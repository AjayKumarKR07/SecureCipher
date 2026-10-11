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
    plaintext: str = Field(..., min_length=1, description="Plaintext string to encrypt")
    passphrase: str = Field(..., min_length=1, description="User passphrase for key derivation")


class AESEncryptResponse(BaseModel):
    algorithm: str = "AES-256-GCM"
    nonce: str = Field(..., description="Base64-encoded 12-byte unique nonce")
    salt: str = Field(..., description="Base64-encoded 16-byte random salt")
    ciphertext: str = Field(..., description="Base64-encoded encrypted payload")
    tag: str = Field(..., description="Base64-encoded 16-byte authentication tag")
    kdf: KDFParameters
    execution_duration_ms: float


class AESDecryptRequest(BaseModel):
    passphrase: str = Field(..., min_length=1, description="User passphrase for key derivation")
    nonce: str = Field(..., min_length=1, description="Base64-encoded 12-byte nonce")
    salt: str = Field(..., min_length=1, description="Base64-encoded 16-byte random salt")
    ciphertext: str = Field(..., min_length=1, description="Base64-encoded encrypted payload")
    tag: str = Field(..., min_length=1, description="Base64-encoded 16-byte authentication tag")


class AESDecryptResponse(BaseModel):
    algorithm: str = "AES-256-GCM"
    plaintext: str = Field(..., description="Verified decrypted UTF-8 plaintext")
    verified: bool = True
    execution_duration_ms: float
