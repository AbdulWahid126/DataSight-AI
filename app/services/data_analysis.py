import pandas as pd
import numpy as np
import uuid

# In-memory storage for active datasets
# Dictionary mapping file_id to pandas DataFrame
ACTIVE_DATASETS = {}

def load_and_summarize_csv(file_stream):
    """
    Reads a CSV stream into a pandas DataFrame, stores it in memory,
    and calculates summary statistics and a preview.
    
    Args:
        file_stream: The file stream from request.files['file'].stream
        
    Returns:
        tuple: (success (bool), summary_or_error_message (dict/str), data (dict/None))
    """
    try:
        # Load CSV into Pandas DataFrame directly from memory
        # Handle potential encoding issues (utf-8 first, fallback to latin1)
        try:
            df = pd.read_csv(file_stream, encoding='utf-8')
        except UnicodeDecodeError:
            file_stream.seek(0)
            df = pd.read_csv(file_stream, encoding='latin1')
            
        # Check if the CSV is empty (no columns or no rows)
        if df.empty or len(df.columns) == 0:
            return False, "The uploaded CSV file is empty.", None
            
        # Generate a unique ID for this session's dataset
        file_id = str(uuid.uuid4())
        
        # Store in memory cache
        ACTIVE_DATASETS[file_id] = df
        
        # 1. Calculate Dataset Summary
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns
        
        summary = {
            "total_rows": int(len(df)),
            "total_columns": int(len(df.columns)),
            "columns": df.columns.tolist(),
            "missing_values": int(df.isnull().sum().sum()),
            "numeric_columns": int(len(numeric_cols)),
            "categorical_columns": int(len(categorical_cols)),
            "memory_usage_mb": round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2),
            "duplicate_rows": int(df.duplicated().sum())
        }
        
        # 2. Calculate Preview (first 10 rows)
        # We must replace NaNs/Infs with None so it can be serialized to JSON properly
        preview_df = df.head(10).replace({np.nan: None, np.inf: None, -np.inf: None})
        preview = preview_df.to_dict(orient='records')
        
        return True, summary, {"preview": preview, "file_id": file_id}
        
    except pd.errors.EmptyDataError:
        return False, "The uploaded file is empty or corrupted.", None
    except pd.errors.ParserError:
        return False, "The uploaded file is not a valid CSV or is corrupted.", None
    except Exception as e:
        return False, f"Error processing file: {str(e)}", None

def get_active_dataset(file_id):
    """Retrieves the active dataframe from memory by its ID."""
    return ACTIVE_DATASETS.get(file_id)
