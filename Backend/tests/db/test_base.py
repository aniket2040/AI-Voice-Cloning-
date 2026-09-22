from app.db.base import Base


def test_base_has_metadata():
    assert Base.metadata is not None