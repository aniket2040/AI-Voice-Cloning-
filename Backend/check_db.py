import asyncio

from sqlalchemy import text

from app.db.postgres import engine


async def main():
    async with engine.connect() as conn:
        result = await conn.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name
                """
            )
        )

        print([row[0] for row in result])

    await engine.dispose()


asyncio.run(main())