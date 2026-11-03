
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    PlanRequest,
    PlanResponse,
    EvaluationRequest,
    EvaluationResponse,
    ProgressUpdate,
    ProgressResponse,
    TopicStatus,
)

from app.planner import generate_study_plan

from app.progress import (
    create_progress,
    get_progress,
    update_topic_status,
    save_evaluation,
    get_evaluation,
)

from app.ai_service import evaluate_recall
from app.pdf_service import extract_pdf_text


app = FastAPI(
    title="RecallLoop API",
    description="Backend for student recall tracking and study planning.",
    version="1.0.0",
)


# Allow requests from the local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        raise HTTPException(status_code=400, detail=str(error))


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


@app.post("/api/reference/extract")
async def extract_reference_document(
    file: UploadFile = File(...),
):
    extracted_text = await extract_pdf_text(file)

    return {
        "filename": file.filename,
        "text": extracted_text,
    }


@app.post(
    "/api/evaluate",
    response_model=EvaluationResponse,
)
def evaluate_recall_endpoint(request: EvaluationRequest):
    try:
        result = evaluate_recall(
            topic=request.topic,
            brain_dump=request.brain_dump,
            reference_text=request.reference_text,
        )

        if request.plan_id:
            saved = save_evaluation(
                request.plan_id,
                request.topic,
                result.model_dump(),
            )

            if not saved:
                raise HTTPException(
                    status_code=404,
                    detail="Study plan or topic not found.",
                )

            evaluation = result.evaluation

            if (
                evaluation.missing_concepts
                or evaluation.misconceptions
            ):
                update_topic_status(
                    request.plan_id,
                    request.topic,
                    TopicStatus.needs_revision,
                )

        return result

    except HTTPException:
        raise

    except Exception as error:
        print(f"Recall evaluation error: {error}")

        raise HTTPException(
            status_code=502,
            detail="Unable to evaluate recall right now. Please try again.",
        )


@app.get("/api/evaluations/{plan_id}/{topic_name}")
def read_evaluation(plan_id: str, topic_name: str):
    result = get_evaluation(plan_id, topic_name)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No saved evaluation found for this topic.",
        )

    return result
