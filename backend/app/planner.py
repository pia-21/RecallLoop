
from datetime import date, timedelta
from uuid import uuid4

from app.schemas import (
    PlanRequest,
    PlanResponse,
    DailySchedule,
    ScheduledTopic,
)


def generate_study_plan(request: PlanRequest) -> PlanResponse:
    today = date.today()

    if request.exam_date <= today:
        raise ValueError("Exam date must be in the future.")

    available_days = (request.exam_date - today).days

    # Keep one day before the exam free for final revision.
    study_days = max(0, available_days - 1)

    daily_limit = request.daily_available_hours
    remaining_hours = daily_limit * study_days

    schedule = []
    unscheduled_topics = []

    total_estimated = sum(
        topic.estimated_hours for topic in request.topics
    )

    current_day = today
    topic_index = 0
    remaining_topic_hours = (
        request.topics[0].estimated_hours
        if request.topics else 0
    )

    while (
    current_day < request.exam_date - timedelta(days=1)
    and topic_index < len(request.topics)
):
        daily_topics = []
        daily_total = 0.0

        while daily_total < daily_limit and topic_index < len(request.topics):
            available = daily_limit - daily_total
            allocated = min(remaining_topic_hours, available)

            daily_topics.append(
                ScheduledTopic(
                    topic_name=request.topics[topic_index].name,
                    allocated_hours=round(allocated, 2),
                )
            )

            daily_total += allocated
            remaining_topic_hours -= allocated

            if remaining_topic_hours <= 0.000001:
                topic_index += 1

                if topic_index < len(request.topics):
                    remaining_topic_hours = (
                        request.topics[topic_index].estimated_hours
                    )

        if daily_topics:
            schedule.append(
                DailySchedule(
                    day=current_day,
                    topics=daily_topics,
                    total_hours=round(daily_total, 2),
                )
            )

        current_day += timedelta(days=1)

    if topic_index < len(request.topics):
        unscheduled_topics.append(request.topics[topic_index].name)

        for topic in request.topics[topic_index + 1:]:
            unscheduled_topics.append(topic.name)

    total_scheduled = sum(
        day.total_hours for day in schedule
    )

    return PlanResponse(
        plan_id=str(uuid4()),
        schedule=schedule,
        unscheduled_topics=unscheduled_topics,
        total_estimated_hours=round(total_estimated, 2),
        total_scheduled_hours=round(total_scheduled, 2),
    )
