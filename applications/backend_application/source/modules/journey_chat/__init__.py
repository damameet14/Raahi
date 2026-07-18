"""Journey chat module.

Owns a text-only group conversation per journey (one ride offer): the driver
and every passenger with a non-cancelled booking on that offer. Messages are
delivered live over a WebSocket and persisted so late joiners see history. No
voice or video — a "call" in the UI is a plain ``tel:`` link handled entirely
on the client.
"""
