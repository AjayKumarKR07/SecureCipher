import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.sha256 import (
    SHA256TextRequest,
    SHA256TextResponse,
    SHA256FileResponse,
    SHA256CompareRequest,
    SHA256CompareResponse,
)
from app.services.sha256_service import (
    compute_sha256_text,
    compute_sha256_file_stream,
    compare_sha256_integrity,
    record_audit_operation,
)

router = APIRouter(prefix="/sha256", tags=["SHA-256 Hashing"])


@router.post(
    "/hash-text",
    response_model=SHA256TextResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute SHA-256 digest of input text",
)
def hash_text_endpoint(
    payload: SHA256TextRequest,
    db: Optional[Session] = Depends(get_db),
) -> SHA256TextResponse:
    """
    Computes a 256-bit (32-byte) deterministic SHA-256 hash digest for UTF-8 input text.
    - Follows NIST FIPS 180-4 standard.
    - Fully supports empty input (yielding NIST test vector e3b0c442...).
    - Returns digest in lowercase hexadecimal (64 characters).
    - Logs safe execution metadata without storing input or digest.
    """
    if payload.text is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text payload must not be null.",
        )

    start_time = time.perf_counter()
    try:
        digest, byte_len = compute_sha256_text(payload.text)
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="SHA-256",
            operation_type="hash_text",
            status="success",
            duration_ms=duration_ms,
        )

        return SHA256TextResponse(
            algorithm="SHA-256",
            digest=digest,
            byte_length=byte_len,
            execution_duration_ms=round(duration_ms, 3),
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="SHA-256",
            operation_type="hash_text",
            status="failed",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SHA-256 text hashing failed: {str(e)}",
        )


@router.post(
    "/hash-file",
    response_model=SHA256FileResponse,
    status_code=status.HTTP_200_OK,
    summary="Stream and compute SHA-256 digest of an uploaded file",
)
async def hash_file_endpoint(
    file: UploadFile = File(...),
    db: Optional[Session] = Depends(get_db),
) -> SHA256FileResponse:
    """
    Streams an uploaded file in 64 KB chunks through hashlib.sha256.
    - Prevents out-of-memory crashes by never loading the complete file into memory.
    - Enforces a 50 MB maximum file size limit.
    - Returns 64-character lowercase hex digest and file metadata.
    - Zero file content or digest stored in database history.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid file with filename must be provided.",
        )

    start_time = time.perf_counter()
    try:
        digest, file_size_bytes = await compute_sha256_file_stream(file)
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="SHA-256",
            operation_type="hash_file",
            status="success",
            duration_ms=duration_ms,
        )

        return SHA256FileResponse(
            algorithm="SHA-256",
            filename=file.filename,
            digest=digest,
            file_size_bytes=file_size_bytes,
            content_type=file.content_type,
            execution_duration_ms=round(duration_ms, 3),
        )
    except HTTPException:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="SHA-256",
            operation_type="hash_file",
            status="failed",
            duration_ms=duration_ms,
        )
        raise
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="SHA-256",
            operation_type="hash_file",
            status="failed",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File hashing failed: {str(e)}",
        )


@router.post(
    "/compare",
    response_model=SHA256CompareResponse,
    status_code=status.HTTP_200_OK,
    summary="Compare two inputs or verify text against an expected checksum",
)
def compare_endpoint(
    payload: SHA256CompareRequest,
    db: Optional[Session] = Depends(get_db),
) -> SHA256CompareResponse:
    """
    Computes and compares SHA-256 hashes of two inputs.
    - In 'text_vs_text' mode: Hashes both Input A and Input B, calculating match status and bit difference.
    - In 'text_vs_hash' mode: Hashes Input A and compares against expected 64-hex digest in Input B.
    - Calculates bit-level Hamming distance demonstrating the cryptographic avalanche effect.
    """
    valid_modes = {"text_vs_text", "text_vs_hash"}
    if payload.compare_mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid compare_mode. Supported modes are: {', '.join(valid_modes)}",
        )

    start_time = time.perf_counter()
    try:
        result = compare_sha256_integrity(
            input_a=payload.input_a,
            input_b=payload.input_b,
            compare_mode=payload.compare_mode,
        )
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="SHA-256",
            operation_type="compare",
            status="success",
            duration_ms=duration_ms,
        )

        return SHA256CompareResponse(
            algorithm="SHA-256",
            compare_mode=payload.compare_mode,
            hash_a=result["hash_a"],
            hash_b=result["hash_b"],
            is_match=result["is_match"],
            hamming_distance_bits=result["hamming_distance_bits"],
            bit_difference_percentage=result["bit_difference_percentage"],
            execution_duration_ms=round(duration_ms, 3),
        )
    except HTTPException:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="SHA-256",
            operation_type="compare",
            status="failed",
            duration_ms=duration_ms,
        )
        raise
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="SHA-256",
            operation_type="compare",
            status="failed",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"SHA-256 comparison failed: {str(e)}",
        )
