"""WARLS (Warlight Addressable Realtime LED Streaming) over UDP.

Reference: https://kno.wled.ge/interfaces/udp-realtime/

Packet format:
    byte 0       — protocol (0x01 = WARLS, 1-byte indices)
    byte 1       — timeout in seconds (short, so the strip restores quickly)
    bytes 2..N   — repeating [index, r, g, b] tuples

While realtime packets arrive, WLED suspends its current effect and pipes the
incoming colours straight to the strip. When packets stop, it auto-restores
after the timeout — no explicit "release" RPC needed.

A WARLS datagram is tiny and the send is fire-and-forget, so a plain blocking
socket send is fine even inside the event loop (it completes in microseconds).
"""

import socket
from urllib.parse import urlparse

from src.wled.client import LEDColor

WARLS_PORT = 21324
WARLS_PROTOCOL = 0x01
# Short so the strip restores quickly once we go silent.
WARLS_TIMEOUT_DEFAULT = 1


def send_warls(device_url: str, leds: list[LEDColor]) -> None:
    """Send a single WARLS packet to the device's realtime UDP port.

    LED indices outside 0..255 are skipped — WARLS uses 1-byte indices.
    Best-effort: transport errors are swallowed (the keepalive loop will retry).
    """
    host = urlparse(device_url).hostname
    if not host:
        return

    packet = bytearray([WARLS_PROTOCOL, WARLS_TIMEOUT_DEFAULT])
    for led in leds:
        if 0 <= led.index <= 255:
            packet += bytes([led.index, led.r & 0xFF, led.g & 0xFF, led.b & 0xFF])

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.sendto(bytes(packet), (host, WARLS_PORT))
    except OSError:
        pass
