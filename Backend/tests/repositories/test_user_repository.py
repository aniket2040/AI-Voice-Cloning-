from uuid import uuid4

import pytest

from app.repositories.user_repository import UserRepository


@pytest.mark.asyncio
async def test_create_user(db_session, create_test_user):
    user = await create_test_user(
        name="Repository Test User"
    )

    assert user.id is not None
    assert user.name == "Repository Test User"
    assert user.email is not None
    assert user.password_hash is not None

    repository = UserRepository(db_session)
    await repository.delete(user.id)


@pytest.mark.asyncio
async def test_get_user_by_id(db_session, create_test_user):
    user = await create_test_user(
        name="Get Test User"
    )

    repository = UserRepository(db_session)

    fetched_user = await repository.get_by_id(user.id)

    assert fetched_user is not None
    assert fetched_user.id == user.id
    assert fetched_user.name == "Get Test User"

    await repository.delete(user.id)


@pytest.mark.asyncio
async def test_get_nonexistent_user(db_session):
    repository = UserRepository(db_session)

    user = await repository.get_by_id(uuid4())

    assert user is None


@pytest.mark.asyncio
async def test_list_users(db_session, create_test_user):
    user1 = await create_test_user(
        name="List User 1"
    )

    user2 = await create_test_user(
        name="List User 2"
    )

    repository = UserRepository(db_session)

    users = await repository.list_all()

    user_ids = {user.id for user in users}

    assert user1.id in user_ids
    assert user2.id in user_ids

    await repository.delete(user1.id)
    await repository.delete(user2.id)


@pytest.mark.asyncio
async def test_update_user_name(db_session, create_test_user):
    user = await create_test_user(
        name="Old Name"
    )

    repository = UserRepository(db_session)

    updated_user = await repository.update_name(
        user.id,
        "New Name",
    )

    assert updated_user is not None
    assert updated_user.name == "New Name"

    await repository.delete(user.id)


@pytest.mark.asyncio
async def test_delete_user(db_session, create_test_user):
    user = await create_test_user(
        name="Delete Test User"
    )

    repository = UserRepository(db_session)

    deleted = await repository.delete(user.id)

    assert deleted is True

    result = await repository.get_by_id(user.id)

    assert result is None