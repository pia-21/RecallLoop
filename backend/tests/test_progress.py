
from app.schemas import TopicStatus
from app import progress


def test_create_and_retrieve_progress(tmp_path, monkeypatch):
    monkeypatch.setattr(
        progress,
        "DATABASE_PATH",
        tmp_path / "test.db",
    )

    progress.initialize_database()

    progress.create_progress(
        "plan-001",
        ["Physics", "Maths", "Chemistry"],
    )

    result = progress.get_progress("plan-001")

    assert len(result.topics) == 3
    assert result.topics[0].topic_name == "Physics"
    assert result.topics[0].status == TopicStatus.not_started


def test_update_topic_status(tmp_path, monkeypatch):
    monkeypatch.setattr(
        progress,
        "DATABASE_PATH",
        tmp_path / "test.db",
    )

    progress.initialize_database()
    progress.create_progress("plan-002", ["Physics", "Maths"])

    updated = progress.update_topic_status(
        "plan-002",
        "Physics",
        TopicStatus.recalled,
    )

    result = progress.get_progress("plan-002")

    assert updated is True
    assert result.topics[0].status == TopicStatus.recalled
    assert result.topics[1].status == TopicStatus.not_started


def test_update_unknown_topic(tmp_path, monkeypatch):
    monkeypatch.setattr(
        progress,
        "DATABASE_PATH",
        tmp_path / "test.db",
    )

    progress.initialize_database()
    progress.create_progress("plan-003", ["Physics"])

    updated = progress.update_topic_status(
        "plan-003",
        "Biology",
        TopicStatus.recalled,
    )

    assert updated is False
