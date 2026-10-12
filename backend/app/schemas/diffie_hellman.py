from typing import Optional
from pydantic import BaseModel, Field


class DHKeyGenRequest(BaseModel):
    party_name: Optional[str] = Field(default="Party", description="Identifier for party (e.g. Alice, Bob)")


class DHKeyGenResponse(BaseModel):
    algorithm: str = "Diffie-Hellman (RFC 3526 MODP Group 14)"
    group_name: str = "MODP Group 14 (2048-bit)"
    prime_bits: int = 2048
    generator: int = 2
    party_name: str
    public_key_pem: str = Field(..., description="SubjectPublicKeyInfo PEM")
    private_key_pem: str = Field(..., description="PKCS#8 PEM private key (kept secret)")
    public_key_hex: str = Field(..., description="Hex representation of public key integer y = g^x mod p")
    execution_duration_ms: float


class DHDeriveSecretRequest(BaseModel):
    private_key_pem: str = Field(..., min_length=1, description="Party's own private key PEM")
    peer_public_key_pem: str = Field(..., min_length=1, description="Peer's public key PEM")
    info: Optional[str] = Field(default="SecureCipher Diffie-Hellman KDF", description="Context info for HKDF")


class DHDeriveSecretResponse(BaseModel):
    algorithm: str = "Diffie-Hellman (RFC 3526 MODP Group 14)"
    kdf: str = "HKDF-SHA256"
    shared_secret_length_bytes: int = 256
    derived_key_b64: str = Field(..., description="256-bit symmetric key derived via HKDF-SHA256 (Base64)")
    derived_key_hex: str = Field(..., description="256-bit symmetric key derived via HKDF-SHA256 (Hex)")
    key_fingerprint: str = Field(..., description="SHA-256 fingerprint for verification without exposing key")
    execution_duration_ms: float


class DHSimulationPartyInfo(BaseModel):
    party_name: str
    public_key_pem: str
    private_key_pem: str
    public_key_hex: str


class DHSimulationResponse(BaseModel):
    algorithm: str = "Diffie-Hellman (RFC 3526 MODP Group 14)"
    group_name: str = "MODP Group 14 (2048-bit)"
    prime_modulus_hex: str
    generator: int = 2
    kdf: str = "HKDF-SHA256"
    alice: DHSimulationPartyInfo
    bob: DHSimulationPartyInfo
    alice_derived_key_b64: str
    bob_derived_key_b64: str
    key_match: bool = True
    key_fingerprint: str
    execution_duration_ms: float
