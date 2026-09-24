from pathlib import Path


class UnsafePathError(ValueError):
    """Raised when a path escapes the allowed storage directory."""


def safe_path(
    base_dir: Path,
    requested_path: str | Path,
) -> Path:
    """
    Resolve a requested path and ensure it remains inside base_dir.
    """

    base_dir = base_dir.resolve()
    requested_path = Path(requested_path)

    resolved_path = requested_path.resolve()

    try:
        resolved_path.relative_to(base_dir)
    except ValueError as exc:
        raise UnsafePathError(
            "Requested path is outside the allowed storage directory."
        ) from exc

    return resolved_path