"""Unit checks for the in-process journey chat connection manager.

Uses a minimal fake socket (only ``send_json``) so the broadcast, room
grouping, and dead-socket cleanup logic can be exercised without a real
WebSocket or event server.
"""

import asyncio

from source.modules.journey_chat.journey_chat_connection_manager import (
    JourneyChatConnectionManager,
)


class _FakeWebSocket:
    def __init__(self, *, should_fail: bool = False):
        self.should_fail = should_fail
        self.received_messages: list[dict] = []

    async def accept(self) -> None:
        return None

    async def send_json(self, message: dict) -> None:
        if self.should_fail:
            raise RuntimeError("socket is broken")
        self.received_messages.append(message)


def test_broadcast_reaches_only_same_room():
    async def scenario():
        manager = JourneyChatConnectionManager()
        offer_one_socket = _FakeWebSocket()
        offer_two_socket = _FakeWebSocket()
        await manager.connect("offer-1", offer_one_socket)
        await manager.connect("offer-2", offer_two_socket)

        await manager.broadcast("offer-1", {"body": "hello"})

        assert offer_one_socket.received_messages == [{"body": "hello"}]
        assert offer_two_socket.received_messages == []

    asyncio.run(scenario())


def test_broadcast_drops_dead_sockets():
    async def scenario():
        manager = JourneyChatConnectionManager()
        healthy_socket = _FakeWebSocket()
        broken_socket = _FakeWebSocket(should_fail=True)
        await manager.connect("offer-1", healthy_socket)
        await manager.connect("offer-1", broken_socket)

        await manager.broadcast("offer-1", {"body": "first"})
        # The broken socket is dropped; a second broadcast only reaches the healthy one.
        await manager.broadcast("offer-1", {"body": "second"})

        assert healthy_socket.received_messages == [
            {"body": "first"},
            {"body": "second"},
        ]

    asyncio.run(scenario())


def test_disconnect_removes_socket():
    async def scenario():
        manager = JourneyChatConnectionManager()
        socket = _FakeWebSocket()
        await manager.connect("offer-1", socket)
        manager.disconnect("offer-1", socket)

        await manager.broadcast("offer-1", {"body": "nobody home"})

        assert socket.received_messages == []

    asyncio.run(scenario())
