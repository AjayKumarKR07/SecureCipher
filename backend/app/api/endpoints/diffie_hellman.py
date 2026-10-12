import time
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.diffie_hellman import (
    DHKeyGenRequest,
    DHKeyGenResponse,
    DHDeriveSecretRequest,
    DHDeriveSecretResponse,
    DHSimulationResponse,
    DHSimulationPartyInfo,
)
from app.services.diffie_hellman_service import (
    generate_dh_keypair,
    derive_shared_secret,
    simulate_full_exchange,
    RFC_3526_GROUP_14_P_HEX,
    RFC_3526_GROUP_14_G,
)
from app.services.history_service import record_audit_operation

router = APIRouter(prefix="/diffie-hellman", tags=["Diffie-Hellman Key Exchange"])


@router.post(
    "/generate-keypair",
    response_model=DHKeyGenResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Diffie-Hellman Keypair (RFC 3526 MODP Group 14)",
)
def generate_keypair(
    payload: DHKeyGenRequest,
    db: Optional[Session] = Depends(get_db),
) -> DHKeyGenResponse:
    """
    Generates an independent Diffie-Hellman key pair using standard RFC 3526 MODP Group 14 (2048-bit prime, g=2).
    
    SECURITY NOTE:
    Private keys are generated in-memory and delivered to the client.
    They are NEVER stored, cached, or logged on the server.
    """
    start_time = time.perf_counter()
    try:
        pub_pem, priv_pem, pub_hex = generate_dh_keypair(payload.party_name or "Party")
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="Diffie-Hellman",
            operation_type="key_generation",
            status="success",
            duration_ms=duration_ms,
        )

        return DHKeyGenResponse(
            algorithm="Diffie-Hellman (RFC 3526 MODP Group 14)",
            group_name="MODP Group 14 (2048-bit)",
            prime_bits=2048,
            generator=RFC_3526_GROUP_14_G,
            party_name=payload.party_name or "Party",
            public_key_pem=pub_pem,
            private_key_pem=priv_pem,
            public_key_hex=pub_hex,
            execution_duration_ms=round(duration_ms, 2),
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="Diffie-Hellman",
            operation_type="key_generation",
            status="failure",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/derive-secret",
    response_model=DHDeriveSecretResponse,
    status_code=status.HTTP_200_OK,
    summary="Derive Shared Secret & HKDF Symmetric Key",
)
def derive_secret(
    payload: DHDeriveSecretRequest,
    db: Optional[Session] = Depends(get_db),
) -> DHDeriveSecretResponse:
    """
    Derives the raw shared secret using the calling party's private key and peer's public key,
    then expands it into a uniform 256-bit symmetric key using HKDF-SHA256.
    
    SECURITY NOTE:
    The raw shared secret and private keys are processed purely in-memory and NEVER persisted to database or logs.
    """
    if not payload.private_key_pem or not payload.private_key_pem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Private key PEM cannot be empty or whitespace.",
        )
    if not payload.peer_public_key_pem or not payload.peer_public_key_pem.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Peer public key PEM cannot be empty or whitespace.",
        )

    start_time = time.perf_counter()
    try:
        raw_secret, key_b64, key_hex, fingerprint = derive_shared_secret(
            private_key_pem=payload.private_key_pem,
            peer_public_key_pem=payload.peer_public_key_pem,
            info=payload.info or "SecureCipher Diffie-Hellman KDF",
        )
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="Diffie-Hellman",
            operation_type="key_derivation",
            status="success",
            duration_ms=duration_ms,
        )

        return DHDeriveSecretResponse(
            algorithm="Diffie-Hellman (RFC 3526 MODP Group 14)",
            kdf="HKDF-SHA256",
            shared_secret_length_bytes=len(raw_secret),
            derived_key_b64=key_b64,
            derived_key_hex=key_hex,
            key_fingerprint=fingerprint,
            execution_duration_ms=round(duration_ms, 2),
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="Diffie-Hellman",
            operation_type="key_derivation",
            status="failure",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/simulate-exchange",
    response_model=DHSimulationResponse,
    status_code=status.HTTP_200_OK,
    summary="Simulate Complete Alice <-> Bob Diffie-Hellman Key Exchange",
)
def simulate_exchange(
    db: Optional[Session] = Depends(get_db),
) -> DHSimulationResponse:
    """
    Executes a complete, independent educational handshake simulation between Alice and Bob:
    1. Generates independent Alice (a, A) and Bob (b, B) keypairs.
    2. Alice computes S_A = B^a mod p and derives K_A via HKDF-SHA256.
    3. Bob computes S_B = A^b mod p and derives K_B via HKDF-SHA256.
    4. Confirms that K_A == K_B.
    
    TRUST LIMITATION WARNING:
    In this educational simulation running on a single host, both parties' operations occur via this API.
    In real-world decentralized deployments, private keys never leave respective endpoints,
    and public keys must be authenticated against Man-in-the-Middle (MitM) attacks.
    """
    start_time = time.perf_counter()
    try:
        sim_data = simulate_full_exchange()
        duration_ms = (time.perf_counter() - start_time) * 1000

        record_audit_operation(
            db=db,
            algorithm_name="Diffie-Hellman",
            operation_type="key_exchange_simulation",
            status="success",
            duration_ms=duration_ms,
        )

        return DHSimulationResponse(
            algorithm="Diffie-Hellman (RFC 3526 MODP Group 14)",
            group_name="MODP Group 14 (2048-bit)",
            prime_modulus_hex=sim_data["prime_modulus_hex"],
            generator=sim_data["generator"],
            kdf="HKDF-SHA256",
            alice=DHSimulationPartyInfo(**sim_data["alice"]),
            bob=DHSimulationPartyInfo(**sim_data["bob"]),
            alice_derived_key_b64=sim_data["alice_derived_key_b64"],
            bob_derived_key_b64=sim_data["bob_derived_key_b64"],
            key_match=sim_data["key_match"],
            key_fingerprint=sim_data["key_fingerprint"],
            execution_duration_ms=round(duration_ms, 2),
        )
    except Exception as e:
        duration_ms = (time.perf_counter() - start_time) * 1000
        record_audit_operation(
            db=db,
            algorithm_name="Diffie-Hellman",
            operation_type="key_exchange_simulation",
            status="failure",
            duration_ms=duration_ms,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
