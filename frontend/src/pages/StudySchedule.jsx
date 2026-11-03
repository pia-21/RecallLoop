
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Trash2
} from "lucide-react";
import API_URL from "../config/api";

const PLAN_ID_KEY = "recallLoopPlanId";
const PLAN_SIGNATURE_KEY = "recallLoopPlanSignature";
const PLAN_CACHE_KEY = "recallLoopCachedPlan";

function readLocalJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function StudySchedule() {
  const [syllabus, setSyllabus] = useState(() =>
    readLocalJSON("recallLoopSyllabus", null)
  );

  const [completedTopics, setCompletedTopics] = useState(() =>
    readLocalJSON("recallLoopCompletedTopics", [])
  );

  const [schedule, setSchedule] = useState([]);
  const [unscheduledTopics, setUnscheduledTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

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

  const priorityOrder = {
    High: 1,
    Medium: 2,
    Low: 3
  };

  const sortedTopics = [...topics].sort(
    (a, b) =>
      (priorityOrder[a.priority] || 2) -
      (priorityOrder[b.priority] || 2)
  );

  const planSignature = JSON.stringify({
    examDate: syllabus?.examDate || "",
    studyHours: Number(syllabus?.studyHours) || 3,
    topics: sortedTopics.map((topic) => ({
      name: topic.name,
      estimatedHours: topic.estimatedHours,
      priority: topic.priority
    }))
  });

  const formatBackendSchedule = (backendSchedule) => {
    const topicDetails = new Map(
      topics.map((topic) => [topic.name, topic])
    );

    return (backendSchedule || []).map((day, index) => ({
      id: index,
      date: new Date(`${day.day}T00:00:00`),
      hours: Number(day.total_hours) || 0,
      topics: (day.topics || []).map((scheduledTopic, topicIndex) => {
        const originalTopic = topicDetails.get(
          scheduledTopic.topic_name
        );

        return {
          ...(originalTopic || {}),
          id: `${index}-${topicIndex}`,
          name: scheduledTopic.topic_name,
          estimatedHours: Number(scheduledTopic.allocated_hours) || 0,
          priority: originalTopic?.priority || "Medium"
        };
      })
    }));
  };

  useEffect(() => {
    let cancelled = false;

    const loadPlan = async () => {
      if (!syllabus || topics.length === 0) {
        setSchedule([]);
        setUnscheduledTopics([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setApiError("");

      try {
        const cachedPlan = readLocalJSON(PLAN_CACHE_KEY, null);

        let planId = null;
        let backendSchedule = null;
        let backendUnscheduled = [];

        if (
          cachedPlan?.planId &&
          cachedPlan.signature === planSignature &&
          Array.isArray(cachedPlan.schedule)
        ) {
          planId = cachedPlan.planId;
          backendSchedule = cachedPlan.schedule;
          backendUnscheduled = cachedPlan.unscheduledTopics || [];

          localStorage.setItem(PLAN_ID_KEY, planId);
          localStorage.setItem(PLAN_SIGNATURE_KEY, planSignature);

          const progressResponse = await fetch(
            `${API_URL}/api/progress/${planId}`
          );

          if (progressResponse.ok) {
            const progressData = await progressResponse.json();

            const completed = (progressData.topics || [])
              .filter((topic) => topic.status === "recalled")
              .map((topic) => topic.topic_name);

            if (!cancelled) {
              setCompletedTopics(completed);
              localStorage.setItem(
                "recallLoopCompletedTopics",
                JSON.stringify(completed)
              );
            }
          } else if (progressResponse.status === 404) {
            planId = null;
          } else {
            throw new Error("Could not retrieve saved study progress.");
          }
        }

        if (!planId) {
          const previousCompleted = readLocalJSON(
            "recallLoopCompletedTopics",
            []
          );

          const planResponse = await fetch(`${API_URL}/api/plan`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              exam_date: syllabus.examDate,
              daily_available_hours:
                Number(syllabus.studyHours) || 3,
              topics: sortedTopics.map((topic) => ({
                name: topic.name,
                estimated_hours: topic.estimatedHours
              }))
            })
          });

          if (!planResponse.ok) {
            const errorData = await planResponse.json().catch(() => ({}));
            throw new Error(
              errorData.detail || "Could not generate your study plan."
            );
          }

          const planData = await planResponse.json();

          planId = planData.plan_id;
          backendSchedule = planData.schedule || [];
          backendUnscheduled = planData.unscheduled_topics || [];

          const savedPlan = {
            planId,
            signature: planSignature,
            schedule: backendSchedule,
            unscheduledTopics: backendUnscheduled
          };

          localStorage.setItem(
            PLAN_CACHE_KEY,
            JSON.stringify(savedPlan)
          );
          localStorage.setItem(PLAN_ID_KEY, planId);
          localStorage.setItem(PLAN_SIGNATURE_KEY, planSignature);

          for (const topicName of previousCompleted) {
            if (!topics.some((topic) => topic.name === topicName)) {
              continue;
            }

            const migrationResponse = await fetch(
              `${API_URL}/api/progress/${planId}`,
              {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  topic_name: topicName,
                  status: "recalled"
                })
              }
            );

            if (!migrationResponse.ok) {
              throw new Error(
                `Could not migrate progress for "${topicName}".`
              );
            }
          }
        }

        if (cancelled) return;

        setSchedule(formatBackendSchedule(backendSchedule));
        setUnscheduledTopics(backendUnscheduled);

        const finalProgressResponse = await fetch(
          `${API_URL}/api/progress/${planId}`
        );

        if (finalProgressResponse.ok) {
          const progressData = await finalProgressResponse.json();

          const completed = (progressData.topics || [])
            .filter((topic) => topic.status === "recalled")
            .map((topic) => topic.topic_name);

          if (!cancelled) {
            setCompletedTopics(completed);
            localStorage.setItem(
              "recallLoopCompletedTopics",
              JSON.stringify(completed)
            );
          }
        } else {
          throw new Error("Could not load the latest topic progress.");
        }
      } catch (error) {
        console.error("Study plan error:", error);

        if (!cancelled) {
          setApiError(error.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, [planSignature]);

  const deleteTopic = (topicName) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${topicName}" from your study plan?`
    );

    if (!confirmed) return;

    const updatedSyllabus = {
      ...syllabus,
      topics: syllabus.topics.filter((topic) => {
        const name = typeof topic === "string" ? topic : topic.name;
        return name !== topicName;
      })
    };

    localStorage.setItem(
      "recallLoopSyllabus",
      JSON.stringify(updatedSyllabus)
    );

    setSyllabus(updatedSyllabus);

    const updatedCompleted = completedTopics.filter(
      (name) => name !== topicName
    );

    localStorage.setItem(
      "recallLoopCompletedTopics",
      JSON.stringify(updatedCompleted)
    );

    setCompletedTopics(updatedCompleted);

    try {
      const brainDumps = readLocalJSON("recallLoopBrainDumps", {});
      delete brainDumps[topicName];

      localStorage.setItem(
        "recallLoopBrainDumps",
        JSON.stringify(brainDumps)
      );
    } catch (error) {
      console.error("Could not update brain dumps:", error);
    }

    try {
      const activity = readLocalJSON(
        "recallLoopStudyActivity",
        []
      );

      const updatedActivity = activity.filter(
        (record) => record.topicName !== topicName
      );

      localStorage.setItem(
        "recallLoopStudyActivity",
        JSON.stringify(updatedActivity)
      );
    } catch (error) {
      console.error("Could not update study activity:", error);
    }
  };

  const toggleCompleted = async (topicName, estimatedHours) => {
    const isAlreadyCompleted = completedTopics.includes(topicName);

    const newStatus = isAlreadyCompleted
      ? "not_started"
      : "recalled";

    const planId = localStorage.getItem(PLAN_ID_KEY);

    if (!planId) {
      setApiError("Your study plan is not connected to the backend yet.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/progress/${planId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            topic_name: topicName,
            status: newStatus
          })
        }
      );

      if (!response.ok) {
        throw new Error("Could not update topic progress.");
      }

      const updated = isAlreadyCompleted
        ? completedTopics.filter((item) => item !== topicName)
        : [...completedTopics, topicName];

      setCompletedTopics(updated);

      localStorage.setItem(
        "recallLoopCompletedTopics",
        JSON.stringify(updated)
      );

      const currentDate = new Date();
      const dateKey = [
        currentDate.getFullYear(),
        String(currentDate.getMonth() + 1).padStart(2, "0"),
        String(currentDate.getDate()).padStart(2, "0")
      ].join("-");

      let activity = readLocalJSON(
        "recallLoopStudyActivity",
        []
      );

      if (isAlreadyCompleted) {
        activity = activity.filter(
          (record) => record.topicName !== topicName
        );
      } else {
        // Remove previous entries for this topic before adding
        // its latest completion record.
        activity = activity.filter(
          (record) => record.topicName !== topicName
        );

        activity.push({
          topicName,
          date: dateKey,
          hours: Number(estimatedHours) || 1
        });
      }

      localStorage.setItem(
        "recallLoopStudyActivity",
        JSON.stringify(activity)
      );

      setApiError("");
    } catch (error) {
      console.error("Progress update error:", error);
      setApiError(
        error.message || "Could not save your progress. Please try again."
      );
    }
  };

  const completedCount = topics.filter((topic) =>
    completedTopics.includes(topic.name)
  ).length;

  const progress = topics.length > 0
    ? Math.round((completedCount / topics.length) * 100)
    : 0;

  const totalStudyHours = topics.reduce(
    (total, topic) => total + topic.estimatedHours,
    0
  );

  const dailyHours = Number(syllabus?.studyHours) || 3;

  if (!syllabus || topics.length === 0) {
    return (
      <section className="page-content">
        <h1>Study Schedule</h1>
        <div className="content-card">
          <BookOpen size={35} />
          <h3>No syllabus found yet</h3>
          <p>Please add and save your syllabus first.</p>
        </div>
      </section>
    );
  }

  const examDate = new Date(`${syllabus.examDate}T00:00:00`);

  return (
    <section className="page-content">

      <div className="welcome-section">
        <div>
          <p className="eyebrow">YOUR PERSONAL STUDY PLAN</p>
          <h1>Study Schedule</h1>
          <p className="subtitle">
            Your topics organised by study time and priority.
          </p>
        </div>
      </div>

      {apiError && (
        <div className="content-card" style={{ marginBottom: "24px" }}>
          <AlertCircle size={22} />
          <p>{apiError}</p>
        </div>
      )}

      {loading && (
        <div className="content-card" style={{ marginBottom: "24px" }}>
          <p>Loading your study plan...</p>
        </div>
      )}

      <div className="stats-grid">

        <div className="stat-card">
          <div className="stat-icon blue">
            <BookOpen size={22} />
          </div>
          <p>Total Topics</p>
          <h2>{topics.length}</h2>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={22} />
          </div>
          <p>Completed</p>
          <h2>{completedCount}</h2>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Clock size={22} />
          </div>
          <p>Daily Study Time</p>
          <h2>{dailyHours} hrs</h2>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <CalendarDays size={22} />
          </div>
          <p>Study Days</p>
          <h2>{schedule.length}</h2>
        </div>

      </div>

      <div className="content-card" style={{ marginBottom: "24px" }}>
        <h3>{syllabus.subject} Study Plan</h3>

        <p>
          Exam date: {examDate.toLocaleDateString()}
        </p>

        <p>
          Estimated study time: <strong>{totalStudyHours} hours</strong>
        </p>

        <p>
          Overall completion: <strong>{progress}%</strong>
        </p>

        <div
          style={{
            background: "#e8edf5",
            height: "10px",
            borderRadius: "20px",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#2563eb",
              transition: "width 0.3s ease"
            }}
          />
        </div>
      </div>

      {unscheduledTopics.length > 0 && (
        <div className="content-card" style={{ marginBottom: "24px" }}>
          <AlertCircle size={22} />
          <p>
            {unscheduledTopics.length} topic(s) could not fit into the
            available study days. Consider increasing your daily study
            hours or starting your preparation earlier.
          </p>
        </div>
      )}

      <div className="schedule-days">

        {schedule.map((day, index) => (
          <div className="content-card" key={day.id ?? index}>

            <div className="card-heading">
              <div>
                <h3>Day {index + 1}</h3>
                <p>
                  {day.date.toLocaleDateString("en-KE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </p>
              </div>

              <span className="topic-status">
                {day.hours} study hours
              </span>
            </div>

            {day.topics.map((topic) => {
              const isCompleted = completedTopics.includes(topic.name);

              return (
                <div className="topic-row" key={topic.id}>

                  <input
                    type="checkbox"
                    checked={isCompleted}
                    disabled={loading}
                    onChange={() =>
                      toggleCompleted(topic.name, topic.estimatedHours)
                    }
                  />

                  <div className="topic-details">
                    <strong>{topic.name}</strong>

                    <small>
                      <Clock size={13} />
                      {topic.estimatedHours} study hours
                    </small>

                    <small>
                      Priority: {topic.priority}
                    </small>
                  </div>

                  <span className={`topic-status ${
                    isCompleted ? "done" : ""
                  }`}>
                    {isCompleted ? "Completed" : "Pending"}
                  </span>

                  <button
                    type="button"
                    onClick={() => deleteTopic(topic.name)}
                    title={`Remove ${topic.name}`}
                    aria-label={`Remove ${topic.name}`}
                    style={{
                      background: "#fff1f2",
                      color: "#dc2626",
                      border: "1px solid #fecaca",
                      borderRadius: "8px",
                      padding: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Trash2 size={17} />
                  </button>

                </div>
              );
            })}

          </div>
        ))}

      </div>

      {unscheduledTopics.length > 0 && (
        <div className="content-card">
          <h3>Topics Still to Schedule</h3>

          {unscheduledTopics.map((topicName) => {
            const topic = topics.find(
              (item) => item.name === topicName
            );

            return (
              <div
                key={topicName}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px"
                }}
              >
                <p>
                  {topicName} — {topic?.estimatedHours || 1} hours
                </p>

                <button
                  type="button"
                  onClick={() => deleteTopic(topicName)}
                  title={`Remove ${topicName}`}
                  aria-label={`Remove ${topicName}`}
                  style={{
                    background: "#fff1f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: "8px",
                    padding: "8px",
                    cursor: "pointer"
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}

export default StudySchedule;
