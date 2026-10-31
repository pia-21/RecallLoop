
import { useEffect, useState } from "react";
import {
  Brain,
  BookOpen,
  Save,
  RotateCcw,
  FileText,
  Clock
} from "lucide-react";

function BrainDump() {
  const [syllabus] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("recallLoopSyllabus")
      );
    } catch {
      return null;
    }
  });


  const topics = (syllabus?.topics || []).map((topic, index) => {
    if (typeof topic === "string") {
      return {
        id: index,
        name: topic,
        estimatedHours: 1,
        priority: "Medium"
      };
    }

    return {
      ...topic,
      id: topic.id ?? index,
      name: topic.name,
      estimatedHours: Number(topic.estimatedHours) || 1,
      priority: topic.priority || "Medium"
    };
  });

  const [selectedTopic, setSelectedTopic] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedTopic) {
      setAnswer("");
      return;
    }

    try {
      const savedDumps = JSON.parse(
        localStorage.getItem("recallLoopBrainDumps") || "{}"
      );

      setAnswer(savedDumps[selectedTopic] || "");
    } catch {
      setAnswer("");
    }

    setMessage("");
  }, [selectedTopic]);

  const selectedTopicDetails = topics.find(
    topic => topic.name === selectedTopic
  );

  const wordCount = answer.trim()
    ? answer.trim().split(/\s+/).length
    : 0;

  const saveBrainDump = () => {
    if (!selectedTopic) {
      setMessage("Please select a topic first.");
      return;
    }

    if (!answer.trim()) {
      setMessage("Please write something before saving.");
      return;
    }

    try {
      const savedDumps = JSON.parse(
        localStorage.getItem("recallLoopBrainDumps") || "{}"
      );

      savedDumps[selectedTopic] = answer;

      localStorage.setItem(
        "recallLoopBrainDumps",
        JSON.stringify(savedDumps)
      );

      setMessage("Your Brain Dump has been saved successfully!");
    } catch {
      setMessage("Unable to save your Brain Dump. Please try again.");
    }
  };

  const clearAnswer = () => {
    setAnswer("");
    setMessage("");
  };

  if (!syllabus || topics.length === 0) {
    return (
      <section className="page-content">
        <h1>Brain Dump</h1>

        <div className="content-card">
          <BookOpen size={35} />
          <h3>No syllabus found</h3>
          <p>Please add and save your syllabus before using Brain Dump.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-content">

      <div className="welcome-section">
        <div>
          <p className="eyebrow">ACTIVE RECALL LEARNING</p>
          <h1>Brain Dump</h1>
          <p className="subtitle">
            Write everything you remember without looking at your notes.
          </p>
        </div>
      </div>

      <div className="content-card brain-dump-card">

        <div className="brain-dump-heading">
          <div className="stat-icon purple">
            <Brain size={25} />
          </div>

          <div>
            <h3>Test Your Memory</h3>
            <p>
              Subject: {syllabus.subject || "Your Subject"}
            </p>
          </div>
        </div>

        <div className="brain-topic-select">
          <label htmlFor="brainTopic">Choose a topic</label>

          <select
            id="brainTopic"
            value={selectedTopic}
            onChange={(event) => setSelectedTopic(event.target.value)}
          >
            <option value="">Select a topic</option>

            {topics.map((topic) => (
              <option key={topic.id} value={topic.name}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        {selectedTopic && selectedTopicDetails && (
          <>
            <div className="brain-instructions">
              <FileText size={20} />

              <p>
                Explain everything you know about{" "}
                <strong>{selectedTopic}</strong>.
                Include definitions, examples and important points.
                Try not to check your notes!
              </p>
            </div>

            <div className="topic-meta brain-topic-meta">
              <span>
                <Clock size={14} />
                {selectedTopicDetails.estimatedHours} study hours
              </span>
              <span>
                Priority: {selectedTopicDetails.priority}
              </span>
            </div>

            <div className="brain-writing-area">
              <label htmlFor="brainAnswer">
                What do you remember?
              </label>

              <textarea
                id="brainAnswer"
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  setMessage("");
                }}
                placeholder="Start writing everything you remember about this topic..."
                rows={12}
              />

              <div className="word-count">
                <span>{wordCount} words</span>
                <span>Topic: {selectedTopic}</span>
              </div>
            </div>

            <div className="brain-actions">
              <button
                type="button"
                className="outline-button"
                onClick={clearAnswer}
              >
                <RotateCcw size={16} />
                Clear
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={saveBrainDump}
              >
                <Save size={17} />
                Save Brain Dump
              </button>
            </div>

            {message && (
              <p className="brain-message" role="status">
                {message}
              </p>
            )}
          </>
        )}

      </div>
    </section>
  );
}

export default BrainDump;
