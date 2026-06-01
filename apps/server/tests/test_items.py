import io

from PIL import Image


def _png_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (64, 48), (10, 20, 30)).save(buf, format="PNG")
    return buf.getvalue()


async def test_create_item_with_tags_and_expand(client):
    tag = (await client.post("/api/tags", json={"name": "smd"})).json()

    created = await client.post(
        "/api/items",
        data={"name": "0603 cap", "tags": f'["{tag["id"]}"]', "notes": "x7r"},
    )
    assert created.status_code == 201
    item = created.json()
    assert item["name"] == "0603 cap"
    assert [t["name"] for t in item["tags"]] == ["smd"]

    listed = await client.get("/api/items")
    assert listed.status_code == 200
    assert any(i["id"] == item["id"] for i in listed.json())


async def test_item_image_upload_and_thumbnail(client):
    created = await client.post(
        "/api/items",
        data={"name": "with image"},
        files={"image": ("pic.png", _png_bytes(), "image/png")},
    )
    assert created.status_code == 201
    item_id = created.json()["id"]
    assert created.json()["image"] != ""

    original = await client.get(f"/api/items/{item_id}/image")
    assert original.status_code == 200

    thumb = await client.get(f"/api/items/{item_id}/image", params={"size": "32x32"})
    assert thumb.status_code == 200
    assert thumb.headers["content-type"] == "image/jpeg"


async def test_update_item_tags(client):
    tag = (await client.post("/api/tags", json={"name": "thru-hole"})).json()
    item = (await client.post("/api/items", data={"name": "diode"})).json()

    updated = await client.patch(
        f"/api/items/{item['id']}/tags", json={"tag_ids": [tag["id"]]}
    )
    assert updated.status_code == 200
    assert [t["id"] for t in updated.json()["tags"]] == [tag["id"]]
