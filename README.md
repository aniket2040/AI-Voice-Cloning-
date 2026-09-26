<div align="center">

  <img src="docs/banner.png" alt="AI Voice Cloning System Banner" width="100%"/>

  <h1>🎙️ AI Voice Cloning System</h1>

  <p>
    AI-Powered Voice Cloning & Speech Generation using FastAPI, NeuTTS, PostgreSQL & React
  </p>

  <p>
    <img src="https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white" alt="Python 3.12"/>
    <img src="https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi&logoColor=white" alt="FastAPI"/>
    <img src="https://img.shields.io/badge/PyTorch-2.14-EE4C2C?logo=pytorch&logoColor=white" alt="PyTorch"/>
    <img src="https://img.shields.io/badge/NeuTTS-1.4.1-6C63FF" alt="NeuTTS"/>
    <img src="https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL"/>
    <img src="https://img.shields.io/badge/React-Latest-61DAFB?logo=react&logoColor=black" alt="React"/>
    <img src="https://img.shields.io/badge/TypeScript-Latest-3178C6?logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker"/>
    <img src="https://img.shields.io/badge/License-MIT-orange" alt="License"/>
  </p>

</div>

---

## 📌 Overview

The **AI Voice Cloning System** is a self-hosted AI application that allows authorized users to register a voice and generate natural-sounding speech using that voice.

The system provides an end-to-end voice cloning pipeline:

```text
Voice Upload
     ↓
Audio Validation
     ↓
Audio Processing
     ↓
Voice Reference Encoding
     ↓
Voice Profile
     ↓
Text Input
     ↓
NeuTTS
     ↓
Generated Speech

```


# 🎙️ AI Voice Cloning System
A self-hosted AI Voice Cloning System that allows authorized users to register a voice, create a reusable voice profile, and generate speech using that voice.

The system is built around **FastAPI**, **NeuTTS**, **PostgreSQL**, **React/Vite**, **Docker**, and **persistent file storage**.

The backend processes uploaded audio, validates and normalizes it, stores only the processed voice reference, and uses **NeuTTS** to generate speech from user-provided text.

---

## 📌 Project Overview

The AI Voice Cloning System provides an end-to-end pipeline for:

- User registration and authentication
- Secure voice upload
- Audio validation and preprocessing
- Voice profile registration
- Reusable voice reference encoding
- AI-based speech generation
- Generated audio storage
- Voice profile management
- Ownership-based authorization
- REST API access
- Web-based frontend
- Dockerized deployment
- PostgreSQL metadata persistence

The system is designed so that raw uploaded audio is **not permanently stored**. 

Instead:

```text
Raw Voice Upload
      ↓
Audio Validation
      ↓
Audio Processing
      ↓
Processed Voice
      ↓
Voice Reference Encoding
      ↓
Voice Profile
      ↓
NeuTTS
      ↓
Generated Speech
```


## 🏗️ Architecture

### High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Browser        │
                         │  React + Vite       │
                         └──────────┬──────────┘
                                    │
                                    │ HTTP / REST API
                                    ▼
                         ┌─────────────────────┐
                         │      FastAPI        │
                         │      Backend        │
                         └──────────┬──────────┘
                                    │
             ┌───────────────────┼───────────────────┐
             │                   │                   │
             ▼                   ▼                   ▼
     ┌──────────────┐    ┌───────────────┐   ┌──────────────┐
     │ PostgreSQL   │    │   NeuTTS      │   │ File Storage │
     │              │    │ AI Inference  │   │              │
     │ Users        │    │               │   │ Voice files  │
     │ Voices       │    │ Voice cloning │   │ Generations  │
     │ Generations  │    │ TTS           │   │ Reference    │
     └──────────────┘    └───────────────┘   └──────────────┘
```



## 🧩 Technology Stack

### Backend
- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy
- Async PostgreSQL
- Alembic
- Pydantic
- PyJWT
- pwdlib + Argon2
- Librosa
- SoundFile
- FFmpeg

### AI / Voice
- NeuTTS
- NeuCodec
- PyTorch
- Torchaudio
- llama-cpp-python
- GGUF
- Hugging Face

### Frontend
- React
- TypeScript
- Vite
- Nginx

### Database
- PostgreSQL 17

### Infrastructure
- Docker
- Docker Compose
- Docker volumes


## 📁 Project Structure

```text
AI_Voice_Cloning/
│
├── Backend/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │
│   │   ├── core/
│   │   │
│   │   ├── db/
│   │   │
│   │   ├── models/
│   │   │
│   │   ├── repositories/
│   │   │
│   │   ├── schemas/
│   │   │
│   │   ├── security/
│   │   │
│   │   ├── services/
│   │   │
│   │   └── main.py
│   │
│   ├── tests/
│   │
│   ├── alembic/
│   │
│   ├── storage/
│   │
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── ...
│
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```



## 🔐 Authentication

The system uses JWT-based authentication.

### Authentication Flow

```text
Register
      ↓
Password Hashing using Argon2
      ↓
User stored in PostgreSQL
      ↓
Login
      ↓
Credentials verified
      ↓
JWT Access Token
      ↓
Bearer Token
      ↓
Protected API endpoints
```

Passwords are never stored in plain text. Password hashing is performed using:
- **pwdlib + Argon2**

JWT tokens contain:
- `sub` → user ID
- `iat` → issued time
- `exp` → expiration time

The default JWT expiration is **30 minutes**.


## 🎤 Voice Registration Flow

Voice registration happens in several stages.

```text
User
 │
 │ Upload audio
 ▼
Temporary Upload
 │
 ▼
Extension Validation
 │
 ▼
MIME Validation
 │
 ▼
Audio Decoding
 │
 ▼
Audio Processing
 │
 ├── Convert to Mono
 ├── Resample to 16 kHz
 ├── Trim Silence
 ├── Duration Validation
 ├── Signal Quality Validation
 └── Normalize Audio
 │
 ▼
Processed WAV
 │
 ▼
NeuTTS Reference Encoding
 │
 ▼
Reference Codes
 │
 ▼
Voice Profile
 │
 ▼
READY
```



## 🎧 Audio Processing

Uploaded audio is not trusted only because its filename says `.wav` or because its MIME type says `audio/wav`. The backend performs actual decoding and audio validation.

### Processing Pipeline

```text
Input Audio
      ↓
Decode
      ↓
Convert to Mono
      ↓
Resample
      ↓
Trim Silence
      ↓
Validate Duration
      ↓
Validate Signal Quality
      ↓
Normalize
      ↓
Export PCM16 WAV
```

### Audio Requirements

The processed reference audio uses:

- **Sample Rate:** 16,000 Hz
- **Channels:** Mono
- **Format:** WAV
- **Encoding:** PCM16
- **Duration:** 3–15 seconds

The system also rejects:

- Corrupt audio
- Unsupported formats
- Invalid MIME types
- Empty audio
- Silent audio
- Extremely low-quality signals
- Audio outside the supported duration range
- Renamed non-audio files



## 🔊 NeuTTS Integration

The project uses NeuTTS for voice cloning and speech generation. NeuTTS is initialized once by the backend instead of loading the model for every request. This avoids repeatedly paying the model-loading cost.

### Registration

During voice registration:

```text
Processed Reference Audio
          +
    Reference Text
          ↓
       NeuTTS
          ↓
   Reference Encoding
          ↓
 reference_codes.pt
```

The encoded reference is stored and reused.

### Generation

During generation:

```text
    User Text
        +
  Voice Profile
        ↓
Stored Reference Codes
        ↓
      NeuTTS
        ↓
  Generated Audio
        ↓
 generation_id.wav
```

The reference audio does not need to be encoded again for every generation request.

## 🧠 Voice Profile Lifecycle

A voice profile has the following lifecycle:

```text
UPLOADED
    ↓
PROCESSING
    ↓
READY
```

If processing fails:

```text
PROCESSING
    ↓
FAILED
```

Only voices with a **READY** status are available for speech generation.

## 🗂️ Storage Architecture

Audio binaries are stored in the filesystem rather than PostgreSQL. PostgreSQL stores metadata and file paths.

```text
storage/
└── users/
    └── {user_id}/
        │
        ├── voices/
        │   ├── {voice_id}/
        │   │   ├── processed.wav
        │   │   └── reference_codes.pt
        │   │
        │   └── {voice_id}/
        │       ├── processed.wav
        │       └── reference_codes.pt
        │
        └── generations/
            ├── {generation_id}.wav
            ├── {generation_id}.wav
            └── ...
```

### Important

Raw uploaded audio is temporary.

```text
Raw Upload
    ↓
Temporary Storage
    ↓
Processing
    ↓
Processed Voice
    ↓
Raw Upload Deleted
```

The database does not store audio using PostgreSQL `BYTEA`. Instead, database records store paths such as:

- `processed_audio_path`
- `reference_codes_path`
- `audio_path`


## 🗄️ Database Schema

PostgreSQL is used for application metadata.

### Users

```text
users
--------------------------------
id
name
email
password_hash
created_at
```

### Voice Profiles

```text
voice_profiles
--------------------------------
id
user_id
name
processed_audio_path
reference_codes_path
reference_text
status
model
created_at
updated_at
```

### Generations

```text
generations
--------------------------------
id
user_id
voice_id
input_text
audio_path
model
created_at
generation_time
```

### Relationships

```text
    User
     │
     ├───────────────┐
     │               │
     ▼               ▼
Voice Profile   Generation
     │               │
     └───────┬───────┘
             │
             ▼
           Audio
```

A user can have multiple voice profiles.
A voice profile can have multiple generated audio files.

## 🔒 Voice Ownership & Authorization

Every voice belongs to a specific user. For example:

```text
User A
 ├── Voice A1
 └── Voice A2

User B
 ├── Voice B1
 └── Voice B2
```

**User A cannot:**
- Access User B's voice
- Generate speech using User B's voice
- Delete User B's voice
- Access User B's generated audio

Ownership checks are performed using the authenticated user's ID.


## 🛡️ Path Security

File paths are never blindly trusted. The backend validates that resolved paths remain inside the configured storage directory. Conceptually:

```text
Requested Path
      ↓
Resolve Path
      ↓
Check Against Storage Root
      ↓
Inside Storage?
   /        \
 Yes         No
  ↓           ↓
Allow       Reject
```

This protects against path traversal attacks such as:
`../../secret.wav`
and absolute paths outside the storage directory.

## 🌐 API Endpoints

The backend exposes REST APIs.

- **Base URL:** `http://localhost:8000`
- **Swagger documentation:** `http://localhost:8000/docs`

### Health Check

**Request**
```http
GET /health
```

**Response**
```json
{
  "status": "healthy"
}
```

## 👤 Authentication APIs

### Register

**Request**
```http
POST /api/auth/register
```
```json
{
  "name": "Aniket",
  "email": "aniket@example.com",
  "password": "StrongPassword123"
}
```

**Response**
```json
{
  "id": "USER_UUID",
  "name": "Aniket",
  "email": "aniket@example.com",
  "created_at": "2026-09-20T10:00:00"
}
```

The password is never returned.


### Login

**Request**
```http
POST /api/auth/login
```
```json
{
  "email": "aniket@example.com",
  "password": "StrongPassword123"
}
```

**Response**
```json
{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer"
}
```

Use the returned token in protected requests:
```http
Authorization: Bearer JWT_TOKEN
```

### Current User

**Request**
```http
GET /api/auth/me
```

**Header**
```http
Authorization: Bearer JWT_TOKEN
```

**Response**
```json
{
  "id": "USER_UUID",
  "name": "Aniket",
  "email": "aniket@example.com",
  "created_at": "2026-09-20T10:00:00"
}
```

## 🎤 Voice APIs

All voice endpoints require authentication.

### Upload Voice

**Request**
```http
POST /api/voices/upload
```
- **Content-Type:** `multipart/form-data`
- **Authorization:** `Bearer JWT_TOKEN`

**Form:**
```text
file=<audio-file>
```

**Example using cURL:**
```bash
curl -X POST "http://localhost:8000/api/voices/upload" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "file=@sample.wav"
```

The uploaded file is stored temporarily for processing.



### 📝 Register Voice

**Request**
```http
POST /api/voices/register
```

**Multipart Fields:**
- `voice_name`
- `temporary_file`
- `reference_text`

**Example using cURL:**
```bash
curl -X POST "http://localhost:8000/api/voices/register" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -F "voice_name=My Voice" \
  -F "temporary_file=/temporary/processed-file.wav" \
  -F "reference_text=This is my reference voice sample."
```

The backend processes the voice and creates a reusable voice profile.

### 📋 List Voices

**Request**
```http
GET /api/voices
```

**Header**
```http
Authorization: Bearer JWT_TOKEN
```

Returns only voices owned by the authenticated user.

### 🔎 Get Voice

**Request**
```http
GET /api/voices/{voice_id}
```

Returns information about a specific voice profile.

### 🗑️ Delete Voice

**Request**
```http
DELETE /api/voices/{voice_id}
```

Deletes the user's voice profile and associated stored files.

### 🗣️ Generate Speech

**Request**
```http
POST /api/voices/{voice_id}/generate
```

**Header**
```http
Authorization: Bearer JWT_TOKEN
```

**Body**
```json
{
  "text": "Hello, this is a generated speech sample."
}
```

**Response**
```json
{
  "generation_id": "GENERATION_UUID",
  "voice_id": "VOICE_UUID",
  "text": "Hello, this is a generated speech sample.",
  "audio_path": "...",
  "generation_time": 5.01
}
```

The exact response structure can be inspected through: `/api/docs`

### 🔊 Get Generated Audio

**Request**
```http
GET /api/voices/{voice_id}/generations/{generation_id}/audio
```

**Requires:**
```http
Authorization: Bearer JWT_TOKEN
```

The API returns the generated WAV audio.

## ⚙️ Environment Variables

The backend requires environment variables for database configuration, JWT authentication, and Hugging Face model access.

**Example root `.env`:**
```env
JWT_SECRET_KEY=your_long_random_secret
HF_TOKEN=hf_your_huggingface_token
```

### JWT_SECRET_KEY

Secret key used to sign JWT access tokens.

**Example:**
```env
JWT_SECRET_KEY=your_long_random_secret
```

Use a long randomly generated value in production. **Never commit the real secret to Git.**

### HF_TOKEN

Hugging Face access token used to download required gated/public model assets.

```env
HF_TOKEN=hf_your_token
```

The token must have the required access permissions for the models used by NeuTTS.

## 🐳 Docker Setup

The entire application can be run using Docker Compose.

### Architecture

```text
┌──────────────────────────────┐
│ Browser                      │
│ http://localhost:3000        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Frontend Container           │
│ React + Vite + Nginx         │
│ Port 3000 → 80               │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Backend Container            │
│ FastAPI + NeuTTS             │
│ Port 8000                    │
└──────────────┬───────────────┘
               │
        ┌──────┴───────┐
        ▼              ▼
┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │ Docker       │
│ Port 5432    │  │ Volumes      │
└──────────────┘  └──────────────┘
```

### Prerequisites

Install:
- Docker Desktop
- Git

Verify:
```bash
docker --version
docker compose version
git --version
```

### 🔑 Configure Environment

Create a `.env` file in the project root:

```env
JWT_SECRET_KEY=your_long_random_secret
HF_TOKEN=hf_your_token
```

Do not commit this file.

### 🚀 Start the Application

From the project root:

```bash
docker compose up -d
```

Check running containers:

```bash
docker compose ps
```

**Expected services:**
- `ai-voice-cloning-postgres`
- `ai-voice-cloning-backend`
- `ai-voice-cloning-frontend`

### 🗄️ Run Database Migrations

After the PostgreSQL container is ready:

```bash
docker compose exec backend alembic upgrade head
```

Check the current migration:

```bash
docker compose exec backend alembic current
```

The database should report the latest Alembic revision.

### 🌐 Access the Application

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend:** [http://localhost:8000](http://localhost:8000)
- **Swagger API documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **OpenAPI:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- **Health:** [http://localhost:8000/health](http://localhost:8000/health)

### 🛑 Stop the Application

```bash
docker compose down
```

The Docker volumes remain intact. To remove containers and volumes:

```bash
docker compose down -v
```

> **Warning:** Removing volumes deletes persistent PostgreSQL data and stored voice/generation files.
> 


## 💾 Docker Volumes

The application uses persistent Docker volumes.

### PostgreSQL
`postgres_data`

Stores PostgreSQL database data.

### Voice Storage
`voice_storage`

Stores:
- `processed.wav`
- `reference_codes.pt`
- generated WAV files

### Hugging Face Cache
`huggingface_cache`

Stores downloaded model files so the models do not need to be downloaded again every time the backend container restarts.

## 🧪 Testing

The backend uses `pytest`. 

Run the complete test suite locally:
```bash
cd Backend
pytest -q
```

The project includes tests for:
- Audio processing
- Audio validation
- Upload validation
- MIME validation
- Corrupt audio
- Renamed non-audio files
- Stereo audio
- Sample-rate conversion
- Voice registration
- Voice generation
- Authentication
- JWT
- Password hashing
- User ownership
- Voice ownership
- Generated audio access
- Path traversal
- Filename security
- PostgreSQL
- API integration

### 🔐 Security Tests

Security-specific tests cover:

**Authentication**
- Registration
- Login
- Invalid credentials
- JWT validation
- Protected endpoints

**Authorization**
- User A → own voice → allowed
- User A → User B voice → rejected

**Path Traversal**
Examples:
```text
../../secret.wav
..\..\secret.wav
/tmp/secret.wav
C:\secret.wav
```
These paths are prevented from escaping the configured storage directory.

**File Validation**
The system does not trust:
- `filename`
- `extension`
- `MIME type`

alone. Actual audio decoding is performed before accepting an uploaded file.

## 📊 Benchmarking

A CPU benchmark was performed using NeuTTS.

**Environment:**
- **Device:** CPU
- **Model:** `neuphonic/neutts-nano-q4-gguf`

**Measured values:**
- **Model Load Time:** 18.89 seconds
- **Reference Encode:** 15.33 seconds
- **Inference Time:** 5.01 seconds
- **Audio Duration:** 6.98 seconds
- **RTF:** 0.717

### Real-Time Factor

RTF is calculated as:
`RTF = Inference Time / Generated Audio Duration`

For the benchmark:
```text
RTF ≈ 5.01 / 6.98
    ≈ 0.717
```

This means the measured inference took approximately 0.717 seconds to generate one second of audio under that benchmark configuration.

> **Important:** The model loading and reference encoding costs should not be treated as per-request generation costs in the final architecture. The backend loads the model once and stores reusable reference encodings for registered voices.

Actual performance depends on:
- CPU/GPU
- Model variant
- Audio length
- Text length
- Quantization
- System memory
- PyTorch configuration

## 🖥️ GPU Requirements

The system is designed to support local GPU inference. NeuTTS uses PyTorch for inference. For production deployment, a CUDA-compatible NVIDIA GPU is recommended for improved inference performance.

The exact GPU requirement depends on:
- NeuTTS model variant
- Quantization
- Available VRAM
- Batch size
- Input/output length

CPU inference is possible but slower. The benchmark above was performed on CPU.

## ⚡ Performance Architecture

The backend avoids unnecessary repeated work.

### Model Loading

Instead of:
```text
Request
   ↓
Load NeuTTS
   ↓
Generate
   ↓
Unload
```

The application uses:
```text
Backend Startup
      ↓
Load NeuTTS Once
      ↓
Keep Model Loaded
      ↓
   Requests
      ↓
Generate Speech
```

### Reference Encoding

Instead of encoding the reference voice for every generation:
```text
Voice Registration
      ↓
Encode Reference
      ↓
Store Reference Codes
```

Then:
```text
Generation Request
      ↓
Load Stored Reference Codes
      ↓
    NeuTTS
      ↓
Generated Speech
```

This reduces repeated processing.

## 🔄 Complete End-to-End Flow

```text
                    USER
                     │
                     ▼
              ┌─────────────┐
              │   Register  │
              │    / Login  │
              └──────┬──────┘
                     │
                     ▼
                JWT Token
                     │
                     ▼
             ┌──────────────┐
             │ Upload Voice │
             └──────┬───────┘
                    │
                    ▼
             Temporary Audio
                    │
                    ▼
          ┌────────────────────┐
          │ Audio Validation   │
          └─────────┬──────────┘
                    │
                    ▼
          ┌────────────────────┐
          │ Audio Processing   │
          │                    │
          │ Mono               │
          │ 16 kHz             │
          │ Silence Trim       │
          │ Quality Check      │
          │ Normalize          │
          └─────────┬──────────┘
                    │
                    ▼
            Processed Voice
                    │
                    ▼
              NeuTTS Encode
                    │
                    ▼
             Voice Profile
                    │
                    ▼
                  READY
                    │
                    │
             User enters text
                    │
                    ▼
              Generate API
                    │
                    ▼
             Stored Reference
                    │
                    ▼
                 NeuTTS
                    │
                    ▼
            Generated Speech
                    │
                    ▼
             WAV File Storage
                    │
                    ▼
               Audio API
                    │
                    ▼
                  USER
```

## 🧪 Example API Workflow

### 1. Register

**Request**
```http
POST /api/auth/register
```
```json
{
  "name": "Aniket",
  "email": "aniket@example.com",
  "password": "StrongPassword123"
}
```

### 2. Login

**Request**
```http
POST /api/auth/login
```
```json
{
  "email": "aniket@example.com",
  "password": "StrongPassword123"
}
```

**Receive:**
```json
{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer"
}
```

### 3. Upload Voice

**Request**
```http
POST /api/voices/upload
```
**Header:**
```http
Authorization: Bearer JWT_TOKEN
```
**Upload:** `sample.wav`

### 4. Register Voice

**Provide:**
- `voice_name`
- `temporary_file`
- `reference_text`

The backend creates a voice profile.

### 5. List Voices

**Request**
```http
GET /api/voices
```
**Header:**
```http
Authorization: Bearer JWT_TOKEN
```

### 6. Generate Speech

**Request**
```http
POST /api/voices/{voice_id}/generate
```
```json
{
  "text": "Welcome to the AI Voice Cloning System."
}
```

### 7. Retrieve Audio

**Request**
```http
GET /api/voices/{voice_id}/generations/{generation_id}/audio
```
**Header:**
```http
Authorization: Bearer JWT_TOKEN
```

The API returns the generated WAV file.



## 📋 Limitations

The current implementation has several limitations.

### 1. CPU Performance
CPU inference is significantly slower than GPU inference. For production workloads, GPU inference is recommended.

### 2. Voice Quality Depends on Reference Audio
Poor reference recordings can result in lower-quality cloning. Recommended reference audio should be:
- Clear
- Continuous
- Free from heavy background noise
- Spoken by a single speaker
- Within the supported duration

### 3. Reference Text Is Required
NeuTTS requires the reference audio and corresponding reference text during voice encoding. The text should accurately represent the spoken reference audio.

### 4. Local Storage
Audio files are currently stored using filesystem/Docker volume storage. A production deployment may require object storage such as:
- S3-compatible storage

for distributed deployments.

### 5. Single Backend Instance Architecture
The current Docker Compose deployment is designed for a local/self-hosted environment. Horizontal scaling would require additional considerations for:
- Shared audio storage
- GPU scheduling
- Model loading
- Distributed workers
- Job queues
- Concurrent inference

### 6. No Background Job Queue
Speech generation currently happens through the backend request flow. For large production workloads, a queue-based architecture could be introduced:

```text
API
 ↓
Job Queue
 ↓
GPU Worker
 ↓
Generated Audio
```

### 7. No Advanced Voice Quality Evaluation
The current system validates audio signal quality during preprocessing but does not provide a complete automated voice similarity evaluation pipeline. Future work could include:
- Speaker embedding similarity
- MOS estimation
- Voice similarity scoring
- Automated audio quality metrics

## 🔮 Future Improvements

Possible future improvements include:
- GPU-optimized Docker deployment
- Background generation workers
- Redis/Celery or another job queue
- S3-compatible object storage
- Rate limiting
- Refresh tokens
- Email verification
- Password reset
- Advanced voice similarity metrics
- Automatic audio quality scoring
- Multi-language voice generation improvements
- Streaming audio generation
- Generation history UI
- Voice profile preview
- Admin monitoring
- Production observability
- Prometheus/Grafana metrics

## 🔒 Security Considerations

The project treats uploaded audio and user-provided data as untrusted input. Security measures include:
- JWT authentication
- Argon2 password hashing
- User ownership checks
- Protected API endpoints
- File extension validation
- MIME validation
- Actual audio decoding
- Audio quality validation
- Path traversal protection
- Safe generated filenames
- No raw password storage
- No audio binary stored in PostgreSQL
- No permanent storage of raw uploads
- Environment variables for secrets



## 🐳 Docker Images

The project uses separate containers.

### Frontend
```text
  React/Vite
      ↓
Production Build
      ↓
    Nginx
```

### Backend
```text
 Python 3.12
      ↓
   FastAPI
      ↓
   NeuTTS
```

### Database
- PostgreSQL 17

## 📦 Backend Dependencies

Important backend packages include:
- `fastapi`
- `uvicorn`
- `pydantic-settings`
- `sqlalchemy`
- `asyncpg`
- `alembic`
- `python-multipart`
- `librosa`
- `soundfile`
- `neutts`
- `neucodec`
- `torch`
- `torchaudio`
- `torchtune`
- `torchao`
- `llama-cpp-python`
- `gguf`
- `pwdlib[argon2]`
- `PyJWT`
- `email-validator`

FFmpeg is installed as a system dependency inside the backend Docker image.

## 🛠️ Local Backend Development

Create a virtual environment:
```bash
python -m venv .venv
```

Activate it on Windows:
```cmd
.venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the backend:
```bash
uvicorn app.main:app --reload
```


## 💻 Frontend Development

Install dependencies:
```bash
npm install
```

Run development server:
```bash
npm run dev
```

**Frontend:** [http://localhost:3000](http://localhost:3000)

The frontend communicates with `http://127.0.0.1:8000` during local development.

## 🧹 Useful Docker Commands

Build backend:
```bash
docker build -t ai-voice-cloning-backend ./Backend
```

Build frontend:
```bash
docker build -t ai-voice-cloning-frontend ./frontend
```

Start all services:
```bash
docker compose up -d
```

View logs:
```bash
docker compose logs -f
```

Backend logs:
```bash
docker compose logs -f backend
```

PostgreSQL logs:
```bash
docker compose logs -f postgres
```

Stop services:
```bash
docker compose down
```

Restart:
```bash
docker compose restart
```


## 📈 Project Status

The major implementation phases are complete.

- ✅ FastAPI Backend
- ✅ Configuration
- ✅ Health Check
- ✅ Audio Upload
- ✅ Audio Processing
- ✅ Audio Validation
- ✅ Voice Registration
- ✅ NeuTTS Integration
- ✅ Reference Encoding
- ✅ Speech Generation
- ✅ Generation Storage
- ✅ PostgreSQL
- ✅ SQLAlchemy
- ✅ Alembic
- ✅ JWT Authentication
- ✅ Password Hashing
- ✅ User Ownership
- ✅ Voice Management
- ✅ Path Security
- ✅ Filename Security
- ✅ Audio Security
- ✅ React Frontend
- ✅ Backend/Frontend Integration
- ✅ Docker Backend
- ✅ Docker Frontend
- ✅ Docker Compose
- ✅ Persistent Docker Volumes
- ✅ API Documentation
- ✅ Automated Tests
- ✅ Benchmarking

## 🧪 Test Result

The project reached:
**148 passed**

after the audio security phase, with the test suite covering the backend, APIs, authentication, authorization, audio processing, storage, and security functionality. Later development also added authentication, voice management, frontend integration, and Docker deployment.

## 📊 Benchmark Summary

| Metric | Result |
|---|---|
| Model Load Time | 18.89 s |
| Reference Encoding | 15.33 s |
| Inference Time | 5.01 s |
| Generated Audio | 6.98 s |
| Real-Time Factor | 0.717 |
| Benchmark Device | CPU |
| Model | neuphonic/neutts-nano-q4-gguf |





## 🎯 Design Principles

The project follows several important design principles.

1. **Uploaded Content Is Untrusted**
   Audio files are validated instead of trusting filenames or MIME types.
2. **Authentication Before Resource Access**
   Protected resources are accessed through the authenticated user's identity.
3. **User Ownership**
   Users can only access their own voice profiles and generated audio.
4. **Database for Metadata**
   PostgreSQL stores metadata rather than large binary audio files.
5. **Filesystem for Audio**
   Processed voices and generated audio are stored as files.
6. **Reuse Expensive Computation**
   NeuTTS is loaded once and reference encodings are reused.
7. **Persistent Infrastructure**
   Docker volumes preserve database, audio, and model-cache data across container restarts.

## 📜 License

Add the project's chosen license here. 

**Example:**
> MIT License

## 👨‍💻 Author

**Aniket Kumar**  
*B.Tech — Computer Science & Engineering (AI/ML)*  
AI/ML Engineering | Generative AI | Backend Development | Voice AI

