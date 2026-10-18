from pydantic import BaseModel, Field, ConfigDict


class KDFParameters(BaseModel):
    algorithm: str = "scrypt"
    n: int = 16384
    r: int = 8
    p: int = 1
    salt_length_bytes: int = 16
    key_length_bytes: int = 32

    model_config = ConfigDict(from_attributes=True)


class AESEncryptRequest(BaseModel):
    plaintext: str = Field(..., min_length=1, max_length=100000, description="Plaintext string to encrypt (max 100KB)")
    passphrase: str = Field(..., min_length=1, max_length=1024, description="User passphrase for key derivation (max 1KB)")


class AESEncryptResponse(BaseModel):
    algorithm: str = "AES-256-GCM"
    nonce: str = Field(..., description="Base64-encoded 12-byte unique nonce")
    salt: str = Field(..., description="Base64-encoded 16-byte random salt")
    ciphertext: str = Field(..., description="Base64-encoded encrypted payload")
    tag: str = Field(..., description="Base64-encoded 16-byte authentication tag")
    kdf: KDFParameters
    execution_duration_ms: float


class AESDecryptRequest(BaseModel):
    passphrase: str = Field(..., min_length=1, max_length=1024, description="User passphrase for key derivation")
    nonce: str = Field(..., min_length=1, max_length=64, description="Base64-encoded 12-byte nonce")
    salt: str = Field(..., min_length=1, max_length=64, description="Base64-encoded 16-byte random salt")
    ciphertext: str = Field(..., min_length=1, max_length=200000, description="Base64-encoded encrypted payload")
    tag: str = Field(..., min_length=1, max_length=64, description="Base64-encoded 16-byte authentication tag")


class AESDecryptResponse(BaseModel):
    algorithm: str = "AES-256-GCM"
    plaintext: str = Field(..., description="Verified decrypted UTF-8 plaintext")
    verified: bool = True
    execution_duration_ms: float
