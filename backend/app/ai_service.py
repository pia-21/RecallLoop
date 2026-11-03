
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from app.schemas import EvaluationResponse


# Load environment variables from backend/.env
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")


# Configure Meta Model API
API_KEY = os.getenv("META_API_KEY")

if not API_KEY:
    raise RuntimeError("META_API_KEY is missing from backend/.env")


client = OpenAI(
    base_url="https://api.meta.ai/v1",
    api_key=API_KEY,
)


MODEL = "muse-spark-1.3"


# Strict JSON schema for RecallLoop feedback
EVALUATION_SCHEMA = {
    "type": "json_schema",
    "json_schema": {
        "name": "recall_evaluation",
        "schema": {
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string"
                },
                "evaluation": {
                    "type": "object",
                    "properties": {
                        "correctly_recalled": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "missing_concepts": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "misconceptions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "student_statement": {
                                        "type": "string"
                                    },
                                    "issue": {
                                        "type": "string"
                                    }
                                },
                                "required": [
                                    "student_statement",
                                    "issue"
                                ],
                                "additionalProperties": False
                            }
                        },
                        "recall_status": {
                            "type": "string"
                        },
                        "confidence_assessment": {
                            "type": "string"
                        }
                    },
                    "required": [
                        "correctly_recalled",
                        "missing_concepts",
                        "misconceptions",
                        "recall_status",
                        "confidence_assessment"
                    ],
                    "additionalProperties": False
                },
                "next_action": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string"},
                        "priority": {"type": "string"}
                    },
                    "required": ["type", "priority"],
                    "additionalProperties": False
                }
            },
            "required": [
                "topic",
                "evaluation",
                "next_action"
            ],
            "additionalProperties": False
        }
    }
}


def evaluate_recall(
    topic: str,
    brain_dump: str,
    reference_text: str,
) -> EvaluationResponse:

    prompt = f"""
Evaluate the student's active recall for the given topic.

TOPIC:
{topic}

REFERENCE MATERIAL:
<reference_material>
{reference_text}
</reference_material>

STUDENT'S BRAIN DUMP:
<student_answer>
{brain_dump}
</student_answer>

YOUR TASK:

1. Identify concepts correctly recalled by the student.
2. Identify important concepts from the reference that are missing.
3. Identify misconceptions by quoting the student's relevant statement
   and describing the factual issue.
4. Assess the overall recall status.
5. Assess how complete and reliable the student's recall appears.
6. Recommend one specific next revision action and its priority.

IMPORTANT RULES:

- Use ONLY the supplied reference material as the basis for evaluation.
- Do not invent facts or introduce concepts absent from the reference.
- Do not mark a concept missing if the reference does not establish
  that it is relevant.
- Accept equivalent wording and correct explanations.
- Distinguish an incomplete answer from an incorrect answer.
- If the reference material is insufficient, make that limitation
  clear in confidence_assessment.
- Do not teach the topic or provide a full subject explanation.
- Do not rewrite the student's answer.
- Keep feedback concise, specific and constructive.
- Return only the requested structured JSON.
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "developer",
                "content": (
                    "You are RecallLoop, an active-recall evaluation "
                    "engine. Your purpose is to assess what a student "
                    "actually remembers, not to teach or tutor them."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        response_format=EVALUATION_SCHEMA,
    )

    content = response.choices[0].message.content

    if not content:
        raise RuntimeError("Meta returned an empty evaluation.")

    result = json.loads(content)

    return EvaluationResponse.model_validate(result)
