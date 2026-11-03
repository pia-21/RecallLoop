
import json
import os

import psycopg
from psycopg.rows import dict_row

from app.schemas import TopicStatus, TopicProgress, ProgressResponse


DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not configured")


def get_connection():
    return psycopg.connect(
        DATABASE_URL,
        row_factory=dict_row,
        prepare_threshold=None,
    )


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS topic_progress (
                id BIGSERIAL PRIMARY KEY,
                plan_id TEXT NOT NULL,
                topic_name TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'not_started',
                UNIQUE (plan_id, topic_name)
            )
        """)

        connection.execute("""
            CREATE TABLE IF NOT EXISTS topic_evaluations (
                id BIGSERIAL PRIMARY KEY,
                plan_id TEXT NOT NULL,
                topic_name TEXT NOT NULL,
                evaluation_json TEXT NOT NULL,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (plan_id, topic_name)
            )
        """)


def create_progress(plan_id: str, topic_names: list[str]):
    with get_connection() as connection:
        connection.executemany(
            """
            INSERT INTO topic_progress
            (plan_id, topic_name, status)
            VALUES (%s, %s, %s)
            ON CONFLICT (plan_id, topic_name) DO NOTHING
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
            SET status = %s
            WHERE plan_id = %s AND topic_name = %s
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
            WHERE plan_id = %s
            ORDER BY id
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
            WHERE plan_id = %s AND topic_name = %s
            """,
            (plan_id, topic_name),
        ).fetchone()

        if topic is None:
            return False

        connection.execute(
            """
            INSERT INTO topic_evaluations
            (plan_id, topic_name, evaluation_json, updated_at)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (plan_id, topic_name)
            DO UPDATE SET
                evaluation_json = EXCLUDED.evaluation_json,
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
            WHERE plan_id = %s AND topic_name = %s
            """,
            (plan_id, topic_name),
        ).fetchone()

    if row is None:
        return None

    return {
        "evaluation": json.loads(row["evaluation_json"]),
        "updated_at": row["updated_at"].isoformat(),
    }


# Create database tables when this module is loaded.
initialize_database()
