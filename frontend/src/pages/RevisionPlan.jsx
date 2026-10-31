
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

function RevisionPlan() {
  const [syllabus, setSyllabus] = useState(null);
  const [completedTopics, setCompletedTopics] = useState([]);
  const [checklist, setChecklist] = useState([
    false, false, false, false
  ]);

  useEffect(() => {
    const savedSyllabus = JSON.parse(
      localStorage.getItem("recallLoopSyllabus") || "null"
    );

    const savedCompleted = JSON.parse(
      localStorage.getItem("recallLoopCompletedTopics") || "[]"
    );

    const savedChecklist = JSON.parse(
      localStorage.getItem("recallLoopRevisionChecklist") || "null"
    );

    setSyllabus(savedSyllabus);
    setCompletedTopics(savedCompleted);

    if (Array.isArray(savedChecklist) && savedChecklist.length === 4) {
      setChecklist(savedChecklist);
    }
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

  const examDate = syllabus.examDate
    ? new Date(`${syllabus.examDate}T00:00:00`)
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysLeft = examDate
    ? Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
    : null;

  const completedCount = topics.filter(topic =>
    completedTopics.includes(topic.name)
  ).length;

  const pendingTopics = topics.filter(topic =>
    !completedTopics.includes(topic.name)
  );

  const revisionTopics = pendingTopics.length
    ? pendingTopics
    : topics;

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
          <strong>{pendingTopics.length}</strong>
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
              {pendingTopics.length
                ? "Give extra attention to topics you haven't completed."
                : "You have completed every topic. Review them to strengthen your understanding."}
            </p>
          </div>
          <Brain size={23} />
        </div>

        {revisionTopics.map((topic, index) => (
          <div className="revision-topic" key={topic.name + index}>
            <div className="revision-topic-icon">
              <BookOpen size={19} />
            </div>

            <div>
              <strong>{topic.name}</strong>
              <span>
                {completedTopics.includes(topic.name)
                  ? "Completed — review to strengthen your understanding"
                  : "Needs more study and practice"}
              </span>
              <span>
                Estimated time: {topic.estimatedHours || 1} hour(s)
                {" • "}
                Priority: {topic.priority || "Medium"}
              </span>
            </div>
          </div>
        ))}
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
