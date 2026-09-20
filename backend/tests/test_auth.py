def test_register_user_success(client):
    payload = {
        "name": "Jagan Test",
        "email": "jagan@test.edu",
        "password": "SecretPassword123!",
        "confirm_password": "SecretPassword123!"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["name"] == "Jagan Test"
    assert data["user"]["email"] == "jagan@test.edu"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]


def test_register_duplicate_email(client):
    payload = {
        "name": "Jagan Test",
        "email": "duplicate@test.edu",
        "password": "Password123",
        "confirm_password": "Password123"
    }
    res1 = client.post("/api/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/api/auth/register", json=payload)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"].lower()


def test_register_password_mismatch(client):
    payload = {
        "name": "Jagan Test",
        "email": "mismatch@test.edu",
        "password": "Password123",
        "confirm_password": "DifferentPassword123"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success_and_me_endpoint(client):
    # 1. Register user
    reg_payload = {
        "name": "Student Alex",
        "email": "alex@university.edu",
        "password": "StudyHard2026!",
        "confirm_password": "StudyHard2026!"
    }
    client.post("/api/auth/register", json=reg_payload)

    # 2. Login
    login_payload = {
        "email": "alex@university.edu",
        "password": "StudyHard2026!"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == 200
    data = response.json()
    token = data["access_token"]
    assert token is not None

    # 3. Access protected /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["name"] == "Student Alex"
    assert me_data["email"] == "alex@university.edu"


def test_login_invalid_password(client):
    reg_payload = {
        "name": "Student Alex",
        "email": "alex2@university.edu",
        "password": "CorrectPassword!",
        "confirm_password": "CorrectPassword!"
    }
    client.post("/api/auth/register", json=reg_payload)

    response = client.post("/api/auth/login", json={
        "email": "alex2@university.edu",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


def test_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
