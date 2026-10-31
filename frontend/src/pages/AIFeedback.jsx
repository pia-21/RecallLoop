
import { useEffect, useState } from "react";
import {
  Brain,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  MessageSquareText,
  BookOpen,
  Sparkles,
  Clock,
  RefreshCw
} from "lucide-react";

function AIFeedback() {
  const [savedDumps, setSavedDumps] = useState({});
  const [selectedTopic, setSelectedTopic] = useState("");
  const [loading, setLoading] = useState(false);

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

  const topics = Object.keys(savedDumps);
  const studentAnswer = savedDumps[selectedTopic] || "";

  const wordCount = studentAnswer.trim()
    ? studentAnswer.trim().split(/\s+/).length
    : 0;

  const handleAnalyse = () => {
    if (!studentAnswer.trim()) return;

    setLoading(true);


    setTimeout(() => {
      setLoading(false);
    }, 700);
  };

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
              disabled={!studentAnswer.trim() || loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} />
                  Preparing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Analyse My Answer
                </>
              )}
            </button>

          

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
              <p>
                Identify the concepts you have explained correctly.
              </p>

            </div>

            <div className="content-card ai-feedback-card">
              <div className="feedback-icon missing">
                <BookOpen size={23} />
              </div>
              <h3>Missing Concepts</h3>
              <p>
                Discover important information you may have left out.
              </p>

            </div>

            <div className="content-card ai-feedback-card">
              <div className="feedback-icon mistakes">
                <AlertCircle size={23} />
              </div>
              <h3>Misunderstandings</h3>
              <p>
                Identify explanations that may be incorrect or need clarification.
              </p>
              
            </div>

            <div className="content-card ai-feedback-card">
              <div className="feedback-icon suggestions">
                <Lightbulb size={23} />
              </div>
              <h3>Improvement Tips</h3>
              <p>
                Receive recommendations on what to revise and how to improve.
              </p>
             
            </div>

          </div>

          <div className="content-card ai-overall-card">
            <Sparkles size={25} />
            <div>
              <h3>Overall AI Feedback</h3>
              
            </div>
          </div>
        </>

      )}

    </section>
  );
}

export default AIFeedback;
