"""
RSA-PSS Digital Signature and Verification API endpoints.

Route prefix: /rsa-pss
Tag:          RSA-PSS Digital Signatures

IMPORTANT DISTINCTION:
  RSA-PSS is a DIGITAL SIGNATURE scheme — it provides integrity and proof of
  private-key possession, NOT confidential encryption. Use /rsa for encryption.

Security Notes:
  - Private keys and passphrases are never stored, logged, or returned beyond
    the single response that delivers them.
  - File bytes are never stored or logged.
  - A signature being cryptographically valid means the data was signed by the
    holder of the private key at some point. It does NOT independently establish
    real-world identity, a trusted timestamp, or legal non-repudiation.
  - Public keys uploaded by users are NOT automatically trusted; authenticity
    must be established out-of-band (e.g., fingerprint verification).
"""
import time
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.api.endpoints.auth import get_optional_current_user
from app.schemas.rsa_pss import (
    RSAPSSKeyGenRequest,
    RSAPSSKeyGenResponse,
    RSAPSSSignRequest,
    RSAPSSSignResponse,
    RSAPSSVerifyRequest,
    RSAPSSVerifyResponse,
    RSAPSSSignFileResponse,
    RSAPSSVerifyFileResponse,
)
from app.services.rsa_pss_service import (
    generate_rsa_pss_keypair,
    sign_text_rsa_pss,
    verify_text_rsa_pss,
    sign_file_rsa_pss,
    verify_file_rsa_pss,
)
from app.services.history_service import record_audit_operation

router = APIRouter(prefix="/rsa-pss", tags=["RSA-PSS Digital Signatures"])


# ---------------------------------------------------------------------------
# A. Generate Key Pair
# ---------------------------------------------------------------------------

@router.post(
    "/generate-keys",
    response_model=RSAPSSKeyGenResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate RSA-PSS Signing Key Pair",
)
def generate_keys(
    payload: RSAPSSKeyGenRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> RSAPSSKeyGenResponse:
    """
    Generate an RSA key pair (2048 / 3072 / 4096 bits) for RSA-PSS digital signatures.

    The private key PEM is encrypted with the supplied passphrase using
    BestAvailableEncryption (AES-based, OpenSSL-compatible PKCS#8).
    If no passphrase is provided, the private key is returned unencrypted.

    **SECURITY NOTICE**: The private key is generated in-memory and returned ONCE.
    It is never stored, cached, or logged on the server. Save it securely.
    If you lose the private key, signatures made with it cannot be recreated.
    """
    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()

    try:
        public_pem, private_pem, encrypted, key_size = generate_rsa_pss_keypair(
            key_size=payload.key_size,
            passphrase=payload.private_key_passphrase,
        )
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name=f"RSA-PSS-{key_size}",
            operation_type="key_generation",
            status="success",
            duration_ms=duration_ms,
            user_id=user_id,
        )

        return RSAPSSKeyGenResponse(
            algorithm="RSA-PSS",
            key_size=key_size,
            public_key_pem=public_pem,
            private_key_pem=private_pem,
            private_key_encrypted=encrypted,
            public_key_format="SubjectPublicKeyInfo (SPKI) PEM",
            private_key_format="PKCS#8 PEM",
            execution_duration_ms=round(duration_ms, 2),
        )
    except ValueError as ve:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name=f"RSA-PSS-{payload.key_size}",
            operation_type="key_generation",
            status="failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name=f"RSA-PSS-{payload.key_size}",
            operation_type="key_generation",
            status="failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Key generation failed due to an internal error.",
        )


# ---------------------------------------------------------------------------
# B. Sign Text
# ---------------------------------------------------------------------------

@router.post(
    "/sign",
    response_model=RSAPSSSignResponse,
    status_code=status.HTTP_200_OK,
    summary="Sign a Text Message with RSA-PSS-SHA256",
)
def sign_text(
    payload: RSAPSSSignRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> RSAPSSSignResponse:
    """
    Sign the exact UTF-8 bytes of a text message using RSA-PSS with SHA-256.

    - Whitespace, line endings, and Unicode are preserved exactly.
    - An empty message is valid and will produce a verifiable signature.
    - The private key is never stored, logged, or returned.
    - The message content is never stored or logged.
    """
    if not payload.private_key_pem or not payload.private_key_pem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Private key PEM cannot be empty or whitespace.",
        )

    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()

    try:
        signature_b64, sig_len, key_size = sign_text_rsa_pss(
            message=payload.message,
            private_key_pem=payload.private_key_pem,
            passphrase=payload.private_key_passphrase,
        )
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="RSA-PSS-SHA256",
            operation_type="signature_generation",
            status="success",
            duration_ms=duration_ms,
            user_id=user_id,
        )

        return RSAPSSSignResponse(
            algorithm="RSA-PSS-SHA256",
            digest="SHA-256",
            mgf="MGF1-SHA256",
            salt_length="PSS.MAX_LENGTH",
            signature_base64=signature_b64,
            signature_byte_length=sig_len,
            key_size=key_size,
            signature_encoding="Base64",
            execution_duration_ms=round(duration_ms, 2),
        )
    except ValueError as ve:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="RSA-PSS-SHA256",
            operation_type="signature_generation",
            status="failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="RSA-PSS-SHA256",
            operation_type="signature_generation",
            status="failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Text signing failed due to an internal error.",
        )


# ---------------------------------------------------------------------------
# C. Verify Text
# ---------------------------------------------------------------------------

@router.post(
    "/verify",
    response_model=RSAPSSVerifyResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify an RSA-PSS-SHA256 Text Signature",
)
def verify_text(
    payload: RSAPSSVerifyRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> RSAPSSVerifyResponse:
    """
    Verify an RSA-PSS-SHA256 signature against a text message using the public key.

    A cryptographically invalid signature returns `valid: false` with a structured
    result — it is NOT an error. HTTP 400 is returned only for malformed inputs.

    **Public Key Trust Notice**: A signature being valid proves that the message
    was signed by the holder of the corresponding private key. It does NOT
    independently establish the real-world identity of the signer, prove when it
    was signed, or guarantee that the public key is authentic. Establish key
    authenticity through a separate trusted channel.
    """
    if not payload.public_key_pem or not payload.public_key_pem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public key PEM cannot be empty or whitespace.",
        )
    if not payload.signature_base64 or not payload.signature_base64.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signature cannot be empty or whitespace.",
        )

    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()

    try:
        valid, user_message = verify_text_rsa_pss(
            message=payload.message,
            signature_b64=payload.signature_base64,
            public_key_pem=payload.public_key_pem,
        )
        duration_ms = (time.perf_counter() - start_time) * 1000

        outcome_status = "valid_signature" if valid else "invalid_signature"
        record_audit_operation(
            db=db,
            algorithm_name="RSA-PSS-SHA256",
            operation_type="signature_verification",
            status="success" if valid else "failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )

        return RSAPSSVerifyResponse(
            valid=valid,
            status=outcome_status,
            algorithm="RSA-PSS-SHA256",
            digest="SHA-256",
            message=user_message,
            execution_duration_ms=round(duration_ms, 2),
        )
    except ValueError as ve:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="RSA-PSS-SHA256",
            operation_type="signature_verification",
            status="failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="RSA-PSS-SHA256",
            operation_type="signature_verification",
            status="failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification could not be completed due to an internal error.",
        )


# ---------------------------------------------------------------------------
# D. Sign a File
# ---------------------------------------------------------------------------

@router.post(
    "/sign-file",
    status_code=status.HTTP_200_OK,
    summary="Sign an Uploaded File with RSA-PSS-SHA256",
    response_description="JSON body with Base64 signature and metadata",
    response_model=RSAPSSSignFileResponse,
)
async def sign_file(
    file: UploadFile = File(..., description="File to sign (max 50 MB)"),
    private_key_pem: str = Form(..., min_length=1, max_length=16384, description="RSA private key PEM"),
    private_key_passphrase: Optional[str] = Form(
        default=None,
        max_length=1024,
        description="Passphrase to unlock the private key if encrypted",
    ),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> RSAPSSSignFileResponse:
    """
    Sign the exact bytes of an uploaded file using RSA-PSS-SHA256.

    The original file is NOT modified. The response contains the Base64 signature
    and metadata. Save the signature separately alongside the original file.
    The file contents and private key are never stored or logged.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid file with a filename must be provided.",
        )
    if not private_key_pem or not private_key_pem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Private key PEM cannot be empty or whitespace.",
        )

    max_size = settings.MAX_FILE_SIZE_BYTES
    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()
    original_filename = file.filename

    try:
        # Stream and enforce size limit before loading into memory
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
                        detail=f"File exceeds the maximum allowed size of {max_mb} MB for signing.",
                    )
                chunks.append(chunk)
            file_bytes = b"".join(chunks)
        except HTTPException:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_generation",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_generation",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read uploaded file: {str(e)}",
            )

        try:
            signature_b64, sig_len = sign_file_rsa_pss(
                file_bytes=file_bytes,
                private_key_pem=private_key_pem,
                passphrase=private_key_passphrase,
                max_file_size=max_size,
            )
            duration_ms = (time.perf_counter() - start_time) * 1000

            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_generation",
                status="success",
                duration_ms=duration_ms,
                user_id=user_id,
            )

            return RSAPSSSignFileResponse(
                algorithm="RSA-PSS-SHA256",
                digest="SHA-256",
                signature_base64=signature_b64,
                signature_byte_length=sig_len,
                original_filename=original_filename,
                original_file_size=total_bytes,
                execution_duration_ms=round(duration_ms, 2),
            )
        except ValueError as ve:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_generation",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except Exception:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_generation",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File signing failed due to an internal error.",
            )
    finally:
        await file.close()


# ---------------------------------------------------------------------------
# E. Verify a File
# ---------------------------------------------------------------------------

@router.post(
    "/verify-file",
    response_model=RSAPSSVerifyFileResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify an RSA-PSS-SHA256 File Signature",
)
async def verify_file(
    file: UploadFile = File(..., description="Original file to verify (max 50 MB)"),
    public_key_pem: str = Form(..., min_length=1, max_length=16384, description="RSA public key PEM"),
    signature_base64: str = Form(
        ...,
        min_length=1,
        max_length=8192,
        description="Base64-encoded RSA-PSS signature to verify against the file",
    ),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> RSAPSSVerifyFileResponse:
    """
    Verify an RSA-PSS-SHA256 signature against the exact bytes of an uploaded file.

    A modified file, a signature created for a different file, or a mismatched
    public key will all return `valid: false` — this is a normal verification
    outcome, NOT an error. HTTP 400 is returned only for malformed inputs.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid file with a filename must be provided.",
        )
    if not public_key_pem or not public_key_pem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public key PEM cannot be empty or whitespace.",
        )
    if not signature_base64 or not signature_base64.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signature cannot be empty or whitespace.",
        )

    max_size = settings.MAX_FILE_SIZE_BYTES
    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()
    original_filename = file.filename

    try:
        # Stream file in chunks, enforce size limit
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
                        detail=f"File exceeds the maximum allowed size of {max_mb} MB for verification.",
                    )
                chunks.append(chunk)
            file_bytes = b"".join(chunks)
        except HTTPException:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_verification",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_verification",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read uploaded file: {str(e)}",
            )

        try:
            valid, user_message = verify_file_rsa_pss(
                file_bytes=file_bytes,
                signature_b64=signature_base64,
                public_key_pem=public_key_pem,
                max_file_size=max_size,
            )
            duration_ms = (time.perf_counter() - start_time) * 1000

            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_verification",
                status="success" if valid else "failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )

            return RSAPSSVerifyFileResponse(
                valid=valid,
                status="valid_signature" if valid else "invalid_signature",
                algorithm="RSA-PSS-SHA256",
                digest="SHA-256",
                original_filename=original_filename,
                original_file_size=total_bytes,
                message=user_message,
                execution_duration_ms=round(duration_ms, 2),
            )
        except ValueError as ve:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_verification",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
        except Exception:
            duration_ms = (time.perf_counter() - start_time) * 1000
            record_audit_operation(
                db=db,
                algorithm_name="RSA-PSS-SHA256",
                operation_type="file_signature_verification",
                status="failure",
                duration_ms=duration_ms,
                user_id=user_id,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File verification failed due to an internal error.",
            )
    finally:
        await file.close()
