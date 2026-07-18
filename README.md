<div align="center">

# 🧠 DataSight AI

### Intelligent CSV Data Analysis & AI-Powered Insights Platform

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1.3-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Pandas](https://img.shields.io/badge/Pandas-3.0.3-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/gemini)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Hackathon](https://img.shields.io/badge/SMIT-AI_Hackathon_2026-red?style=for-the-badge)](https://smit.edu.pk)

<br/>

**DataSight AI** is a production-quality, full-stack web application that transforms raw CSV data into intelligent, actionable insights. Upload any dataset, instantly receive statistical analysis, interactive visualizations, AI-generated narrative insights, and a conversational question engine — all powered by a hybrid Python + Google Gemini AI architecture. Built in under 48 hours for the SMIT AI Data Analysis Hackathon 2026.

</div>

---

## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Folder Structure](#-folder-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Application Workflow](#-application-workflow)
- [AI Architecture](#-ai-architecture)
- [Screenshots](#-screenshots)
- [API Reference](#-api-reference)
- [Future Improvements](#-future-improvements)
- [Challenges Faced](#-challenges-faced)
- [Lessons Learned](#-lessons-learned)
- [Contributors](#-contributors)
- [License](#-license)

---

## 🎯 Project Overview

Modern organizations generate vast amounts of tabular data, yet extracting meaningful insights from CSV files typically requires expensive data science tools or advanced programming skills. **DataSight AI** solves this problem by providing a zero-setup, browser-based platform that makes data analysis accessible to everyone.

### Who Is It For?

| Audience | Use Case |
|---|---|
| 📊 **Data Analysts** | Rapid exploratory data analysis without writing code |
| 🏫 **Educators & Students** | Understanding datasets for academic projects |
| 💼 **Business Users** | Extracting KPIs and trends from sales, HR, or finance data |
| 🔬 **Researchers** | Quickly profiling research datasets |
| 🏆 **Hackathon Participants** | Demonstrating AI + data science capabilities |

### Why DataSight AI?

- **Zero setup** — No local Python environment or Jupyter notebook required
- **Hybrid intelligence** — Python ensures calculation accuracy; Gemini provides narrative intelligence
- **Session-aware** — Full state restoration on page refresh; clean reset on intentional new analysis
- **Reliable fallbacks** — Fully functional even without a Gemini API key

---

## ✨ Features

### Core Features

| Feature | Description |
|---|---|
| 📂 **CSV Upload** | Drag-and-drop or browse upload for any CSV file up to 25 MB |
| 🔬 **Automatic Dataset Analysis** | Instant computation of row counts, column types, missing values, memory usage, duplicates, and numeric distributions |
| 📊 **Interactive Dashboard** | Live summary cards, column preview table, and dataset metadata panel |
| 📈 **Smart Chart Generation** | Automatic chart-type selection (bar, line, scatter, pie) based on data shape — rendered as high-resolution PNGs |
| 💬 **Hybrid AI Chat** | Natural-language Q&A engine: Python rule engine for statistical precision, Gemini for contextual/analytical questions |
| 🧠 **AI Insights** | Google Gemini generates narrative insights — key findings, risks, trends, and plain-English explanations |
| 💡 **Suggested Questions** | Three context-aware questions generated per dataset: one statistical, one analytical, one AI insight |
| 📜 **Analysis History** | Per-session record of all uploaded datasets, questions asked, and charts generated |
| ⚙️ **Settings Panel** | Notification preferences, auto-save toggles, and Danger Zone for full application reset |
| 🌙 **Dark Mode** | Premium dark glassmorphism UI with persistent theme preference |
| 📱 **Responsive UI** | Fully mobile-responsive layout using Tailwind CSS |
| 🔁 **Session Persistence** | Browser-session state restoration — refresh without losing your work |
| 📋 **Sample Dataset** | Built-in sales dataset for instant exploration without uploading a file |

---

## 🛠 Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| **Tailwind CSS** (CDN) | Utility-first CSS framework for premium dark UI |
| **Vanilla JavaScript** | Core application logic, session management, and API communication |
| **HTML5 + Jinja2** | Server-side templating via Flask's template engine |
| **Phosphor Icons** | Modern SVG icon system |
| **Marked.js** | Client-side Markdown rendering for AI responses |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.10+ | Core runtime |
| **Flask** | 3.1.3 | WSGI web framework and routing |
| **Pandas** | 3.0.3 | In-memory CSV loading, statistics, and data manipulation |
| **NumPy** | 2.5.1 | Numerical operations and type detection |
| **Matplotlib** | 3.11.0 | Chart generation and PNG export |
| **Pillow** | 12.3.0 | Image processing for chart output |
| **Google Generative AI** | 0.8.6 | Gemini model access for narrative AI |
| **python-dotenv** | 1.2.2 | Environment variable management |
| **Gunicorn** | 26.0.0 | Production WSGI server |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER CLIENT                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  main.js │  │  ui.js   │  │session.js│  │ theme.js │   │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────┼─────────────────────────────────────────────────────┘
        │  HTTP / JSON (Fetch API)
        ▼
┌─────────────────────────────────────────────────────────────┐
│                      FLASK BACKEND                          │
│                                                             │
│  ┌─────────────┐   ┌──────────────────────────────────┐    │
│  │   views.py  │   │            api.py                │    │
│  │  (HTML pages)│   │  /upload  /analyze  /ask         │    │
│  └─────────────┘   │  /generate-chart  /ai-insights   │    │
│                    │  /dataset/<id>  /clear-session    │    │
│                    └───────────┬──────────────────────┘    │
└────────────────────────────────┼────────────────────────────┘
                                 │
              ┌──────────────────┴──────────────────┐
              ▼                                      ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   PYTHON ANALYSIS LAYER │          │    GOOGLE GEMINI API    │
│                         │          │                         │
│  ┌───────────────────┐  │          │  ┌───────────────────┐  │
│  │  data_analysis.py │  │          │  │   ai_service.py   │  │
│  │  (CSV loading,    │  │          │  │  (Narrative        │  │
│  │   summarization)  │  │          │  │   explanation,     │  │
│  └───────────────────┘  │          │  │   insights, and    │  │
│  ┌───────────────────┐  │          │  │   suggested Q's)   │  │
│  │  analysis_engine  │  │          │  └───────────────────┘  │
│  │  (stats, insights,│  │          └─────────────────────────┘
│  │   correlations)   │  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │  question_engine  │  │
│  │  (rule-based NLP  │  │
│  │   + Gemini hybrid)│  │
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │ visualization_    │  │
│  │ engine.py         │  │
│  │ (Matplotlib PNGs) │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

---

## 📁 Folder Structure

```
ai-data-insight-assistant/
│
├── app/                            # Main Flask application package
│   ├── __init__.py                 # App factory — creates Flask instance, registers blueprints
│   │
│   ├── routes/                     # HTTP request handlers
│   │   ├── api.py                  # All REST API endpoints (/upload, /analyze, /ask, etc.)
│   │   └── views.py                # Page routes (/, /history, /settings, /ai-insights)
│   │
│   ├── services/                   # Business logic layer
│   │   ├── data_analysis.py        # CSV loading, in-memory DataFrame store
│   │   ├── analysis_engine.py      # Statistical analysis, correlations, outlier detection
│   │   ├── question_engine.py      # Hybrid NLP question answering (rule-based + Gemini)
│   │   ├── visualization_engine.py # Chart type selection and Matplotlib PNG generation
│   │   └── ai_service.py           # Google Gemini API wrapper (insights + suggested Q's)
│   │
│   ├── utils/                      # Shared helpers
│   │   └── file_handler.py         # Upload validation (type, size, encoding checks)
│   │
│   ├── static/                     # Browser-served static assets
│   │   ├── css/
│   │   │   └── styles.css          # Custom CSS, animations, glassmorphism utilities
│   │   ├── js/
│   │   │   ├── main.js             # Core application logic and dashboard orchestration
│   │   │   ├── ui.js               # Toast notifications, button loading, ripple effects
│   │   │   ├── session.js          # SessionManager — history, settings, storage abstraction
│   │   │   ├── api.js              # Shared API utility helpers
│   │   │   └── theme.js            # Dark/light mode toggle with localStorage persistence
│   │   ├── charts/                 # Generated chart PNG files (runtime output)
│   │   ├── images/                 # Static image assets
│   │   └── sample_data.csv         # Bundled sample sales dataset for instant demo
│   │
│   └── templates/                  # Jinja2 HTML templates
│       ├── base.html               # Base layout: navigation, footer, JS/CSS imports
│       ├── index.html              # Main dashboard: upload, chart, chat, stats
│       ├── ai_insights.html        # AI Insights generation page
│       ├── history.html            # Analysis history page
│       ├── settings.html           # Application settings and Danger Zone
│       └── about.html              # About / team information page
│
├── tests/                          # Automated test suite
│   └── test_api.py                 # Unit tests: classifiers, question engine, Gemini error handling
│
├── run.py                          # Development server entry point
├── requirements.txt                # Pinned Python dependencies
├── render.yaml                     # Render.com cloud deployment configuration
├── test_script.py                  # End-to-end integration test (50 assertions)
├── .env                            # Local environment variables (not committed)
├── .gitignore                      # Git exclusion rules
└── README.md                       # This file
```

---

## 🚀 Installation

### Prerequisites

- Python **3.10** or higher
- `pip` (Python package manager)
- A free [Google Gemini API key](https://aistudio.google.com/app/apikey) *(optional but recommended)*

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/AbdulWahid126/DataSight-AI.git
cd DataSight-AI
```

#### 2. Create a Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

#### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# .env
SECRET_KEY=your-strong-random-secret-key-here
GEMINI_API_KEY=your-google-gemini-api-key-here
```

> **Note:** The application is fully functional without `GEMINI_API_KEY`. AI Insights and Gemini-powered chat will be unavailable, but all statistical analysis, charts, and rule-based Q&A will work normally.

#### 5. Run the Development Server

```bash
python run.py
```

Open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

#### 6. Run the Test Suite *(Optional)*

```bash
# End-to-end integration tests (50 assertions)
python test_script.py

# Unit tests
python -m unittest tests/test_api.py -v
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ **Required** | Flask session encryption key. Use a long, random string in production. |
| `GEMINI_API_KEY` | ⚠️ Optional | Google Gemini API key. Enables AI Insights, Gemini chat, and AI-generated suggested questions. Get one free at [Google AI Studio](https://aistudio.google.com/app/apikey). |

---

## 🔄 Application Workflow

```
 ┌─────────────────────────────────────┐
 │         User opens browser          │
 └──────────────────┬──────────────────┘
                    │
                    ▼
 ┌─────────────────────────────────────┐
 │    Upload CSV (drag-drop or browse) │◄── Up to 25 MB
 └──────────────────┬──────────────────┘
                    │
                    ▼
 ┌─────────────────────────────────────┐
 │  Pandas loads & profiles the data  │
 │  • Row / column counts             │
 │  • Data type detection             │
 │  • Missing value audit             │
 │  • Memory footprint                │
 └──────────────────┬──────────────────┘
                    │
                    ▼
 ┌─────────────────────────────────────┐
 │      Intelligent Analysis Engine   │
 │  • Numeric distributions & stats   │
 │  • Correlation matrix              │
 │  • Outlier detection               │
 │  • Auto-generated text insights    │
 └──────────────────┬──────────────────┘
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
 ┌────────────────┐  ┌─────────────────────┐
 │  Gemini AI     │  │  Rule-Based Engine  │
 │  Suggested     │  │  Fallback Questions │
 │  Questions (3) │  │  (offline-capable)  │
 └────────┬───────┘  └─────────┬───────────┘
          └─────────┬──────────┘
                    ▼
 ┌─────────────────────────────────────┐
 │       Dashboard Rendered            │
 │  Summary cards / Preview table /   │
 │  Chart section / Chat panel /      │
 │  Suggested Questions chips         │
 └──────────────────┬──────────────────┘
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
 ┌────────────────┐  ┌─────────────────────┐
 │  Generate Chart│  │  Ask AI Questions   │
 │  Auto-selected │  │  Rule engine first; │
 │  chart type    │  │  Gemini if complex  │
 └────────────────┘  └─────────────────────┘
                    │
                    ▼
 ┌─────────────────────────────────────┐
 │        AI Insights Page            │
 │  Gemini generates narrative report │
 │  • Key findings                    │
 │  • Trends & patterns               │
 │  • Risk factors                    │
 │  • Plain-English explanation       │
 │  • Actionable recommendations      │
 └─────────────────────────────────────┘
```

---

## 🤖 AI Architecture

DataSight AI uses a carefully designed **Hybrid AI Architecture** that separates responsibilities between Python and Google Gemini to maximize both **accuracy** and **intelligence**.

### The Golden Rule

> **Python calculates. Gemini explains.**

### How It Works

```
User Question
      │
      ▼
 Question Classifier
      │
      ├──► Statistical / Simple ──► Pandas Engine ──► Precise Answer
      │                              (average, sum,       (95% confidence)
      │                               max, min, count)
      │
      └──► Analytical / Complex ──► Gemini AI ──► Contextual Answer
                                    (trend, compare,    (with explanation)
                                     recommend,
                                     summarize)
```

### Why This Architecture Is Superior

| Concern | Naive Approach | DataSight AI |
|---|---|---|
| **Calculation accuracy** | Ask Gemini to calculate → hallucination risk | Pandas computes → 100% accurate |
| **Context understanding** | Rule engine only → rigid, misses meaning | Gemini on complex Qs → flexible |
| **Offline fallback** | AI-only → breaks without API key | Rule engine works without Gemini |
| **Speed** | Gemini on every request → slow | Rule engine first → instant |
| **Reliability** | Single point of failure | Dual-layer with graceful degradation |

### Gemini's Responsibilities (What it does)

- ✅ Generating **narrative AI Insights** from pre-computed statistics
- ✅ Answering **contextual / analytical / recommendation** questions
- ✅ Generating **dataset-aware suggested questions**
- ✅ Interpreting trends and providing plain-English explanations

### Gemini's Restrictions (What it never does)

- ❌ Performing arithmetic on raw data
- ❌ Computing averages, sums, maximums, or counts
- ❌ Replacing or substituting Pandas operations
- ❌ Accessing the raw DataFrame directly

---

## 📸 Screenshots

### Dashboard — Upload & Statistics

> *(Upload a CSV to see live statistics cards, column preview, and the analysis panel)*

```
[ Screenshot: Dashboard with stats cards, column table, and chart section ]
```

### Interactive Chart

> *(Auto-selected visualization based on data shape — bar, line, scatter, or pie)*

```
[ Screenshot: Generated Scatter or Pie chart with type badge and explanation ]
```

### AI Chat — Hybrid Q&A

> *(Ask natural-language questions; the hybrid engine routes each to Python or Gemini)*

```
[ Screenshot: Chat interface showing suggested question chips and AI response ]
```

### AI Insights Report

> *(Gemini-generated narrative report with key findings, trends, and recommendations)*

```
[ Screenshot: AI Insights page with structured sections: findings, risks, plain English ]
```

---

## 📡 API Reference

All endpoints are prefixed with `/api`. Responses are JSON.

### `POST /api/upload`

Upload a CSV file for analysis.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "success": true,
  "file_id": "uuid-string",
  "summary": { "total_rows": 100, "total_columns": 6, "..." },
  "preview": [ { "col1": "val", "..." } ]
}
```

---

### `POST /api/load-sample`

Load the built-in sample sales dataset without file upload.

**Response:** Same structure as `/api/upload`

---

### `POST /api/analyze`

Run full statistical analysis and generate suggested questions.

**Request body:**
```json
{ "file_id": "uuid-string" }
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "numeric_analysis": { "..." },
    "correlation_matrix": { "..." },
    "data_quality": { "..." },
    "insights": [ "..." ]
  },
  "suggested_questions": [
    "What is the average Sales?",
    "How does Sales relate to Profit?",
    "Summarize this dataset and give recommendations."
  ]
}
```

---

### `POST /api/ask`

Submit a natural-language question to the hybrid Q&A engine.

**Request body:**
```json
{ "file_id": "uuid-string", "question": "What is the average profit?" }
```

**Response:**
```json
{
  "answer": "The average Profit is 2,945.00.",
  "confidence": 95,
  "confidence_label": "Rule-based Engine",
  "suggestions": [],
  "question": "What is the average profit?"
}
```

---

### `POST /api/generate-chart`

Generate an automatic visualization for the dataset.

**Request body:**
```json
{ "file_id": "uuid-string" }
```

**Response:**
```json
{
  "success": true,
  "chart_path": "/static/charts/uuid_bar_abc123.png",
  "chart_type": "Bar Chart",
  "explanation": "Sales by Category shows Electronics leads with 50% share."
}
```

---

### `POST /api/ai-insights`

Generate a full AI narrative insights report via Gemini.

**Request body:**
```json
{ "file_id": "uuid-string" }
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "key_findings": [ "..." ],
    "trends_and_patterns": [ "..." ],
    "potential_risks": [ "..." ],
    "plain_english_explanation": "This dataset represents..."
  }
}
```

---

### `GET /api/dataset/<file_id>`

Retrieve dataset metadata (used for session verification on page load).

**Response:**
```json
{
  "success": true,
  "file_id": "uuid-string",
  "filename": "sales_data.csv",
  "summary": { "..." },
  "preview": [ "..." ]
}
```

---

### `POST /api/clear-session`

Clear the server-side session and free the in-memory DataFrame.

**Response:**
```json
{ "success": true, "message": "Session cleared." }
```

---

## 🚀 Future Improvements

| Feature | Description |
|---|---|
| 🔐 **Authentication** | User accounts with OAuth (Google/GitHub login) |
| 👤 **User Profiles** | Persistent dashboards, saved analyses, and preferences |
| ☁️ **Cloud Storage** | Upload datasets to AWS S3 or Google Cloud Storage |
| 📄 **PDF Export** | Download full analysis reports as branded PDF files |
| 🤖 **Machine Learning** | Automated model selection (regression, classification) |
| 📉 **Predictive Analytics** | Forecasting and time-series analysis built in |
| 👥 **Team Collaboration** | Shared dashboards and team workspaces |
| 🗄️ **Database Support** | Direct SQL query integration (PostgreSQL, MySQL) |
| 🔗 **API Access** | REST API tokens for programmatic dataset analysis |
| 📊 **More Chart Types** | Heatmaps, box plots, histograms, geospatial maps |

---

## 🏔 Challenges Faced

### 1. Session Lifecycle Management
Managing state across page navigations (Dashboard → History → AI Insights → back) without losing the dataset proved complex. We built a dual-layer system: `sessionStorage` for browser state and Flask `session` for server-side references, with a live verification handshake (`GET /api/dataset/<id>`) on every page load to detect server restarts and expired sessions.

### 2. Chart Generation Reliability
Matplotlib generates charts in a headless server environment with no display. Getting the `Agg` backend to work correctly, avoiding thread-safety issues, and ensuring chart file cleanup required careful architecture design in `visualization_engine.py`.

### 3. Hybrid AI Question Routing
Deciding in real time whether to route a question to the Python rule engine or Gemini required building a robust NLP classifier. The classifier uses keyword weighting, confidence scoring, and a tiered fallback system so the user always receives an answer even when Gemini is unavailable.

### 4. State Persistence on Navigation
The frontend dashboard needed to restore its full visual state (stats cards, chart image, chat history, analysis panels, suggested questions) after navigating to other pages and returning — all without a full server round-trip. This was solved entirely with `sessionStorage` caching and selective DOM restoration.

### 5. Hackathon Time Constraints
Delivering a production-quality, multi-feature AI platform within 48 hours required aggressive prioritization: building a solid backend foundation first, then layering the UI, and finally integrating Gemini at the end — with all edge cases handled via fallbacks so no failure mode breaks the user experience.

---

## 💡 Lessons Learned

- **Separation of concerns pays off under pressure.** By keeping analysis logic, AI communication, and HTTP handling in distinct service modules, we could debug and iterate on each independently during the hackathon crunch.

- **Never let AI handle calculations.** Routing statistical questions to Pandas and only using Gemini for narrative work eliminated an entire class of AI hallucination bugs that would have been nearly impossible to debug under time pressure.

- **Session management is deceptively complex.** Browser `sessionStorage`, Flask server sessions, and in-memory Python caches all need to stay synchronized. Building a single `clearSessionAndResetUI()` function that coordinates all three was the correct architectural decision.

- **Graceful degradation builds trust.** Designing every feature to work without an API key meant we could demo the application confidently regardless of network conditions at the hackathon venue.

- **Version-busting static assets early.** Adding `?v=x.x` cache parameters to JS/CSS files from the start prevented hours of frustration debugging why UI changes weren't appearing in the browser.

---

## 👥 Contributors

<div align="center">

| Role | Name |
|---|---|
| 🏗️ **Lead Architect & Full-Stack Engineer** | AI Hackers Team |
| 🤖 **AI Integration Engineer** | AI Hackers Team |
| 🎨 **UI/UX Designer** | AI Hackers Team |

**Hackathon:** SMIT AI Data Analysis Hackathon 2026
**Team:** AI Hackers

</div>

---

## 📄 License

```
MIT License

Copyright (c) 2026 AI Hackers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

Built with ❤️ by **AI Hackers** · SMIT AI Data Analysis Hackathon 2026

[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white)](https://pandas.pydata.org)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/gemini)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

*"From raw data to actionable intelligence — instantly."*

</div>
