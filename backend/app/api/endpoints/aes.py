import time
from typing import Optional
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, status
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.api.endpoints.auth import get_optional_current_user
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
    encrypt_aes_file,
    decrypt_aes_file,
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
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> AESEncryptResponse:
    """
    Encrypts a UTF-8 text message using AES-256-GCM.
    - Derives a 256-bit key using Scrypt with a fresh 16-byte salt.
    - Encrypts using a fresh random 12-byte nonce.
    - Returns Base64-encoded nonce, salt, ciphertext, and authentication tag.
    - Logs execution duration safely in the database associated with authenticated user.
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

    user_id = current_user.id if current_user else None
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
            user_id=user_id,
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
            user_id=user_id,
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
    current_user: Optional[User] = Depends(get_optional_current_user),
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

    user_id = current_user.id if current_user else None
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
            user_id=user_id,
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
            user_id=user_id,
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
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decryption operation encountered an error.",
        )


@router.post(
    "/encrypt-file",
    status_code=status.HTTP_200_OK,
    summary="Encrypt arbitrary binary file with AES-256-GCM",
    response_description="Binary encrypted .scipher container",
)
async def encrypt_file_endpoint(
    file: UploadFile = File(..., description="File to encrypt (max 50 MB)"),
    passphrase: str = Form(..., min_length=1, max_length=1024, description="Secret passphrase for AES key derivation"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
):
    """
    Encrypts an uploaded binary file using AES-256-GCM into a SecureCipher container.
    - Derives 256-bit key from passphrase and random 16-byte salt via Scrypt.
    - Uses a fresh random 12-byte nonce for each encryption.
    - Cryptographically binds the metadata header as AES-GCM Associated Authenticated Data (AAD).
    - Returns binary .scipher container ready for safe download.
    - Records safe operational audit metadata (operation_type='file_encryption') with zero file/key data stored.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid file with filename must be provided.",
        )
    if not passphrase or not passphrase.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passphrase cannot be empty or whitespace.",
        )

    max_size = settings.MAX_FILE_SIZE_BYTES
    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()

    try:
        # Read file in chunks to enforce size limit before memory processing
        total_bytes = 0
        chunks = []
        chunk_size = 64 * 1024
        try:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_size:
                    max_mb = max_size // (1024 * 1024)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"File exceeds maximum allowed size limit of {max_mb} MB.",
                    )
                chunks.append(chunk)
            file_bytes = b"".join(chunks)
        except HTTPException:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="AES-256-GCM",
                operation_type="file_encryption",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="AES-256-GCM",
                operation_type="file_encryption",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read uploaded file: {str(e)}",
            )

        try:
            container_bytes, download_filename, metadata = encrypt_aes_file(
                file_bytes=file_bytes,
                filename=file.filename,
                passphrase=passphrase,
                max_file_size=max_size,
            )
            duration_ms = (time.perf_counter() - start_time) * 1000

            record_audit_operation(
                db=db,
                algorithm_name="AES-256-GCM",
                operation_type="file_encryption",
                status="success",
                duration_ms=duration_ms,
                user_id=user_id,
            )

            encoded_filename = quote(download_filename)
            # RFC 6266 / RFC 5987 ASCII fallback
            ascii_fallback = download_filename.encode("ascii", "replace").decode("ascii").replace("?", "_")
            if not ascii_fallback or ascii_fallback == ".scipher":
                ascii_fallback = "encrypted_file.scipher"

            headers = {
                "Content-Disposition": f'attachment; filename="{ascii_fallback}"; filename*=UTF-8\'\'{encoded_filename}',
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "X-Original-Filename": encoded_filename,
                "X-Encrypted-Size": str(len(container_bytes)),
                "X-Execution-Duration-Ms": str(round(duration_ms, 2)),
            }

            return Response(
                content=container_bytes,
                media_type="application/octet-stream",
                headers=headers,
            )
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="AES-256-GCM",
                operation_type="file_encryption",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
    finally:
        await file.close()


@router.post(
    "/decrypt-file",
    status_code=status.HTTP_200_OK,
    summary="Authenticate and decrypt AES-256-GCM .scipher file",
    response_description="Recovered original binary file",
)
async def decrypt_file_endpoint(
    file: UploadFile = File(..., description="Encrypted .scipher container to decrypt"),
    passphrase: str = Form(..., min_length=1, max_length=1024, description="Passphrase used during encryption"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
):
    """
    Authenticates and decrypts a SecureCipher .scipher file.
    - Verifies magic header, format version, and metadata.
    - Reconstructs Associated Authenticated Data (AAD) and derives 256-bit Scrypt key.
    - Verifies 16-byte GCM authentication tag.
    - Returns recovered original file bytes with safe Content-Disposition filename.
    - Fails safely on incorrect passphrase, tampered ciphertext, or corrupted metadata.
    - Never returns partial or unauthenticated plaintext.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid file must be provided.",
        )
    if not passphrase or not passphrase.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passphrase cannot be empty or whitespace.",
        )

    max_size = settings.MAX_FILE_SIZE_BYTES + 65536 + 1024
    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()

    try:
        # Read container bytes in chunks
        total_bytes = 0
        chunks = []
        chunk_size = 64 * 1024
        try:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > max_size:
                    max_mb = settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Container exceeds maximum allowed size limit of {max_mb} MB.",
                    )
                chunks.append(chunk)
            container_bytes = b"".join(chunks)
        except HTTPException:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="AES-256-GCM",
                operation_type="file_decryption",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="AES-256-GCM",
                operation_type="file_decryption",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read encrypted container: {str(e)}",
            )

        try:
            decrypted_bytes, download_filename, metadata = decrypt_aes_file(
                container_bytes=container_bytes,
                passphrase=passphrase,
                max_file_size=max_size,
            )
            duration_ms = (time.perf_counter() - start_time) * 1000

            record_audit_operation(
                db=db,
                algorithm_name="AES-256-GCM",
                operation_type="file_decryption",
                status="success",
                duration_ms=duration_ms,
                user_id=user_id,
            )

            encoded_filename = quote(download_filename)
            # RFC 6266 / RFC 5987 ASCII fallback
            ascii_fallback = download_filename.encode("ascii", "replace").decode("ascii").replace("?", "_")
            if not ascii_fallback or ascii_fallback == ".bin":
                ascii_fallback = "decrypted_file.bin"

            headers = {
                "Content-Disposition": f'attachment; filename="{ascii_fallback}"; filename*=UTF-8\'\'{encoded_filename}',
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "X-Original-Filename": encoded_filename,
                "X-Decrypted-Size": str(len(decrypted_bytes)),
                "X-Execution-Duration-Ms": str(round(duration_ms, 2)),
            }

            return Response(
                content=decrypted_bytes,
                media_type="application/octet-stream",
                headers=headers,
            )
        except ValueError as ve:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="AES-256-GCM",
                operation_type="file_decryption",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
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
                operation_type="file_decryption",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Decryption failed. Please verify that the file and passphrase are valid.",
            )
    finally:
        await file.close()
