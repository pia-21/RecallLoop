
import json
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

        connection.execute("""
            CREATE TABLE IF NOT EXISTS topic_evaluations (
                plan_id TEXT NOT NULL,
                topic_name TEXT NOT NULL,
                evaluation_json TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
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


def save_evaluation(
    plan_id: str,
    topic_name: str,
    evaluation_data: dict,
) -> bool:
    evaluation_json = json.dumps(evaluation_data)

    with get_connection() as connection:
        topic = connection.execute(
            """
            SELECT 1
            FROM topic_progress
            WHERE plan_id = ? AND topic_name = ?
            """,
            (plan_id, topic_name),
        ).fetchone()

        if topic is None:
            return False

        connection.execute(
            """
            INSERT INTO topic_evaluations
            (plan_id, topic_name, evaluation_json, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(plan_id, topic_name)
            DO UPDATE SET
                evaluation_json = excluded.evaluation_json,
                updated_at = CURRENT_TIMESTAMP
            """,
            (plan_id, topic_name, evaluation_json),
        )

        return True


def get_evaluation(plan_id: str, topic_name: str):
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT evaluation_json, updated_at
            FROM topic_evaluations
            WHERE plan_id = ? AND topic_name = ?
            """,
            (plan_id, topic_name),
        ).fetchone()

    if row is None:
        return None

    return {
        "evaluation": json.loads(row["evaluation_json"]),
        "updated_at": row["updated_at"],
    }


# Create database tables when this module is loaded.
initialize_database()
