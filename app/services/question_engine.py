import pandas as pd
import numpy as np
import re
import difflib

class QuestionEngine:
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.columns = df.columns.tolist()
        self.lower_cols = {c.lower(): c for c in self.columns}
        
    def _extract_intent(self, q: str):
        q = q.lower()
        intents = {
            'highest': ['highest', 'maximum', 'max', 'largest', 'top', 'biggest'],
            'lowest': ['lowest', 'minimum', 'min', 'smallest', 'bottom'],
            'average': ['average', 'mean'],
            'median': ['median'],
            'sum': ['sum', 'total'],
            'count': ['count', 'how many'],
            'unique': ['unique', 'distinct'],
            'missing': ['missing', 'null', 'empty'],
            'most_frequent': ['most frequent', 'most common', 'popular', 'frequently'],
            'least_frequent': ['least frequent', 'least common'],
            'variance': ['variance', 'spread'],
            'std_dev': ['standard deviation', 'std dev', 'std'],
            'duplicate': ['duplicate'],
            'shape': ['shape', 'dimension', 'size of dataset', 'dimensions'],
            'columns': ['column names', 'columns', 'headers', 'header names'],
            'data_types': ['data types', 'datatypes', 'types', 'variables type', 'column types'],
            'rows': ['rows', 'number of rows']
        }
        
        for intent, keywords in intents.items():
            for kw in keywords:
                if kw in q:
                    return intent
        return 'unknown'

    def _extract_columns(self, q: str):
        q_lower = q.lower()
        q_clean = re.sub(r'[^\w\s]', '', q_lower)
        words = q_clean.split()
        
        found_cols = []
        
        # Exact substring matching
        for c in self.columns:
            if c.lower() in q_clean:
                found_cols.append(c)
                
        # Fuzzy word matching
        if not found_cols:
            for word in words:
                if len(word) < 3: continue
                matches = difflib.get_close_matches(word, self.lower_cols.keys(), n=1, cutoff=0.75)
                if matches:
                    found_cols.append(self.lower_cols[matches[0]])
                    
        # Remove duplicates while preserving order
        return list(dict.fromkeys(found_cols))

    def classify(self, question: str) -> str:
        q = question.lower()
        
        # Keywords indicating explanation, recommendations, insights, trends, patterns, business meaning, or charts
        gemini_keywords = [
            'why', 'explain', 'insight', 'trend', 'pattern', 'recommend', 'suggest', 'meaning', 'concept',
            'business meaning', 'educational', 'forecast', 'predict', 'chart explanation', 'explain the chart',
            'what does', 'how does', 'reason', 'cause', 'interpret', 'describe', 'summary', 'summarize'
        ]
        
        # If it's explicitly asking for explanation/complex insights, route to Gemini
        for kw in gemini_keywords:
            if kw in q:
                return 'GEMINI'
                
        # Keywords indicating simple rule-based calculations
        rule_keywords = [
            'average', 'mean', 'median', 'count', 'how many', 'max', 'min', 'highest', 'lowest', 'largest', 'smallest',
            'sum', 'total', 'standard deviation', 'std', 'variance', 'missing', 'null', 'empty', 'shape', 'dimension',
            'column', 'header', 'unique', 'distinct', 'rows', 'data type', 'datatype', 'types', 'duplicate'
        ]
        
        for kw in rule_keywords:
            if kw in q:
                return 'RULE_ENGINE'
                
        # If it doesn't match any standard keywords, it is a general natural language query, so route to Gemini
        return 'GEMINI'

    def ask(self, question: str, file_id: str = None, filename: str = "dataset.csv"):
        if self.df.empty:
            return {"success": False, "answer": "The dataset is empty.", "confidence": 0}
            
        classification = self.classify(question)
        
        if classification == 'RULE_ENGINE':
            intent = self._extract_intent(question)
            cols = self._extract_columns(question)
            
            if not cols and intent not in ['duplicate', 'count', 'missing', 'shape', 'columns', 'data_types', 'rows']:
                suggested = [c for c in self.columns[:5]]
                return {
                    "success": False,
                    "answer": f"I couldn't identify which column you mean. Did you mean one of these: {', '.join(suggested)}?",
                    "confidence": 30
                }
                
            try:
                result = self._execute(intent, cols, question)
                if result.get('success'):
                    result['confidence_label'] = "Rule-based Engine"
                    return result
            except Exception as e:
                pass

        # Call Gemini AI
        from app.services.ai_service import GeminiService, GeminiError
        from app.services.analysis_engine import IntelligentAnalyzer
        from app.services.visualization_engine import VisualizationEngine
        
        try:
            # 1. Dataset Name
            dataset_name = filename or "dataset.csv"
            
            # 2. Columns
            columns = self.columns
            
            # 3. Summary Statistics
            analyzer = IntelligentAnalyzer(self.df)
            summary_stats = {
                "general_stats": analyzer._general_stats(),
                "numeric_analysis": analyzer._numeric_analysis()
            }
            
            # 4. Detected Patterns
            patterns = analyzer._generate_insights()
            
            # 5. Chart Information
            chart_info = {}
            try:
                viz = VisualizationEngine(self.df, "", file_id or "temp")
                chart_type, x_col, y_col = viz._recommend_strategy()
                chart_info = {
                    "recommended_chart_type": chart_type,
                    "x_axis_column": x_col,
                    "y_axis_column": y_col
                }
            except Exception:
                chart_info = {"status": "No chart information available"}
                
            ai_answer = GeminiService.generate_qa_response(
                question=question,
                dataset_name=dataset_name,
                columns=columns,
                summary_stats=summary_stats,
                patterns=patterns,
                chart_info=chart_info
            )
            
            return {
                "success": True,
                "answer": ai_answer,
                "confidence": 95,
                "confidence_label": "Gemini AI"
            }
            
        except GeminiError as ge:
            # Fallback to Rule Engine if Gemini fails
            try:
                intent = self._extract_intent(question)
                cols = self._extract_columns(question)
                result = self._execute(intent, cols, question)
                if result.get('success'):
                    result['answer'] = f"[Gemini offline: {ge.message}. Rule Engine Fallback] " + result['answer']
                    result['confidence_label'] = "Rule-based Engine (Fallback)"
                    return result
            except Exception:
                pass
                
            return {
                "success": False,
                "answer": f"Gemini API Error ({ge.error_type}): {ge.message}",
                "confidence": 0
            }
        except Exception as e:
            return {
                "success": False,
                "answer": f"Error communicating with AI service: {str(e)}",
                "confidence": 0
            }

    def _execute(self, intent, cols, q):
        ans = ""
        conf = 80
        
        # Numeric/Categorical grouping
        numeric_cols = [c for c in cols if pd.api.types.is_numeric_dtype(self.df[c])]
        cat_cols = [c for c in cols if c not in numeric_cols]
        
        if intent == 'highest' or intent == 'lowest':
            if not numeric_cols:
                return {"success": False, "answer": "I need a numerical column to find the highest or lowest value.", "confidence": 90}
            metric_col = numeric_cols[0]
            
            if cat_cols: # E.g., "Which product generated highest sales"
                group_col = cat_cols[0]
                grouped = self.df.groupby(group_col)[metric_col].sum()
                if intent == 'highest':
                    val = grouped.max()
                    idx = grouped.idxmax()
                    ans = f"The {group_col} with the highest {metric_col} is '{idx}' with {val:,.2f}."
                else:
                    val = grouped.min()
                    idx = grouped.idxmin()
                    ans = f"The {group_col} with the lowest {metric_col} is '{idx}' with {val:,.2f}."
                conf = 95
            else: # E.g., "What is the highest sales"
                val = self.df[metric_col].max() if intent == 'highest' else self.df[metric_col].min()
                word = "highest" if intent == 'highest' else "lowest"
                ans = f"The {word} value in {metric_col} is {val:,.2f}."
                conf = 90
                
        elif intent == 'average':
            if not numeric_cols:
                return {"success": False, "answer": "I need a numerical column to calculate the average.", "confidence": 90}
            val = self.df[numeric_cols[0]].mean()
            ans = f"The average {numeric_cols[0]} is {val:,.2f}."
            conf = 95
            
        elif intent == 'median':
            if not numeric_cols:
                return {"success": False, "answer": "I need a numerical column to calculate the median.", "confidence": 90}
            val = self.df[numeric_cols[0]].median()
            ans = f"The median {numeric_cols[0]} is {val:,.2f}."
            conf = 95
            
        elif intent == 'std_dev':
            if not numeric_cols:
                return {"success": False, "answer": "I need a numerical column to calculate the standard deviation.", "confidence": 90}
            val = self.df[numeric_cols[0]].std()
            ans = f"The standard deviation of {numeric_cols[0]} is {val:,.2f}."
            conf = 95
            
        elif intent == 'variance':
            if not numeric_cols:
                return {"success": False, "answer": "Variance requires a numerical column.", "confidence": 90}
            val = self.df[numeric_cols[0]].var()
            ans = f"The variance of {numeric_cols[0]} is {val:,.2f}."
            conf = 95

        elif intent == 'sum':
            if not numeric_cols:
                return {"success": False, "answer": "I need a numerical column to calculate the total sum.", "confidence": 90}
            val = self.df[numeric_cols[0]].sum()
            ans = f"The total sum of {numeric_cols[0]} is {val:,.2f}."
            conf = 95
            
        elif intent == 'unique':
            col = cols[0]
            val = self.df[col].nunique()
            ans = f"There are {val} unique values in {col}."
            conf = 95
            
        elif intent == 'missing':
            if cols:
                col = cols[0]
                val = self.df[col].isnull().sum()
                ans = f"There are {val} missing values in {col}."
            else:
                val = self.df.isnull().sum().sum()
                ans = f"There are {val} missing values in the dataset."
            conf = 95
            
        elif intent == 'most_frequent':
            col = cols[0]
            val = self.df[col].mode()[0]
            freq = (self.df[col] == val).sum()
            ans = f"The most frequent value in {col} is '{val}', appearing {freq} times."
            conf = 95
            
        elif intent == 'duplicate':
            val = self.df.duplicated().sum()
            ans = f"There are {val} completely duplicated rows in the dataset."
            conf = 95
            
        elif intent == 'count':
            if cols:
                val = self.df[cols[0]].count()
                ans = f"There are {val} non-empty records in {cols[0]}."
            else:
                val = len(self.df)
                ans = f"There are {val} total records in the dataset."
            conf = 95

        elif intent == 'shape':
            rows, cols_cnt = self.df.shape
            ans = f"The dataset shape is {rows} rows by {cols_cnt} columns."
            conf = 95

        elif intent == 'columns':
            ans = f"The columns in this dataset are: {', '.join(self.columns)}."
            conf = 95

        elif intent == 'data_types':
            types_str = ", ".join([f"{col} ({dtype})" for col, dtype in self.df.dtypes.items()])
            ans = f"The data types of the columns are: {types_str}."
            conf = 95

        elif intent == 'rows':
            ans = f"There are {len(self.df)} total rows in the dataset."
            conf = 95
            
        else:
            # Fallback
            if cols:
                col = cols[0]
                ans = f"You mentioned {col}. It contains {self.df[col].nunique()} unique values and has {self.df[col].isnull().sum()} missing entries."
                conf = 60
            else:
                ans = f"The dataset contains {len(self.df)} rows and {len(self.columns)} columns."
                conf = 50

        return {
            "success": True,
            "answer": ans,
            "confidence": conf
        }
