from flask import Blueprint, render_template

views_bp = Blueprint('views', __name__)

@views_bp.route('/')
def index():
    return render_template('index.html')

@views_bp.route('/history')
def history():
    return render_template('history.html')

@views_bp.route('/settings')
def settings():
    return render_template('settings.html')

@views_bp.route('/about')
def about():
    return render_template('about.html')

@views_bp.route('/ai-insights')
def ai_insights():
    return render_template('ai_insights.html')

