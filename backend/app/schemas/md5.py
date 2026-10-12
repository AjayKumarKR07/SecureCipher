from typing import Optional
from pydantic import BaseModel, Field

MD5_SECURITY_WARNING = (
    "MD5 is cryptographically broken and vulnerable to collision attacks (Wang et al.). "
    "It must NOT be used for digital certificates, signatures, or password hashing in modern systems."
)


class MD5TextRequest(BaseModel):
    """Payload for text MD5 hashing."""
    text: str = Field(
        default="",
        description="The UTF-8 text string to be hashed (empty string is supported as a standard RFC 1321 test vector).",
    )


class MD5TextResponse(BaseModel):
    """Response returned upon hashing text with MD5."""
    algorithm: str = Field(default="MD5", description="Cryptographic hash algorithm name")
    digest: str = Field(
        ...,
        description="32-character lowercase hexadecimal MD5 hash digest",
        min_length=32,
        max_length=32,
    )
    byte_length: int = Field(..., description="Byte length of the UTF-8 input payload")
    execution_duration_ms: float = Field(..., description="Execution time in milliseconds")
    security_warning: str = Field(default=MD5_SECURITY_WARNING, description="Cryptographic security advisory")


class MD5FileResponse(BaseModel):
    """Response returned upon hashing an uploaded file via chunk streaming."""
    algorithm: str = Field(default="MD5", description="Cryptographic hash algorithm name")
    filename: str = Field(..., description="Original filename of the uploaded file")
    digest: str = Field(
        ...,
        description="32-character lowercase hexadecimal MD5 hash digest",
        min_length=32,
        max_length=32,
    )
    file_size_bytes: int = Field(..., description="Total size of the streamed file in bytes")
    content_type: Optional[str] = Field(None, description="MIME content type of the uploaded file")
    execution_duration_ms: float = Field(..., description="Execution time in milliseconds")
    security_warning: str = Field(default=MD5_SECURITY_WARNING, description="Cryptographic security advisory")


class MD5CompareRequest(BaseModel):
    """Request payload for comparing two inputs or verifying against an expected MD5 hash."""
    input_a: str = Field(
        default="",
        description="First input text or payload",
    )
    input_b: str = Field(
        default="",
        description="Second input text or expected 32-hexadecimal checksum",
    )
    compare_mode: str = Field(
        default="text_vs_text",
        description="Comparison mode: 'text_vs_text' or 'text_vs_hash'",
    )


class MD5CompareResponse(BaseModel):
    """Response returned from MD5 integrity and avalanche comparison."""
    algorithm: str = Field(default="MD5", description="Cryptographic hash algorithm name")
    compare_mode: str = Field(..., description="Active comparison mode")
    hash_a: str = Field(
        ...,
        description="32-character lowercase hex digest of input A",
        min_length=32,
        max_length=32,
    )
    hash_b: str = Field(
        ...,
        description="32-character lowercase hex digest of input B (or normalized expected hash)",
        min_length=32,
        max_length=32,
    )
    is_match: bool = Field(..., description="True if both digests are identical; False otherwise")
    hamming_distance_bits: int = Field(
        ...,
        description="Number of differing bit positions across the 128-bit digests (0 for match, ~64 for avalanche)",
    )
    bit_difference_percentage: float = Field(
        ...,
        description="Percentage of digest bits that differ between inputs (out of 128 bits)",
    )
    execution_duration_ms: float = Field(..., description="Execution time in milliseconds")
    security_warning: str = Field(default=MD5_SECURITY_WARNING, description="Cryptographic security advisory")
