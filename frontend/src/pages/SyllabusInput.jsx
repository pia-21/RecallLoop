
import { useEffect, useState } from "react";
import {
  UploadCloud,
  FileText,
  CalendarDays,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
const openPdfDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("RecallLoopFiles", 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains("syllabusPdfs")) {
        database.createObjectStore("syllabusPdfs");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const savePdfToDatabase = async (pdfFile) => {
  const database = await openPdfDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      "syllabusPdfs",
      "readwrite"
    );

    transaction.objectStore("syllabusPdfs").put(
      {
        name: pdfFile.name,
        file: pdfFile
      },
      "studentSyllabus"
    );

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

const getSavedPdf = async () => {
  const database = await openPdfDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      "syllabusPdfs",
      "readonly"
    );

    const request = transaction
      .objectStore("syllabusPdfs")
      .get("studentSyllabus");

    request.onsuccess = () => {
      database.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
};

const deleteSavedPdf = async () => {
  const database = await openPdfDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      "syllabusPdfs",
      "readwrite"
    );

    transaction.objectStore("syllabusPdfs").delete("studentSyllabus");

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
};

function SyllabusInput() {
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [studyHours, setStudyHours] = useState("3");
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState("");
  const [newHours, setNewHours] = useState("1");
  const [newPriority, setNewPriority] = useState("Medium");
  const [editingTopicId, setEditingTopicId] = useState(null);
const [editTopicName, setEditTopicName] = useState("");
const [editTopicHours, setEditTopicHours] = useState("1");
const [editTopicPriority, setEditTopicPriority] = useState("Medium");
  const [file, setFile] = useState(null);
const [pdfUrl, setPdfUrl] = useState("");
const [message, setMessage] = useState("");
const [pdfLoading, setPdfLoading] = useState(true);
useEffect(() => {
  const savedSyllabus = localStorage.getItem("recallLoopSyllabus");

  if (savedSyllabus) {
    try {
      const syllabus = JSON.parse(savedSyllabus);

      setSubject(syllabus.subject || "");
      setExamDate(syllabus.examDate || "");
      setStudyHours(syllabus.studyHours || "3");

      setTopics(
        (syllabus.topics || []).map((topic, index) => ({
          ...topic,
          id: Date.now() + index,
          selected: topic.selected !== false
        }))
      );
    } catch (error) {
      console.error("Could not load saved syllabus:", error);
    }
  }
}, []);
useEffect(() => {
  let objectUrl;

  if (file) {
    objectUrl = URL.createObjectURL(file);
    setPdfUrl(objectUrl);
  } else {
    setPdfUrl("");
  }

  return () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  };
}, [file]);

useEffect(() => {
  const loadSavedPdf = async () => {
    try {
      const savedPdf = await getSavedPdf();

      if (savedPdf?.file) {
        const restoredFile = new File(
          [savedPdf.file],
          savedPdf.name,
          { type: "application/pdf" }
        );

        setFile(restoredFile);
      }
    } catch (error) {
      console.error("Could not load saved PDF:", error);
    } finally {
      setPdfLoading(false);
    }
  };

  loadSavedPdf();
}, []);
  const addTopic = () => {
    if (!newTopic.trim()) {
      setMessage("Please enter a topic name.");
      return;
    }

    if (topics.some(topic => topic.name.toLowerCase() === newTopic.trim().toLowerCase())) {
      setMessage("This topic has already been added.");
      return;
    }

    setTopics([
      ...topics,
      {
        id: Date.now(),
        name: newTopic.trim(),
        estimatedHours: Number(newHours),
        priority: newPriority,
        selected: true
      }
    ]);

    setNewTopic("");
    setNewHours("1");
    setNewPriority("Medium");
    setMessage("");
  };

  const removeTopic = (id) => {
    setTopics(topics.filter(topic => topic.id !== id));
  };

  const updateTopic = (id, field, value) => {
    setTopics(topics.map(topic =>
      topic.id === id ? { ...topic, [field]: value } : topic
    ));
  };
const startEditingTopic = (topic) => {
  setEditingTopicId(topic.id);
  setEditTopicName(topic.name);
  setEditTopicHours(String(topic.estimatedHours));
  setEditTopicPriority(topic.priority);
  setMessage("");
};

const cancelEditingTopic = () => {
  setEditingTopicId(null);
  setEditTopicName("");
};

const saveEditedTopic = () => {
  const trimmedName = editTopicName.trim();

  if (!trimmedName) {
    setMessage("Please enter a topic name.");
    return;
  }

  const duplicate = topics.some(
    topic =>
      topic.id !== editingTopicId &&
      topic.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (duplicate) {
    setMessage("A topic with this name already exists.");
    return;
  }

  setTopics(currentTopics =>
    currentTopics.map(topic =>
      topic.id === editingTopicId
        ? {
            ...topic,
            name: trimmedName,
            estimatedHours: Number(editTopicHours),
            priority: editTopicPriority
          }
        : topic
    )
  );

  setEditingTopicId(null);
  setMessage("Topic updated. Click Save My Syllabus to save your changes.");
};
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile && selectedFile.type !== "application/pdf") {
      setMessage("Please upload a PDF file.");
      setFile(null);
      return;
    }

    setFile(selectedFile || null);
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const selectedTopics = topics.filter(topic => topic.selected);

    if (!subject.trim() || !examDate || selectedTopics.length === 0) {
      setMessage("Enter your subject, exam date and select at least one topic.");
      return;
    }

    if (new Date(examDate + "T00:00:00") < new Date(new Date().toDateString())) {
      setMessage("Please select a future examination date.");
      return;
    }
if (file) {
  try {
    await savePdfToDatabase(file);
  } catch (error) {
    console.error("PDF storage error:", error);
    setMessage("Could not save your PDF. Please try again.");
    return;
  }
}
    const syllabusData = {
      subject,
      examDate,
      studyHours,
      topics: selectedTopics.map(({ id, ...topic }) => topic),
      fileName: file ? file.name : null
    };

    localStorage.setItem(
      "recallLoopSyllabus",
      JSON.stringify(syllabusData)
    );

    setMessage("Your study plan has been saved successfully!");
  };

  return (
    <div className="syllabus-page">

      <div className="syllabus-heading">
        <p className="eyebrow">PLAN YOUR LEARNING</p>
        <h1>Set Up Your Study Plan</h1>
        <p>
          Tell RecallLoop about your examination and syllabus.
          Choose the topics you want to study and organise your time.
        </p>
      </div>

      <form className="syllabus-form" onSubmit={handleSubmit}>

        <div className="form-section">
          <div className="form-section-heading">
            <BookOpen size={21} />
            <div>
              <h3>Subject Information</h3>
              <p>Enter the subject you are preparing for.</p>
            </div>
          </div>

          <label>Subject Name</label>
          <input
            type="text"
            placeholder="e.g. Database Management"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <CalendarDays size={21} />
            <div>
              <h3>Examination Details</h3>
              <p>When will you sit for your examination?</p>
            </div>
          </div>

          <label>Examination Date</label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            required
          />
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <Clock size={21} />
            <div>
              <h3>Available Study Time</h3>
              <p>How many hours can you study each day?</p>
            </div>
          </div>

          <label>Daily Study Hours</label>
          <select
            value={studyHours}
            onChange={(e) => setStudyHours(e.target.value)}
          >
            <option value="1">1 hour per day</option>
            <option value="2">2 hours per day</option>
            <option value="3">3 hours per day</option>
            <option value="4">4 hours per day</option>
            <option value="5">5 hours per day</option>
            <option value="6">6 hours per day</option>
            <option value="8">8 hours per day</option>
          </select>
        </div>

        <div className="form-section">
          <div className="form-section-heading">
            <UploadCloud size={21} />
            <div>
              <h3>Upload Your Syllabus</h3>
              <p>Upload your syllabus in PDF format.</p>
            </div>
          </div>

          <label className="upload-area">
            <UploadCloud size={35} />
            <strong>
              {file ? file.name : "Click to upload your syllabus"}
            </strong>
            <span>PDF files only</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              hidden
            />
          </label>

          {file && (
            <div className="uploaded-file">
              <FileText size={20} />
              <span>{file.name}</span>
              <CheckCircle2 size={19} color="green" />
            </div>
          )}
        </div>
{pdfLoading ? (
  <p>Checking for your saved syllabus...</p>
) : pdfUrl ? (
  <div className="pdf-reader">
    <div className="pdf-reader-heading">
      <FileText size={20} />
      <strong>Read Your Uploaded Syllabus</strong>
    </div>

    <iframe
      src={pdfUrl}
      title="Uploaded syllabus PDF"
      width="100%"
      height="650px"
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: "10px",
        background: "#f8fafc"
      }}
    />

    <a
      href={pdfUrl}
      download={file.name}
      className="outline-button"
      style={{
        display: "inline-block",
        marginTop: "12px",
        textDecoration: "none"
      }}
    >
      Download Syllabus
    </a>

    <button
  type="button"
  className="outline-button"
  style={{
    marginTop: "12px",
    marginLeft: "10px",
    color: "#dc2626",
    borderColor: "#fecaca"
  }}
  onClick={async () => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this syllabus PDF?"
    );

    if (!confirmed) return;

    try {
      await deleteSavedPdf();
      setFile(null);
      setMessage("Your PDF has been removed. You can upload another one.");
    } catch (error) {
      console.error(error);
      setMessage("Could not remove the PDF. Please try again.");
    }
  }}
>
  <Trash2 size={16} />
  Remove PDF
</button>

  </div>
) : null}
        <div className="form-section">
          <div className="form-section-heading">
            <BookOpen size={21} />
            <div>
              <h3>Build Your Topic List</h3>
              <p>Add topics and decide how much attention each one needs.</p>
            </div>
          </div>

          <label>Topic Name</label>
          <input
            type="text"
            placeholder="e.g. Database Normalisation"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTopic();
              }
            }}
          />

          <div className="topic-options">
            <div>
              <label>Estimated Study Time</label>
              <select
                value={newHours}
                onChange={(e) => setNewHours(e.target.value)}
              >
                <option value="0.5">30 minutes</option>
                <option value="1">1 hour</option>
                <option value="1.5">1.5 hours</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="4">4 hours</option>
                <option value="5">5 hours</option>
              </select>
            </div>

            <div>
              <label>Topic Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="add-topic-button"
            onClick={addTopic}
          >
            <Plus size={18} />
            Add Topic
          </button>

         <div className="manual-topic-list">
  {topics.map((topic) => (
    <div className="manual-topic enhanced-topic" key={topic.id}>

      {editingTopicId === topic.id ? (
        <div className="topic-details" style={{ width: "100%" }}>

          <label>Topic Name</label>
          <input
            type="text"
            value={editTopicName}
            onChange={(e) => setEditTopicName(e.target.value)}
          />

          <div className="topic-options">
            <div>
              <label>Estimated Study Time</label>
              <select
                value={editTopicHours}
                onChange={(e) => setEditTopicHours(e.target.value)}
              >
                <option value="0.5">30 minutes</option>
                <option value="1">1 hour</option>
                <option value="1.5">1.5 hours</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="4">4 hours</option>
                <option value="5">5 hours</option>
              </select>
            </div>

            <div>
              <label>Topic Priority</label>
              <select
                value={editTopicPriority}
                onChange={(e) => setEditTopicPriority(e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
            <button type="button" onClick={saveEditedTopic}>
              <CheckCircle2 size={16} /> Save Changes
            </button>

            <button type="button" onClick={cancelEditingTopic}>
              Cancel
            </button>
          </div>

        </div>
      ) : (
        <>
          <div className="topic-details">
            <label className="topic-select">
              <input
                type="checkbox"
                checked={topic.selected}
                onChange={(e) =>
                  updateTopic(topic.id, "selected", e.target.checked)
                }
              />
              <span>{topic.name}</span>
            </label>

            <div className="topic-meta">
              <span>{topic.estimatedHours} study hours</span>

              <select
                aria-label={`Priority for ${topic.name}`}
                value={topic.priority}
                onChange={(e) =>
                  updateTopic(topic.id, "priority", e.target.value)
                }
              >
                <option value="High">High priority</option>
                <option value="Medium">Medium priority</option>
                <option value="Low">Low priority</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => startEditingTopic(topic)}
            aria-label={`Edit ${topic.name}`}
            title="Edit topic"
          >
            <Pencil size={17} />
          </button>

          <button
            type="button"
            onClick={() => removeTopic(topic.id)}
            aria-label={`Remove ${topic.name}`}
            title="Delete topic"
          >
            <Trash2 size={17} />
          </button>
        </>
      )}

    </div>
  ))}

  {topics.length === 0 && (
    <p className="empty-topics">No topics added yet.</p>
  )}
</div>
          <p className="topic-count">
            {topics.filter(topic => topic.selected).length} selected out of {topics.length} topics
          </p>
        </div>

        {message && (
          <div className="form-message" role="status">
            {message}
          </div>
        )}

        <button type="submit" className="save-syllabus-button">
          Save My Syllabus
          <CheckCircle2 size={19} />
        </button>

      </form>
    </div>
  );
}

export default SyllabusInput;
