
import { useState } from "react";
import {
  CalendarDays,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

function StudySchedule() {
  const [syllabus] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("recallLoopSyllabus"));
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

  const [completedTopics, setCompletedTopics] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("recallLoopCompletedTopics")
      ) || [];
    } catch {
      return [];
    }
  });

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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = new Date(`${syllabus.examDate}T00:00:00`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const daysAvailable = Math.max(
    1,
    Math.ceil((examDate - today) / millisecondsPerDay)
  );

  const dailyHours = Number(syllabus.studyHours) || 3;


  const priorityOrder = {
    High: 1,
    Medium: 2,
    Low: 3
  };

  const sortedTopics = [...topics].sort(
    (a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
  );


  const schedule = [];
  let topicIndex = 0;

  for (
    let day = 0;
    day < daysAvailable && topicIndex < sortedTopics.length;
    day++
  ) {
    let hoursUsed = 0;
    const dailyTopics = [];

    while (topicIndex < sortedTopics.length) {
      const topic = sortedTopics[topicIndex];

      if (
        dailyTopics.length > 0 &&
        hoursUsed + topic.estimatedHours > dailyHours
      ) {
        break;
      }

      dailyTopics.push(topic);
      hoursUsed += topic.estimatedHours;
      topicIndex++;

      if (hoursUsed >= dailyHours) {
        break;
      }
    }

    const date = new Date(today);
    date.setDate(today.getDate() + day);

    schedule.push({
      date,
      topics: dailyTopics,
      hours: hoursUsed
    });
  }

  const unscheduledTopics = sortedTopics.slice(topicIndex);

 const toggleCompleted = (topicName, estimatedHours) => {
  setCompletedTopics((previous) => {
    const isAlreadyCompleted = previous.includes(topicName);

    const updated = isAlreadyCompleted
      ? previous.filter((item) => item !== topicName)
      : [...previous, topicName];

    localStorage.setItem(
      "recallLoopCompletedTopics",
      JSON.stringify(updated)
    );

    const today = new Date();
    const dateKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    let activity = [];

    try {
      activity = JSON.parse(
        localStorage.getItem("recallLoopStudyActivity") || "[]"
      );
    } catch {
      activity = [];
    }

    if (isAlreadyCompleted) {
      activity = activity.filter(
        (record) => record.topicName !== topicName
      );
    } else {
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

    return updated;
  });
};

  const completedCount = topics.filter(topic =>
    completedTopics.includes(topic.name)
  ).length;

  const progress = Math.round(
    (completedCount / topics.length) * 100
  );

  const totalStudyHours = topics.reduce(
    (total, topic) => total + topic.estimatedHours,
    0
  );

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
          <div className="content-card" key={index}>

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

                </div>
              );
            })}

          </div>
        ))}

      </div>

      {unscheduledTopics.length > 0 && (
        <div className="content-card">
          <h3>Topics Still to Schedule</h3>

          {unscheduledTopics.map(topic => (
            <p key={topic.id}>
              {topic.name} — {topic.estimatedHours} hours
            </p>
          ))}
        </div>
      )}

    </section>
  );
}

export default StudySchedule;
