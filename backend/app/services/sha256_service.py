"""SHA-256 Cryptographic Hash & Integrity Service (NIST FIPS 180-4).

Provides:
- Standard UTF-8 text hashing using hashlib.sha256.
- Chunk-streamed file hashing without loading large files into memory.
- Integrity verification and avalanche effect calculation between two inputs.
- Safe audit logging without persisting plaintext or file contents.
"""

import hashlib
import logging
from typing import Tuple, Dict, Any
from fastapi import UploadFile, HTTPException, status
from app.services.history_service import record_audit_operation

logger = logging.getLogger(__name__)

# Maximum file size allowed for streamed hashing (50 MB)
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
# Stream chunk buffer size (64 KB)
STREAM_CHUNK_SIZE_BYTES = 64 * 1024


def compute_sha256_text(text: str) -> Tuple[str, int]:
    """
    Computes standard SHA-256 digest for input text.
    
    Empty input is supported and produces standard NIST test vector:
    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    
    Returns:
        (lowercase_hex_digest, byte_length)
    """
    encoded_bytes = text.encode("utf-8")
    hasher = hashlib.sha256(encoded_bytes)
    digest = hasher.hexdigest().lower()
    return digest, len(encoded_bytes)


async def compute_sha256_file_stream(
    file: UploadFile,
    max_size_bytes: int = MAX_FILE_SIZE_BYTES,
    chunk_size: int = STREAM_CHUNK_SIZE_BYTES,
) -> Tuple[str, int]:
    """
    Streams an uploaded file in chunks through hashlib.sha256 without loading
    the full file into memory.
    
    Enforces maximum file size limit during streaming.
    
    Returns:
        (lowercase_hex_digest, total_file_size_bytes)
        
    Raises:
        HTTPException: If file size exceeds maximum allowed limit or read fails.
    """
    hasher = hashlib.sha256()
    total_bytes = 0

    try:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_size_bytes:
                max_mb = max_size_bytes // (1024 * 1024)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File exceeds maximum allowed size limit of {max_mb} MB.",
                )
            hasher.update(chunk)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed during streamed file hashing: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error occurred while streaming and hashing the uploaded file.",
        )
    finally:
        # Reset file cursor if possible
        try:
            await file.seek(0)
        except Exception:
            pass

    digest = hasher.hexdigest().lower()
    return digest, total_bytes


def compare_sha256_integrity(
    input_a: str,
    input_b: str,
    compare_mode: str = "text_vs_text",
) -> Dict[str, Any]:
    """
    Computes hashes for two inputs and calculates integrity match and bit-level differences.
    
    Modes:
    - 'text_vs_text': Computes SHA-256 for both input_a and input_b text.
    - 'text_vs_hash': Computes SHA-256 for input_a and compares with expected hex digest in input_b.
    
    Returns:
        Dict with hash_a, hash_b, is_match, hamming_distance_bits, and bit_difference_percentage.
    """
    hash_a, _ = compute_sha256_text(input_a)

    if compare_mode == "text_vs_hash":
        clean_expected = input_b.strip().lower()
        # Verify if input_b is a valid 64-hex SHA-256 digest
        if len(clean_expected) == 64 and all(c in "0123456789abcdef" for c in clean_expected):
            hash_b = clean_expected
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expected checksum must be a valid 64-character hexadecimal SHA-256 digest.",
            )
    else:
        # text_vs_text
        hash_b, _ = compute_sha256_text(input_b)

    is_match = (hash_a == hash_b)

    # Compute Hamming distance across 256 bits
    int_a = int(hash_a, 16)
    int_b = int(hash_b, 16)
    xor_diff = int_a ^ int_b
    hamming_distance = bin(xor_diff).count("1")
    bit_difference_pct = round((hamming_distance / 256.0) * 100.0, 2)

    return {
        "hash_a": hash_a,
        "hash_b": hash_b,
        "is_match": is_match,
        "hamming_distance_bits": hamming_distance,
        "bit_difference_percentage": bit_difference_pct,
    }


__all__ = [
    "compute_sha256_text",
    "compute_sha256_file_stream",
    "compare_sha256_integrity",
    "record_audit_operation",
    "MAX_FILE_SIZE_BYTES",
]
