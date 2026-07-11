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
            'sum': ['sum', 'total'],
            'count': ['count', 'how many'],
            'unique': ['unique', 'distinct'],
            'missing': ['missing', 'null', 'empty'],
            'most_frequent': ['most frequent', 'most common', 'popular', 'frequently'],
            'least_frequent': ['least frequent', 'least common'],
            'variance': ['variance', 'spread'],
            'duplicate': ['duplicate']
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

    def ask(self, question: str):
        if self.df.empty:
            return {"success": False, "answer": "The dataset is empty.", "confidence": 0}
            
        intent = self._extract_intent(question)
        cols = self._extract_columns(question)
        
        if not cols and intent not in ['duplicate', 'count']:
            suggested = [c for c in self.columns[:5]]
            return {
                "success": False,
                "answer": f"I couldn't identify which column you mean. Did you mean one of these: {', '.join(suggested)}?",
                "confidence": 30
            }
            
        try:
            return self._execute(intent, cols, question)
        except Exception as e:
            return {"success": False, "answer": f"I couldn't process that question properly.", "confidence": 10}

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
            col = cols[0]
            val = self.df[col].isnull().sum()
            ans = f"There are {val} missing values in {col}."
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
            
        elif intent == 'variance':
            if not numeric_cols:
                return {"success": False, "answer": "Variance requires a numerical column.", "confidence": 90}
            val = self.df[numeric_cols[0]].var()
            ans = f"The variance of {numeric_cols[0]} is {val:,.2f}."
            conf = 95
            
        else:
            # Fallback
            col = cols[0]
            ans = f"You mentioned {col}. It contains {self.df[col].nunique()} unique values and has {self.df[col].isnull().sum()} missing entries."
            conf = 60

        return {
            "success": True,
            "answer": ans,
            "confidence": conf
        }
