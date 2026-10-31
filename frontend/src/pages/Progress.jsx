
import { useEffect, useState } from "react";
import {
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  Brain,
  RefreshCw,
  Award
} from "lucide-react";

function Progress() {
  const [syllabus, setSyllabus] = useState(null);
  const [brainDumps, setBrainDumps] = useState({});
  const [completedTopics, setCompletedTopics] = useState([]);

  useEffect(() => {
    const loadProgress = () => {
      try {
        const savedSyllabus = JSON.parse(
          localStorage.getItem("recallLoopSyllabus") || "null"
        );

        const savedDumps = JSON.parse(
          localStorage.getItem("recallLoopBrainDumps") || "{}"
        );

        const savedCompleted = JSON.parse(
          localStorage.getItem("recallLoopCompletedTopics") || "[]"
        );

        setSyllabus(savedSyllabus);
        setBrainDumps(savedDumps);
        setCompletedTopics(savedCompleted);
      } catch {
        setSyllabus(null);
        setBrainDumps({});
        setCompletedTopics([]);
      }
    };

    loadProgress();

    // Refresh displayed data when another page changes localStorage.
    window.addEventListener("focus", loadProgress);
    window.addEventListener("storage", loadProgress);

    return () => {
      window.removeEventListener("focus", loadProgress);
      window.removeEventListener("storage", loadProgress);
    };
  }, []);

  // Support both old text topics and the new topic objects.
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

  const totalTopics = topics.length;

  const completedCount = topics.filter(topic =>
    completedTopics.includes(topic.name)
  ).length;

  const remainingCount = totalTopics - completedCount;

  const dumpCount = topics.filter(topic =>
    Boolean(brainDumps[topic.name]?.trim())
  ).length;

  const progressPercentage = totalTopics > 0
    ? Math.round((completedCount / totalTopics) * 100)
    : 0;

  const studyHours = Number(syllabus?.studyHours) || 0;

  const totalEstimatedHours = topics.reduce(
    (total, topic) => total + topic.estimatedHours,
    0
  );

  const stats = [
    {
      title: "Total Topics",
      value: totalTopics,
      description: "Topics in your syllabus",
      icon: BookOpen,
      color: "blue"
    },
    {
      title: "Completed Topics",
      value: completedCount,
      description: "Topics marked as completed",
      icon: CheckCircle2,
      color: "green"
    },
    {
      title: "Remaining Topics",
      value: remainingCount,
      description: "Topics left to study",
      icon: Clock,
      color: "orange"
    },
    {
      title: "Brain Dumps Saved",
      value: dumpCount,
      description: "Topics with saved responses",
      icon: Brain,
      color: "purple"
    }
  ];

  if (!syllabus || totalTopics === 0) {
    return (
      <div className="progress-page">
        <div className="progress-header">
          <span className="progress-label">YOUR PERFORMANCE</span>
          <h1>My Progress</h1>
          <p>Track your learning journey and study achievements.</p>
        </div>

        <div className="progress-empty">
          <BookOpen size={45} />
          <h2>No syllabus found yet</h2>
          <p>
            Add your subject and topics in My Syllabus
            before tracking your study progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-page">

      <div className="progress-header">
        <span className="progress-label">YOUR PERFORMANCE</span>
        <h1>My Progress</h1>
        <p>
          Keep track of your learning journey and
          celebrate every step forward.
        </p>
      </div>

      <div className="progress-subject-card">
        <div>
          <span>YOUR CURRENT SUBJECT</span>
          <h2>{syllabus.subject}</h2>
          <p>
            Exam date: {syllabus.examDate || "Not set"}
          </p>
        </div>

        <div className="subject-icon">
          <BookOpen size={30} />
        </div>
      </div>

      <div className="progress-stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div className="progress-stat-card" key={index}>
              <div className={`progress-stat-icon ${stat.color}`}>
                <Icon size={22} />
              </div>

              <h3>{stat.title}</h3>
              <strong>{stat.value}</strong>
              <p>{stat.description}</p>
            </div>
          );
        })}
      </div>

      <div className="progress-main-grid">

        <div className="progress-overview-card">
          <div className="progress-card-heading">
            <div>
              <h2>Overall Progress</h2>
              <p>Your syllabus completion rate</p>
            </div>
            <TrendingUp size={23} />
          </div>

          <div className="progress-circle-area">
            <div
              className="progress-circle"
              style={{
                background: `conic-gradient(#2563eb ${progressPercentage * 3.6}deg, #e8eef7 0deg)`
              }}
            >
              <div className="progress-circle-inner">
                <strong>{progressPercentage}%</strong>
                <span>Completed</span>
              </div>
            </div>
          </div>

          <div className="progress-summary">
            <div>
              <span className="summary-dot completed-dot"></span>
              Completed
              <strong>{completedCount}</strong>
            </div>

            <div>
              <span className="summary-dot remaining-dot"></span>
              Remaining
              <strong>{remainingCount}</strong>
            </div>
          </div>
        </div>

        <div className="progress-details-card">
          <div className="progress-card-heading">
            <div>
              <h2>Study Summary</h2>
              <p>Your current learning activity</p>
            </div>
            <Target size={23} />
          </div>

          <div className="summary-item">
            <div className="summary-item-icon">
              <Clock size={20} />
            </div>
            <div>
              <strong>{studyHours} hours</strong>
              <span>Daily available study time</span>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-item-icon">
              <BookOpen size={20} />
            </div>
            <div>
              <strong>{totalEstimatedHours} hours</strong>
              <span>Total estimated study time</span>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-item-icon">
              <Brain size={20} />
            </div>
            <div>
              <strong>{dumpCount} topics</strong>
              <span>Brain Dumps saved</span>
            </div>
          </div>

          <div className="summary-item">
            <div className="summary-item-icon">
              <Award size={20} />
            </div>
            <div>
              <strong>{progressPercentage}%</strong>
              <span>Overall completion</span>
            </div>
          </div>
        </div>

      </div>

      <div className="topic-progress-card">
        <div className="progress-card-heading">
          <div>
            <h2>Topic Progress</h2>
            <p>Follow your progress topic by topic.</p>
          </div>
          <RefreshCw size={21} />
        </div>

        {topics.map((topic) => {
          const isCompleted = completedTopics.includes(topic.name);
          const hasDump = Boolean(brainDumps[topic.name]?.trim());

          return (
            <div className="topic-progress-item" key={topic.id}>
              <div className="topic-progress-info">
                <div>
                  <strong>{topic.name}</strong>
                  <span>
                    {isCompleted
                      ? "Completed"
                      : hasDump
                      ? "Brain dump saved"
                      : "Not completed"}
                  </span>
                  <span>
                    {topic.estimatedHours} study hours · {topic.priority} priority
                  </span>
                </div>

                <span className={`topic-status ${
                  isCompleted ? "done" : "pending"
                }`}>
                  {isCompleted ? "Completed" : "In progress"}
                </span>
              </div>

              <div className="topic-progress-track">
                <div
                  className="topic-progress-fill"
                  style={{
                    width: isCompleted ? "100%" : hasDump ? "50%" : "0%"
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="progress-motivation">
        <div className="motivation-icon">
          <Award size={27} />
        </div>
        <div>
          <h3>Keep going. Every topic counts!</h3>
          <p>
            Your progress grows with every study session.
            Stay consistent and prepare confidently for your exam.
          </p>
        </div>
      </div>

    </div>
  );
}

export default Progress;
