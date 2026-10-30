
import sqlite3
from pathlib import Path

from app.schemas import TopicStatus, TopicProgress, ProgressResponse


# Store the database inside the backend folder.
DATABASE_PATH = Path(__file__).resolve().parent.parent / "recallloop.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS topic_progress (
                plan_id TEXT NOT NULL,
                topic_name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'not_started',
                PRIMARY KEY (plan_id, topic_name)
            )
        """)


def create_progress(plan_id: str, topic_names: list[str]):
    with get_connection() as connection:
        connection.executemany(
            """
            INSERT OR IGNORE INTO topic_progress
            (plan_id, topic_name, status)
            VALUES (?, ?, ?)
            """,
            [
                (plan_id, name, TopicStatus.not_started.value)
                for name in topic_names
            ],
        )


def update_topic_status(
    plan_id: str,
    topic_name: str,
    status: TopicStatus,
) -> bool:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            UPDATE topic_progress
            SET status = ?
            WHERE plan_id = ? AND topic_name = ?
            """,
            (status.value, plan_id, topic_name),
        )

        return cursor.rowcount > 0


def get_progress(plan_id: str) -> ProgressResponse:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT topic_name, status
            FROM topic_progress
            WHERE plan_id = ?
            ORDER BY rowid
            """,
            (plan_id,),
        ).fetchall()

    topics = [
        TopicProgress(
            topic_name=row["topic_name"],
            status=TopicStatus(row["status"]),
        )
        for row in rows
    ]

    return ProgressResponse(
        plan_id=plan_id,
        topics=topics,
    )


# Create the database table when this module is loaded.
initialize_database()
