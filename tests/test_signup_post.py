from src.app import activities


def test_signup_success_adds_participant(client):
    activity_name = "Chess Club"
    email = "new.student@mergington.edu"

    assert email not in activities[activity_name]["participants"]

    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for {activity_name}"
    assert email in activities[activity_name]["participants"]


def test_signup_returns_404_for_unknown_activity(client):
    response = client.post(
        "/activities/Unknown%20Club/signup",
        params={"email": "student@mergington.edu"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_returns_400_for_duplicate_registration(client):
    activity_name = "Chess Club"
    existing_email = activities[activity_name]["participants"][0]

    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": existing_email},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up"


def test_signup_returns_400_when_activity_is_full(client):
    activity_name = "Chess Club"
    email = "overflow.student@mergington.edu"

    activities[activity_name]["participants"] = [
        f"student{i}@mergington.edu"
        for i in range(activities[activity_name]["max_participants"])
    ]

    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Activity is full"
    assert email not in activities[activity_name]["participants"]
    assert (
        len(activities[activity_name]["participants"])
        == activities[activity_name]["max_participants"]
    )
