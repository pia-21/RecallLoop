
import { useEffect, useState } from "react";
import SyllabusInput from "./pages/SyllabusInput";
import StudySchedule from "./pages/StudySchedule";
import BrainDump from "./pages/BrainDump";
import AIFeedback from "./pages/AIFeedback";
import Progress from "./pages/Progress";
import RevisionPlan from "./pages/RevisionPlan";
import SettingsPage from "./pages/Settings";

import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Brain,
  BarChart3,
  Settings,
  Bell,
  Search,
  Clock,
  CheckCircle2,
  Flame,
  Menu,
  X,
  ArrowRight,
  Plus,
  GraduationCap
} from "lucide-react";

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "My Syllabus", icon: BookOpen },
  { name: "Study Schedule", icon: CalendarDays },
  { name: "Brain Dump", icon: Brain },
  { name: "AI Feedback", icon: CheckCircle2 },
  { name: "My Progress", icon: BarChart3 },
  { name: "Revision Plan", icon: CalendarDays }
];

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function getDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function calculateStreak(activity) {
  const dates = [
    ...new Set(
      activity
        .map((record) => record.date)
        .filter(Boolean)
    )
  ].sort().reverse();

  if (dates.length === 0) return 0;

  const today = new Date();
  const todayKey = getDateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  
  let currentDate = dates[0];

  if (currentDate !== todayKey && currentDate !== yesterdayKey) {
    return 0;
  }

  let streak = 0;

  for (const date of dates) {
    if (date !== currentDate) break;

    streak++;

    const previousDate = new Date(
      Number(currentDate.slice(0, 4)),
      Number(currentDate.slice(5, 7)) - 1,
      Number(currentDate.slice(8, 10))
    );

    previousDate.setDate(previousDate.getDate() - 1);
    currentDate = getDateKey(previousDate);
  }

  return streak;
}

function App() {
  const studentName =
  localStorage.getItem("recallLoopDisplayName") ||
  localStorage.getItem("recallLoopFullName") ||
  "Student";

const studentCourse =
  localStorage.getItem("recallLoopCourse") || "Your learning space";
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [dashboardData, setDashboardData] = useState({
    syllabus: null,
    topics: [],
    completedTopics: [],
    activity: [],
    brainDumps: {}
  });


  useEffect(() => {
    if (activePage !== "Dashboard") return;

    const syllabus = readStorage("recallLoopSyllabus", null);
    const completedTopics = readStorage(
      "recallLoopCompletedTopics",
      []
    );
    const activity = readStorage("recallLoopStudyActivity", []);
    const brainDumps = readStorage("recallLoopBrainDumps", {});

    const topics = (syllabus?.topics || []).map((topic) => {
      if (typeof topic === "string") {
        return {
          name: topic,
          estimatedHours: 1,
          priority: "Medium"
        };
      }

      return {
        name: topic.name,
        estimatedHours: Number(topic.estimatedHours) || 1,
        priority: topic.priority || "Medium"
      };
    });

    setDashboardData({
      syllabus,
      topics,
      completedTopics: Array.isArray(completedTopics)
        ? completedTopics
        : [],
      activity: Array.isArray(activity) ? activity : [],
      brainDumps:
        brainDumps && typeof brainDumps === "object"
          ? brainDumps
          : {}
    });
  }, [activePage]);

  const {
    syllabus,
    topics,
    completedTopics,
    activity,
    brainDumps
  } = dashboardData;

  const totalTopics = topics.length;

  const completedCount = topics.filter((topic) =>
    completedTopics.includes(topic.name)
  ).length;

  const remainingCount = Math.max(
    totalTopics - completedCount,
    0
  );

  const progress =
    totalTopics > 0
      ? Math.round((completedCount / totalTopics) * 100)
      : 0;

  const studyHours = activity.reduce(
    (total, record) => total + (Number(record.hours) || 0),
    0
  );

  const streak = calculateStreak(activity);


  const dailyHours = Number(syllabus?.studyHours) || 2;

  const priorityOrder = {
    High: 1,
    Medium: 2,
    Low: 3
  };

  const remainingTopics = topics
    .filter((topic) => !completedTopics.includes(topic.name))
    .sort(
      (a, b) =>
        (priorityOrder[a.priority] || 2) -
        (priorityOrder[b.priority] || 2)
    );

  const todayTopics = [];
  let plannedHours = 0;

  for (const topic of remainingTopics) {
    if (plannedHours >= dailyHours && todayTopics.length > 0) {
      break;
    }

    todayTopics.push(topic);
    plannedHours += topic.estimatedHours;
  }

  
  const searchResults = searchTerm.trim()
    ? topics.filter((topic) => {
        const savedNote = brainDumps[topic.name] || "";

        return (
          topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          savedNote.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }).slice(0, 6)
    : [];

  const openPage = (page) => {
    setActivePage(page);
    setMobileMenu(false);
    setSearchTerm("");
  };

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>

        <div className="brand">
          <div className="brand-icon">
            <Brain size={25} />
          </div>

          <span>
            Recall<span className="brand-blue">Loop</span>
          </span>

          <button
            className="close-menu"
            onClick={() => setMobileMenu(false)}
          >
            <X size={21} />
          </button>
        </div>

        <div className="sidebar-label">MENU</div>

        <nav>
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => openPage(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">

          <button
            className={`nav-item ${
              activePage === "Settings" ? "active" : ""
            }`}
            onClick={() => openPage("Settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="profile">
            <div className="avatar">T</div>

            <div>
              <strong>Student Account</strong>
              <small>My learning space</small>
            </div>
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOP NAVIGATION */}
        <header className="topbar">

          <button
            className="mobile-menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={23} />
          </button>

          <div className="search-box">
            <Search size={18} />

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search topics, notes..."
            />

            {searchTerm.trim() && (
              <div className="search-results">
                {searchResults.length > 0 ? (
                  searchResults.map((topic) => (
                    <button
                      key={topic.name}
                      onClick={() => openPage("Brain Dump")}
                    >
                      <BookOpen size={16} />
                      <span>{topic.name}</span>
                      <ArrowRight size={14} />
                    </button>
                  ))
                ) : (
                  <p>No matching topics or notes found.</p>
                )}
              </div>
            )}
          </div>

          <div className="topbar-right">
            <button className="notification">
              <Bell size={20} />
              <span></span>
            </button>

            <div className="avatar">T</div>
          </div>

        </header>

        {/* DASHBOARD */}
        {activePage === "Dashboard" ? (

          <section className="page-content">

            <div className="welcome-section">

              <div>
                <p className="eyebrow">YOUR LEARNING SPACE</p>

                <h1>Welcome back, {studentName}! 👋</h1>

                <p className="subtitle">
                  {studentCourse
  ? `Keep learning, keep recalling, and get closer to your goals.`
  : "Welcome to your learning space."}
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => openPage("My Syllabus")}
              >
                <Plus size={18} />
                Add Syllabus
              </button>

            </div>

            {/* STATISTICS */}
            <div className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon blue">
                  <BookOpen size={22} />
                </div>

                <p>Total Topics</p>
                <h2>{totalTopics}</h2>
                <small>Across your syllabus</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <CheckCircle2 size={22} />
                </div>

                <p>Topics Completed</p>
                <h2>{completedCount}</h2>
                <small>{progress}% completed</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">
                  <Clock size={22} />
                </div>

                <p>Study Hours</p>
                <h2>{studyHours.toFixed(1)}</h2>
                <small>Estimated hours completed</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <Flame size={22} />
                </div>

                <p>Study Streak</p>
                <h2>{streak} {streak === 1 ? "Day" : "Days"}</h2>
                <small>Consecutive study days</small>
              </div>

            </div>

            {/* DAILY SCHEDULE AND PROGRESS */}
            <div className="dashboard-grid">

              <div className="content-card schedule-card">

                <div className="card-heading">

                  <div>
                    <h3>Today's Study Plan</h3>
                    <p>Your suggested learning sessions</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => openPage("Study Schedule")}
                  >
                    View all <ArrowRight size={15} />
                  </button>

                </div>

                <div className="topic-list">

                  {totalTopics === 0 ? (
                    <div className="empty-dashboard">
                      <BookOpen size={28} />
                      <p>You haven't added any syllabus topics yet.</p>
                      <button
                        className="text-button"
                        onClick={() => openPage("My Syllabus")}
                      >
                        Add your syllabus <ArrowRight size={15} />
                      </button>
                    </div>
                  ) : todayTopics.length === 0 ? (
                    <div className="empty-dashboard">
                      <CheckCircle2 size={28} />
                      <p>Wonderful! You've completed all your topics.</p>
                    </div>
                  ) : (
                    todayTopics.map((topic) => {
                      const isDone = completedTopics.includes(topic.name);

                      return (
                        <div className="topic-row" key={topic.name}>

                          <div
                            className={`topic-check ${
                              isDone ? "completed" : ""
                            }`}
                          >
                            {isDone && <CheckCircle2 size={19} />}
                          </div>

                          <div className="topic-details">
                            <strong>{topic.name}</strong>

                            <small>
                              <Clock size={13} />
                              {topic.estimatedHours}{" "}
                              {topic.estimatedHours === 1 ? "hour" : "hours"}
                              {" · "}
                              {topic.priority} priority
                            </small>
                          </div>

                          <span
                            className={`topic-status ${
                              isDone ? "done" : ""
                            }`}
                          >
                            {isDone ? "Completed" : "Upcoming"}
                          </span>

                        </div>
                      );
                    })
                  )}

                </div>

                <button
                  className="outline-button full-button"
                  onClick={() => openPage("Study Schedule")}
                >
                  Open Study Schedule <ArrowRight size={16} />
                </button>

              </div>

              {/* PROGRESS */}
              <div className="content-card progress-card">

                <h3>Overall Progress</h3>
                <p>Your syllabus completion</p>

                <div className="progress-circle">

                  <div>
                    <strong>{progress}%</strong>
                    <small>Completed</small>
                  </div>

                </div>

                <div className="progress-info">

                  <div>
                    <span>Completed topics</span>
                    <strong>{completedCount}</strong>
                  </div>

                  <div>
                    <span>Remaining topics</span>
                    <strong>{remainingCount}</strong>
                  </div>

                </div>

                <button
                  className="text-button centered"
                  onClick={() => openPage("My Progress")}
                >
                  View detailed progress <ArrowRight size={15} />
                </button>

              </div>

            </div>

            {/* BRAIN DUMP */}
            <div className="brain-banner">

              <div className="brain-banner-icon">
                <Brain size={30} />
              </div>

              <div>
                <h3>Test what you remember!</h3>

                <p>
                  Use Brain Dump to recall everything you've learned
                  without looking at your notes.
                </p>
              </div>

              <button
                className="white-button"
                onClick={() => openPage("Brain Dump")}
              >
                Start Brain Dump <ArrowRight size={16} />
              </button>

            </div>

          </section>

        ) : activePage === "My Syllabus" ? (

          <SyllabusInput />

        ) : activePage === "Study Schedule" ? (

          <StudySchedule />

        ) : activePage === "Brain Dump" ? (

          <BrainDump />

        ) : activePage === "AI Feedback" ? (

          <AIFeedback />

        ) : activePage === "My Progress" ? (

          <Progress />

        ) : activePage === "Revision Plan" ? (

          <RevisionPlan />

        ) : activePage === "Settings" ? (

          <SettingsPage />

        ) : (

          <section className="page-content">

            <p className="eyebrow">RECALLLOOP WORKSPACE</p>

            <h1>{activePage}</h1>

            <p className="subtitle">
              Your {activePage.toLowerCase()} workspace will appear here.
            </p>

            <div className="content-card placeholder-card">

              <GraduationCap size={42} />

              <h3>{activePage}</h3>

              <p>
                We're building this section next. Your dashboard is ready!
              </p>

              <button
                className="primary-button"
                onClick={() => openPage("Dashboard")}
              >
                Return to Dashboard
              </button>

            </div>

          </section>

        )}

      </main>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenu && (
        <button
          className="menu-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}

    </div>
  );
}

export default App;
