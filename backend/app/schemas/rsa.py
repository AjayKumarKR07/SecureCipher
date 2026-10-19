from typing import Optional
from pydantic import BaseModel, Field, field_validator


class RSAKeyGenRequest(BaseModel):
    key_size: int = Field(default=2048, description="RSA modulus size in bits (2048 or 3072)")

    @field_validator("key_size")
    @classmethod
    def validate_key_size(cls, v: int) -> int:
        if v not in (2048, 3072):
            raise ValueError("Supported RSA key sizes are 2048 and 3072 bits.")
        return v


class RSAKeyGenResponse(BaseModel):
    algorithm: str = "RSA"
    key_size: int
    public_key_pem: str
    private_key_pem: str
    format: str = "PKCS#8 PEM"
    execution_duration_ms: float


class RSAEncryptRequest(BaseModel):
    plaintext: str = Field(..., min_length=1, description="UTF-8 plaintext message to encrypt")
    public_key_pem: str = Field(..., min_length=1, description="PEM-encoded RSA public key")


class RSAEncryptResponse(BaseModel):
    algorithm: str = "RSA-OAEP-SHA256"
    key_size: int
    ciphertext: str = Field(..., description="Base64-encoded encrypted RSA payload")
    padding: str = "OAEP-MGF1-SHA256"
    execution_duration_ms: float


class RSADecryptRequest(BaseModel):
    ciphertext: str = Field(..., min_length=1, description="Base64-encoded RSA ciphertext")
    private_key_pem: str = Field(..., min_length=1, description="PEM-encoded RSA private key")
    private_key_passphrase: Optional[str] = Field(
        default=None,
        max_length=1024,
        description="Optional passphrase for encrypted private key",
    )


class RSADecryptResponse(BaseModel):
    algorithm: str = "RSA-OAEP-SHA256"
    plaintext: str = Field(..., description="Decrypted UTF-8 plaintext")
    verified: bool = True
    execution_duration_ms: float
