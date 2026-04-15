def test_get_activities_returns_expected_structure(client):
    response = client.get("/activities")

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, dict)
    assert len(data) > 0

    for _, details in data.items():
        assert "description" in details
        assert "schedule" in details
        assert "max_participants" in details
        assert "participants" in details
        assert isinstance(details["participants"], list)


def test_get_activities_has_preloaded_participants(client):
    response = client.get("/activities")

    assert response.status_code == 200

    data = response.json()
    assert all(len(details["participants"]) >= 1 for details in data.values())
