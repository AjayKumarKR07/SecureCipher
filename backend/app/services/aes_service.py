import os
import time
import base64
import logging
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


def record_audit_operation(
    db: Optional[Session],
    algorithm_name: str,
    operation_type: str,
    status: str,
    duration_ms: float,
) -> None:
    """
    Persists safe operational execution metadata to PostgreSQL history.
    
    SECURITY GUARANTEE:
    Plaintext, passphrases, derived keys, nonces, and ciphertext payloads
    are NEVER stored or logged.
    """
    if db is None:
        return

    try:
        audit_entry = OperationHistory(
            algorithm_name=algorithm_name,
            operation_type=operation_type,
            status=status,
            execution_duration_ms=round(duration_ms, 2),
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        logger.warning("Could not persist audit record to database: %s", str(e))
        try:
            db.rollback()
        except Exception:
            pass
