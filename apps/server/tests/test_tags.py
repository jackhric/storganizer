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


async def _mk_tag(client, name):
    return (await client.post("/api/tags", json={"name": name})).json()


async def _mk_item(client, name):
    return (await client.post("/api/items", data={"name": name})).json()


async def _item_tag_ids(client, item_id):
    item = (await client.get(f"/api/items/{item_id}")).json()
    return sorted(t["id"] for t in item["tags"])


async def test_apply_tags_to_items_is_idempotent(client):
    smd = await _mk_tag(client, "smd")
    thru = await _mk_tag(client, "thru-hole")
    a = await _mk_item(client, "0603 cap")
    b = await _mk_item(client, "0805 cap")

    r = await client.post(
        "/api/tags/apply",
        json={"tag_ids": [smd["id"], thru["id"]], "item_ids": [a["id"], b["id"]]},
    )
    assert r.status_code == 204

    expected = sorted([smd["id"], thru["id"]])
    assert await _item_tag_ids(client, a["id"]) == expected
    assert await _item_tag_ids(client, b["id"]) == expected

    # Re-apply should not duplicate.
    r = await client.post(
        "/api/tags/apply",
        json={"tag_ids": [smd["id"]], "item_ids": [a["id"]]},
    )
    assert r.status_code == 204
    assert await _item_tag_ids(client, a["id"]) == expected


async def test_remove_tags_from_items(client):
    smd = await _mk_tag(client, "smd")
    thru = await _mk_tag(client, "thru-hole")
    item = await _mk_item(client, "diode")

    await client.post(
        "/api/tags/apply",
        json={"tag_ids": [smd["id"], thru["id"]], "item_ids": [item["id"]]},
    )

    r = await client.post(
        "/api/tags/remove",
        json={"tag_ids": [smd["id"]], "item_ids": [item["id"]]},
    )
    assert r.status_code == 204
    assert await _item_tag_ids(client, item["id"]) == [thru["id"]]


async def test_merge_tags_retags_and_deletes_source(client):
    source = await _mk_tag(client, "old")
    target = await _mk_tag(client, "new")
    only_source = await _mk_item(client, "only-source")
    both = await _mk_item(client, "both")

    await client.post(
        "/api/tags/apply",
        json={"tag_ids": [source["id"]], "item_ids": [only_source["id"], both["id"]]},
    )
    await client.post(
        "/api/tags/apply",
        json={"tag_ids": [target["id"]], "item_ids": [both["id"]]},
    )

    r = await client.post(
        "/api/tags/merge",
        json={"source_id": source["id"], "target_id": target["id"]},
    )
    assert r.status_code == 204

    assert await _item_tag_ids(client, only_source["id"]) == [target["id"]]
    assert await _item_tag_ids(client, both["id"]) == [target["id"]]
    # Source tag is gone.
    listed = await client.get("/api/tags")
    assert source["id"] not in [t["id"] for t in listed.json()]


async def test_merge_unknown_tag_404s(client):
    target = await _mk_tag(client, "real")
    r = await client.post(
        "/api/tags/merge",
        json={"source_id": "does-not-exist", "target_id": target["id"]},
    )
    assert r.status_code == 404
