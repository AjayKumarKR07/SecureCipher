import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.aes import (
    AESEncryptRequest,
    AESEncryptResponse,
    AESDecryptRequest,
    AESDecryptResponse,
    KDFParameters,
)
from app.services.aes_service import (
    encrypt_aes_256_gcm,
    decrypt_aes_256_gcm,
    record_audit_operation,
)

router = APIRouter(prefix="/aes", tags=["AES Cryptography"])


@router.post(
    "/encrypt",
    response_model=AESEncryptResponse,
    status_code=status.HTTP_200_OK,
    summary="Encrypt text with AES-256-GCM",
)
def encrypt_text(
    payload: AESEncryptRequest,
    db: Optional[Session] = Depends(get_db),
) -> AESEncryptResponse:
    """
    Encrypts a UTF-8 text message using AES-256-GCM.
    - Derives a 256-bit key using Scrypt with a fresh 16-byte salt.
    - Encrypts using a fresh random 12-byte nonce.
    - Returns Base64-encoded nonce, salt, ciphertext, and authentication tag.
    - Logs execution duration safely in the database (never stores keys or plaintext).
    """
    if not payload.plaintext or not payload.plaintext.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plaintext cannot be empty or whitespace.",
        )
    if not payload.passphrase or not payload.passphrase.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passphrase cannot be empty or whitespace.",
        )

    start_time = time.perf_counter()
    try:
        result = encrypt_aes_256_gcm(payload.plaintext, payload.passphrase)
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Persist audit record
        record_audit_operation(
            db=db,
            algorithm_name="AES-256-GCM",
            operation_type="encryption",
            status="success",
            duration_ms=duration_ms,
        )

        return AESEncryptResponse(
            algorithm=result["algorithm"],
            nonce=result["nonce"],
            salt=result["salt"],
            ciphertext=result["ciphertext"],
            tag=result["tag"],
            kdf=KDFParameters(**result["kdf"]),
            execution_duration_ms=round(duration_ms, 2),
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="AES-256-GCM",
            operation_type="encryption",
            status="failure",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/decrypt",
    response_model=AESDecryptResponse,
    status_code=status.HTTP_200_OK,
    summary="Decrypt and authenticate text with AES-256-GCM",
)
def decrypt_text(
    payload: AESDecryptRequest,
    db: Optional[Session] = Depends(get_db),
) -> AESDecryptResponse:
    """
    Authenticates and decrypts an AES-256-GCM ciphertext payload.
    - Validates nonce, salt, ciphertext, and tag Base64 structures.
    - Derives 256-bit key from passphrase and salt via Scrypt.
    - Verifies the GCM 16-byte authentication tag.
    - Fails safely if passphrase or data has been tampered with.
    """
    if not payload.passphrase or not payload.passphrase.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passphrase cannot be empty or whitespace.",
        )

    start_time = time.perf_counter()
    try:
        plaintext = decrypt_aes_256_gcm(
            ciphertext_b64=payload.ciphertext,
            tag_b64=payload.tag,
            nonce_b64=payload.nonce,
            salt_b64=payload.salt,
            passphrase=payload.passphrase,
        )
        duration_ms = (time.perf_counter() - start_time) * 1000

        # Persist audit record
        record_audit_operation(
            db=db,
            algorithm_name="AES-256-GCM",
            operation_type="decryption",
            status="success",
            duration_ms=duration_ms,
        )

        return AESDecryptResponse(
            algorithm="AES-256-GCM",
            plaintext=plaintext,
            verified=True,
            execution_duration_ms=round(duration_ms, 2),
        )
    except ValueError as ve:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="AES-256-GCM",
            operation_type="decryption",
            status="failure",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="AES-256-GCM",
            operation_type="decryption",
            status="failure",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decryption operation encountered an error.",
        )
