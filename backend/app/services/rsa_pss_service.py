"""
RSA-PSS Digital Signature Service.

Provides cryptographic primitives for RSA-PSS signing and verification.
Algorithm configuration:
  - Scheme:       RSA-PSS
  - Digest:       SHA-256
  - MGF:          MGF1
  - MGF Digest:   SHA-256
  - Salt Length:  PSS.MAX_LENGTH (maximum salt length for given key size)

SECURITY CONTRACT:
  - Private keys and passphrases are NEVER logged, stored, or returned beyond
    the single HTTP response that delivers them to the client.
  - File contents and message bodies are NEVER logged or persisted.
  - Verification failures for cryptographically invalid signatures are normal
    outcomes, not exceptions — they return valid=False, not HTTP 500.
  - The library (cryptography) supplies all randomness; no manual RNG is used.
"""
import base64
import logging
from typing import Optional, Tuple

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey, RSAPublicKey

logger = logging.getLogger(__name__)

# Supported RSA modulus sizes for PSS signing
SUPPORTED_KEY_SIZES = (2048, 3072, 4096)
PUBLIC_EXPONENT = 65537

# Enforce a maximum file size for signing/verification (same value as config; service
# enforces it independently so it can be tested without importing settings)
MAX_FILE_BYTES = 50 * 1024 * 1024  # 50 MB


# ---------------------------------------------------------------------------
# Key Generation
# ---------------------------------------------------------------------------

def generate_rsa_pss_keypair(
    key_size: int = 2048,
    passphrase: Optional[str] = None,
) -> Tuple[str, str, bool, int]:
    """
    Generate a cryptographically secure RSA key pair for use with RSA-PSS signatures.

    Returns: (public_key_pem, private_key_pem, private_key_encrypted, key_size)

    The private key PEM is encrypted with the passphrase when one is provided
    (using BestAvailableEncryption, which as of cryptography >=41 uses AES-256-CBC
    with PBKDF2-HMAC-SHA256 via OpenSSL's default PEM encryption).
    If no passphrase is provided, the private key is returned in unencrypted PKCS#8 format.

    SECURITY NOTE: Private keys are generated in memory and returned once.
    They are never stored, logged, or persisted on the server.
    """
    if key_size not in SUPPORTED_KEY_SIZES:
        raise ValueError(
            f"Unsupported RSA key size: {key_size}. "
            f"Supported sizes are: {', '.join(str(k) for k in SUPPORTED_KEY_SIZES)} bits."
        )

    private_key: RSAPrivateKey = rsa.generate_private_key(
        public_exponent=PUBLIC_EXPONENT,
        key_size=key_size,
    )
    public_key: RSAPublicKey = private_key.public_key()

    # Public key — SubjectPublicKeyInfo (SPKI) PEM
    public_pem: str = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")

    # Private key — PKCS#8 PEM (encrypted if passphrase supplied)
    if passphrase:
        encryption_algorithm = serialization.BestAvailableEncryption(
            passphrase.encode("utf-8")
        )
        private_key_encrypted = True
    else:
        encryption_algorithm = serialization.NoEncryption()
        private_key_encrypted = False

    private_pem: str = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=encryption_algorithm,
    ).decode("utf-8")

    return public_pem, private_pem, private_key_encrypted, key_size


# ---------------------------------------------------------------------------
# Key Loading Helpers
# ---------------------------------------------------------------------------

def _load_private_key(private_key_pem: str, passphrase: Optional[str] = None) -> RSAPrivateKey:
    """
    Load an RSA private key from PEM, decrypting with the passphrase if needed.
    Raises ValueError with a safe message on failure; does not expose internals.
    """
    pem_bytes = private_key_pem.strip().encode("utf-8")
    password_bytes = passphrase.encode("utf-8") if passphrase else None

    try:
        loaded = serialization.load_pem_private_key(pem_bytes, password=password_bytes)
    except (ValueError, TypeError) as e:
        msg = str(e).lower()
        if "password" in msg or "decrypt" in msg or "bad decrypt" in msg:
            raise ValueError(
                "Failed to decrypt the private key. "
                "The passphrase may be incorrect or the key may not be encrypted."
            )
        raise ValueError(
            "Invalid RSA private key: could not parse PEM format. "
            "Ensure the PEM is complete and in PKCS#8 format."
        )
    except Exception:
        raise ValueError(
            "Invalid RSA private key: could not parse PEM format. "
            "Ensure the PEM is complete and in PKCS#8 format."
        )

    if not isinstance(loaded, RSAPrivateKey):
        raise ValueError(
            "Provided key is not an RSA private key. "
            "RSA-PSS signing requires an RSA private key."
        )

    if loaded.key_size not in SUPPORTED_KEY_SIZES:
        raise ValueError(
            f"RSA private key has unsupported modulus size: {loaded.key_size} bits. "
            f"Supported sizes for PSS: {', '.join(str(k) for k in SUPPORTED_KEY_SIZES)} bits."
        )

    return loaded


def _load_public_key(public_key_pem: str) -> RSAPublicKey:
    """
    Load an RSA public key from PEM.
    Raises ValueError with a safe message on failure.
    """
    pem_bytes = public_key_pem.strip().encode("utf-8")

    try:
        loaded = serialization.load_pem_public_key(pem_bytes)
    except Exception:
        raise ValueError(
            "Invalid RSA public key: could not parse PEM format. "
            "Ensure the key is in SubjectPublicKeyInfo (SPKI) PEM format."
        )

    if not isinstance(loaded, RSAPublicKey):
        raise ValueError(
            "Provided key is not an RSA public key. "
            "RSA-PSS verification requires an RSA public key."
        )

    return loaded


def _decode_signature(signature_b64: str) -> bytes:
    """
    Safely decode a Base64-encoded signature.
    Raises ValueError on malformed Base64.
    """
    try:
        return base64.b64decode(signature_b64.strip(), validate=True)
    except Exception:
        raise ValueError(
            "Malformed signature: could not decode Base64 signature string. "
            "Ensure the signature is standard Base64-encoded."
        )


def _pss_padding() -> padding.PSS:
    """Return the PSS padding instance with project-standard parameters."""
    return padding.PSS(
        mgf=padding.MGF1(hashes.SHA256()),
        salt_length=padding.PSS.MAX_LENGTH,
    )


# ---------------------------------------------------------------------------
# Text Signing
# ---------------------------------------------------------------------------

def sign_text_rsa_pss(
    message: str,
    private_key_pem: str,
    passphrase: Optional[str] = None,
) -> Tuple[str, int, int]:
    """
    Sign an exact UTF-8 text message using RSA-PSS-SHA256.

    The message is encoded to UTF-8 bytes and signed without any modification.
    Empty messages are valid.

    Returns: (signature_base64, signature_byte_length, key_size)
    """
    if not private_key_pem or not private_key_pem.strip():
        raise ValueError("Private key PEM cannot be empty.")

    private_key = _load_private_key(private_key_pem, passphrase)
    message_bytes = message.encode("utf-8")

    try:
        signature_bytes = private_key.sign(
            message_bytes,
            _pss_padding(),
            hashes.SHA256(),
        )
    except Exception as e:
        raise ValueError(f"RSA-PSS signing failed: {str(e)}")

    signature_b64 = base64.b64encode(signature_bytes).decode("ascii")
    return signature_b64, len(signature_bytes), private_key.key_size


# ---------------------------------------------------------------------------
# Text Verification
# ---------------------------------------------------------------------------

def verify_text_rsa_pss(
    message: str,
    signature_b64: str,
    public_key_pem: str,
) -> Tuple[bool, str]:
    """
    Verify an RSA-PSS-SHA256 signature against an exact UTF-8 text message.

    A cryptographically invalid signature is a normal verification outcome
    (returns valid=False), NOT an exception.

    Returns: (valid: bool, safe_user_message: str)
    Raises ValueError for malformed inputs (not for signature failure).
    """
    if not public_key_pem or not public_key_pem.strip():
        raise ValueError("Public key PEM cannot be empty.")
    if not signature_b64 or not signature_b64.strip():
        raise ValueError("Signature cannot be empty.")

    # May raise ValueError for malformed inputs — caller converts to HTTP 400
    public_key = _load_public_key(public_key_pem)
    signature_bytes = _decode_signature(signature_b64)
    message_bytes = message.encode("utf-8")

    try:
        public_key.verify(
            signature_bytes,
            message_bytes,
            _pss_padding(),
            hashes.SHA256(),
        )
        return True, "Signature is cryptographically valid. The message has not been altered."
    except InvalidSignature:
        return False, (
            "Signature verification failed. "
            "The message may have been modified, the signature may be incorrect, "
            "or the public key does not correspond to the signing private key."
        )
    except Exception as e:
        # Unexpected error (e.g., wrong key type at runtime): treat as verification error
        logger.warning("Unexpected error during RSA-PSS text verification: %s", str(e))
        raise ValueError(
            "Verification could not be completed due to an invalid input. "
            "Check that the public key and signature are well-formed."
        )


# ---------------------------------------------------------------------------
# File Signing
# ---------------------------------------------------------------------------

def sign_file_rsa_pss(
    file_bytes: bytes,
    private_key_pem: str,
    passphrase: Optional[str] = None,
    max_file_size: int = MAX_FILE_BYTES,
) -> Tuple[str, int]:
    """
    Sign the exact bytes of a file using RSA-PSS-SHA256.

    The complete file bytes are loaded into memory for signing. The caller is
    responsible for streaming and enforcing the size limit before calling.
    This function provides a secondary internal size check.

    Returns: (signature_base64, signature_byte_length)
    """
    if not private_key_pem or not private_key_pem.strip():
        raise ValueError("Private key PEM cannot be empty.")

    if len(file_bytes) > max_file_size:
        max_mb = max_file_size // (1024 * 1024)
        raise ValueError(f"File exceeds maximum allowed size of {max_mb} MB for signing.")

    private_key = _load_private_key(private_key_pem, passphrase)

    try:
        signature_bytes = private_key.sign(
            file_bytes,
            _pss_padding(),
            hashes.SHA256(),
        )
    except Exception as e:
        raise ValueError(f"RSA-PSS file signing failed: {str(e)}")

    signature_b64 = base64.b64encode(signature_bytes).decode("ascii")
    return signature_b64, len(signature_bytes)


# ---------------------------------------------------------------------------
# File Verification
# ---------------------------------------------------------------------------

def verify_file_rsa_pss(
    file_bytes: bytes,
    signature_b64: str,
    public_key_pem: str,
    max_file_size: int = MAX_FILE_BYTES,
) -> Tuple[bool, str]:
    """
    Verify an RSA-PSS-SHA256 signature against the exact bytes of a file.

    A cryptographically invalid signature returns valid=False, not an exception.

    Returns: (valid: bool, safe_user_message: str)
    Raises ValueError for malformed inputs.
    """
    if not public_key_pem or not public_key_pem.strip():
        raise ValueError("Public key PEM cannot be empty.")
    if not signature_b64 or not signature_b64.strip():
        raise ValueError("Signature cannot be empty.")

    if len(file_bytes) > max_file_size:
        max_mb = max_file_size // (1024 * 1024)
        raise ValueError(f"File exceeds maximum allowed size of {max_mb} MB for verification.")

    public_key = _load_public_key(public_key_pem)
    signature_bytes = _decode_signature(signature_b64)

    try:
        public_key.verify(
            signature_bytes,
            file_bytes,
            _pss_padding(),
            hashes.SHA256(),
        )
        return True, "File signature is cryptographically valid. The file has not been modified."
    except InvalidSignature:
        return False, (
            "File signature verification failed. "
            "The file may have been modified, the signature may belong to a different file, "
            "or the public key does not correspond to the signing private key."
        )
    except Exception as e:
        logger.warning("Unexpected error during RSA-PSS file verification: %s", str(e))
        raise ValueError(
            "Verification could not be completed due to an invalid input. "
            "Check that the public key and signature are well-formed."
        )
