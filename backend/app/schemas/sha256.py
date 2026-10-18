from typing import Optional
from pydantic import BaseModel, Field


class SHA256TextRequest(BaseModel):
    """Payload for text SHA-256 hashing."""
    text: str = Field(
        default="",
        max_length=500000,
        description="The UTF-8 text string to be hashed (empty string is supported as a standard NIST test vector, max 500KB).",
    )


class SHA256TextResponse(BaseModel):
    """Response returned upon hashing text."""
    algorithm: str = Field(default="SHA-256", description="Cryptographic hash algorithm name")
    digest: str = Field(
        ...,
        description="64-character lowercase hexadecimal SHA-256 hash digest",
        min_length=64,
        max_length=64,
    )
    byte_length: int = Field(..., description="Byte length of the UTF-8 input payload")
    execution_duration_ms: float = Field(..., description="Execution time in milliseconds")


class SHA256FileResponse(BaseModel):
    """Response returned upon hashing an uploaded file via chunk streaming."""
    algorithm: str = Field(default="SHA-256", description="Cryptographic hash algorithm name")
    filename: str = Field(..., description="Original filename of the uploaded file")
    digest: str = Field(
        ...,
        description="64-character lowercase hexadecimal SHA-256 hash digest",
        min_length=64,
        max_length=64,
    )
    file_size_bytes: int = Field(..., description="Total size of the streamed file in bytes")
    content_type: Optional[str] = Field(None, description="MIME content type of the uploaded file")
    execution_duration_ms: float = Field(..., description="Execution time in milliseconds")


class SHA256CompareRequest(BaseModel):
    """Request payload for comparing two inputs or verifying against an expected hash."""
    input_a: str = Field(
        default="",
        max_length=500000,
        description="First input text or payload (max 500KB)",
    )
    input_b: str = Field(
        default="",
        max_length=500000,
        description="Second input text or expected hexadecimal checksum (max 500KB)",
    )
    compare_mode: str = Field(
        default="text_vs_text",
        description="Comparison mode: 'text_vs_text' or 'text_vs_hash'",
    )


class SHA256CompareResponse(BaseModel):
    """Response returned from SHA-256 integrity and avalanche comparison."""
    algorithm: str = Field(default="SHA-256", description="Cryptographic hash algorithm name")
    compare_mode: str = Field(..., description="Active comparison mode")
    hash_a: str = Field(
        ...,
        description="64-character lowercase hex digest of input A",
        min_length=64,
        max_length=64,
    )
    hash_b: str = Field(
        ...,
        description="64-character lowercase hex digest of input B (or normalized expected hash)",
        min_length=64,
        max_length=64,
    )
    is_match: bool = Field(..., description="True if both digests are identical; False otherwise")
    hamming_distance_bits: int = Field(
        ...,
        description="Number of differing bit positions across the 256-bit digests (0 for match, ~128 for avalanche)",
    )
    bit_difference_percentage: float = Field(
        ...,
        description="Percentage of digest bits that differ between inputs",
    )
    execution_duration_ms: float = Field(..., description="Execution time in milliseconds")
