import os
from flask import Blueprint, request, jsonify, current_app, session
from app.utils.file_handler import validate_upload
from app.services.data_analysis import load_and_summarize_csv, get_active_dataset, get_active_dataset_name
from app.services.analysis_engine import IntelligentAnalyzer
from app.services.question_engine import QuestionEngine
from app.services.visualization_engine import VisualizationEngine
from app.services.ai_service import GeminiService, GeminiError
api_bp = Blueprint('api', __name__)

@api_bp.route('/load-sample', methods=['POST'])
def load_sample():
    """Load the bundled sample CSV dataset without requiring a file upload."""
    try:
        sample_path = os.path.join(current_app.static_folder, 'sample_data.csv')
        if not os.path.exists(sample_path):
            return jsonify({'success': False, 'message': 'Sample dataset not found.'}), 404

        with open(sample_path, 'rb') as f:
            success, summary_or_error, data = load_and_summarize_csv(f, filename='sample_sales_data.csv')

        if success:
            session['file_id'] = data['file_id']
            return jsonify({
                'success': True,
                'message': 'Sample dataset loaded successfully.',
                'summary': summary_or_error,
                'preview': data['preview'],
                'file_id': data['file_id'],
                'filename': 'sample_sales_data.csv'
            }), 200
        else:
            return jsonify({'success': False, 'message': summary_or_error}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error loading sample: {str(e)}'}), 500

@api_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part in the request'}), 400
        
    file = request.files['file']
    
    # Validation
    is_valid, msg = validate_upload(file)
    if not is_valid:
        return jsonify({'success': False, 'message': msg}), 400
        
    # Process and Summarize CSV
    success, summary_or_error, data = load_and_summarize_csv(file.stream, filename=file.filename)
    
    if success:
        session['file_id'] = data['file_id']
        return jsonify({
            'success': True,
            'message': 'File uploaded and processed successfully',
            'summary': summary_or_error,
            'preview': data['preview'],
            'file_id': data['file_id']
        }), 200
    else:
        return jsonify({'success': False, 'message': summary_or_error}), 400

@api_bp.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'success': False, 'message': 'File exceeds the 25MB limit.'}), 413

@api_bp.route('/ask', methods=['POST'])
def ask_question():
    data = request.get_json()
    if not data or 'question' not in data or 'file_id' not in data:
        return jsonify({'success': False, 'message': 'Missing question or file_id'}), 400
        
    file_id = data['file_id']
    question = data['question']
    
    df = get_active_dataset(file_id)
    if df is None:
        return jsonify({'success': False, 'answer': 'Dataset not found or session expired. Please re-upload.', 'confidence': 0}), 404
        
    filename = get_active_dataset_name(file_id)
    engine = QuestionEngine(df)
    result = engine.ask(question, file_id=file_id, filename=filename)
    
    # Merge question into response payload
    result['question'] = question
    
    return jsonify(result), 200

def generate_fallback_questions(columns, numeric_cols, categorical_cols):
    """Always returns exactly 3 curated questions: statistical, analytical, AI insight."""

    # 1. Statistical — pick the first numeric column if available
    if numeric_cols:
        stat_q = f"What is the average {numeric_cols[0]}?"
    elif columns:
        stat_q = f"How many records exist in {columns[0]}?"
    else:
        stat_q = "What is the total record count in this dataset?"

    # 2. Analytical / Trend — use first two numeric cols or first categorical
    if len(numeric_cols) >= 2:
        trend_q = f"How does {numeric_cols[0]} relate to {numeric_cols[1]}?"
    elif categorical_cols and numeric_cols:
        trend_q = f"Which {categorical_cols[0]} has the highest {numeric_cols[0]}?"
    elif categorical_cols:
        trend_q = f"What is the distribution of {categorical_cols[0]}?"
    else:
        trend_q = "What patterns or trends exist in this dataset?"

    # 3. AI Insight / Recommendation — always generic but useful
    insight_q = "Summarize this dataset and give recommendations."

    return [stat_q, trend_q, insight_q]



@api_bp.route('/analyze', methods=['POST'])
def analyze_data():
    data = request.get_json()
    if not data or 'file_id' not in data:
        return jsonify({'success': False, 'message': 'Missing file_id'}), 400
        
    file_id = data['file_id']
    df = get_active_dataset(file_id)
    
    if df is None:
        return jsonify({'success': False, 'message': 'Dataset not found or session expired.'}), 404
        
    try:
        analyzer = IntelligentAnalyzer(df)
        analysis_result = analyzer.analyze()

        # Dynamic Suggested Questions Generation
        import numpy as np
        filename = get_active_dataset_name(file_id)
        columns = df.columns.tolist()
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        summary_stats = analysis_result.get('numeric_analysis', {})
        patterns = analysis_result.get('insights', [])

        # Call Gemini for suggested questions
        suggested = GeminiService.generate_suggested_questions(
            dataset_name=filename,
            columns=columns,
            summary_stats=summary_stats,
            patterns=patterns
        )

        # Fallback to local rule-based suggestions if Gemini fails or API key is not configured
        if not suggested:
            suggested = generate_fallback_questions(columns, numeric_cols, categorical_cols)

        return jsonify({
            'success': True,
            'analysis': analysis_result,
            'suggested_questions': suggested
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': f'Analysis failed: {str(e)}'}), 500

@api_bp.route('/generate-chart', methods=['POST'])
def generate_chart():
    data = request.get_json()
    if not data or 'file_id' not in data:
        return jsonify({'success': False, 'message': 'Missing file_id'}), 400
        
    file_id = data['file_id']
    df = get_active_dataset(file_id)
    if df is None:
        return jsonify({'success': False, 'message': 'Dataset not found or session expired.'}), 404
        
    try:
        engine = VisualizationEngine(df, current_app.static_folder, file_id)
        result = engine.generate()
        return jsonify({
            'success': True,
            **result
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_bp.route('/ai-insights', methods=['POST'])
def get_ai_insights():
    data = request.get_json()
    if not data or 'file_id' not in data:
        return jsonify({'success': False, 'message': 'Missing file_id'}), 400
        
    file_id = data['file_id']
    df = get_active_dataset(file_id)
    if df is None:
        return jsonify({'success': False, 'message': 'Dataset not found or session expired.'}), 404
        
    try:
        filename = get_active_dataset_name(file_id)
        columns = df.columns.tolist()
        
        analyzer = IntelligentAnalyzer(df)
        summary_stats = {
            "general_stats": analyzer._general_stats(),
            "numeric_analysis": analyzer._numeric_analysis()
        }
        
        patterns = analyzer._generate_insights()
        
        chart_info = {}
        try:
            viz = VisualizationEngine(df, "", file_id)
            chart_type, x_col, y_col = viz._recommend_strategy()
            chart_info = {
                "recommended_chart_type": chart_type,
                "x_axis_column": x_col,
                "y_axis_column": y_col
            }
        except Exception:
            chart_info = {"status": "No chart information available"}
            
        insights = GeminiService.generate_insights(
            dataset_name=filename,
            columns=columns,
            summary_stats=summary_stats,
            patterns=patterns,
            chart_info=chart_info
        )
        
        return jsonify({
            'success': True,
            'insights': insights
        }), 200
        
    except GeminiError as ge:
        return jsonify({
            'success': False,
            'message': f"Gemini AI Error ({ge.error_type}): {ge.message}"
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Failed to generate insights: {str(e)}"
        }), 500


@api_bp.route('/dataset/<file_id>', methods=['GET'])
def get_dataset_info(file_id):
    """Return dataset metadata so the frontend can restore UI state after navigation."""
    df = get_active_dataset(file_id)
    if df is None:
        return jsonify({'success': False, 'message': 'Dataset not found or session expired.'}), 404

    import numpy as np
    filename = get_active_dataset_name(file_id)
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(exclude=[np.number]).columns

    summary = {
        'total_rows': int(len(df)),
        'total_columns': int(len(df.columns)),
        'columns': df.columns.tolist(),
        'missing_values': int(df.isnull().sum().sum()),
        'numeric_columns': int(len(numeric_cols)),
        'categorical_columns': int(len(categorical_cols)),
        'memory_usage_mb': round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2),
        'duplicate_rows': int(df.duplicated().sum())
    }

    preview_df = df.head(10).replace({np.nan: None, np.inf: None, -np.inf: None})
    preview = preview_df.to_dict(orient='records')

    return jsonify({
        'success': True,
        'file_id': file_id,
        'filename': filename,
        'summary': summary,
        'preview': preview
    }), 200


@api_bp.route('/clear-session', methods=['POST'])
def clear_session_endpoint():
    """Clear Flask session state and associated dataset reference."""
    file_id = session.pop('file_id', None)
    if file_id:
        from app.services.data_analysis import ACTIVE_DATASETS, ACTIVE_DATASET_NAMES
        ACTIVE_DATASETS.pop(file_id, None)
        ACTIVE_DATASET_NAMES.pop(file_id, None)
    session.clear()
    return jsonify({'success': True, 'message': 'Session cleared.'}), 200

