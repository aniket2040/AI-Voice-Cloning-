from pathlib import Path

import pytest

from app.security.path import UnsafePathError, safe_path


def test_safe_path_allows_path_inside_storage(tmp_path):
    storage_root = tmp_path / "storage"
    storage_root.mkdir()

    requested_path = storage_root / "users" / "user123" / "voices"

    result = safe_path(storage_root, requested_path)

    assert result == requested_path.resolve()


def test_safe_path_rejects_parent_traversal(tmp_path):
    storage_root = tmp_path / "storage"
    storage_root.mkdir()

    malicious_path = storage_root / ".." / "secret.wav"

    with pytest.raises(UnsafePathError):
        safe_path(storage_root, malicious_path)


def test_safe_path_rejects_absolute_path_outside_storage(tmp_path):
    storage_root = tmp_path / "storage"
    storage_root.mkdir()

    malicious_path = tmp_path / "secret.wav"

    with pytest.raises(UnsafePathError):
        safe_path(storage_root, malicious_path)


def test_safe_path_rejects_windows_style_traversal(tmp_path):
    storage_root = tmp_path / "storage"
    storage_root.mkdir()

    malicious_path = storage_root / r"..\..\secret.wav"

    with pytest.raises(UnsafePathError):
        safe_path(storage_root, malicious_path)