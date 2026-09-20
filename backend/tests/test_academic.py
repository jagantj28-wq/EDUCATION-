import datetime


def _get_auth_header(client, email="student@univ.edu"):
    client.post("/api/auth/register", json={
        "name": "Academic Tester",
        "email": email,
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_subject_crud(client):
    headers = _get_auth_header(client, "subject_test@univ.edu")

    # Create subject
    create_res = client.post("/api/subjects", headers=headers, json={
        "name": "Operating Systems",
        "code": "CS301",
        "teacher": "Dr. Silberschatz",
        "credits": 4,
        "color": "#3B82F6"
    })
    assert create_res.status_code == 201
    subject_id = create_res.json()["id"]

    # List subjects
    list_res = client.get("/api/subjects", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1
    assert list_res.json()[0]["name"] == "Operating Systems"

    # Update subject
    update_res = client.put(f"/api/subjects/{subject_id}", headers=headers, json={
        "teacher": "Dr. Tanenbaum",
        "credits": 4
    })
    assert update_res.status_code == 200
    assert update_res.json()["teacher"] == "Dr. Tanenbaum"


def test_assignment_workflow(client):
    headers = _get_auth_header(client, "assignment_test@univ.edu")
    s_res = client.post("/api/subjects", headers=headers, json={
        "name": "DBMS",
        "code": "CS302",
        "credits": 3,
        "color": "#10B981"
    })
    subject_id = s_res.json()["id"]

    # Create Assignment
    deadline = (datetime.datetime.utcnow() + datetime.timedelta(days=2)).isoformat()
    asgn_res = client.post("/api/assignments", headers=headers, json={
        "subject_id": subject_id,
        "title": "B+ Tree Indexing",
        "description": "Implement B+ tree node splits in C++",
        "deadline": deadline,
        "priority": "high",
        "status": "pending"
    })
    assert asgn_res.status_code == 201
    asgn_id = asgn_res.json()["id"]
    assert asgn_res.json()["is_overdue"] is False

    # Toggle status
    toggle_res = client.patch(f"/api/assignments/{asgn_id}/toggle-status", headers=headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["status"] == "completed"


def test_attendance_calculation(client):
    headers = _get_auth_header(client, "att_test@univ.edu")
    s_res = client.post("/api/subjects", headers=headers, json={
        "name": "Computer Networks",
        "code": "CS303",
        "credits": 3,
        "color": "#F59E0B"
    })
    subject_id = s_res.json()["id"]

    # Update attendance: 30 held, 20 attended = 66.7% (below 75% target)
    update_res = client.put(f"/api/attendance/{subject_id}", headers=headers, json={
        "classes_held": 30,
        "classes_attended": 20,
        "target_percentage": 75.0
    })
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["percentage"] == 66.7
    assert data["is_below_target"] is True
    assert data["classes_needed"] == 10

    # Quick mark attendance: present
    mark_res = client.post(f"/api/attendance/{subject_id}/mark?present=true", headers=headers)
    assert mark_res.status_code == 200
    assert mark_res.json()["classes_held"] == 31
    assert mark_res.json()["classes_attended"] == 21


def test_recommendation_and_dashboard(client):
    headers = _get_auth_header(client, "dashboard_test@univ.edu")
    s_res = client.post("/api/subjects", headers=headers, json={
        "name": "Mathematics",
        "code": "MATH201",
        "credits": 4,
        "color": "#8B5CF6"
    })
    subject_id = s_res.json()["id"]

    # Add exam in 2 days (urgent)
    exam_date = (datetime.datetime.utcnow() + datetime.timedelta(days=2)).isoformat()
    client.post("/api/exams", headers=headers, json={
        "subject_id": subject_id,
        "title": "Midterm Exam",
        "exam_date": exam_date,
        "exam_type": "Midterm",
        "syllabus": "Calculus and Linear Algebra"
    })

    # Call Dashboard
    dash_res = client.get("/api/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["upcoming_exams"] == 1
    assert len(dash_data["today_plan"]) >= 1
    first_task = dash_data["today_plan"][0]
    assert first_task["priority"] == "high"


def test_ai_chat_and_summarize(client):
    headers = _get_auth_header(client, "ai_test@univ.edu")

    # Ask academic question
    chat_res = client.post("/api/ai/chat", headers=headers, json={
        "message": "What is deadlock in operating systems?"
    })
    assert chat_res.status_code == 200
    assert "deadlock" in chat_res.json()["answer"].lower()
    assert "coffman" in chat_res.json()["answer"].lower()
