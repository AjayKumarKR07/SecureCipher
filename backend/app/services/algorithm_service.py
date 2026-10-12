from typing import List
from app.schemas.algorithm import AlgorithmInfo

# The 6 core cryptographic algorithms supported by SecureCipher
ALGORITHMS_REGISTRY: List[AlgorithmInfo] = [
    AlgorithmInfo(
        id="aes",
        name="AES (Advanced Encryption Standard)",
        category="Symmetric Block Cipher",
        purpose="Confidential bulk data encryption and secure file protection",
        description="Rijndael block cipher standardized by NIST in 2001. Operates on 128-bit blocks using 128, 192, or 256-bit keys with modes like CBC and GCM.",
        key_size_info="128, 192, or 256 bits",
        status="Active (AES-256-GCM Implemented)",
        features=[
            "128-bit block size",
            "Hardware accelerated on modern CPUs (AES-NI)",
            "NIST FIPS 197 standard",
            "Supports CBC and authenticated GCM modes",
        ],
    ),
    AlgorithmInfo(
        id="rsa",
        name="RSA (Rivest-Shamir-Adleman)",
        category="Asymmetric Cryptography",
        purpose="Public-key encryption, secure key transport, and digital signatures",
        description="Trapdoor one-way permutation based on the computational difficulty of factoring the product of two large prime numbers.",
        key_size_info="2048, 3072, or 4096 bits",
        status="Active (RSA-OAEP-SHA256 Implemented)",
        features=[
            "Public and private key pairs",
            "OAEP padding for secure encryption",
            "PSS padding for digital signature verification",
            "PKCS#1 / PKCS#8 formatting support",
        ],
    ),
    AlgorithmInfo(
        id="diffie-hellman",
        name="Diffie-Hellman Key Exchange",
        category="Key Agreement Protocol",
        purpose="Secure establishment of shared secret keys over insecure communication channels",
        description="First public-key protocol published (1976), relying on the discrete logarithm problem in cyclic groups to derive matching session keys without transmitting secrets.",
        key_size_info="2048-bit MODP Group 14 (RFC 3526)",
        status="Active (RFC 3526 MODP-2048 & HKDF-SHA256 Implemented)",
        features=[
            "Zero pre-shared key requirement",
            "Forward secrecy enablement",
            "Educational step-by-step modular exponentiation visualization",
            "Shared secret derivation for symmetric pipelines",
        ],
    ),
    AlgorithmInfo(
        id="sha-256",
        name="SHA-256 (Secure Hash Algorithm)",
        category="Cryptographic Hash Function",
        purpose="Cryptographic data integrity, digital fingerprints, and message authentication",
        description="Belongs to the SHA-2 family designed by the NSA. Compresses variable-length input into a deterministic 256-bit (32-byte) digest with pre-image and collision resistance.",
        key_size_info="Fixed 256-bit digest (64 hex characters)",
        status="Active (FIPS 180-4 Hashing & Integrity Verification Implemented)",
        features=[
            "Strict one-way avalanche effect",
            "Chunk-streamed file hashing (O(1) memory)",
            "NIST FIPS 180-4 standard verification",
            "Bit-level Hamming distance comparison",
        ],
    ),
    AlgorithmInfo(
        id="md5",
        name="MD5 (Message Digest 5)",
        category="Legacy Hash Function",
        purpose="Educational integrity comparison, legacy checksum verification, and collision analysis",
        description="Designed by Ronald Rivest in 1991. Produces a 128-bit digest. Cryptographically broken for collision resistance, included for comparative analysis and legacy systems.",
        key_size_info="Fixed 128-bit digest (32 hex characters)",
        status="Active (RFC 1321 Legacy Hash & Educational Collision Analysis)",
        features=[
            "128-bit digest (32 hex characters)",
            "High execution speed for non-security checksums",
            "Educational comparison against modern SHA-256",
            "Demonstration of collision vulnerabilities (Wang et al.)",
        ],
    ),
    AlgorithmInfo(
        id="des",
        name="DES (Data Encryption Standard)",
        category="Legacy Symmetric Cipher",
        purpose="Historical and educational block cipher analysis and cryptanalysis demonstrations",
        description="Feistel cipher standardized in 1977 by NBS. Employs a 56-bit key on 64-bit blocks across 16 rounds. Superseded by AES due to brute-force vulnerability.",
        key_size_info="56 effective bits (64-bit with parity)",
        status="Active (FIPS 46-3 Legacy Feistel Cipher - Educational Only)",
        features=[
            "64-bit block size with 16 Feistel rounds",
            "DES-CBC mode with random 8-byte IV",
            "Educational comparison against modern AES-256",
            "Demonstrates 56-bit key-space vulnerability",
        ],
    ),
]


def get_all_algorithms() -> List[AlgorithmInfo]:
    return ALGORITHMS_REGISTRY


def get_algorithm_by_id(algo_id: str) -> AlgorithmInfo | None:
    for algo in ALGORITHMS_REGISTRY:
        if algo.id == algo_id:
            return algo
    return None
