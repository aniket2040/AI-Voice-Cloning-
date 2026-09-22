from uuid import uuid4

import pytest

from app.repositories.user_repository import UserRepository


@pytest.mark.asyncio
async def test_create_user(db_session):
    repository = UserRepository(db_session)

    user = await repository.create(
        name="Repository Test User"
    )

    assert user.id is not None
    assert user.name == "Repository Test User"

    await repository.delete(user.id)


@pytest.mark.asyncio
async def test_get_user_by_id(db_session):
    repository = UserRepository(db_session)

    created_user = await repository.create(
        name="Get Test User"
    )

    user = await repository.get_by_id(created_user.id)

    assert user is not None
    assert user.id == created_user.id
    assert user.name == "Get Test User"

    await repository.delete(created_user.id)


@pytest.mark.asyncio
async def test_get_nonexistent_user(db_session):
    repository = UserRepository(db_session)

    user = await repository.get_by_id(uuid4())

    assert user is None


@pytest.mark.asyncio
async def test_list_users(db_session):
    repository = UserRepository(db_session)

    user1 = await repository.create(
        name="List User 1"
    )

    user2 = await repository.create(
        name="List User 2"
    )

    users = await repository.list_all()

    user_ids = {user.id for user in users}

    assert user1.id in user_ids
    assert user2.id in user_ids

    await repository.delete(user1.id)
    await repository.delete(user2.id)


@pytest.mark.asyncio
async def test_update_user_name(db_session):
    repository = UserRepository(db_session)

    user = await repository.create(
        name="Old Name"
    )

    updated_user = await repository.update_name(
        user.id,
        "New Name",
    )

    assert updated_user is not None
    assert updated_user.name == "New Name"

    await repository.delete(user.id)


@pytest.mark.asyncio
async def test_delete_user(db_session):
    repository = UserRepository(db_session)

    user = await repository.create(
        name="Delete Test User"
    )

    deleted = await repository.delete(user.id)

    assert deleted is True

    result = await repository.get_by_id(user.id)

    assert result is None