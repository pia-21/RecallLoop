
import { useState } from "react";

function Settings() {
  const [notifications, setNotifications] = useState(
    localStorage.getItem("recallLoopNotifications") !== "false"
  );

  const [reminders, setReminders] = useState(
    localStorage.getItem("recallLoopReminders") !== "false"
  );

  const [studyHours, setStudyHours] = useState(
    localStorage.getItem("recallLoopStudyHours") || "3"
  );

  const [fullName, setFullName] = useState(
    localStorage.getItem("recallLoopFullName") || ""
  );

  const [displayName, setDisplayName] = useState(
    localStorage.getItem("recallLoopDisplayName") || ""
  );

  const [course, setCourse] = useState(
    localStorage.getItem("recallLoopCourse") || ""
  );

 const saveSettings = async () => {
  localStorage.setItem("recallLoopStudyHours", studyHours);
  localStorage.setItem("recallLoopNotifications", notifications);
  localStorage.setItem("recallLoopReminders", reminders);

  localStorage.setItem("recallLoopFullName", fullName.trim());
  localStorage.setItem("recallLoopDisplayName", displayName.trim());
  localStorage.setItem("recallLoopCourse", course.trim());

  if (notifications && "Notification" in window) {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      new Notification("RecallLoop", {
        body: "Your study notifications are enabled. Happy learning!"
      });
    }
  }

  alert("Your settings have been saved!");
};

  return (
    <div className="page-container">

      <div className="page-heading">
        <p className="eyebrow">PREFERENCES</p>
        <h1>Settings</h1>
        <p>Manage your RecallLoop learning experience.</p>
      </div>

      {/* STUDENT PROFILE */}
      <section className="settings-card">
        <h2>Student Profile</h2>
        <p>Personalise your RecallLoop learning space.</p>

        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <label htmlFor="displayName">Preferred display name</label>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <label htmlFor="course">Course or programme</label>
        <input
          id="course"
          type="text"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
      </section>

      {/* STUDY PREFERENCES */}
      <section className="settings-card">
        <h2>Study Preferences</h2>

        <label htmlFor="studyHours">Daily study hours</label>
        <select
          id="studyHours"
          value={studyHours}
          onChange={(e) => setStudyHours(e.target.value)}
        >
          <option value="1">1 hour</option>
          <option value="2">2 hours</option>
          <option value="3">3 hours</option>
          <option value="4">4 hours</option>
          <option value="5">5 hours</option>
          <option value="6">6 hours</option>
          <option value="8">8 hours</option>
        </select>
      </section>

      {/* NOTIFICATIONS */}
      <section className="settings-card">
        <h2>Notifications</h2>

        <label className="settings-option">
          <span>
            <strong>Study notifications</strong>
            <small>
              Receive updates about your study activities.
            </small>
          </span>

          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
        </label>

        <label className="settings-option">
          <span>
            <strong>Study reminders</strong>
            <small>
              Remind me to follow my study schedule.
            </small>
          </span>

          <input
            type="checkbox"
            checked={reminders}
            onChange={(e) => setReminders(e.target.checked)}
          />
        </label>
      </section>

      {/* SAVE */}
      <section className="settings-card">
        <button onClick={saveSettings}>
          Save all settings
        </button>
      </section>

      {/* ABOUT */}
      <section className="settings-card">
        <h2>About RecallLoop</h2>
        <p>
          RecallLoop helps students plan their studies, practise
          active recall and prepare for examinations.
        </p>
      </section>

    </div>
  );
}

export default Settings;
