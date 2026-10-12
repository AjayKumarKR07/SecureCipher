from pydantic import BaseModel, Field

DES_SECURITY_WARNING = (
    "EDUCATIONAL / LEGACY ONLY: DES is cryptographically obsolete with an inadequate 56-bit key space "
    "vulnerable to exhaustive search in hours. CBC mode provides NO cryptographic integrity or authentication "
    "and is vulnerable to padding oracle and bit-flipping tampering. Never use DES for sensitive or modern data."
)

DES_TAMPER_WARNING = (
    "CBC mode does NOT authenticate ciphertext. Successful decryption only confirms mathematical unpadding; "
    "it does NOT guarantee the message was not modified in transit."
)


class DESEncryptRequest(BaseModel):
    """Payload for DES-CBC encryption."""
    plaintext: str = Field(
        ...,
        description="The UTF-8 text to encrypt (max 65,536 characters).",
        min_length=1,
        max_length=65536,
    )
    key: str = Field(
        ...,
        description="Legacy 56-bit DES key (exactly 8 ASCII characters / 64 bits with 8 parity bits).",
        min_length=8,
        max_length=8,
    )


class DESEncryptResponse(BaseModel):
    """Response returned upon DES-CBC encryption."""
    algorithm: str = Field(default="DES-CBC", description="Cipher algorithm name and mode")
    ciphertext: str = Field(..., description="Base64-encoded DES-CBC ciphertext payload")
    iv: str = Field(..., description="Base64-encoded 8-byte initialization vector (IV)")
    block_size_bytes: int = Field(default=8, description="DES block size in bytes (64 bits)")
    key_size_bits: int = Field(default=56, description="Effective DES key size in bits")
    is_authenticated: bool = Field(default=False, description="Explicitly False: CBC provides zero authentication")
    security_warning: str = Field(default=DES_SECURITY_WARNING, description="Mandatory educational legacy warning")
    execution_duration_ms: float = Field(..., description="Execution time in milliseconds")


class DESDecryptRequest(BaseModel):
    """Payload for DES-CBC decryption."""
    ciphertext: str = Field(..., description="Base64-encoded ciphertext string")
    key: str = Field(
        ...,
        description="Legacy 56-bit DES key (exactly 8 ASCII characters).",
        min_length=8,
        max_length=8,
    )
    iv: str = Field(..., description="Base64-encoded 8-byte initialization vector (IV)")


class DESDecryptResponse(BaseModel):
    """Response returned upon DES-CBC decryption."""
    algorithm: str = Field(default="DES-CBC", description="Cipher algorithm name and mode")
    plaintext: str = Field(..., description="Decrypted UTF-8 plaintext")
    is_authenticated: bool = Field(default=False, description="Explicitly False: CBC provides zero authentication")
    tamper_warning: str = Field(default=DES_TAMPER_WARNING, description="CBC integrity caveat notice")
    security_warning: str = Field(default=DES_SECURITY_WARNING, description="Mandatory educational legacy warning")
    execution_duration_ms: float = Field(..., description="Execution time in milliseconds")
