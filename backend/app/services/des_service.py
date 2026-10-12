"""DES (Data Encryption Standard) Cryptographic Service (RFC FIPS 46-3 - Legacy / Educational).

CRITICAL SECURITY ADVISORY:
DES is an obsolete 56-bit symmetric block cipher standardized in 1977 and officially
withdrawn by NIST in 2005. Its small 56-bit key space (2^56 keys) can be broken via
exhaustive brute-force search within hours on modern commodity hardware.
Furthermore, CBC mode provides NO cryptographic integrity or authentication, leaving
ciphertexts vulnerable to bit-flipping attacks and padding oracles.

This implementation uses pycryptodome (Crypto.Cipher.DES) in CBC mode with PKCS#7 padding
strictly for educational analysis, historical Feistel network demonstrations, and
academic comparison against modern AES-256-GCM.
"""

import os
import base64
import logging
from typing import Dict, Any
from fastapi import HTTPException, status
from Crypto.Cipher import DES
from Crypto.Util.Padding import pad, unpad
from app.services.history_service import record_audit_operation

logger = logging.getLogger(__name__)

DES_BLOCK_SIZE = 8  # 64 bits
DES_KEY_SIZE = 8    # 64 bits (56 effective bits + 8 parity bits)
MAX_PLAINTEXT_LENGTH = 65536  # 64 KB safety limit for educational payloads


def _validate_des_key(key_str: str) -> bytes:
    """
    Validates and encodes an 8-character DES key.
    
    DES keys must be exactly 8 bytes (64 bits).
    Raises HTTPException(400) if key length is not exactly 8 bytes.
    """
    if not key_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DES key must not be empty.",
        )
    key_bytes = key_str.encode("utf-8")
    if len(key_bytes) != DES_KEY_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DES key must be exactly {DES_KEY_SIZE} bytes (8 ASCII characters, 56 effective bits). Received {len(key_bytes)} bytes.",
        )
    return key_bytes


def encrypt_des_cbc(plaintext: str, key_str: str) -> Dict[str, Any]:
    """
    Encrypts UTF-8 plaintext using legacy DES-CBC with PKCS#7 padding.
    
    Generates a fresh random 8-byte IV for every encryption operation.
    Returns Base64-encoded ciphertext and IV.
    """
    if not plaintext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plaintext cannot be empty.",
        )
    if len(plaintext) > MAX_PLAINTEXT_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Plaintext exceeds maximum allowed length of {MAX_PLAINTEXT_LENGTH} characters.",
        )

    key_bytes = _validate_des_key(key_str)
    iv_bytes = os.urandom(DES_BLOCK_SIZE)

    try:
        cipher = DES.new(key_bytes, DES.MODE_CBC, iv=iv_bytes)
        plaintext_bytes = plaintext.encode("utf-8")
        padded_bytes = pad(plaintext_bytes, DES_BLOCK_SIZE, style="pkcs7")
        ciphertext_bytes = cipher.encrypt(padded_bytes)

        ciphertext_b64 = base64.b64encode(ciphertext_bytes).decode("ascii")
        iv_b64 = base64.b64encode(iv_bytes).decode("ascii")

        return {
            "ciphertext": ciphertext_b64,
            "iv": iv_b64,
            "block_size_bytes": DES_BLOCK_SIZE,
            "key_size_bits": 56,
        }
    except Exception as e:
        logger.error("DES-CBC encryption failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DES-CBC encryption failed: {str(e)}",
        )


def decrypt_des_cbc(ciphertext_b64: str, key_str: str, iv_b64: str) -> Dict[str, Any]:
    """
    Decrypts Base64-encoded DES-CBC ciphertext with PKCS#7 unpadding.
    
    Validates Base64 format, 8-byte IV, and 8-byte block alignment.
    Sanitizes padding errors and warns that CBC provides NO authentication.
    """
    if not ciphertext_b64 or not ciphertext_b64.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ciphertext cannot be empty.",
        )
    if not iv_b64 or not iv_b64.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Initialization vector (IV) cannot be empty.",
        )

    key_bytes = _validate_des_key(key_str)

    # Decode IV
    try:
        iv_bytes = base64.b64decode(iv_b64.strip(), validate=True)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Base64 encoding for initialization vector (IV).",
        )
    if len(iv_bytes) != DES_BLOCK_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DES IV must be exactly {DES_BLOCK_SIZE} bytes (64 bits). Received {len(iv_bytes)} bytes.",
        )

    # Decode Ciphertext
    try:
        ciphertext_bytes = base64.b64decode(ciphertext_b64.strip(), validate=True)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Base64 encoding for ciphertext.",
        )
    if len(ciphertext_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decoded ciphertext cannot be 0 bytes.",
        )
    if len(ciphertext_bytes) % DES_BLOCK_SIZE != 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ciphertext length ({len(ciphertext_bytes)} bytes) must be a multiple of the DES block size ({DES_BLOCK_SIZE} bytes).",
        )

    try:
        cipher = DES.new(key_bytes, DES.MODE_CBC, iv=iv_bytes)
        decrypted_padded = cipher.decrypt(ciphertext_bytes)
        plaintext_bytes = unpad(decrypted_padded, DES_BLOCK_SIZE, style="pkcs7")
        plaintext = plaintext_bytes.decode("utf-8")
        return {
            "plaintext": plaintext,
            "is_authenticated": False,
        }
    except (ValueError, KeyError):
        # PKCS#7 unpadding failure or malformed block
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decryption failed: Invalid PKCS#7 padding or incorrect key/IV. Note: DES-CBC provides no message integrity authentication.",
        )
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Decryption failed: Plaintext is not valid UTF-8. The key or ciphertext is likely incorrect.",
        )
    except Exception as e:
        logger.error("DES-CBC decryption failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DES decryption error: {str(e)}",
        )


__all__ = [
    "encrypt_des_cbc",
    "decrypt_des_cbc",
    "record_audit_operation",
    "DES_BLOCK_SIZE",
    "DES_KEY_SIZE",
]
