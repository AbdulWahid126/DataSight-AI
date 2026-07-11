ALLOWED_EXTENSIONS = {'csv'}

def allowed_file(filename):
    """Check if the file has a valid CSV extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_upload(file):
    """
    Validates the uploaded file object.
    Checks existence, filename, and extension.
    Size limit (25MB) is handled by Flask's MAX_CONTENT_LENGTH natively.
    
    Returns:
        tuple: (bool is_valid, str error_message)
    """
    if not file:
        return False, "No file provided."
    
    if file.filename == '':
        return False, "No file selected."
        
    if not allowed_file(file.filename):
        return False, "Invalid file type. Only .csv files are allowed."
        
    return True, "Valid file"
