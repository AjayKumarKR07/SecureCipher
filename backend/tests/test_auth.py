import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.core.security import (
    validate_password_strength,
    hash_password,
    verify_password,
    generate_otp,
    hash_otp,
    verify_otp,
)

# In-memory SQLite for testing authentication isolatedly
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_password_strength_validation():
    # Less than 8 chars
    valid, err = validate_password_strength("Short1!")
    assert not valid
    assert "8 characters" in err

    # No uppercase
    valid, err = validate_password_strength("lowercase123!")
    assert not valid
    assert "uppercase" in err

    # No lowercase
    valid, err = validate_password_strength("UPPERCASE123!")
    assert not valid
    assert "lowercase" in err

    # No numbers
    valid, err = validate_password_strength("NoNumbersHere!")
    assert not valid
    assert "numeric digit" in err

    # No special chars
    valid, err = validate_password_strength("NoSpecialChar123")
    assert not valid
    assert "special character" in err

    # Valid strong password
    valid, err = validate_password_strength("SecurePass#2026")
    assert valid
    assert err is None


def test_password_hashing():
    pwd = "StrongPassword@999"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert hashed.startswith("$2b$")
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword@999", hashed) is False


def test_otp_hashing():
    otp = generate_otp()
    assert len(otp) == 6
    assert otp.isdigit()

    email = "test@securecipher.io"
    h = hash_otp(otp, email)
    assert h != otp
    assert verify_otp(otp, email, h) is True
    assert verify_otp("000000", email, h) is False
    assert verify_otp(otp, "different@securecipher.io", h) is False


def test_request_and_verify_otp_registration_flow(client):
    test_user = {
        "full_name": "Cipher Analyst",
        "email": "analyst@securecipher.org",
        "password": "ValidPassword#2026",
    }

    # Step 1: Request OTP
    res1 = client.post("/api/auth/register/request-otp", json=test_user)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["email"] == test_user["email"]
    assert "dev_otp" in data1
    otp_code = data1["dev_otp"]
    assert len(otp_code) == 6

    # Test cooldown: requesting again immediately returns 429
    res_cooldown = client.post("/api/auth/register/request-otp", json=test_user)
    assert res_cooldown.status_code == 429

    # Step 2: Invalid OTP fails
    res_invalid = client.post(
        "/api/auth/register/verify-otp",
        json={**test_user, "otp": "999999" if otp_code != "999999" else "111111"},
    )
    assert res_invalid.status_code == 400
    assert "Invalid verification code" in res_invalid.json()["detail"]

    # Step 3: Valid OTP creates account
    res_valid = client.post(
        "/api/auth/register/verify-otp",
        json={**test_user, "otp": otp_code},
    )
    assert res_valid.status_code == 201
    auth_data = res_valid.json()
    assert "access_token" in auth_data
    assert auth_data["user"]["email"] == test_user["email"]
    assert auth_data["user"]["full_name"] == test_user["full_name"]
    assert auth_data["user"]["is_verified"] is True
    # Verify password is not in response
    assert "password" not in auth_data["user"]
    assert "hashed_password" not in auth_data["user"]

    # Duplicate registration request fails
    res_dup = client.post("/api/auth/register/request-otp", json=test_user)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]


def test_login_and_me_endpoints(client):
    # Register user first
    test_user = {
        "full_name": "Alice Cyber",
        "email": "alice@securecipher.io",
        "password": "AlicePassword!123",
    }
    r_otp = client.post("/api/auth/register/request-otp", json=test_user)
    otp = r_otp.json()["dev_otp"]
    client.post("/api/auth/register/verify-otp", json={**test_user, "otp": otp})

    # Test successful login
    login_res = client.post(
        "/api/auth/login",
        json={"email": "alice@securecipher.io", "password": "AlicePassword!123"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Test wrong password login
    bad_login = client.post(
        "/api/auth/login",
        json={"email": "alice@securecipher.io", "password": "WrongPassword!123"},
    )
    assert bad_login.status_code == 401

    # Test protected /me endpoint with Bearer token
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    profile = me_res.json()
    assert profile["email"] == "alice@securecipher.io"
    assert profile["full_name"] == "Alice Cyber"

    # Test /me without token fails
    unauth_res = client.get("/api/auth/me")
    assert unauth_res.status_code == 401


def test_change_password_and_update_profile(client):
    test_user = {
        "full_name": "Bob Security",
        "email": "bob@securecipher.io",
        "password": "InitialPassword#2026",
    }
    r_otp = client.post("/api/auth/register/request-otp", json=test_user)
    otp = r_otp.json()["dev_otp"]
    v_res = client.post("/api/auth/register/verify-otp", json={**test_user, "otp": otp})
    token = v_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Update Profile
    update_res = client.put(
        "/api/auth/profile",
        headers=headers,
        json={"full_name": "Robert Security Analyst"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Robert Security Analyst"

    # 2. Change Password - Wrong current password fails
    bad_cp = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "WrongPassword#2026", "new_password": "NewSecretPassword#2026"},
    )
    assert bad_cp.status_code == 400
    assert "incorrect" in bad_cp.json()["detail"]

    # 3. Change Password - Weak new password fails complexity check
    weak_cp = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "InitialPassword#2026", "new_password": "weakpassword123"},
    )
    assert weak_cp.status_code == 400
    assert "uppercase" in weak_cp.json()["detail"]

    # 4. Change Password - Valid change succeeds
    good_cp = client.post(
        "/api/auth/change-password",
        headers=headers,
        json={"current_password": "InitialPassword#2026", "new_password": "NewSecretPassword#2026"},
    )
    assert good_cp.status_code == 200
    assert good_cp.json()["status"] == "success"

    # 5. Verify new password can log in
    new_login = client.post(
        "/api/auth/login",
        json={"email": "bob@securecipher.io", "password": "NewSecretPassword#2026"},
    )
    assert new_login.status_code == 200

