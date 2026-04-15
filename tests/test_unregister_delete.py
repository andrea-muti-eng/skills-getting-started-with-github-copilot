from src.app import activities


def test_unregister_success_removes_participant(client):
    activity_name = "Chess Club"
    existing_email = activities[activity_name]["participants"][0]

    response = client.delete(
        f"/activities/{activity_name}/signup",
        params={"email": existing_email},
    )

    assert response.status_code == 200
    assert response.json()["message"] == f"Removed {existing_email} from {activity_name}"
    assert existing_email not in activities[activity_name]["participants"]


def test_unregister_returns_404_for_unknown_activity(client):
    response = client.delete(
        "/activities/Unknown%20Club/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_returns_404_for_non_registered_student(client):
    response = client.delete(
        "/activities/Chess%20Club/signup",
        params={"email": "not.registered@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Student not signed up for this activity"


def test_unregister_same_student_twice_returns_404_on_second_attempt(client):
    activity_name = "Chess Club"
    existing_email = activities[activity_name]["participants"][0]

    first_response = client.delete(
        f"/activities/{activity_name}/signup",
        params={"email": existing_email},
    )

    second_response = client.delete(
        f"/activities/{activity_name}/signup",
        params={"email": existing_email},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 404
    assert second_response.json()["detail"] == "Student not signed up for this activity"
