from app.models.user import User


def test_user_model():
    user = User(name="Test User")

    assert user.name == "Test User"
    assert user.id is None


from app.db.base import Base


def test_user_table_registered():
    assert "users" in Base.metadata.tables