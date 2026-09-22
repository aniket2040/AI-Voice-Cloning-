import asyncio

from alembic.migration import MigrationContext
from alembic.autogenerate import compare_metadata

from app.db.base import Base
import app.models

from app.db.postgres import engine


async def main():
    async with engine.connect() as connection:
        def compare(sync_connection):
            migration_context = MigrationContext.configure(
                sync_connection
            )

            differences = compare_metadata(
                migration_context,
                Base.metadata,
            )

            return differences

        differences = await connection.run_sync(compare)

        print("\nAlembic schema differences:")
        for difference in differences:
            print(difference)

    await engine.dispose()


asyncio.run(main())