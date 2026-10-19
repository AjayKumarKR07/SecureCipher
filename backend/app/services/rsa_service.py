import base64
import logging
from typing import Tuple, Optional
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

logger = logging.getLogger(__name__)

SUPPORTED_KEY_SIZES = (2048, 3072)
PUBLIC_EXPONENT = 65537


def generate_rsa_keypair(key_size: int = 2048) -> Tuple[str, str, int]:
    """
    Generates a cryptographically secure RSA key pair.
    Returns: (public_key_pem, private_key_pem, key_size)
    """
    if key_size not in SUPPORTED_KEY_SIZES:
        raise ValueError(f"Unsupported RSA key size: {key_size}. Supported sizes are 2048 and 3072 bits.")

    private_key = rsa.generate_private_key(
        public_exponent=PUBLIC_EXPONENT,
        key_size=key_size,
    )
    public_key = private_key.public_key()

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")

    return public_pem, private_pem, key_size


def encrypt_rsa_oaep(plaintext: str, public_key_pem: str) -> Tuple[str, int]:
    """
    Encrypts a UTF-8 plaintext string using an RSA public key with OAEP (SHA-256) padding.
    Returns: (ciphertext_b64, key_size)
    """
    if not plaintext or not plaintext.strip():
        raise ValueError("Plaintext cannot be empty.")
    if not public_key_pem or not public_key_pem.strip():
        raise ValueError("Public key PEM cannot be empty.")

    try:
        loaded_public_key = serialization.load_pem_public_key(
            public_key_pem.strip().encode("utf-8")
        )
    except Exception as e:
        raise ValueError(f"Invalid RSA public key: could not parse PEM format ({str(e)}).")

    if not isinstance(loaded_public_key, rsa.RSAPublicKey):
        raise ValueError("Provided key is not an RSA public key.")

    key_size = loaded_public_key.key_size
    # Max plaintext length for OAEP with SHA-256 (hash length = 32 bytes):
    # max_bytes = k - 2*hLen - 2, where k is modulus length in bytes
    max_bytes = (key_size // 8) - (2 * 32) - 2

    plaintext_bytes = plaintext.encode("utf-8")
    if len(plaintext_bytes) > max_bytes:
        raise ValueError(
            f"Plaintext of {len(plaintext_bytes)} bytes exceeds maximum capacity of {max_bytes} bytes "
            f"for RSA-{key_size} with OAEP-SHA256 padding. Please shorten message or use hybrid encryption."
        )

    try:
        ciphertext = loaded_public_key.encrypt(
            plaintext_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )
    except Exception as e:
        raise ValueError(f"RSA encryption failed: {str(e)}")

    ciphertext_b64 = base64.b64encode(ciphertext).decode("ascii")
    return ciphertext_b64, key_size


def decrypt_rsa_oaep(
    ciphertext_b64: str,
    private_key_pem: str,
    passphrase: Optional[str] = None,
) -> str:
    """
    Decrypts an RSA-OAEP (SHA-256) Base64-encoded ciphertext using an RSA private key.
    Supports optional passphrase for encrypted PKCS#8 PEM keys.
    Returns: plaintext string
    """
    if not ciphertext_b64 or not ciphertext_b64.strip():
        raise ValueError("Ciphertext cannot be empty.")
    if not private_key_pem or not private_key_pem.strip():
        raise ValueError("Private key PEM cannot be empty.")

    try:
        ciphertext_bytes = base64.b64decode(ciphertext_b64.strip(), validate=True)
    except Exception:
        raise ValueError("Malformed payload: Invalid Base64 ciphertext.")

    password_bytes = passphrase.encode("utf-8") if passphrase else None
    try:
        loaded_private_key = serialization.load_pem_private_key(
            private_key_pem.strip().encode("utf-8"),
            password=password_bytes,
        )
    except Exception as e:
        raise ValueError(f"Invalid RSA private key: could not parse PEM format ({str(e)}).")

    if not isinstance(loaded_private_key, rsa.RSAPrivateKey):
        raise ValueError("Provided key is not an RSA private key.")

    # Expected ciphertext size must match key modulus in bytes
    expected_bytes = loaded_private_key.key_size // 8
    if len(ciphertext_bytes) != expected_bytes:
        raise ValueError(
            f"Invalid ciphertext length: expected {expected_bytes} bytes for "
            f"RSA-{loaded_private_key.key_size}, but received {len(ciphertext_bytes)} bytes."
        )

    try:
        decrypted_bytes = loaded_private_key.decrypt(
            ciphertext_bytes,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )
    except Exception:
        raise ValueError(
            "Decryption failed: RSA OAEP padding or key mismatch. "
            "Ensure the private key corresponds to the public key used for encryption."
        )

    try:
        return decrypted_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise ValueError("Decryption failed: decrypted data is not valid UTF-8 text.")
