"""Services package."""
from app.services.algorithm_service import get_all_algorithms, get_algorithm_by_id
from app.services.history_service import get_recent_history
from app.services.aes_service import encrypt_aes_256_gcm, decrypt_aes_256_gcm, record_audit_operation
from app.services.rsa_service import generate_rsa_keypair, encrypt_rsa_oaep, decrypt_rsa_oaep
from app.services.diffie_hellman_service import (
    generate_dh_keypair,
    derive_shared_secret,
    simulate_full_exchange,
    get_dh_parameters,
)
from app.services.sha256_service import (
    compute_sha256_text,
    compute_sha256_file_stream,
    compare_sha256_integrity,
)
from app.services.md5_service import (
    compute_md5_text,
    compute_md5_file_stream,
    compare_md5_integrity,
)
from app.services.des_service import (
    encrypt_des_cbc,
    decrypt_des_cbc,
)

__all__ = [
    "get_all_algorithms",
    "get_algorithm_by_id",
    "get_recent_history",
    "encrypt_aes_256_gcm",
    "decrypt_aes_256_gcm",
    "record_audit_operation",
    "generate_rsa_keypair",
    "encrypt_rsa_oaep",
    "decrypt_rsa_oaep",
    "generate_dh_keypair",
    "derive_shared_secret",
    "simulate_full_exchange",
    "get_dh_parameters",
    "compute_sha256_text",
    "compute_sha256_file_stream",
    "compare_sha256_integrity",
    "compute_md5_text",
    "compute_md5_file_stream",
    "compare_md5_integrity",
    "encrypt_des_cbc",
    "decrypt_des_cbc",
]


