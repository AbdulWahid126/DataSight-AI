# DataSight AI - Intelligent Data Analysis Assistant

> An AI-powered web application that automatically analyzes, visualizes, and answers questions about your CSV datasets using Google Generative AI.

![Flask](https://img.shields.io/badge/Flask-3.1.3-green)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Google AI](https://img.shields.io/badge/Google_Generative_AI-0.8.6-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Overview

DataSight AI is a sophisticated web application designed for the **SMIT Coding Night AI Data Analysis Hackathon**. It provides an intuitive interface for uploading CSV datasets and leverages AI to perform comprehensive data analysis, generate meaningful visualizations, and answer complex data questions in seconds.

### Key Features

- 📤 **Easy Data Upload** - Drag & drop or click to upload CSV files up to 25MB
- 🤖 **AI-Powered Analysis** - Powered by Google Generative AI (Gemini) for intelligent insights
- 📊 **Auto-Generated Visualizations** - Intelligent chart generation (line, bar, pie, scatter)
- 🔍 **Natural Language Q&A** - Ask questions about your data in plain English
- 📈 **Comprehensive Statistics** - Automatic detection of data types and statistical analysis
- 💾 **Session Management** - Track your analysis history
- 🎨 **Modern Dark UI** - Beautiful, responsive interface with Tailwind CSS
- 🔒 **Data Privacy** - Files are processed on-server and can be managed through settings

## 🏗️ Project Structure

```
ai-data-insight-assistant/
├── app/
│   ├── __init__.py                 # Flask app factory
│   ├── routes/
│   │   ├── api.py                  # REST API endpoints
│   │   └── views.py                # Web page routes
│   ├── services/
│   │   ├── ai_service.py           # AI integration (Gemini)
│   │   ├── analysis_engine.py      # Core data analysis logic
│   │   ├── chart_generator.py      # Chart creation utilities
│   │   ├── data_analysis.py        # CSV processing & summarization
│   │   ├── question_engine.py      # Natural language Q&A engine
│   │   └── visualization_engine.py # Matplotlib chart generation
│   ├── static/
│   │   ├── sample_data.csv         # Demo dataset
│   │   ├── css/styles.css          # Tailwind CSS styling
│   │   ├── js/
│   │   │   ├── api.js              # API client
│   │   │   ├── main.js             # Main application logic
│   │   │   ├── session.js          # Session management
│   │   │   ├── theme.js            # Theme toggle
│   │   │   └── ui.js               # UI interactions
│   │   ├── images/generated_charts/ # Output directory for charts
│   │   └── charts/                 # Chart storage
│   ├── templates/
│   │   ├── index.html              # Dashboard & upload interface
│   │   ├── base.html               # Base template
│   │   ├── history.html            # Analysis history page
│   │   ├── settings.html           # User settings
│   │   └── about.html              # About page
│   └── utils/
│       ├── file_handler.py         # File validation & handling
│       └── helpers.py              # Utility functions
├── data/
│   └── uploads/                    # User uploaded files directory
├── tests/
│   ├── test_analysis.py            # Analysis engine tests
│   └── test_api.py                 # API endpoint tests
├── run.py                          # Application entry point
├── requirements.txt                # Python dependencies
└── render.yaml                     # Render deployment config
```

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Google Generative AI API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ai-data-insight-assistant.git
   cd ai-data-insight-assistant
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   
   Create a `.env` file in the project root:
   ```env
   GOOGLE_API_KEY=your_google_generative_ai_key_here
   SECRET_KEY=your_secret_key_here
   FLASK_ENV=development
   PORT=5000
   ```

5. **Run the application:**
   ```bash
   python run.py
   ```

6. **Access the app:**
   
   Open your browser and navigate to: `http://localhost:5000`

## 📊 Core Components

### Analysis Engine (`analysis_engine.py`)

Provides comprehensive data analysis including:
- **General Statistics**: Row/column counts, missing values, memory usage
- **Numeric Analysis**: Mean, median, mode, std deviation, outlier detection
- **Categorical Analysis**: Value counts, frequencies, diversity metrics
- **Date Analysis**: Temporal patterns and trends
- **Correlation Analysis**: Numerical relationships between columns
- **Data Quality Reports**: Completeness, duplicates, data type validation

### Question Engine (`question_engine.py`)

Natural language processing engine that:
- Extracts intent from user questions (highest, lowest, average, sum, etc.)
- Identifies relevant columns through fuzzy matching
- Performs calculations on appropriate columns
- Returns natural language answers with confidence scores

### Visualization Engine (`visualization_engine.py`)

Intelligently generates charts based on data characteristics:
- **Line Charts** - For time-series data
- **Bar Charts** - For categorical comparisons
- **Pie Charts** - For composition analysis
- **Scatter Plots** - For correlation exploration
- **Horizontal Bars** - For many categories (top 15)

### AI Service Integration

Powered by Google Generative AI (Gemini) for:
- Advanced data insights
- Trend analysis
- Anomaly detection
- Actionable recommendations

## 🔌 API Endpoints

### Data Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload CSV file for analysis |
| POST | `/api/load-sample` | Load bundled sample dataset |
| GET | `/api/preview` | Get preview of active dataset |
| GET | `/api/summary` | Get analysis summary |

### Analysis & Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analysis` | Get full data analysis |
| POST | `/api/question` | Ask natural language questions |
| GET | `/api/visualizations` | Get generated charts |
| POST | `/api/chart` | Generate specific chart |

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | Get analysis history |
| DELETE | `/api/clear` | Clear session & uploaded file |
| POST | `/api/settings` | Update user preferences |

## 📦 Dependencies

Key packages:

- **Flask (3.1.3)** - Web framework
- **Flask-CORS (6.0.5)** - Cross-origin resource sharing
- **Google-Generative AI (0.8.6)** - AI/ML capabilities
- **Pandas (3.0.3)** - Data manipulation & analysis
- **NumPy (2.5.1)** - Numerical computing
- **Matplotlib (3.11.0)** - Visualization & chart generation
- **Gunicorn (26.0.0)** - Production WSGI server

For complete list, see [requirements.txt](requirements.txt)

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
python -m pytest tests/

# Run specific test file
python -m pytest tests/test_analysis.py

# Run with coverage
python -m pytest --cov=app tests/
```

## 🌐 Deployment

### Deploy to Render

The application includes a `render.yaml` configuration for easy deployment to [Render](https://render.com):

1. Push your repository to GitHub
2. Connect to Render
3. Render will automatically detect `render.yaml` and deploy

**Environment variables needed on Render:**
- `GOOGLE_API_KEY` - Google Generative AI API key
- `SECRET_KEY` - Flask secret key

### Deploy to Other Platforms

The application can be deployed to any platform supporting Python:

```bash
# Using Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app

# Using Flask (development)
flask run
```

## 💡 Usage Examples

### 1. Upload a Dataset
1. Go to the Dashboard
2. Drag & drop a CSV file or click "Upload New"
3. The app automatically analyzes and displays insights

### 2. Ask Questions
- "What is the average sales?"
- "How many unique customers do we have?"
- "What's the highest revenue month?"
- "Show me missing values in each column"

### 3. View Visualizations
- Charts are auto-generated based on data characteristics
- Explore relationships between variables
- Export charts for presentations

### 4. Track History
- View all previous analyses
- Compare datasets
- Manage uploaded files

## 🔒 Security Features

- **File Validation** - CSV format verification
- **Size Limits** - 25MB max file upload
- **CORS Protection** - Cross-origin resource sharing configured
- **HTTPS Ready** - Compatible with SSL/TLS
- **Session Management** - Secure session handling

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built for **SMIT Coding Night AI Data Analysis Hackathon**
- Powered by [Google Generative AI](https://ai.google.dev/)
- UI inspired by modern data dashboard design
- Special thanks to the hackathon organizers

## 📞 Support

For issues, questions, or suggestions:

1. **Create an Issue** - Report bugs or request features
2. **Check Documentation** - Review this README and API docs
3. **Visit About Page** - In-app help and resources

## 🎯 Roadmap

- [ ] Multi-file dataset merging
- [ ] Advanced SQL-like queries
- [ ] Custom chart styling options
- [ ] Export to PDF reports
- [ ] Collaborative sharing features
- [ ] Real-time data streaming support
- [ ] Machine learning model integration
- [ ] Advanced statistical tests

---

**Made with ❤️ for data enthusiasts and AI practitioners**
