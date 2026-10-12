import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.des import (
    DESEncryptRequest,
    DESEncryptResponse,
    DESDecryptRequest,
    DESDecryptResponse,
    DES_SECURITY_WARNING,
    DES_TAMPER_WARNING,
)
from app.services.des_service import (
    encrypt_des_cbc,
    decrypt_des_cbc,
    record_audit_operation,
)

router = APIRouter(prefix="/des", tags=["DES Cryptography (Legacy)"])


@router.post(
    "/encrypt",
    response_model=DESEncryptResponse,
    status_code=status.HTTP_200_OK,
    summary="Encrypt text with legacy DES-CBC (Educational)",
)
def encrypt_text_endpoint(
    payload: DESEncryptRequest,
    db: Optional[Session] = Depends(get_db),
) -> DESEncryptResponse:
    """
    Encrypts UTF-8 text using legacy DES-CBC with PKCS#7 padding.
    - Requires an 8-character (64-bit / 56-bit effective) key.
    - Generates a fresh random 8-byte IV for every encryption.
    - Returns Base64-encoded ciphertext and IV.
    - Logs safe execution metadata without storing keys, plaintext, or ciphertext.
    
    WARNING: EDUCATIONAL / LEGACY ONLY. DES is broken and CBC mode provides NO authentication.
    """
    start_time = time.perf_counter()
    try:
        result = encrypt_des_cbc(payload.plaintext, payload.key)
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="DES-CBC",
            operation_type="encryption",
            status="success",
            duration_ms=duration_ms,
        )

        return DESEncryptResponse(
            algorithm="DES-CBC",
            ciphertext=result["ciphertext"],
            iv=result["iv"],
            block_size_bytes=result["block_size_bytes"],
            key_size_bits=result["key_size_bits"],
            is_authenticated=False,
            security_warning=DES_SECURITY_WARNING,
            execution_duration_ms=round(duration_ms, 3),
        )
    except HTTPException:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="DES-CBC",
            operation_type="encryption",
            status="failed",
            duration_ms=duration_ms,
        )
        raise
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="DES-CBC",
            operation_type="encryption",
            status="failed",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DES encryption error: {str(e)}",
        )


@router.post(
    "/decrypt",
    response_model=DESDecryptResponse,
    status_code=status.HTTP_200_OK,
    summary="Decrypt ciphertext with legacy DES-CBC (Educational)",
)
def decrypt_text_endpoint(
    payload: DESDecryptRequest,
    db: Optional[Session] = Depends(get_db),
) -> DESDecryptResponse:
    """
    Decrypts Base64-encoded DES-CBC ciphertext with PKCS#7 unpadding.
    - Requires the matching 8-character key and Base64-encoded 8-byte IV.
    - Validates Base64 encoding, IV length, and block alignment.
    - Explicitly sets is_authenticated=False and includes CBC tampering warning.
    - Logs execution duration safely in the database (never stores keys, plaintext, or ciphertext).
    """
    start_time = time.perf_counter()
    try:
        result = decrypt_des_cbc(payload.ciphertext, payload.key, payload.iv)
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="DES-CBC",
            operation_type="decryption",
            status="success",
            duration_ms=duration_ms,
        )

        return DESDecryptResponse(
            algorithm="DES-CBC",
            plaintext=result["plaintext"],
            is_authenticated=False,
            tamper_warning=DES_TAMPER_WARNING,
            security_warning=DES_SECURITY_WARNING,
            execution_duration_ms=round(duration_ms, 3),
        )
    except HTTPException:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="DES-CBC",
            operation_type="decryption",
            status="failed",
            duration_ms=duration_ms,
        )
        raise
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="DES-CBC",
            operation_type="decryption",
            status="failed",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DES decryption error: {str(e)}",
        )
