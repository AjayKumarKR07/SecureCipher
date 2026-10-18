import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.endpoints.auth import get_optional_current_user
from app.schemas.rsa import (
    RSAKeyGenRequest,
    RSAKeyGenResponse,
    RSAEncryptRequest,
    RSAEncryptResponse,
    RSADecryptRequest,
    RSADecryptResponse,
)
from app.services.rsa_service import (
    generate_rsa_keypair,
    encrypt_rsa_oaep,
    decrypt_rsa_oaep,
)
from app.services.history_service import record_audit_operation

router = APIRouter(prefix="/rsa", tags=["RSA Cryptography"])


@router.post(
    "/generate-keys",
    response_model=RSAKeyGenResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate RSA Public/Private Keypair",
)
def generate_keys(
    payload: RSAKeyGenRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> RSAKeyGenResponse:
    """
    Generates an RSA-2048 or RSA-3072 key pair in PKCS#8 PEM format.
    
    SECURITY NOTE:
    Private keys are generated in-memory and delivered directly to the client.
    They are NEVER stored, cached, or logged on the server.
    """
    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()
    try:
        public_pem, private_pem, key_size = generate_rsa_keypair(payload.key_size)
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name=f"RSA-{key_size}",
            operation_type="key_generation",
            status="success",
            duration_ms=duration_ms,
            user_id=user_id,
        )

        return RSAKeyGenResponse(
            algorithm="RSA",
            key_size=key_size,
            public_key_pem=public_pem,
            private_key_pem=private_pem,
            format="PKCS#8 PEM",
            execution_duration_ms=round(duration_ms, 2),
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name=f"RSA-{payload.key_size}",
            operation_type="key_generation",
            status="failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/encrypt",
    response_model=RSAEncryptResponse,
    status_code=status.HTTP_200_OK,
    summary="Encrypt text with RSA Public Key and OAEP-SHA256",
)
def encrypt_text(
    payload: RSAEncryptRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> RSAEncryptResponse:
    """
    Encrypts a UTF-8 text message using an RSA public key with OAEP (SHA-256) padding.
    Returns Base64-encoded ciphertext.
    """
    if not payload.plaintext or not payload.plaintext.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plaintext cannot be empty or whitespace.",
        )
    if not payload.public_key_pem or not payload.public_key_pem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public key PEM cannot be empty or whitespace.",
        )

    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()
    try:
        ciphertext_b64, key_size = encrypt_rsa_oaep(payload.plaintext, payload.public_key_pem)
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name=f"RSA-{key_size}",
            operation_type="encryption",
            status="success",
            duration_ms=duration_ms,
            user_id=user_id,
        )

        return RSAEncryptResponse(
            algorithm="RSA-OAEP-SHA256",
            key_size=key_size,
            ciphertext=ciphertext_b64,
            padding="OAEP-MGF1-SHA256",
            execution_duration_ms=round(duration_ms, 2),
        )
    except ValueError as ve:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="RSA",
            operation_type="encryption",
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
            algorithm_name="RSA",
            operation_type="encryption",
            status="failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RSA encryption operation failed.",
        )


@router.post(
    "/decrypt",
    response_model=RSADecryptResponse,
    status_code=status.HTTP_200_OK,
    summary="Decrypt ciphertext with RSA Private Key and OAEP-SHA256",
)
def decrypt_text(
    payload: RSADecryptRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Optional[Session] = Depends(get_db),
) -> RSADecryptResponse:
    """
    Decrypts an RSA-OAEP (SHA-256) ciphertext using the recipient's private key.
    Fails safely if the private key or ciphertext is invalid or tampered with.
    """
    if not payload.ciphertext or not payload.ciphertext.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ciphertext cannot be empty or whitespace.",
        )
    if not payload.private_key_pem or not payload.private_key_pem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Private key PEM cannot be empty or whitespace.",
        )

    user_id = current_user.id if current_user else None
    start_time = time.perf_counter()
    try:
        plaintext = decrypt_rsa_oaep(payload.ciphertext, payload.private_key_pem)
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="RSA-OAEP",
            operation_type="decryption",
            status="success",
            duration_ms=duration_ms,
            user_id=user_id,
        )

        return RSADecryptResponse(
            algorithm="RSA-OAEP-SHA256",
            plaintext=plaintext,
            verified=True,
            execution_duration_ms=round(duration_ms, 2),
        )
    except ValueError as ve:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="RSA-OAEP",
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
            algorithm_name="RSA-OAEP",
            operation_type="decryption",
            status="failure",
            duration_ms=duration_ms,
            user_id=user_id,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RSA decryption operation failed.",
        )
