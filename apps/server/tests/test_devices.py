async def test_create_device_populates_from_wled_and_derives_cells(client):
    # The fake WLED reports 10 LEDs.
    res = await client.post(
        "/api/devices", json={"name": "bench", "url": "http://wled-bench"}
    )
    assert res.status_code == 201
    body = res.json()
    assert body["led_count"] == 10
    assert body["grid_width"] == 5
    assert body["is_online"] is True

    # The create hook should have derived one cell per LED.
    cells = await client.get("/api/cells", params={"device_id": body["id"]})
    assert cells.status_code == 200
    assert len(cells.json()) == 10
    assert {c["led_index"] for c in cells.json()} == set(range(10))


async def test_duplicate_device_name_conflicts(client):
    await client.post("/api/devices", json={"name": "dup", "url": "http://a"})
    res = await client.post("/api/devices", json={"name": "dup", "url": "http://b"})
    assert res.status_code == 409


async def test_unreachable_device_rejected(client, monkeypatch):
    from src.wled import client as wled

    async def boom(_url, timeout=None):
        raise RuntimeError("unreachable")

    monkeypatch.setattr(wled, "fetch_info", boom)
    res = await client.post(
        "/api/devices", json={"name": "ghost", "url": "http://nope"}
    )
    assert res.status_code == 422


async def test_delete_device_cascades_to_cells(client):
    res = await client.post(
        "/api/devices", json={"name": "temp", "url": "http://temp"}
    )
    device_id = res.json()["id"]

    deleted = await client.delete(f"/api/devices/{device_id}")
    assert deleted.status_code == 204

    cells = await client.get("/api/cells", params={"device_id": device_id})
    assert cells.json() == []
