 RecallLoop - System Architecture

 1. System Overview

RecallLoop is an AI-powered student recall-assessment and preparation-tracking application.

It is designed to help students understand how much of a topic they can independently recall rather than relying only on repeated reading or familiarity with study material.

Students can generate a study plan, provide reference material, submit a topic-wise brain dump and receive AI-generated feedback comparing their recall with the supplied reference material.

The system identifies correctly recalled concepts, missing concepts and possible misunderstandings. It also supports preparation progress tracking.

 2. Technology Stack

 Component                Technology

 Frontend                  React
 Frontend build tool       Vite
 Backend                   Python
 Backend framework         FastAPI
 AI integration            Meta Muse Spark API
 AI client                 OpenAI-compatible client
 Database                  SQLite
 PDF text extraction       pypdf
 Frontend storage          localStorage and IndexedDB
 Deployment                Vercel

 3. High-Level Architecture

RecallLoop consists of the following major components:

1. Frontend: Provides the user interface for study-plan creation, reference-note upload, brain-dump submission, AI feedback and progress viewing.
2. Backend API: Handles requests from the frontend and connects application services.
3. Study Planning Service: Processes exam and syllabus information to generate a study plan.
4. PDF Extraction Service: Extracts readable text from uploaded PDF documents.
5. AI Evaluation Service: Sends the topic, student's brain dump and reference material to the configured Meta AI model for recall evaluation.
6. Progress and Evaluation Storage: Uses SQLite to store topic progress and evaluation records.

 4. System Workflow

 4.1 Study Plan Generation

 The student provides examination and syllabus information.
 The frontend sends the information to the backend.
 The backend generates a structured study plan.
 The frontend displays the generated plan.

 4.2 Reference Material Processing

 The student uploads PDF reference notes.
 The frontend sends the PDF to the backend.
 The PDF extraction service uses pypdf to extract readable text.
 The extracted text is returned to the frontend for use during evaluation.

 4.3 Recall Evaluation

 The student selects a topic and writes a brain dump from memory.
 The frontend retrieves the relevant reference material.
 The topic, brain dump and reference text are sent to the backend.
 The backend invokes the AI evaluation service.
 The AI service uses the configured Meta Muse Spark API.
 The returned evaluation is processed and displayed to the student.

 4.4 Progress Tracking

 Each study plan is associated with a plan ID.
 Topic completion statuses are retrieved and updated through backend endpoints.
 Evaluation records can be stored and retrieved using the plan ID and topic name.

 5. API Endpoints

 Method                  Endpoint                                           Purpose

 POST                    /api/plan                                         Generate a study plan
 POST                    /api/reference/extract                            Extract text from a PDF
 POST                    /api/evaluate                                     Evaluate a student's recall
 GET                     /api/progress/{plan_id}                           Retrieve topic progress
 PATCH                   /api/progress/{plan_id}                           Update topic progress
 GET                     /api/evaluations/{plan_id}/{topic_name}           Retrieve a saved topic evaluation
 GET                     /health                                           Check backend service availability


 6. Recall Evaluation Data Flow

The evaluation process uses three primary inputs:

 Topic: The subject or topic being assessed.
 Brain dump: The student's independent recollection.
 Reference text: The supplied study material used as the comparison source.

The evaluation output includes feedback about:

 Correctly recalled concepts.
 Missing concepts.
 Possible misconceptions.
 Recall status.
 Confidence.
 Revision priority.

The evaluation is intended to assess recall against the supplied reference material, not to teach the topic.

 7. Data Storage

SQLite is used for backend progress and evaluation storage.

The current implementation includes:

 Topic progress records.
 Topic evaluation records.
 Plan-based retrieval of progress and evaluation information.

The frontend also uses browser storage for certain client-side data, including localStorage and IndexedDB where implemented.

 8. Architecture Diagram


flowchart TD

    A[Student]     ->         B[React and Vite Frontend]
    B              ->         C[FastAPI Backend]
    C              ->         D[Study Planning Service]
    C              ->         E[PDF Extraction Service]
    C              ->         F[AI Evaluation Service]
    F              ->         G[Meta Muse Spark API]
    C              ->         H[SQLite Database]
    B              ->         I[Browser Storage(IndexedDB)]
    D              ->         C
    E              ->         B
    G              ->         F
    H              ->         C


 9. Deployment

The application is deployed using Vercel, subject to verification of the actual frontend and backend deployment configuration.
