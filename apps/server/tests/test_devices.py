import io

from PIL import Image


def _png_bytes(color=(10, 20, 30)) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (32, 32), color).save(buf, format="PNG")
    return buf.getvalue()


def _gif_bytes() -> bytes:
    """A tiny 2-frame animated GIF."""
    buf = io.BytesIO()
    frames = [Image.new("P", (8, 8), 0), Image.new("P", (8, 8), 1)]
    frames[0].save(
        buf,
        format="GIF",
        save_all=True,
        append_images=frames[1:],
        duration=100,
        loop=0,
    )
    return buf.getvalue()


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


async def test_device_icon_upload_and_serve(client, tmp_path, monkeypatch):
    from src.core.config import settings

    monkeypatch.setattr(settings, "storage_dir", tmp_path)

    device_id = (
        await client.post("/api/devices", json={"name": "lit", "url": "http://lit"})
    ).json()["id"]

    res = await client.put(
        f"/api/devices/{device_id}/icon",
        files={"image": ("ghost.png", _png_bytes(), "image/png")},
    )
    assert res.status_code == 200
    assert res.json()["icon"] != ""

    served = await client.get(f"/api/devices/{device_id}/icon")
    assert served.status_code == 200
    assert served.content == _png_bytes()


async def test_device_icon_reupload_overwrites(client, tmp_path, monkeypatch):
    from src.core.config import settings

    monkeypatch.setattr(settings, "storage_dir", tmp_path)

    device_id = (
        await client.post("/api/devices", json={"name": "two", "url": "http://two"})
    ).json()["id"]

    await client.put(
        f"/api/devices/{device_id}/icon",
        files={"image": ("first.png", _png_bytes((1, 1, 1)), "image/png")},
    )
    await client.put(
        f"/api/devices/{device_id}/icon",
        files={"image": ("second.png", _png_bytes((2, 2, 2)), "image/png")},
    )

    # Exactly one file remains in the device's storage dir.
    files = list((tmp_path / "devices" / device_id).iterdir())
    assert [f.name for f in files] == ["second.png"]


async def test_device_icon_gif_served_unmodified(client, tmp_path, monkeypatch):
    from src.core.config import settings

    monkeypatch.setattr(settings, "storage_dir", tmp_path)

    device_id = (
        await client.post("/api/devices", json={"name": "anim", "url": "http://anim"})
    ).json()["id"]

    gif = _gif_bytes()
    await client.put(
        f"/api/devices/{device_id}/icon",
        files={"image": ("spin.gif", gif, "image/gif")},
    )

    served = await client.get(f"/api/devices/{device_id}/icon")
    assert served.status_code == 200
    assert served.content == gif  # byte-identical, animation preserved
    assert served.headers["content-type"] == "image/gif"


async def test_device_icon_missing_returns_404(client):
    device_id = (
        await client.post("/api/devices", json={"name": "bare", "url": "http://bare"})
    ).json()["id"]
    res = await client.get(f"/api/devices/{device_id}/icon")
    assert res.status_code == 404


async def test_delete_device_removes_icon_dir(client, tmp_path, monkeypatch):
    from src.core.config import settings

    monkeypatch.setattr(settings, "storage_dir", tmp_path)

    device_id = (
        await client.post("/api/devices", json={"name": "gone", "url": "http://gone"})
    ).json()["id"]
    await client.put(
        f"/api/devices/{device_id}/icon",
        files={"image": ("x.png", _png_bytes(), "image/png")},
    )
    assert (tmp_path / "devices" / device_id).exists()

    await client.delete(f"/api/devices/{device_id}")
    assert not (tmp_path / "devices" / device_id).exists()
