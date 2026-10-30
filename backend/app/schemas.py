
from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ---------- Study Plan ----------

class TopicInput(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    estimated_hours: float = Field(gt=0, le=100)


class PlanRequest(BaseModel):
    exam_date: date
    daily_available_hours: float = Field(gt=0, le=24)
    topics: list[TopicInput] = Field(min_length=1)


class ScheduledTopic(BaseModel):
    topic_name: str
    allocated_hours: float


class DailySchedule(BaseModel):
    day: date
    topics: list[ScheduledTopic]
    total_hours: float


class PlanResponse(BaseModel):
    plan_id: str
    schedule: list[DailySchedule]
    unscheduled_topics: list[str]
    total_estimated_hours: float
    total_scheduled_hours: float


# ---------- Recall Evaluation ----------

class Misconception(BaseModel):
    student_statement: str
    issue: str


class RecallEvaluation(BaseModel):
    correctly_recalled: list[str]
    missing_concepts: list[str]
    misconceptions: list[Misconception]
    recall_status: str
    confidence_assessment: str


class NextAction(BaseModel):
    type: str
    priority: str


class EvaluationResponse(BaseModel):
    topic: str
    evaluation: RecallEvaluation
    next_action: NextAction


# ---------- Progress Tracking ----------

class TopicStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    recalled = "recalled"
    needs_revision = "needs_revision"


class ProgressUpdate(BaseModel):
    topic_name: str
    status: TopicStatus


class TopicProgress(BaseModel):
    topic_name: str
    status: TopicStatus


class ProgressResponse(BaseModel):
    plan_id: str
    topics: list[TopicProgress]
