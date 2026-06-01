"""Process-wide owner of WARLS streaming state.

Maps a device URL to the LEDs that should be lit on it, and runs one keepalive
task per active device that re-sends the frame at a fixed cadence so it
outlasts WLED's realtime timeout.

Note the absence of a lock. In the Go original this needed a sync.Mutex because
goroutines run in true parallel. Here the asyncio event loop is single-threaded
and none of these critical sections span an `await`, so map access is already
atomic — the lock simply isn't needed.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field

from src.wled.client import LEDColor
from src.wled.realtime import send_warls

# WLED's WARLS realtime timeout is ~1s; re-send well inside that so a single
# dropped UDP packet can't let the strip fall back to its previous effect.
KEEPALIVE_INTERVAL = 0.3


@dataclass
class _DeviceState:
    url: str
    frame: dict[int, LEDColor] = field(default_factory=dict)
    task: asyncio.Task | None = None


class Registry:
    def __init__(self) -> None:
        self._devices: dict[str, _DeviceState] = {}

    def set(self, url: str, leds: list[LEDColor]) -> None:
        """Replace the frame for a device URL. Empty `leds` clears it.

        Paints immediately (so the strip repaints within one UDP round-trip)
        and extinguishes any LED that was lit before but isn't now."""
        if not leds:
            self.clear(url)
            return

        nxt = {led.index: led for led in leds}
        state = self._devices.get(url)
        if state is None:
            state = _DeviceState(url=url)
            self._devices[url] = state
            state.task = asyncio.create_task(self._run(state))
        prev = state.frame
        state.frame = nxt

        packet = list(nxt.values())
        packet += [LEDColor(index=idx) for idx in prev if idx not in nxt]
        send_warls(url, packet)

    def clear(self, url: str) -> None:
        """Stop streaming to a device and turn off any LEDs it was holding."""
        state = self._devices.pop(url, None)
        if state is None:
            return
        if state.task is not None:
            state.task.cancel()
        if state.frame:
            send_warls(url, [LEDColor(index=idx) for idx in state.frame])

    async def _run(self, state: _DeviceState) -> None:
        try:
            while True:
                await asyncio.sleep(KEEPALIVE_INTERVAL)
                if state.frame:
                    send_warls(state.url, list(state.frame.values()))
        except asyncio.CancelledError:
            pass
