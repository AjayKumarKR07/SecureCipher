"""
Pydantic schemas for RSA-PSS Digital Signature operations.

RSA-PSS is a SIGNING scheme (integrity + authenticity).
It is strictly separate from RSA-OAEP, which is an ENCRYPTION scheme.
"""
from typing import Optional
from pydantic import BaseModel, Field, field_validator

# Supported RSA key sizes (matches existing RSA-OAEP module; 4096 added for signatures)
SUPPORTED_PSS_KEY_SIZES = (2048, 3072, 4096)

# Maximum allowed sizes for text inputs and signatures (server-side enforcement)
MAX_MESSAGE_BYTES = 10 * 1024 * 1024   # 10 MB text message
MAX_SIGNATURE_CHARS = 8192              # Base64 signature string length
MAX_KEY_PEM_CHARS = 16384              # PEM key string length
MAX_PASSPHRASE_CHARS = 1024            # Passphrase length


class RSAPSSKeyGenRequest(BaseModel):
    """Request body for RSA-PSS key pair generation."""
    key_size: int = Field(
        default=2048,
        description="RSA modulus size in bits. Supported: 2048, 3072, 4096.",
    )
    private_key_passphrase: Optional[str] = Field(
        default=None,
        max_length=MAX_PASSPHRASE_CHARS,
        description=(
            "Optional passphrase to encrypt the exported private key (recommended). "
            "If omitted, the private key is returned in unencrypted PKCS#8 PEM format."
        ),
    )

    @field_validator("key_size")
    @classmethod
    def validate_key_size(cls, v: int) -> int:
        if v not in SUPPORTED_PSS_KEY_SIZES:
            raise ValueError(
                f"Unsupported RSA key size: {v}. "
                f"Supported sizes are: {', '.join(str(k) for k in SUPPORTED_PSS_KEY_SIZES)} bits."
            )
        return v


class RSAPSSKeyGenResponse(BaseModel):
    """Response containing a freshly generated RSA-PSS key pair."""
    algorithm: str = "RSA-PSS"
    key_size: int
    public_key_pem: str = Field(description="RSA public key in SubjectPublicKeyInfo (SPKI) PEM format.")
    private_key_pem: str = Field(
        description=(
            "RSA private key in PKCS#8 PEM format. "
            "Encrypted with the provided passphrase if one was supplied."
        )
    )
    private_key_encrypted: bool = Field(
        description="True if the private key PEM is passphrase-encrypted."
    )
    public_key_format: str = "SubjectPublicKeyInfo (SPKI) PEM"
    private_key_format: str = "PKCS#8 PEM"
    execution_duration_ms: float


class RSAPSSSignRequest(BaseModel):
    """Request body for signing a text message with RSA-PSS."""
    message: str = Field(
        ...,
        max_length=MAX_MESSAGE_BYTES,
        description=(
            "The exact UTF-8 text message to sign. "
            "Whitespace, newlines, and Unicode are preserved exactly as provided. "
            "An empty string is valid input."
        ),
    )
    private_key_pem: str = Field(
        ...,
        min_length=1,
        max_length=MAX_KEY_PEM_CHARS,
        description="RSA private key in PKCS#8 PEM format (encrypted or unencrypted).",
    )
    private_key_passphrase: Optional[str] = Field(
        default=None,
        max_length=MAX_PASSPHRASE_CHARS,
        description="Passphrase to unlock the private key if it is encrypted.",
    )


class RSAPSSSignResponse(BaseModel):
    """Response containing the Base64-encoded RSA-PSS signature."""
    algorithm: str = "RSA-PSS-SHA256"
    digest: str = "SHA-256"
    mgf: str = "MGF1-SHA256"
    salt_length: str = "PSS.MAX_LENGTH"
    signature_base64: str = Field(description="Base64-encoded RSA-PSS signature bytes.")
    signature_byte_length: int
    key_size: Optional[int] = None
    signature_encoding: str = "Base64"
    execution_duration_ms: float


class RSAPSSVerifyRequest(BaseModel):
    """Request body for verifying an RSA-PSS signature against a text message."""
    message: str = Field(
        ...,
        max_length=MAX_MESSAGE_BYTES,
        description=(
            "The exact UTF-8 text message that was originally signed. "
            "Must match the original byte-for-byte."
        ),
    )
    signature_base64: str = Field(
        ...,
        min_length=1,
        max_length=MAX_SIGNATURE_CHARS,
        description="Base64-encoded RSA-PSS signature to verify.",
    )
    public_key_pem: str = Field(
        ...,
        min_length=1,
        max_length=MAX_KEY_PEM_CHARS,
        description="RSA public key in SubjectPublicKeyInfo (SPKI) PEM format.",
    )


class RSAPSSVerifyResponse(BaseModel):
    """Response indicating whether an RSA-PSS signature is valid or not."""
    valid: bool
    status: str = Field(
        description="'valid_signature' or 'invalid_signature' or 'verification_error'."
    )
    algorithm: str = "RSA-PSS-SHA256"
    digest: str = "SHA-256"
    message: str = Field(description="Safe human-readable verification outcome.")
    execution_duration_ms: float


class RSAPSSSignFileResponse(BaseModel):
    """Metadata returned alongside a downloadable RSA-PSS file signature."""
    algorithm: str = "RSA-PSS-SHA256"
    digest: str = "SHA-256"
    signature_base64: str
    signature_byte_length: int
    original_filename: str
    original_file_size: int
    execution_duration_ms: float


class RSAPSSVerifyFileResponse(BaseModel):
    """Response for file signature verification."""
    valid: bool
    status: str
    algorithm: str = "RSA-PSS-SHA256"
    digest: str = "SHA-256"
    original_filename: str
    original_file_size: int
    message: str
    execution_duration_ms: float
