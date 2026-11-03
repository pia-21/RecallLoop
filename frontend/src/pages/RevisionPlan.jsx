
import { useEffect, useState } from "react";
import {
  CalendarDays,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Target,
  RefreshCw
} from "lucide-react";
import API_URL from "../config/api";

const PLAN_ID_KEY = "recallLoopPlanId";

function RevisionPlan() {
  const [syllabus, setSyllabus] = useState(null);
  const [completedTopics, setCompletedTopics] = useState([]);
  const [backendStatuses, setBackendStatuses] = useState(null);
  const [checklist, setChecklist] = useState([
    false, false, false, false
  ]);

  useEffect(() => {
    let isActive = true;

    const loadRevisionData = async () => {
      try {
        const savedSyllabus = JSON.parse(
          localStorage.getItem("recallLoopSyllabus") || "null"
        );

        const savedCompleted = JSON.parse(
          localStorage.getItem("recallLoopCompletedTopics") || "[]"
        );

        const savedChecklist = JSON.parse(
          localStorage.getItem("recallLoopRevisionChecklist") || "null"
        );

        if (!isActive) return;

        setSyllabus(savedSyllabus);
        setCompletedTopics(savedCompleted);

        if (Array.isArray(savedChecklist) && savedChecklist.length === 4) {
          setChecklist(savedChecklist);
        }

        const planId = localStorage.getItem(PLAN_ID_KEY);

        if (!planId) {
          setBackendStatuses(null);
          return;
        }

        const response = await fetch(
          `${API_URL}/api/progress/${planId}`
        );

        if (!response.ok) {
          throw new Error("Could not fetch revision progress");
        }

        const data = await response.json();

        if (!isActive) return;

        const statusMap = {};

        data.topics.forEach((topic) => {
          statusMap[topic.topic_name] = topic.status;
        });

        setBackendStatuses(statusMap);
      } catch (error) {
        console.error("Revision data loading error:", error);

        if (isActive) {
          setBackendStatuses(null);
        }
      }
    };

    loadRevisionData();

    window.addEventListener("focus", loadRevisionData);
    window.addEventListener("storage", loadRevisionData);

    return () => {
      isActive = false;
      window.removeEventListener("focus", loadRevisionData);
      window.removeEventListener("storage", loadRevisionData);
    };
  }, []);

  const toggleChecklist = (index) => {
    setChecklist(previous => {
      const updated = previous.map((value, i) =>
        i === index ? !value : value
      );

      localStorage.setItem(
        "recallLoopRevisionChecklist",
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  if (!syllabus || !syllabus.topics?.length) {
    return (
      <div className="revision-page">
        <div className="revision-header">
          <span>EXAM PREPARATION</span>
          <h1>Revision Plan</h1>
          <p>Your final preparation starts here.</p>
        </div>

        <div className="revision-empty">
          <BookOpen size={42} />
          <h2>No syllabus available</h2>
          <p>Add your syllabus in My Syllabus to create a revision plan.</p>
        </div>
      </div>
    );
  }

  const topics = syllabus.topics.map(topic =>
    typeof topic === "string"
      ? {
          name: topic,
          estimatedHours: 1,
          priority: "Medium"
        }
      : topic
  );

  const getTopicStatus = (topicName) => {
    if (backendStatuses && backendStatuses[topicName]) {
      return backendStatuses[topicName];
    }

    return completedTopics.includes(topicName)
      ? "recalled"
      : "not_started";
  };

  const examDate = syllabus.examDate
    ? new Date(`${syllabus.examDate}T00:00:00`)
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysLeft = examDate
    ? Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
    : null;

  const completedCount = topics.filter(
    topic => getTopicStatus(topic.name) === "recalled"
  ).length;

  const revisionTopics = topics.filter(
    topic => getTopicStatus(topic.name) !== "recalled"
  );

  const revisionDay = examDate
    ? new Date(examDate.getTime() - 24 * 60 * 60 * 1000)
    : null;

  const checklistItems = [
    "Review all important definitions and concepts",
    "Practise questions from every topic",
    "Review mistakes and difficult concepts",
    "Prepare examination materials and timetable"
  ];

  return (
    <div className="revision-page">

      <div className="revision-header">
        <span>EXAM PREPARATION</span>
        <h1>Revision Plan</h1>
        <p>Review what you have learned and prepare confidently.</p>
      </div>

      <div className="revision-hero">
        <div>
          <span>YOUR EXAM SUBJECT</span>
          <h2>{syllabus.subject}</h2>
          <p>
            Exam date: {syllabus.examDate || "Not set"}
          </p>
        </div>

        <div className="revision-countdown">
          <CalendarDays size={25} />
          <strong>
            {daysLeft === null
              ? "--"
              : daysLeft < 0
              ? "Passed"
              : daysLeft}
          </strong>
          <span>Days until exam</span>
        </div>
      </div>

      <div className="revision-info-grid">

        <div className="revision-info-card">
          <BookOpen size={23} />
          <strong>{topics.length}</strong>
          <span>Total topics</span>
        </div>

        <div className="revision-info-card">
          <RefreshCw size={23} />
          <strong>{revisionTopics.length}</strong>
          <span>Topics to revisit</span>
        </div>

        <div className="revision-info-card">
          <CheckCircle2 size={23} />
          <strong>{completedCount}</strong>
          <span>Topics completed</span>
        </div>

      </div>

      <div className="revision-section">
        <div className="revision-section-heading">
          <div>
            <h2>Topics to Revise</h2>
            <p>
              {revisionTopics.length
                ? "Give extra attention to topics that need revision or are not yet completed."
                : "You have completed every topic. Review them to strengthen your understanding."}
            </p>
          </div>
          <Brain size={23} />
        </div>

        {(revisionTopics.length ? revisionTopics : topics).map((topic, index) => {
          const status = getTopicStatus(topic.name);

          const description = {
            needs_revision: "AI evaluation identified concepts that need revision",
            in_progress: "In progress — continue studying and practising",
            not_started: "Not started — begin studying this topic",
            recalled: "Completed — review to strengthen your understanding"
          };

          return (
            <div className="revision-topic" key={topic.name + index}>
              <div className="revision-topic-icon">
                <BookOpen size={19} />
              </div>

              <div>
                <strong>{topic.name}</strong>
                <span>{description[status] || "Needs more study and practice"}</span>
                <span>
                  Estimated time: {topic.estimatedHours || 1} hour(s)
                  {" • "}
                  Priority: {topic.priority || "Medium"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="revision-section">
        <div className="revision-section-heading">
          <div>
            <h2>Final Revision Checklist</h2>
            <p>Tick each task after completing it.</p>
          </div>
          <Target size={23} />
        </div>

        {checklistItems.map((item, index) => (
          <label className="revision-check-item" key={index}>
            <input
              type="checkbox"
              checked={checklist[index]}
              onChange={() => toggleChecklist(index)}
            />
            <span>{item}</span>
          </label>
        ))}

        <p className="revision-check-progress">
          {checklist.filter(Boolean).length} of 4 tasks completed
        </p>
      </div>

      <div className="revision-day-card">
        <Clock size={25} />
        <div>
          <h3>Final Revision Day</h3>
          <p>
            {revisionDay
              ? revisionDay.toLocaleDateString("en-KE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })
              : "Set your exam date to see your revision day."}
          </p>
          <span>
            Use this day to review key concepts and avoid starting
            completely new topics.
          </span>
        </div>
      </div>

    </div>
  );
}

export default RevisionPlan;
