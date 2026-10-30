
from datetime import date, timedelta

from app.schemas import PlanRequest, TopicInput
from app.planner import generate_study_plan


def test_plan_respects_daily_limit():
    request = PlanRequest(
        exam_date=date.today() + timedelta(days=5),
        daily_available_hours=3,
        topics=[
            TopicInput(name="Physics", estimated_hours=4),
            TopicInput(name="Maths", estimated_hours=3),
        ],
    )

    result = generate_study_plan(request)

    assert all(
        day.total_hours <= 3 for day in result.schedule
    )
    assert result.total_scheduled_hours == 7
    assert result.unscheduled_topics == []


def test_unscheduled_topics_are_reported():
    request = PlanRequest(
        exam_date=date.today() + timedelta(days=3),
        daily_available_hours=2,
        topics=[
            TopicInput(name="Physics", estimated_hours=5),
            TopicInput(name="Maths", estimated_hours=3),
        ],
    )

    result = generate_study_plan(request)

    assert result.total_scheduled_hours == 4
    assert result.unscheduled_topics == ["Physics", "Maths"]


def test_exam_day_is_not_used():
    request = PlanRequest(
        exam_date=date.today() + timedelta(days=1),
        daily_available_hours=3,
        topics=[
            TopicInput(name="Chemistry", estimated_hours=2),
        ],
    )

    result = generate_study_plan(request)

    assert result.schedule == []
    assert result.unscheduled_topics == ["Chemistry"]
