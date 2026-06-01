"""Async HTTP client for the WLED JSON API.

No database dependency — importable by any module. Written as module-level
functions rather than a class so tests can monkeypatch `fetch_info` to avoid
touching real hardware.

WLED API reference: https://kno.wled.ge/interfaces/json-api/
"""

from dataclasses import dataclass

import httpx

from src.core.config import settings


@dataclass
class WLEDInfo:
    """The subset of GET /json/info we care about."""

    count: int
    width: int
    height: int


@dataclass
class LEDColor:
    """A single LED position and its target RGB colour."""

    index: int
    r: int = 0
    g: int = 0
    b: int = 0


async def fetch_info(base_url: str, timeout: float | None = None) -> WLEDInfo:
    """Retrieve device metadata from GET /json/info.

    Raises on any transport or decode error so callers can treat the device as
    unreachable.
    """
    timeout = settings.wled_timeout_seconds if timeout is None else timeout
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(f"{base_url}/json/info")
        resp.raise_for_status()
        leds = resp.json()["leds"]
        matrix = leds.get("matrix") or {}
        return WLEDInfo(
            count=int(leds.get("count", 0)),
            width=int(matrix.get("w", 0)),
            height=int(matrix.get("h", 0)),
        )


async def highlight(base_url: str, leds: list[LEDColor], timeout: float | None = None) -> None:
    """Light specific LEDs over a black background via POST /json/state.

    The WLED "i" (individual) array is a flat [index, r, g, b, ...] sequence.
    """
    individual: list[int] = []
    for led in leds:
        individual += [led.index, led.r, led.g, led.b]
    await _post_state(
        base_url,
        {"on": True, "bri": 200, "seg": [{"col": [[0, 0, 0]], "i": individual}]},
        timeout,
    )


async def clear(base_url: str, timeout: float | None = None) -> None:
    """Turn the device off via POST /json/state."""
    await _post_state(base_url, {"on": False}, timeout)


async def _post_state(base_url: str, payload: dict, timeout: float | None) -> None:
    timeout = settings.wled_timeout_seconds if timeout is None else timeout
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(f"{base_url}/json/state", json=payload)
        resp.raise_for_status()
