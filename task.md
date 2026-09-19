# 🎙️ AI Voice Cloning System — Task Tracker

## Project Goal

Build a self-hosted AI voice cloning system where an authorized user can:

1. Upload a voice sample.
2. Process the voice sample once.
3. Store only the processed reference voice.
4. Register the processed voice as a reusable voice profile.
5. Select a registered voice later.
6. Enter text.
7. Generate speech using NeuTTS with the selected processed voice.
8. Store the generated speech and its metadata.

> **Core rule:** Raw uploaded audio is temporary. It must not be persistently stored. Voice processing happens only during voice registration, not during every generation request.

---

# 🏗️ Current Architecture

```text
                    USER
                     │
                     │ Upload voice
                     ▼
          ┌─────────────────────┐
          │ Temporary Upload    │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ Voice Processing    │
          │ Pipeline            │
          └──────────┬──────────┘
                     │
                     ▼
             Processed Voice
                     │
                     ├──────────────► Store
                     │
                     ▼
             Voice Registration
                     │
                     ▼
               Voice Profile
                     │
                     │ User selects
                     ▼
               Selected Voice
                     │
                     ▼
                  NeuTTS
                     ▲
                     │
                  User Text
                     │
                     ▼
             Generated Speech
                     │
                     ▼
             Cloned Voice Storage
```

---

# 📌 Project Rules

- [ ] Accept only authorized user's voice samples.
- [ ] Treat uploaded raw audio as temporary data.
- [ ] Do not persist the original/unprocessed upload.
- [ ] Run voice processing only once during registration.
- [ ] Store the processed reference voice.
- [ ] Allow multiple registered voices per user.
- [ ] Each voice must have a unique `voice_id`.
- [ ] Only `READY` voices can be used for generation.
- [ ] Do not preprocess the stored reference again during generation.
- [ ] Load NeuTTS once and reuse the model for requests.
- [ ] Store generated speech separately from registered voices.
- [ ] Store generation metadata in PostgreSQL.
- [ ] Validate that a selected `voice_id` belongs to the requesting user.
- [ ] Keep the system self-hosted/local where practical.
- [ ] Dockerize the complete application.
- [ ] Add tests for the major pipeline components.

---

# 1. 📁 Project Setup

## 1.1 Repository Setup

- [X] Create project repository.
- [X] Create `.gitignore`.
- [X] Create `README.md`.
- [X] Create `TASK.md`.
- [X] Create `.env.example`.
- [X] Decide Python version.
- [X] Create Python virtual environment.
- [X] Configure Git.
- [X] Create initial commit.

## 1.2 Backend Setup

- [X] Create FastAPI application.
- [X] Create application entry point.
- [X] Add configuration management.
- [X] Add environment variable loading.
- [X] Add structured logging.
- [X] Add health-check endpoint.

## 1.3 Frontend Setup

- [ ] Create Next.js application.
- [ ] Configure React + TypeScript.
- [ ] Create basic application layout.
- [ ] Create API client.
- [ ] Create voice registration page.
- [ ] Create voice selection page.
- [ ] Create text-to-speech generation page.

---

# 2. 🎤 Temporary Voice Upload

## Upload Flow

```text
User
 ↓
Upload Audio
 ↓
Temporary File
 ↓
Validation
 ↓
Voice Processing
```

Tasks:

- [X] Create voice upload endpoint.
- [X] Accept supported audio formats.
- [X] Validate file extension.
- [X] Validate MIME/content type.
- [X] Validate file size.
- [X] Validate that the uploaded file is readable audio.
- [X] Generate a temporary unique filename.
- [X] Save upload only to temporary storage.
- [X] Prevent temporary uploads from becoming persistent voice files.
- [X] Add cleanup logic for failed processing.

### Target Endpoint

```text
POST /api/voices/upload
```

---

# 3. 🔊 Voice Processing Pipeline

## Processing Flow

```text
Temporary Audio
      │
      ▼
Audio Validation
      │
      ▼
Audio Loading
      │
      ▼
Mono Conversion
      │
      ▼
Sample Rate Normalization
      │
      ▼
Silence / Unwanted Audio Handling
      │
      ▼
Audio Quality Validation
      │
      ▼
Processed Reference Voice
```

Tasks:

- [X] Define supported input audio requirements.
- [X] Implement audio loading.
- [X] Implement channel normalization.
- [X] Implement sample-rate normalization.
- [X] Implement audio format normalization.
- [X] Implement silence handling.
- [X] Validate minimum usable speech duration.
- [X] Validate audio quality.
- [X] Normalize processed audio if required.
- [X] Save processed audio in the required format.
- [X] Return processing result/status.
- [X] Add processing error handling.
- [x] Add processing tests.

### Important

Processing must happen **only during voice registration**.

Generation must use the already processed reference audio.

---

# 4. 💾 Processed Voice Storage

## Storage Structure

```text
storage/
└── users/
    └── {user_id}/
        ├── voices/
        │   ├── {voice_id}/
        │   │   └── processed.wav
        │   └── {voice_id}/
        │       └── processed.wav
        │
        └── generations/
            ├── {generation_id}.wav
            └── {generation_id}.wav
```

Tasks:

- [X] Create persistent storage directory.
- [X] Create per-user storage isolation.
- [X] Create unique `voice_id`.
- [X] Store processed voice using `voice_id`.
- [X] Prevent raw uploaded audio from being stored here.
- [X] Define file naming convention.
- [X] Define file deletion policy.
- [X] Handle missing/corrupted processed files.
- [X] Add storage utility/service.

---

# 5. 👤 Voice Registration

## Registration Flow

```text
Processed Voice
      │
      ▼
Voice Registration
      │
      ▼
Voice Profile
```

Tasks:

- [X] Create voice profile model.
- [X] Generate unique voice ID.
- [X] Store voice name.
- [X] Store processed audio path.
- [X] Store processing status.
- [X] Store model information.
- [X] Store timestamps.
- [X] Associate voice with user.
- [X] Mark voice `READY` only after processing/storage succeeds.
- [X] Delete temporary raw audio after successful registration.
- [X] Delete temporary raw audio after failed registration cleanup.
- [X] Return registered voice information.

### Voice Status

```text
UPLOADED
    │
    ▼
PROCESSING
    │
    ├──────────────► FAILED
    │
    ▼
READY
```

Only:

```text
READY
```

voices are available for generation.

---

# 6. 🗄️ PostgreSQL Database

## Users

```text
users
-----
id
name
created_at
```

Tasks:

- [ ] Create users table.
- [ ] Add primary key.
- [ ] Add timestamps.
- [ ] Add user relationship.

## Voice Profiles

```text
voice_profiles
--------------
id
user_id
name
processed_audio_path
status
model
created_at
updated_at
```

Tasks:

- [ ] Create `voice_profiles` table.
- [ ] Add foreign key to users.
- [ ] Add voice status.
- [ ] Add processed audio path.
- [ ] Add model information.
- [ ] Add timestamps.
- [ ] Add indexes where required.
- [ ] Add CRUD repository/service.

### Relationship

```text
User
 │
 ├── Voice Profile 1
 ├── Voice Profile 2
 └── Voice Profile 3
```

## Generations

```text
generations
-----------
id
user_id
voice_id
input_text
audio_path
model
generation_time
created_at
```

Tasks:

- [ ] Create `generations` table.
- [ ] Add user relationship.
- [ ] Add selected voice relationship.
- [ ] Store input text.
- [ ] Store generated audio path.
- [ ] Store model.
- [ ] Store generation time.
- [ ] Store timestamp.
- [ ] Add indexes where useful.

---

# 7. 🧠 NeuTTS Integration

## Generation Flow

```text
User Text
    +
Selected Voice
    │
    ▼
Retrieve processed.wav
    │
    ▼
NeuTTS
    │
    ▼
Generated Speech
```

Tasks:

- [ ] Study current NeuTTS repository/API.
- [ ] Select NeuTTS model variant.
- [ ] Decide local model format.
- [ ] Download/configure model weights.
- [ ] Install NeuTTS dependencies.
- [ ] Test NeuTTS independently.
- [ ] Test reference voice cloning.
- [ ] Test text-to-speech generation.
- [ ] Determine required reference audio format.
- [ ] Implement NeuTTS service wrapper.
- [ ] Load model once at application startup/lazy initialization.
- [ ] Avoid loading the model for every request.
- [ ] Add inference error handling.
- [ ] Measure generation latency.
- [ ] Measure generated audio duration.
- [ ] Test multiple registered voices.

### Critical Optimization

```text
Application Startup
        │
        ▼
   Load NeuTTS
        │
        ▼
   Keep in Memory
        │
        ├──── Request 1
        ├──── Request 2
        ├──── Request 3
        └──── Request N
```

Do **not**:

```text
Request
  ↓
Load NeuTTS
  ↓
Generate
  ↓
Unload
```

---

# 8. 🗣️ Speech Generation API

### Target Endpoint

```text
POST /api/generate
```

### Request

```json
{
  "voice_id": "voice_001",
  "text": "Hello, this is a generated speech."
}
```

### Processing

```text
Request
  │
  ▼
Validate User
  │
  ▼
Validate voice_id
  │
  ▼
Check ownership
  │
  ▼
Check status = READY
  │
  ▼
Retrieve processed reference
  │
  ▼
NeuTTS
  │
  ▼
Generated audio
  │
  ▼
Store output
  │
  ▼
Store metadata
  │
  ▼
Response
```

Tasks:

- [ ] Create generation endpoint.
- [ ] Validate input text.
- [ ] Validate `voice_id`.
- [ ] Verify voice belongs to user.
- [ ] Verify voice status is `READY`.
- [ ] Retrieve processed reference audio.
- [ ] Call NeuTTS.
- [ ] Save generated speech.
- [ ] Record generation metadata.
- [ ] Return generation response.
- [ ] Add error handling.
- [ ] Add generation tests.

---

# 9. 🎧 Generated Speech Storage

```text
storage/
└── users/
    └── {user_id}/
        └── generations/
            ├── {generation_id}.wav
            ├── {generation_id}.wav
            └── {generation_id}.wav
```

Tasks:

- [ ] Generate unique generation ID.
- [ ] Save generated WAV/audio.
- [ ] Associate output with user.
- [ ] Associate output with voice profile.
- [ ] Store output path in PostgreSQL.
- [ ] Prevent generated files from overwriting each other.
- [ ] Add retrieval endpoint if required.

---

# 10. 🌐 Voice Management APIs

### List Voices

```text
GET /api/voices
```

Tasks:

- [ ] Return user's registered voices.
- [ ] Return only required metadata.
- [ ] Do not expose internal filesystem paths unnecessarily.
- [ ] Include voice ID.
- [ ] Include voice name.
- [ ] Include status.
- [ ] Include creation date.

### Voice Details

```text
GET /api/voices/{voice_id}
```

Tasks:

- [ ] Validate ownership.
- [ ] Return voice metadata.
- [ ] Handle missing voice.
- [ ] Handle invalid voice status.

### Optional Voice Delete

```text
DELETE /api/voices/{voice_id}
```

Tasks:

- [ ] Confirm deletion behavior.
- [ ] Delete processed voice file.
- [ ] Delete database record.
- [ ] Decide what happens to related generations.
- [ ] Add authorization check.

---

# 11. 🖥️ Frontend

## Voice Registration UI

Tasks:

- [ ] Create upload component.
- [ ] Add audio file selector.
- [ ] Add upload progress.
- [ ] Show processing state.
- [ ] Show success/failure state.
- [ ] Ask user for voice name.
- [ ] Show registered voice after success.

## Registered Voices UI

```text
My Voices

┌─────────────────────────┐
│ Voice 1                 │
│ Status: READY           │
│                         │
│ [Select]                │
└─────────────────────────┘
```

Tasks:

- [ ] Fetch registered voices.
- [ ] Display voice cards/list.
- [ ] Show status.
- [ ] Allow voice selection.
- [ ] Prevent selection of failed voices.

## Text-to-Speech UI

```text
Selected Voice: Voice 1

┌─────────────────────────────┐
│ Enter text...               │
│                             │
│                             │
└─────────────────────────────┘

[ Generate Speech ]
```

Tasks:

- [ ] Display selected voice.
- [ ] Add text input.
- [ ] Add generation button.
- [ ] Show generation progress.
- [ ] Handle errors.
- [ ] Provide audio player.
- [ ] Show generated audio information.

---

# 12. 🔐 Security & Authorization

Tasks:

- [ ] Define authentication approach.
- [ ] Verify user identity on voice APIs.
- [ ] Verify voice ownership before generation.
- [ ] Prevent user A from accessing user B's voice.
- [ ] Prevent path traversal.
- [ ] Sanitize uploaded filenames.
- [ ] Use generated IDs instead of user-controlled filenames.
- [ ] Validate audio file content.
- [ ] Validate text input length.
- [ ] Add request limits.
- [ ] Restrict access to stored audio.
- [ ] Ensure temporary raw files are deleted.
- [ ] Avoid logging sensitive audio data or full filesystem secrets.

---

# 13. 🧪 Testing

## Unit Tests

- [ ] Audio validation tests.
- [ ] Audio processing tests.
- [ ] Storage service tests.
- [ ] Voice profile tests.
- [ ] Voice repository tests.
- [ ] Generation service tests.
- [ ] NeuTTS service tests with mocked inference where appropriate.

## API Tests

- [ ] Upload valid audio.
- [ ] Reject invalid audio.
- [ ] Register processed voice.
- [ ] List voices.
- [ ] Retrieve voice.
- [ ] Reject non-owned voice.
- [ ] Generate speech.
- [ ] Reject non-ready voice.
- [ ] Reject invalid text.
- [ ] Store generation metadata.

## Integration Tests

- [ ] Upload → process → register.
- [ ] Register → select → generate.
- [ ] Generate → store output → save metadata.
- [ ] Multiple voices for one user.
- [ ] Temporary raw file cleanup.
- [ ] End-to-end generation.

---

# 14. 📊 Evaluation & Benchmarking

The RD requires measurable voice similarity, speech quality, and inference performance.

Tasks:

- [ ] Define voice similarity metric.
- [ ] Decide whether ECAPA-TDNN will be used for evaluation.
- [ ] Compare registered/reference voice with generated speech.
- [ ] Define speech quality metrics.
- [ ] Measure generation latency.
- [ ] Measure real-time factor (RTF) if applicable.
- [ ] Measure CPU/GPU memory usage.
- [ ] Test different text lengths.
- [ ] Test different reference voice samples.
- [ ] Record benchmark results.

### Evaluation Architecture

```text
Reference Voice
      │
      ├──────────────┐
      │              │
      ▼              ▼
  NeuTTS         Similarity
      │           Evaluator
      ▼              ▲
Generated Speech ────┘
```

> ECAPA-TDNN is optional for evaluation. It is not required in the generation path when NeuTTS directly uses the processed reference audio.

---

# 15. 🐳 Dockerization

Tasks:

- [ ] Create backend Dockerfile.
- [ ] Create frontend Dockerfile.
- [ ] Create Docker Compose configuration.
- [ ] Configure PostgreSQL container.
- [ ] Configure persistent storage volume.
- [ ] Configure environment variables.
- [ ] Configure GPU support if required.
- [ ] Test complete application using Docker.
- [ ] Document Docker setup.

Target structure:

```text
Docker Compose
│
├── Backend
│    └── FastAPI + NeuTTS
│
├── Frontend
│    └── Next.js
│
├── PostgreSQL
│
└── Persistent Storage
```

---

# 16. 📝 Documentation

Tasks:

- [ ] Write project overview.
- [ ] Document architecture.
- [ ] Document voice registration flow.
- [ ] Document generation flow.
- [ ] Document API endpoints.
- [ ] Document environment variables.
- [ ] Document database schema.
- [ ] Document storage structure.
- [ ] Document NeuTTS setup.
- [ ] Document GPU requirements.
- [ ] Document Docker setup.
- [ ] Document testing.
- [ ] Document benchmarking results.
- [ ] Document limitations.
- [ ] Add example API requests/responses.

---

# 17. 🚀 Final End-to-End Checklist

## Voice Registration

- [ ] User uploads voice.
- [ ] Raw audio is stored temporarily.
- [ ] Audio is validated.
- [ ] Audio is processed.
- [ ] Processed reference is stored.
- [ ] Voice profile is created.
- [ ] Raw temporary audio is deleted.
- [ ] Voice status becomes `READY`.

## Voice Generation

- [ ] User selects registered voice.
- [ ] Backend validates ownership.
- [ ] Backend validates `READY` status.
- [ ] Backend retrieves stored processed reference.
- [ ] Backend does NOT run the processing pipeline again.
- [ ] NeuTTS receives processed reference + text.
- [ ] Speech is generated.
- [ ] Generated speech is stored.
- [ ] Generation metadata is stored.
- [ ] Audio is returned to frontend.

---

# 📈 Progress Tracker

| Phase | Status | Progress |
|---|---|---:|
| Project Setup | ⬜ Not Started | 0% |
| Temporary Upload | ⬜ Not Started | 0% |
| Voice Processing | ⬜ Not Started | 0% |
| Processed Voice Storage | ⬜ Not Started | 0% |
| Voice Registration | ⬜ Not Started | 0% |
| PostgreSQL | ⬜ Not Started | 0% |
| NeuTTS Integration | ⬜ Not Started | 0% |
| Generation API | ⬜ Not Started | 0% |
| Generated Speech Storage | ⬜ Not Started | 0% |
| Voice Management APIs | ⬜ Not Started | 0% |
| Frontend | ⬜ Not Started | 0% |
| Security | ⬜ Not Started | 0% |
| Testing | ⬜ Not Started | 0% |
| Evaluation | ⬜ Not Started | 0% |
| Docker | ⬜ Not Started | 0% |
| Documentation | ⬜ Not Started | 0% |

---

# 🧭 Recommended Implementation Order

Follow this order to avoid architectural rework:

```text
1. Project Setup
       ↓
2. Audio Processing
       ↓
3. Temporary Upload
       ↓
4. Processed Voice Storage
       ↓
5. PostgreSQL + Voice Profile
       ↓
6. Voice Registration API
       ↓
7. NeuTTS Standalone Test
       ↓
8. NeuTTS Service Integration
       ↓
9. Generation API
       ↓
10. Generated Speech Storage
       ↓
11. Voice Management APIs
       ↓
12. Frontend
       ↓
13. Security
       ↓
14. Testing
       ↓
15. Evaluation
       ↓
16. Docker
       ↓
17. Documentation
```

---

# 🎯 Current Milestone

**Milestone 1 — Foundation**

### Immediate next tasks

- [ ] Finalize project folder structure.
- [ ] Set Python version.
- [ ] Create FastAPI backend.
- [ ] Create configuration system.
- [ ] Create PostgreSQL connection.
- [ ] Create storage directories.
- [ ] Create basic health endpoint.
- [ ] Create initial database models.

### Definition of Done

The foundation is complete when:

```text
FastAPI
   │
   ├── PostgreSQL connected
   │
   ├── Storage configured
   │
   ├── Configuration loaded
   │
   └── Health endpoint working
```

Then move to **Milestone 2 — Voice Processing & Registration**.
