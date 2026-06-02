async def test_create_and_list_tags(client):
    created = await client.post("/api/tags", json={"name": "resistor", "color": "#ff0000"})
    assert created.status_code == 201
    assert created.json()["name"] == "resistor"

    listed = await client.get("/api/tags")
    assert listed.status_code == 200
    names = [t["name"] for t in listed.json()]
    assert "resistor" in names


async def test_duplicate_tag_name_conflicts(client):
    first = await client.post("/api/tags", json={"name": "capacitor"})
    assert first.status_code == 201
    dup = await client.post("/api/tags", json={"name": "capacitor"})
    assert dup.status_code == 409
