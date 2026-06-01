"""WARLS WebSocket session.

The frontend publishes the full desired LED state for every device it wants to
drive in one message; a device that drops out of `frames` is cleared. On
disconnect, every device this session touched is turned off.

    {"type":"set","frames":{"<deviceId>":[{"idx":3,"r":255,"g":0,"b":0}]}}
    {"type":"set","frames":{}}     // clear everything
"""

from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from src.core.database import SessionLocal
from src.devices.models import Device
from src.warls.registry import Registry
from src.wled.client import LEDColor

router = APIRouter()


async def _resolve_url(device_id: str) -> str | None:
    async with SessionLocal() as db:
        device = await db.get(Device, device_id)
        return device.url if device is not None else None


@router.websocket("/api/warls/stream")
async def warls_stream(websocket: WebSocket) -> None:
    registry: Registry = websocket.app.state.warls_registry
    await websocket.accept()

    owned_urls: set[str] = set()
    try:
        while True:
            msg = await websocket.receive_json()
            if msg.get("type") != "set":
                continue

            frames: dict = msg.get("frames") or {}
            next_owned: set[str] = set()
            for device_id, leds in frames.items():
                url = await _resolve_url(device_id)
                if not url:
                    continue
                colors = [
                    LEDColor(
                        index=int(f["idx"]),
                        r=int(f.get("r", 0)),
                        g=int(f.get("g", 0)),
                        b=int(f.get("b", 0)),
                    )
                    for f in leds
                ]
                registry.set(url, colors)
                next_owned.add(url)

            # Clear any device that dropped out of this frame.
            for url in owned_urls - next_owned:
                registry.clear(url)
            owned_urls = next_owned
    except WebSocketDisconnect:
        pass
    finally:
        for url in owned_urls:
            registry.clear(url)
