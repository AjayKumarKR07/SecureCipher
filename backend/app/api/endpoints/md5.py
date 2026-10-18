import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.endpoints.auth import get_optional_current_user
from app.schemas.md5 import (
    MD5TextRequest,
    MD5TextResponse,
    MD5FileResponse,
    MD5CompareRequest,
    MD5CompareResponse,
)
from app.services.md5_service import (
    compute_md5_text,
    compute_md5_file_stream,
    compare_md5_integrity,
    record_audit_operation,
)

router = APIRouter(prefix="/md5", tags=["MD5 Hashing (Legacy)"])


@router.post(
    "/hash-text",
    response_model=MD5TextResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute MD5 digest of input text (Educational / Legacy)",
)
def hash_text_endpoint(
    payload: MD5TextRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> MD5TextResponse:
    """
    Computes a 128-bit (16-byte) MD5 hash digest for UTF-8 input text.
    - Follows RFC 1321 standard.
    - Fully supports empty input (yielding RFC 1321 test vector d41d8cd98f00b204e9800998ecf8427e).
    - Returns digest in lowercase hexadecimal (32 characters).
    - Logs safe execution metadata without storing input or digest.
    
    WARNING: MD5 is cryptographically broken and must NOT be used for security purposes.
    """
    if payload.text is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text payload must not be null.",
        )

    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()
    try:
        digest, byte_len = compute_md5_text(payload.text)
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="MD5",
            operation_type="hash_text",
            status="success",
            duration_ms=duration_ms,
            user_id=user_id,
        )

        return MD5TextResponse(
            algorithm="MD5",
            digest=digest,
            byte_length=byte_len,
            execution_duration_ms=round(duration_ms, 3),
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="MD5",
            operation_type="hash_text",
            status="failed",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MD5 text hashing failed: {str(e)}",
        )


@router.post(
    "/hash-file",
    response_model=MD5FileResponse,
    status_code=status.HTTP_200_OK,
    summary="Stream and compute MD5 digest of an uploaded file (Legacy)",
)
async def hash_file_endpoint(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> MD5FileResponse:
    """
    Streams an uploaded file in 64 KB chunks through hashlib.md5.
    - Prevents out-of-memory crashes by never loading the complete file into memory.
    - Enforces a 50 MB maximum file size limit.
    - Returns 32-character lowercase hex digest and file metadata.
    - Zero file content or digest stored in database history.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid file with filename must be provided.",
        )

    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()
    try:
        digest, file_size_bytes = await compute_md5_file_stream(file)
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="MD5",
            operation_type="hash_file",
            status="success",
            duration_ms=duration_ms,
            user_id=user_id,
        )

        return MD5FileResponse(
            algorithm="MD5",
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
            algorithm_name="MD5",
            operation_type="hash_file",
            status="failed",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="MD5",
            operation_type="hash_file",
            status="failed",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MD5 file hashing failed: {str(e)}",
        )


@router.post(
    "/compare",
    response_model=MD5CompareResponse,
    status_code=status.HTTP_200_OK,
    summary="Compare two inputs or verify text against an expected MD5 checksum",
)
def compare_endpoint(
    payload: MD5CompareRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> MD5CompareResponse:
    """
    Computes and compares MD5 hashes of two inputs.
    - In 'text_vs_text' mode: Hashes both Input A and Input B, calculating match status and bit difference.
    - In 'text_vs_hash' mode: Hashes Input A and compares against expected 32-hex digest in Input B.
    - Calculates bit-level Hamming distance across 128 bits.
    """
    valid_modes = {"text_vs_text", "text_vs_hash"}
    if payload.compare_mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid compare_mode. Supported modes are: {', '.join(valid_modes)}",
        )

    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()
    try:
        result = compare_md5_integrity(
            input_a=payload.input_a,
            input_b=payload.input_b,
            compare_mode=payload.compare_mode,
        )
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="MD5",
            operation_type="compare",
            status="success",
            duration_ms=duration_ms,
            user_id=user_id,
        )

        return MD5CompareResponse(
            algorithm="MD5",
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
            algorithm_name="MD5",
            operation_type="compare",
            status="failed",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="MD5",
            operation_type="compare",
            status="failed",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MD5 comparison failed: {str(e)}",
        )
