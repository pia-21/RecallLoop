 RecallLoop - Product Requirements Document

 1. Product Overview

RecallLoop is an AI-powered active-recall assessment and study-preparation tracking application.

Its primary purpose is to help students evaluate what they can independently remember about a topic and identify areas that require further revision.

Rather than functioning as a conventional AI tutor, RecallLoop focuses on comparing student-generated recall with supplied reference material.

 2. Problem Statement

Students often mistake familiarity with study material for actual understanding.

Repeatedly reading notes can make information seem familiar without ensuring that a student can independently reproduce or explain it.

This creates a gap between perceived preparation and actual recall.

Students need a structured way to assess what they remember, identify what they have missed and prioritise topics that require more attention.

 3. Product Vision

To provide students with a clearer and more realistic picture of their examination preparation through active recall, AI-assisted feedback and progress tracking.

RecallLoop aims to help students move from passive revision towards measurable preparation.

 4. Target Users

The intended users include:

 School students preparing for examinations.
 College and university students.
 Students preparing for competitive examinations.
 Learners managing multiple subjects and topics under examination deadlines.

 5. Core Product Features

 5.1 Study Plan Generation

Allows students to provide examination and syllabus information and generate a structured study plan.

Status: Implemented in the development version; production behaviour should be verified.

 5.2 Reference Material Upload

Allows students to upload PDF study notes that can be processed for text extraction.

Status: Implemented in the development version; supported document cases should be tested.

 5.3 Topic-Wise Brain Dumps

Allows students to independently write what they remember about a selected topic without relying on the reference material while composing their response.

Status: Implemented in the frontend; verify the complete evaluation workflow.

 5.4 AI-Based Recall Evaluation

Compares the student's brain dump with the supplied reference material using the configured AI service.

Status: AI evaluation integration is reported as implemented; production API connectivity should be verified.

 5.5 Concept-Level Feedback

Identifies:

 Concepts correctly recalled.
 Important concepts that were missed.
 Possible conceptual misunderstandings.

Status: Supported by the intended evaluation workflow; actual response fields should be confirmed against the backend implementation.

 5.6 Preparation Tracking

Provides topic-level progress tracking to help students monitor their study-plan completion.

Status: Implemented in the development version; production data persistence should be verified.

 5.7 Evaluation History

Allows saved evaluations to be retrieved for a particular study plan and topic, subject to the configured storage environment.

Status: Backend functionality is reported as implemented; persistence in the deployed environment requires verification.

 5.8 Revision Prioritisation

Uses evaluation feedback to indicate which topics may require additional revision, wherever supported by the current implementation.

Status: Subject to verification against the current evaluation and revision-plan code.

 6. Main User Workflow

- The student enters examination and syllabus information.
- RecallLoop generates a study plan.
- The student uploads relevant reference notes.
- The student selects a topic for recall assessment.
- The student writes a brain dump independently.
- RecallLoop extracts the relevant reference text.
- The AI service compares the brain dump against the reference material.
- The student receives feedback about correct recall, missing concepts and possible misunderstandings.
- The student reviews the feedback and continues preparation.
- Progress information helps the student monitor completed topics and revision needs.

 7. Product Boundaries and Non-Goals

RecallLoop is not intended to be:

 A general-purpose AI chatbot.
 A subject-question-answering assistant.
 An AI tutor that teaches lessons.
 A replacement for textbooks, teachers or academic resources.
 A system that guarantees examination performance.

The core purpose is recall assessment and preparation tracking, not generating explanations or teaching academic concepts.

 8. Expected Outcomes

RecallLoop aims to help students:

 Recognise the difference between familiarity and independent recall.
 Identify missing information.
 Recognise possible misunderstandings.
 Track preparation progress.
 Make more informed revision decisions.

 9. Implementation Status

Feature status is classified as follows:

 Implemented: Functionality is available in the current code.
 Partially implemented: Functionality is available with known restrictions or incomplete integration.
 Planned: Functionality is intended but is not yet available.

Statuses in this document are provisional and should be checked against the current GitHub implementation and deployed application before final publication.
