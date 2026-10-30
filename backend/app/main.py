
from fastapi import FastAPI, HTTPException

from app.schemas import (
    PlanRequest,
    PlanResponse,
    ProgressUpdate,
    ProgressResponse,
    EvaluationResponse,
)

from app.planner import generate_study_plan

from app.progress import (
    create_progress,
    get_progress,
    update_topic_status,
)


app = FastAPI(
    title="RecallLoop API",
    description="Backend for student recall tracking and study planning.",
    version="1.0.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RecallLoop API",
    }


@app.post("/api/plan", response_model=PlanResponse)
def create_study_plan(request: PlanRequest):
    try:
        plan = generate_study_plan(request)

        create_progress(
            plan.plan_id,
            [topic.name for topic in request.topics],
        )

        return plan

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@app.get(
    "/api/progress/{plan_id}",
    response_model=ProgressResponse,
)
def read_progress(plan_id: str):
    result = get_progress(plan_id)

    if not result.topics:
        raise HTTPException(
            status_code=404,
            detail="Plan not found.",
        )

    return result


@app.patch(
    "/api/progress/{plan_id}",
    response_model=ProgressResponse,
)
def update_progress(plan_id: str, request: ProgressUpdate):
    updated = update_topic_status(
        plan_id,
        request.topic_name,
        request.status,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Plan or topic not found.",
        )

    return get_progress(plan_id)


@app.post("/api/evaluate", response_model=EvaluationResponse)
def evaluate_recall():
    raise HTTPException(
        status_code=501,
        detail="Recall evaluation integration is not connected yet.",
    )
