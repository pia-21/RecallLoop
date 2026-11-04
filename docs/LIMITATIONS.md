 RecallLoop - System Limitations

 1. Introduction

RecallLoop is designed to help students prepare for examinations through structured study planning, active recall, and AI-generated feedback.

Although the system provides useful learning support, it has some limitations that should be considered.

 2. Current Limitations

 2.1 PDF Processing

 The system uses pypdf to extract text from PDF documents.
 Scanned PDFs and image-only documents may not produce readable text.
 Optical Character Recognition (OCR) is not currently included.

 2.2 AI Feedback Accuracy

 AI-generated feedback depends on the quality and completeness of the reference material provided.
 The AI may occasionally miss important concepts or incorrectly classify a student's answer.
 Students should use AI feedback as a learning guide rather than a replacement for their study materials.

 2.3 Reference Text Length

 Long reference documents may be limited by the amount of text processed during evaluation.
 The proposed text-processing limit of approximately 30,000 characters should be confirmed against the current backend implementation before being treated as a verified system limit.

 2.4 Internet and API Dependency

 AI evaluation requires a working backend connection.
 The system depends on a valid Meta API configuration and internet connectivity when communicating with the AI model.
 AI-related features may become unavailable if the API service is unreachable.

 2.5 Data Persistence and Deployment

 The backend uses SQLite for data storage.
 SQLite data stored on temporary or serverless deployment storage may not persist reliably across restarts or redeployments.
 Production deployment may require a managed database for reliable long-term storage.

 3. Future Improvements

The following improvements may be considered in future versions:

- Add OCR support for scanned PDF documents.
- Improve PDF processing for large documents.
- Introduce a managed database for reliable data persistence.
- Improve AI feedback validation and accuracy.
- Expand automated testing for backend and frontend features.
- Improve error handling when the AI service is unavailable.

 4. Conclusion

RecallLoop provides a foundation for AI-assisted examination preparation. Addressing these limitations in future releases will help improve reliability, accuracy, accessibility, and the overall student experience.
