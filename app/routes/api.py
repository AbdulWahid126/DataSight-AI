from flask import Blueprint, request, jsonify, current_app
from app.utils.file_handler import validate_upload
from app.services.data_analysis import load_and_summarize_csv, get_active_dataset
from app.services.analysis_engine import IntelligentAnalyzer
from app.services.question_engine import QuestionEngine
from app.services.visualization_engine import VisualizationEngine
api_bp = Blueprint('api', __name__)

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
    success, summary_or_error, data = load_and_summarize_csv(file.stream)
    
    if success:
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
        
    engine = QuestionEngine(df)
    result = engine.ask(question)
    
    # Merge question into response payload
    result['question'] = question
    
    return jsonify(result), 200

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
        return jsonify({
            'success': True,
            'analysis': analysis_result
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
