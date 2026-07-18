from app.memory import SENSITIVE_MARKERS


def test_sensitive_memory_markers_include_credentials():
    assert "password" in SENSITIVE_MARKERS
    assert "token" in SENSITIVE_MARKERS
