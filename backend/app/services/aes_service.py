import os
import time
import json
import struct
import base64
import logging
import unicodedata
import re
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag
from app.models.history import OperationHistory

logger = logging.getLogger(__name__)

# Scrypt KDF Security Parameters (OWASP Recommended)
SCRYPT_N = 16384        # CPU/memory cost parameter (2^14)
SCRYPT_R = 8            # Block size parameter
SCRYPT_P = 1            # Parallelization parameter
KEY_LENGTH_BYTES = 32   # 256-bit key for AES-256
SALT_LENGTH_BYTES = 16  # 128-bit random salt
NONCE_LENGTH_BYTES = 12 # 96-bit random nonce for AES-GCM
TAG_LENGTH_BYTES = 16   # 128-bit GCM authentication tag

# SecureCipher Encrypted File Container v1 Specification
# Header layout:
#   [0:8]   Magic identifier: b"SCENC01\x00" (8 bytes)
#   [8:12]  Header JSON length: 32-bit big-endian unsigned integer (4 bytes)
#   [12:12+header_len] UTF-8 JSON metadata block containing version, KDF, salt, nonce, filename, size
#   [12+header_len:] Ciphertext with 16-byte GCM authentication tag appended
# Entire header ([0:12+header_len]) is cryptographically bound as AES-GCM Associated Authenticated Data (AAD)
MAGIC_HEADER = b"SCENC01\x00"
CONTAINER_VERSION = 1
MAX_HEADER_LENGTH = 65536  # 64 KB safety limit for metadata block
DEFAULT_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB default safety limit


def derive_key(passphrase: str, salt: bytes) -> bytes:
    """
    Derives a 256-bit AES key from a passphrase and salt using Scrypt.
    """
    if not passphrase:
        raise ValueError("Passphrase cannot be empty.")
    if len(salt) != SALT_LENGTH_BYTES:
        raise ValueError(f"Salt must be exactly {SALT_LENGTH_BYTES} bytes.")

    kdf = Scrypt(
        salt=salt,
        length=KEY_LENGTH_BYTES,
        n=SCRYPT_N,
        r=SCRYPT_R,
        p=SCRYPT_P,
    )
    return kdf.derive(passphrase.encode("utf-8"))


def encrypt_aes_256_gcm(plaintext: str, passphrase: str) -> Dict[str, Any]:
    """
    Encrypts plaintext using AES-256-GCM.
    - Derives a 256-bit key using Scrypt with a fresh random 16-byte salt.
    - Uses a fresh random 12-byte nonce for each operation (guarantees nonce uniqueness).
    - Returns Base64-encoded nonce, salt, ciphertext, tag, and KDF metadata.
    """
    if not plaintext:
        raise ValueError("Plaintext cannot be empty.")
    if not passphrase:
        raise ValueError("Passphrase cannot be empty.")

    # Fresh random salt and nonce
    salt = os.urandom(SALT_LENGTH_BYTES)
    nonce = os.urandom(NONCE_LENGTH_BYTES)

    # Derive 256-bit key
    key = derive_key(passphrase, salt)

    # AES-256-GCM authenticated encryption
    aesgcm = AESGCM(key)
    plaintext_bytes = plaintext.encode("utf-8")
    
    # AESGCM.encrypt appends 16-byte authentication tag to ciphertext
    encrypted_payload = aesgcm.encrypt(nonce, plaintext_bytes, None)
    ciphertext = encrypted_payload[:-TAG_LENGTH_BYTES]
    tag = encrypted_payload[-TAG_LENGTH_BYTES:]

    return {
        "algorithm": "AES-256-GCM",
        "nonce": base64.b64encode(nonce).decode("ascii"),
        "salt": base64.b64encode(salt).decode("ascii"),
        "ciphertext": base64.b64encode(ciphertext).decode("ascii"),
        "tag": base64.b64encode(tag).decode("ascii"),
        "kdf": {
            "algorithm": "scrypt",
            "n": SCRYPT_N,
            "r": SCRYPT_R,
            "p": SCRYPT_P,
            "salt_length_bytes": SALT_LENGTH_BYTES,
            "key_length_bytes": KEY_LENGTH_BYTES,
        },
    }


def decrypt_aes_256_gcm(
    ciphertext_b64: str,
    tag_b64: str,
    nonce_b64: str,
    salt_b64: str,
    passphrase: str,
) -> str:
    """
    Decrypts an AES-256-GCM encrypted payload.
    - Validates inputs and decodes Base64 parameters.
    - Derives key using Scrypt and the provided salt.
    - Authenticates the tag and decrypts the ciphertext.
    - Fails safely on incorrect passphrase, tampered ciphertext, or bad parameters.
    """
    if not passphrase:
        raise ValueError("Passphrase cannot be empty.")
    if not ciphertext_b64 or not tag_b64 or not nonce_b64 or not salt_b64:
        raise ValueError("Ciphertext, tag, nonce, and salt are all required for decryption.")

    # Base64 decoding with validation
    try:
        nonce = base64.b64decode(nonce_b64, validate=True)
        salt = base64.b64decode(salt_b64, validate=True)
        ciphertext = base64.b64decode(ciphertext_b64, validate=True)
        tag = base64.b64decode(tag_b64, validate=True)
    except Exception as e:
        raise ValueError("Malformed payload: Invalid Base64 encoding in one or more parameters.")

    # Parameter length validations
    if len(nonce) != NONCE_LENGTH_BYTES:
        raise ValueError(f"Invalid nonce length: expected {NONCE_LENGTH_BYTES} bytes, got {len(nonce)} bytes.")
    if len(salt) != SALT_LENGTH_BYTES:
        raise ValueError(f"Invalid salt length: expected {SALT_LENGTH_BYTES} bytes, got {len(salt)} bytes.")
    if len(tag) != TAG_LENGTH_BYTES:
        raise ValueError(f"Invalid authentication tag length: expected {TAG_LENGTH_BYTES} bytes, got {len(tag)} bytes.")

    # Derive key from passphrase and provided salt
    key = derive_key(passphrase, salt)

    # Reconstruct payload for AESGCM (ciphertext + 16-byte tag)
    payload_with_tag = ciphertext + tag
    aesgcm = AESGCM(key)

    try:
        decrypted_bytes = aesgcm.decrypt(nonce, payload_with_tag, None)
    except InvalidTag:
        raise ValueError(
            "Decryption failed: authentication tag verification failed. "
            "Ensure the passphrase and ciphertext are correct and unmodified."
        )

    try:
        return decrypted_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise ValueError("Decryption failed: decrypted data is not valid UTF-8 text.")


def sanitize_filename(filename: Optional[str]) -> str:
    """
    Sanitizes an input filename to prevent directory traversal and filesystem attacks.
    - Strips directory components (e.g., ../, ..\\, /etc/passwd).
    - Removes null bytes, control characters, and dangerous characters.
    - Normalizes Unicode (NFKC).
    - Limits length to 255 characters.
    - Returns a safe basename, defaulting to 'file.bin' if completely empty or invalid.
    """
    if not filename or not isinstance(filename, str):
        return "file.bin"

    # Unicode normalization
    normalized = unicodedata.normalize("NFKC", filename)

    # Replace backslashes with forward slashes and take basename
    basename = normalized.replace("\\", "/").split("/")[-1]

    # Remove null bytes and control characters (ASCII 0-31 and 127)
    cleaned = "".join(ch for ch in basename if ord(ch) >= 32 and ord(ch) != 127)

    # Remove dangerous characters: <>:"/\|?*
    cleaned = re.sub(r'[<>:"/\\|?*]', "_", cleaned)

    # Strip leading/trailing dots, spaces, and dashes
    cleaned = cleaned.strip(". -_")

    # If empty after sanitization, fallback
    if not cleaned:
        return "file.bin"

    # Cap to 255 characters while preserving extension if possible
    if len(cleaned.encode("utf-8")) > 255:
        name_part, ext = os.path.splitext(cleaned)
        allowed_len = 255 - len(ext.encode("utf-8"))
        while len(name_part.encode("utf-8")) > allowed_len and len(name_part) > 1:
            name_part = name_part[:-1]
        cleaned = name_part + ext

    return cleaned


def encrypt_aes_file(
    file_bytes: bytes,
    filename: str,
    passphrase: str,
    max_file_size: int = DEFAULT_MAX_FILE_SIZE_BYTES,
) -> Tuple[bytes, str, Dict[str, Any]]:
    """
    Encrypts arbitrary binary file bytes using AES-256-GCM into a SecureCipher container.
    - Derives a 256-bit key using Scrypt with a fresh 16-byte random salt.
    - Generates a fresh 12-byte random nonce for the operation.
    - Builds a versioned JSON metadata header containing safe original filename, size, and KDF params.
    - Cryptographically binds the complete header as AES-GCM Associated Authenticated Data (AAD).
    - Produces a single binary container: [MAGIC (8B)][HEADER_LEN (4B)][METADATA_JSON][CIPHERTEXT + 16B TAG].
    - Returns (container_bytes, download_filename, metadata_dict).
    """
    if not passphrase or not passphrase.strip():
        raise ValueError("Passphrase cannot be empty or whitespace.")

    if len(file_bytes) > max_file_size:
        max_mb = max_file_size // (1024 * 1024)
        raise ValueError(f"File exceeds maximum allowed size of {max_mb} MB.")

    safe_filename = sanitize_filename(filename)

    # Cryptographically secure random salt and nonce
    salt = os.urandom(SALT_LENGTH_BYTES)
    nonce = os.urandom(NONCE_LENGTH_BYTES)

    # Derive 256-bit key via Scrypt
    key = derive_key(passphrase, salt)

    metadata = {
        "format": "SCENC",
        "version": CONTAINER_VERSION,
        "algorithm": "AES-256-GCM",
        "original_filename": safe_filename,
        "original_file_size": len(file_bytes),
        "salt": base64.b64encode(salt).decode("ascii"),
        "nonce": base64.b64encode(nonce).decode("ascii"),
        "kdf": {
            "algorithm": "scrypt",
            "n": SCRYPT_N,
            "r": SCRYPT_R,
            "p": SCRYPT_P,
            "salt_length_bytes": SALT_LENGTH_BYTES,
            "key_length_bytes": KEY_LENGTH_BYTES,
        },
    }

    # Deterministic UTF-8 JSON encoding
    metadata_bytes = json.dumps(metadata, separators=(",", ":"), sort_keys=True).encode("utf-8")
    header_length = len(metadata_bytes)

    if header_length > MAX_HEADER_LENGTH:
        raise ValueError("Metadata header exceeds maximum allowed length.")

    # Header structure: [MAGIC_HEADER: 8 bytes][HEADER_LENGTH: 4 bytes big-endian uint32][METADATA_BYTES]
    header = MAGIC_HEADER + struct.pack(">I", header_length) + metadata_bytes

    # The entire header is cryptographically bound as Associated Authenticated Data (AAD)
    associated_data = header

    aesgcm = AESGCM(key)
    # encrypt appends 16-byte GCM authentication tag to ciphertext
    ciphertext_with_tag = aesgcm.encrypt(nonce, file_bytes, associated_data)

    container_bytes = header + ciphertext_with_tag
    download_filename = f"{safe_filename}.scipher"

    return container_bytes, download_filename, metadata


def decrypt_aes_file(
    container_bytes: bytes,
    passphrase: str,
    max_file_size: int = DEFAULT_MAX_FILE_SIZE_BYTES + MAX_HEADER_LENGTH + 1024,
) -> Tuple[bytes, str, Dict[str, Any]]:
    """
    Authenticates and decrypts a SecureCipher AES-256-GCM container file.
    - Validates container magic bytes, header length, and JSON metadata.
    - Reconstructs Associated Authenticated Data (AAD) matching the exact encrypted header.
    - Validates salt, nonce, algorithm, and version.
    - Derives 256-bit key using Scrypt and the embedded salt.
    - Verifies GCM authentication tag over the ciphertext and AAD header.
    - Fails safely if passphrase is incorrect or any byte of metadata/ciphertext is tampered with.
    - Never returns partial or unauthenticated plaintext.
    - Returns (decrypted_file_bytes, safe_download_filename, metadata_dict).
    """
    if not passphrase or not passphrase.strip():
        raise ValueError("Passphrase cannot be empty or whitespace.")

    if len(container_bytes) > max_file_size:
        max_mb = max_file_size // (1024 * 1024)
        raise ValueError(f"Encrypted container exceeds maximum allowed size of {max_mb} MB.")

    min_required_len = len(MAGIC_HEADER) + 4 + TAG_LENGTH_BYTES
    if len(container_bytes) < min_required_len:
        raise ValueError("Invalid file format: container is corrupted or too short.")

    # 1. Verify Magic Identifier
    magic = container_bytes[:len(MAGIC_HEADER)]
    if magic != MAGIC_HEADER:
        raise ValueError("Invalid file format: missing or unrecognized SecureCipher magic header.")

    # 2. Extract and Validate Header Length
    header_length = struct.unpack(">I", container_bytes[len(MAGIC_HEADER):len(MAGIC_HEADER) + 4])[0]
    if header_length <= 0 or header_length > MAX_HEADER_LENGTH:
        raise ValueError(f"Malformed container: invalid metadata header length ({header_length} bytes).")

    header_end = len(MAGIC_HEADER) + 4 + header_length
    if len(container_bytes) < header_end + TAG_LENGTH_BYTES:
        raise ValueError("Malformed or truncated container: missing encrypted payload or authentication tag.")

    # 3. Parse Metadata Block
    metadata_bytes = container_bytes[len(MAGIC_HEADER) + 4:header_end]
    try:
        metadata = json.loads(metadata_bytes.decode("utf-8"))
    except Exception:
        raise ValueError("Malformed container: invalid JSON metadata structure.")

    if not isinstance(metadata, dict):
        raise ValueError("Malformed container: metadata is not a valid JSON object.")

    # 4. Validate Version and Algorithm
    if metadata.get("version") != CONTAINER_VERSION:
        raise ValueError(
            f"Unsupported container version: expected version {CONTAINER_VERSION}, "
            f"got {metadata.get('version')}."
        )

    if metadata.get("algorithm") != "AES-256-GCM":
        raise ValueError(
            f"Unsupported algorithm: expected AES-256-GCM, got {metadata.get('algorithm')}."
        )

    # 5. Extract and Validate Salt & Nonce
    salt_b64 = metadata.get("salt")
    nonce_b64 = metadata.get("nonce")
    if not salt_b64 or not nonce_b64:
        raise ValueError("Malformed container metadata: missing salt or nonce.")

    try:
        salt = base64.b64decode(salt_b64, validate=True)
        nonce = base64.b64decode(nonce_b64, validate=True)
    except Exception:
        raise ValueError("Malformed container metadata: salt or nonce is not valid Base64.")

    if len(salt) != SALT_LENGTH_BYTES:
        raise ValueError(f"Invalid salt length in container: expected {SALT_LENGTH_BYTES} bytes, got {len(salt)}.")
    if len(nonce) != NONCE_LENGTH_BYTES:
        raise ValueError(f"Invalid nonce length in container: expected {NONCE_LENGTH_BYTES} bytes, got {len(nonce)}.")

    expected_file_size = metadata.get("original_file_size")
    if expected_file_size is not None and (not isinstance(expected_file_size, int) or expected_file_size < 0):
        raise ValueError("Malformed container metadata: invalid original file size.")

    # 6. Reconstruct AAD from the exact header bytes
    associated_data = container_bytes[:header_end]
    ciphertext_with_tag = container_bytes[header_end:]

    # 7. Derive 256-bit Key via Scrypt
    key = derive_key(passphrase, salt)

    # 8. Authenticated Decryption
    aesgcm = AESGCM(key)
    try:
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext_with_tag, associated_data)
    except InvalidTag:
        raise ValueError(
            "Decryption failed: authentication tag verification failed. "
            "Ensure the passphrase is correct and the encrypted file has not been damaged or tampered with."
        )

    # 9. Verify decrypted size against authenticated metadata
    if expected_file_size is not None and len(decrypted_bytes) != expected_file_size:
        raise ValueError("Decryption failed: recovered file size does not match authenticated metadata.")

    # 10. Extract safe download filename
    raw_filename = metadata.get("original_filename")
    safe_filename = sanitize_filename(raw_filename)
    if not safe_filename or safe_filename == "file.bin":
        safe_filename = "decrypted_file.bin"

    return decrypted_bytes, safe_filename, metadata


from app.services.history_service import record_audit_operation
