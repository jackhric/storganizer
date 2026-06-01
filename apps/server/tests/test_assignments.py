import pytest_asyncio


@pytest_asyncio.fixture
async def setup(client):
    """A device with derived cells plus two items, returned with their ids."""
    device = (
        await client.post("/api/devices", json={"name": "d", "url": "http://d"})
    ).json()
    cells = (
        await client.get("/api/cells", params={"device_id": device["id"]})
    ).json()

    async def make_item(name):
        return (await client.post("/api/items", data={"name": name})).json()

    item_a = await make_item("alpha")
    item_b = await make_item("beta")
    return {"cells": cells, "item_a": item_a, "item_b": item_b}


async def test_move_to_empty_cell(client, setup):
    cells = setup["cells"]
    created = await client.post(
        "/api/assignments",
        json={"item_id": setup["item_a"]["id"], "cell_id": cells[0]["id"], "quantity": 5},
    )
    assert created.status_code == 201

    moved = await client.post(
        "/api/assignments/move",
        json={"from_cell_id": cells[0]["id"], "to_cell_id": cells[1]["id"]},
    )
    assert moved.status_code == 200

    by_item = await client.get(f"/api/assignments/by-item/{setup['item_a']['id']}")
    rows = by_item.json()
    assert len(rows) == 1
    assert rows[0]["cell_id"] == cells[1]["id"]
    # Expanded cell + device come back inline.
    assert rows[0]["cell"]["device"]["name"] == "d"


async def test_swap_two_assignments(client, setup):
    cells = setup["cells"]
    await client.post(
        "/api/assignments",
        json={"item_id": setup["item_a"]["id"], "cell_id": cells[0]["id"], "quantity": 1},
    )
    await client.post(
        "/api/assignments",
        json={"item_id": setup["item_b"]["id"], "cell_id": cells[1]["id"], "quantity": 2},
    )

    swapped = await client.post(
        "/api/assignments/move",
        json={"from_cell_id": cells[0]["id"], "to_cell_id": cells[1]["id"]},
    )
    assert swapped.status_code == 200

    # item_a now sits on cell[1]; item_b on cell[0].
    rows = {r["item_id"]: r["cell_id"] for r in (
        await client.get(f"/api/assignments/by-item/{setup['item_a']['id']}")
    ).json()}
    assert rows[setup["item_a"]["id"]] == cells[1]["id"]

    rows_b = {r["item_id"]: r["cell_id"] for r in (
        await client.get(f"/api/assignments/by-item/{setup['item_b']['id']}")
    ).json()}
    assert rows_b[setup["item_b"]["id"]] == cells[0]["id"]


async def test_move_with_no_source_fails(client, setup):
    cells = setup["cells"]
    res = await client.post(
        "/api/assignments/move",
        json={"from_cell_id": cells[0]["id"], "to_cell_id": cells[1]["id"]},
    )
    assert res.status_code == 400
