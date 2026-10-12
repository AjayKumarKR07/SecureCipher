import base64
import hashlib
import logging
import warnings
from typing import Tuple, Dict, Any
from cryptography.hazmat.primitives.asymmetric import dh
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.utils import CryptographyDeprecationWarning

logger = logging.getLogger(__name__)

# Suppress known FFDH deprecation warning locally in this service
warnings.filterwarnings("ignore", category=CryptographyDeprecationWarning)

# RFC 3526 MODP Group 14 (2048-bit prime, generator g=2)
RFC_3526_GROUP_14_P_HEX = (
    "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD1"
    "29024E088A67CC74020BBEA63B139B22514A08798E3404DD"
    "EF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245"
    "E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED"
    "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3D"
    "C2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F"
    "83655D23DCA3AD961C62F356208552BB9ED529077096966D"
    "670C354E4ABC9804F1746C08CA18217C32905E462E36CE3B"
    "E39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9"
    "DE2BCBF6955817183995497CEA956AE515D2261898FA0510"
    "15728E5A8AACAA68FFFFFFFFFFFFFFFF"
)
RFC_3526_GROUP_14_P = int(RFC_3526_GROUP_14_P_HEX, 16)
RFC_3526_GROUP_14_G = 2

_CACHED_DH_PARAMS: dh.DHParameters | None = None


def get_dh_parameters() -> dh.DHParameters:
    """
    Returns the standard RFC 3526 MODP Group 14 DHParameters instance.
    Cached in-memory to prevent repeated modulus parsing overhead.
    """
    global _CACHED_DH_PARAMS
    if _CACHED_DH_PARAMS is None:
        param_numbers = dh.DHParameterNumbers(RFC_3526_GROUP_14_P, RFC_3526_GROUP_14_G)
        _CACHED_DH_PARAMS = param_numbers.parameters()
    return _CACHED_DH_PARAMS


def generate_dh_keypair(party_name: str = "Party") -> Tuple[str, str, str]:
    """
    Generates an independent, cryptographically secure Diffie-Hellman keypair using RFC 3526 Group 14.
    Returns: (public_key_pem, private_key_pem, public_key_hex)
    """
    params = get_dh_parameters()
    private_key = params.generate_private_key()
    public_key = private_key.public_key()

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")

    pub_y = public_key.public_numbers().y
    pub_hex = hex(pub_y)[2:]

    return public_pem, private_pem, pub_hex


def derive_shared_secret(
    private_key_pem: str,
    peer_public_key_pem: str,
    info: str = "SecureCipher Diffie-Hellman KDF",
) -> Tuple[bytes, str, str, str]:
    """
    Derives the raw shared secret using ECDH/DH exchange and hashes it through HKDF-SHA256.
    Returns: (raw_shared_secret_bytes, derived_key_b64, derived_key_hex, key_fingerprint)
    
    SECURITY PRINCIPLE:
    Raw Diffie-Hellman shared secret is NEVER used directly as a symmetric key.
    HKDF-SHA256 extracts and expands full 256-bit entropy.
    """
    if not private_key_pem or not private_key_pem.strip():
        raise ValueError("Private key PEM cannot be empty.")
    if not peer_public_key_pem or not peer_public_key_pem.strip():
        raise ValueError("Peer public key PEM cannot be empty.")

    try:
        loaded_private = serialization.load_pem_private_key(
            private_key_pem.strip().encode("utf-8"),
            password=None,
        )
    except Exception as e:
        raise ValueError(f"Invalid private key PEM format: {str(e)}")

    if not isinstance(loaded_private, dh.DHPrivateKey):
        raise ValueError("Provided private key is not a Diffie-Hellman private key.")

    try:
        loaded_peer_public = serialization.load_pem_public_key(
            peer_public_key_pem.strip().encode("utf-8")
        )
    except Exception as e:
        raise ValueError(f"Invalid peer public key PEM format: {str(e)}")

    if not isinstance(loaded_peer_public, dh.DHPublicKey):
        raise ValueError("Provided peer key is not a Diffie-Hellman public key.")

    # Validate compatible group parameters (prime modulus and generator must match)
    priv_params = loaded_private.parameters().parameter_numbers()
    pub_params = loaded_peer_public.parameters().parameter_numbers()
    if priv_params.p != pub_params.p or priv_params.g != pub_params.g:
        raise ValueError("Incompatible Diffie-Hellman groups: prime modulus or generator mismatch.")

    try:
        raw_secret = loaded_private.exchange(loaded_peer_public)
    except Exception as e:
        raise ValueError(f"Diffie-Hellman exchange computation failed: {str(e)}")

    # Apply HKDF-SHA256 to extract and expand a uniform 256-bit (32-byte) key
    info_bytes = info.encode("utf-8") if info else b"SecureCipher Diffie-Hellman KDF"
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=info_bytes,
    )
    derived_key = hkdf.derive(raw_secret)

    derived_key_b64 = base64.b64encode(derived_key).decode("utf-8")
    derived_key_hex = derived_key.hex()
    key_fingerprint = hashlib.sha256(derived_key).hexdigest()

    return raw_secret, derived_key_b64, derived_key_hex, key_fingerprint


def simulate_full_exchange() -> Dict[str, Any]:
    """
    Performs an end-to-end, independent Alice <-> Bob Diffie-Hellman key exchange.
    Both sides independently generate keypairs and compute shared secrets,
    then derive matching HKDF keys.
    """
    # 1. Independent generation for Alice
    alice_pub_pem, alice_priv_pem, alice_pub_hex = generate_dh_keypair(party_name="Alice")

    # 2. Independent generation for Bob
    bob_pub_pem, bob_priv_pem, bob_pub_hex = generate_dh_keypair(party_name="Bob")

    # 3. Alice computes shared secret using Bob's public key
    _, alice_key_b64, alice_key_hex, alice_fp = derive_shared_secret(
        private_key_pem=alice_priv_pem,
        peer_public_key_pem=bob_pub_pem,
    )

    # 4. Bob computes shared secret using Alice's public key
    _, bob_key_b64, bob_key_hex, bob_fp = derive_shared_secret(
        private_key_pem=bob_priv_pem,
        peer_public_key_pem=alice_pub_pem,
    )

    key_match = (alice_key_b64 == bob_key_b64) and (alice_fp == bob_fp)

    return {
        "prime_modulus_hex": RFC_3526_GROUP_14_P_HEX,
        "generator": RFC_3526_GROUP_14_G,
        "alice": {
            "party_name": "Alice",
            "public_key_pem": alice_pub_pem,
            "private_key_pem": alice_priv_pem,
            "public_key_hex": alice_pub_hex,
        },
        "bob": {
            "party_name": "Bob",
            "public_key_pem": bob_pub_pem,
            "private_key_pem": bob_priv_pem,
            "public_key_hex": bob_pub_hex,
        },
        "alice_derived_key_b64": alice_key_b64,
        "bob_derived_key_b64": bob_key_b64,
        "key_match": key_match,
        "key_fingerprint": alice_fp,
    }
