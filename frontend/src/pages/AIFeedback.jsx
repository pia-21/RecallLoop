
import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  MessageSquareText,
  BookOpen,
  Sparkles,
  RefreshCw
} from "lucide-react";
import API_URL from "../config/api";

const PLAN_ID_KEY = "recallLoopPlanId";

function openPdfDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RecallLoopFiles", 2);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getSavedStudyNotes() {
  const database = await openPdfDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction("studyNotes", "readonly");
    const request = transaction.objectStore("studyNotes").getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
      database.close();
    };

    request.onerror = () => {
      reject(request.error);
      database.close();
    };
  });
}

function AIFeedback() {
  const [savedDumps, setSavedDumps] = useState({});
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [savedEvaluationAt, setSavedEvaluationAt] = useState(null);
  const [error, setError] = useState("");

  const loadBrainDumps = () => {
    try {
      const dumps = JSON.parse(
        localStorage.getItem("recallLoopBrainDumps") || "{}"
      );

      setSavedDumps(dumps);

      const firstTopic = Object.keys(dumps)[0];

      setSelectedTopic(previous =>
        previous && dumps[previous] ? previous : firstTopic || ""
      );
    } catch {
      setSavedDumps({});
      setSelectedTopic("");
    }
  };

  useEffect(() => {
    loadBrainDumps();

    const handleFocus = () => loadBrainDumps();

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Retrieve an existing evaluation whenever the selected topic changes.
  useEffect(() => {
    let isActive = true;

    const loadSavedEvaluation = async () => {
      setFeedback(null);
      setSavedEvaluationAt(null);
      setError("");

      if (!selectedTopic) {
        setLoadingSaved(false);
        return;
      }

      const planId = localStorage.getItem(PLAN_ID_KEY);

      if (!planId) {
        setLoadingSaved(false);
        return;
      }

      setLoadingSaved(true);

      try {
        const response = await fetch(
          `${API_URL}/api/evaluations/${planId}/${encodeURIComponent(selectedTopic)}`
        );

        // A 404 simply means this topic has not been analysed yet.
        if (response.status === 404) {
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not retrieve the saved evaluation."
          );
        }

        if (!isActive) return;

        if (data.evaluation) {
          setFeedback(data.evaluation);
          setSavedEvaluationAt(data.updated_at || null);
        }
      } catch (err) {
        console.error("Saved evaluation loading error:", err);

        if (isActive) {
          setError(
            err.message || "Could not load the saved evaluation."
          );
        }
      } finally {
        if (isActive) {
          setLoadingSaved(false);
        }
      }
    };

    loadSavedEvaluation();

    return () => {
      isActive = false;
    };
  }, [selectedTopic]);

  const topics = Object.keys(savedDumps);
  const studentAnswer = savedDumps[selectedTopic] || "";

  const wordCount = studentAnswer.trim()
    ? studentAnswer.trim().split(/\s+/).length
    : 0;

  const handleAnalyse = async () => {
    if (!studentAnswer.trim()) return;

    setLoading(true);
    setError("");
    setFeedback(null);
    setSavedEvaluationAt(null);

    try {
      const planId = localStorage.getItem(PLAN_ID_KEY);

      if (!planId) {
        throw new Error(
          "No active study plan found. Please generate your study plan first."
        );
      }

      // Retrieve uploaded study-note PDFs.
      const notes = await getSavedStudyNotes();

      if (!notes.length) {
        throw new Error(
          "No study notes found. Upload at least one study-notes PDF before analysing your answer."
        );
      }

      // Extract readable text from each PDF using the backend.
      const extractedNotes = await Promise.all(
        notes.map(async note => {
          const formData = new FormData();
          formData.append("file", note.file, note.name);

          const response = await fetch(
            `${API_URL}/api/reference/extract`,
            {
              method: "POST",
              body: formData
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(
              data.detail || `Could not extract ${note.name}.`
            );
          }

          return `\n\n--- ${data.filename} ---\n${data.text}`;
        })
      );

      const referenceText = extractedNotes.join("\n").slice(0, 30000);

      if (!referenceText.trim()) {
        throw new Error(
          "No readable text was found in your uploaded study notes."
        );
      }

      // Evaluate the brain dump and associate it with the active plan.
      const response = await fetch(`${API_URL}/api/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan_id: planId,
          topic: selectedTopic,
          brain_dump: studentAnswer,
          reference_text: referenceText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to analyse your answer right now."
        );
      }

      setFeedback(data);
      setSavedEvaluationAt(new Date().toISOString());
    } catch (err) {
      console.error("RecallLoop analysis error:", err);
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const evaluation = feedback?.evaluation;
  const correctlyRecalled = evaluation?.correctly_recalled || [];
  const missingConcepts = evaluation?.missing_concepts || [];
  const misconceptions = evaluation?.misconceptions || [];

  return (
    <section className="page-content">

      <div className="welcome-section">
        <div>
          <p className="eyebrow">SMART LEARNING ASSISTANT</p>
          <h1>AI Feedback</h1>
          <p className="subtitle">
            Understand what you know and discover what you need to improve.
          </p>
        </div>

        <div className="ai-heading-icon">
          <Sparkles size={30} />
        </div>
      </div>

      {topics.length === 0 ? (

        <div className="content-card ai-empty-state">
          <Brain size={45} />
          <h3>No Brain Dumps found</h3>
          <p>
            Complete a Brain Dump first. Your saved answers
            will appear here for feedback.
          </p>
        </div>

      ) : (

        <>
          <div className="content-card ai-selection-card">

            <div className="ai-section-heading">
              <BookOpen size={22} />
              <div>
                <h3>Select Your Topic</h3>
                <p>Choose an answer you want to review.</p>
              </div>
            </div>

            <label htmlFor="feedbackTopic">
              Saved Brain Dump topics
            </label>

            <select
              id="feedbackTopic"
              value={selectedTopic}
              onChange={(event) =>
                setSelectedTopic(event.target.value)
              }
            >
              {topics.map(topic => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>

            <div className="ai-answer-summary">
              <div>
                <span>Words written</span>
                <strong>{wordCount}</strong>
              </div>

              <div>
                <span>Selected topic</span>
                <strong>{selectedTopic}</strong>
              </div>
            </div>

            <button
              className="ai-analyse-button"
              onClick={handleAnalyse}
              disabled={!studentAnswer.trim() || loading || loadingSaved}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyse My Answer
                </>
              )}
            </button>

            {loadingSaved && (
              <p>Checking for a saved evaluation...</p>
            )}

            {savedEvaluationAt && !loadingSaved && (
              <p>
                <CheckCircle2 size={15} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
                Saved evaluation retrieved
                {new Date(savedEvaluationAt).toLocaleString()}
                <br />
                If you have edited your Brain Dump since this evaluation,
                analyse again to update your feedback.
              </p>
            )}

            {error && (
              <p role="alert" className="ai-error-message">
                {error}
              </p>
            )}

          </div>

          <div className="content-card ai-student-answer">

            <div className="ai-section-heading">
              <MessageSquareText size={22} />
              <div>
                <h3>Your Brain Dump Answer</h3>
                <p>Your original saved response.</p>
              </div>
            </div>

            <div className="student-answer-text">
              {studentAnswer || "No answer has been saved for this topic yet."}
            </div>

          </div>

          <div className="ai-feedback-heading">
            <div>
              <p className="eyebrow">YOUR LEARNING ANALYSIS</p>
              <h2>Feedback Overview</h2>
            </div>
          </div>

          <div className="ai-feedback-grid">

            <div className="content-card ai-feedback-card">
              <div className="feedback-icon correct">
                <CheckCircle2 size={23} />
              </div>
              <h3>Correct Concepts</h3>

              {evaluation ? (
                correctlyRecalled.length ? (
                  <ul>
                    {correctlyRecalled.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No correctly recalled concepts were identified.</p>
                )
              ) : (
                <p>
                  {loadingSaved
                    ? "Loading saved feedback..."
                    : "Identify the concepts you have explained correctly."}
                </p>
              )}
            </div>

            <div className="content-card ai-feedback-card">
              <div className="feedback-icon missing">
                <BookOpen size={23} />
              </div>
              <h3>Missing Concepts</h3>

              {evaluation ? (
                missingConcepts.length ? (
                  <ul>
                    {missingConcepts.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No missing concepts were identified.</p>
                )
              ) : (
                <p>
                  {loadingSaved
                    ? "Loading saved feedback..."
                    : "Discover important information you may have left out."}
                </p>
              )}
            </div>

            <div className="content-card ai-feedback-card">
              <div className="feedback-icon mistakes">
                <AlertCircle size={23} />
              </div>
              <h3>Misunderstandings</h3>

              {evaluation ? (
                misconceptions.length ? (
                  <ul>
                    {misconceptions.map((item, index) => (
                      <li key={index}>
                        <strong>Your statement:</strong>{" "}
                        {item.student_statement}
                        <br />
                        <strong>Issue:</strong> {item.issue}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No misunderstandings were identified.</p>
                )
              ) : (
                <p>
                  {loadingSaved
                    ? "Loading saved feedback..."
                    : "Identify statements that may be incorrect or need clarification."}
                </p>
              )}
            </div>

            <div className="content-card ai-feedback-card">
              <div className="feedback-icon suggestions">
                <Lightbulb size={23} />
              </div>
              <h3>Next Revision Action</h3>

              {feedback ? (
                <>
                  <p>
                    {feedback.next_action?.type || "No revision action provided."}
                  </p>
                  <p>
                    <strong>Priority:</strong>{" "}
                    {feedback.next_action?.priority || "Not specified"}
                  </p>
                </>
              ) : (
                <p>
                  {loadingSaved
                    ? "Loading saved feedback..."
                    : "Receive a recommendation on what to revise next."}
                </p>
              )}
            </div>

          </div>

          {feedback && (
            <div className="content-card ai-overall-card">
              <Sparkles size={25} />
              <div>
                <h3>Overall AI Feedback</h3>

                <p>
                  <strong>Recall status:</strong>{" "}
                  {evaluation?.recall_status || "Not available"}
                </p>

                <p>
                  <strong>Confidence assessment:</strong>{" "}
                  {evaluation?.confidence_assessment || "Not available"}
                </p>
              </div>
            </div>
          )}

        </>

      )}

    </section>
  );
}

export default AIFeedback;
