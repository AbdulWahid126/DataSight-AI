import pandas as pd
import numpy as np

class IntelligentAnalyzer:
    def __init__(self, df: pd.DataFrame):
        self.df = df
        
        # Identify column types
        self.numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        
        datetime_cols = []
        for col in self.df.columns:
            if pd.api.types.is_datetime64_any_dtype(self.df[col]):
                datetime_cols.append(col)
                
        self.date_cols = datetime_cols
        self.cat_cols = [col for col in self.df.columns if col not in self.numeric_cols and col not in self.date_cols]

    def analyze(self):
        """Runs all analysis modules and returns a structured dictionary."""
        return {
            "general_stats": self._general_stats(),
            "numeric_analysis": self._numeric_analysis(),
            "categorical_analysis": self._categorical_analysis(),
            "date_analysis": self._date_analysis(),
            "correlation_matrix": self._correlation_analysis(),
            "data_quality": self._data_quality_report(),
            "insights": self._generate_insights()
        }

    def _general_stats(self):
        total_rows = len(self.df)
        total_cols = len(self.df.columns)
        total_missing = int(self.df.isnull().sum().sum())
        total_cells = total_rows * total_cols
        
        unique_counts = {col: int(self.df[col].nunique()) for col in self.df.columns}
        
        return {
            "total_records": total_rows,
            "total_columns": total_cols,
            "missing_values": total_missing,
            "duplicate_rows": int(self.df.duplicated().sum()),
            "memory_usage_mb": round(self.df.memory_usage(deep=True).sum() / (1024 * 1024), 2),
            "data_types": {col: str(dtype) for col, dtype in self.df.dtypes.items()},
            "unique_values_per_column": unique_counts,
            "null_percentage": round((total_missing / total_cells) * 100, 2) if total_cells > 0 else 0
        }

    def _numeric_analysis(self):
        analysis = {}
        for col in self.numeric_cols:
            series = self.df[col]
            clean_series = series.dropna()
            
            if len(clean_series) == 0:
                continue
                
            q1 = float(clean_series.quantile(0.25))
            q3 = float(clean_series.quantile(0.75))
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            outlier_count = int(((clean_series < lower_bound) | (clean_series > upper_bound)).sum())
            
            mode_val = clean_series.mode()
            mode = float(mode_val.iloc[0]) if not mode_val.empty else None

            analysis[col] = {
                "mean": round(float(clean_series.mean()), 4),
                "median": round(float(clean_series.median()), 4),
                "mode": mode,
                "min": round(float(clean_series.min()), 4),
                "max": round(float(clean_series.max()), 4),
                "range": round(float(clean_series.max() - clean_series.min()), 4),
                "std_dev": round(float(clean_series.std()), 4) if len(clean_series) > 1 else 0,
                "variance": round(float(clean_series.var()), 4) if len(clean_series) > 1 else 0,
                "p25": q1,
                "p50": round(float(clean_series.quantile(0.50)), 4),
                "p75": q3,
                "sum": round(float(clean_series.sum()), 4),
                "count": int(clean_series.count()),
                "missing_count": int(series.isnull().sum()),
                "outlier_count": outlier_count
            }
        return analysis

    def _categorical_analysis(self):
        analysis = {}
        for col in self.cat_cols:
            series = self.df[col]
            value_counts = series.value_counts()
            
            if len(value_counts) == 0:
                continue
                
            top_10 = value_counts.head(10).to_dict()
            total_count = len(series.dropna())
            
            analysis[col] = {
                "unique_categories": int(series.nunique()),
                "most_frequent": str(value_counts.index[0]),
                "least_frequent": str(value_counts.index[-1]),
                "missing_count": int(series.isnull().sum()),
                "top_10": {str(k): int(v) for k, v in top_10.items()},
                "percentage_distribution": {str(k): round((v/total_count)*100, 2) for k, v in top_10.items()} if total_count > 0 else {}
            }
        return analysis

    def _date_analysis(self):
        analysis = {}
        for col in self.date_cols:
            series = self.df[col].dropna()
            if len(series) == 0:
                continue
            
            earliest = series.min()
            latest = series.max()
            span = latest - earliest
            
            analysis[col] = {
                "earliest_date": earliest.isoformat() if pd.notnull(earliest) else None,
                "latest_date": latest.isoformat() if pd.notnull(latest) else None,
                "time_span_days": span.days if pd.notnull(span) else 0
            }
        return analysis

    def _correlation_analysis(self):
        if len(self.numeric_cols) < 2:
            return {}
        corr_matrix = self.df[self.numeric_cols].corr().fillna(0)
        return corr_matrix.to_dict()

    def _data_quality_report(self):
        report = {
            "high_missing": [],
            "constant_columns": [],
            "potential_ids": [],
            "potential_targets": [],
            "mixed_types": []
        }
        
        total_rows = len(self.df)
        if total_rows == 0:
            return report
            
        for col in self.df.columns:
            series = self.df[col]
            missing_pct = series.isnull().sum() / total_rows
            nunique = series.nunique()
            
            if missing_pct > 0.5:
                report["high_missing"].append(col)
                
            if nunique == 1:
                report["constant_columns"].append(col)
                
            if nunique == total_rows and series.dtype in ['int64', 'object']:
                report["potential_ids"].append(col)
                
            if 2 <= nunique <= 10 and col in self.cat_cols:
                report["potential_targets"].append(col)
                
            if series.dtype == 'object':
                types = series.dropna().map(type).nunique()
                if types > 1:
                    report["mixed_types"].append(col)
                    
        return report

    def _generate_insights(self):
        insights = []
        
        total_missing = self.df.isnull().sum().sum()
        if total_missing == 0:
            insights.append("The dataset is highly complete with zero missing values.")
        else:
            insights.append(f"The dataset contains {total_missing} missing values across all columns.")
            
        if self.numeric_cols:
            var_dict = {col: self.df[col].var() for col in self.numeric_cols if len(self.df[col].dropna()) > 1}
            if var_dict:
                highest_var_col = max(var_dict, key=var_dict.get)
                insights.append(f"'{highest_var_col}' has the highest variance among numeric columns, indicating a wide spread of values.")
                
        outlier_cols = []
        for col in self.numeric_cols:
            s = self.df[col].dropna()
            if len(s) > 0:
                q1 = s.quantile(0.25)
                q3 = s.quantile(0.75)
                iqr = q3 - q1
                outliers = ((s < (q1 - 1.5 * iqr)) | (s > (q3 + 1.5 * iqr))).sum()
                if outliers > 0:
                    outlier_cols.append(col)
        
        if outlier_cols:
            insights.append(f"Found potential outliers in {len(outlier_cols)} columns, including '{outlier_cols[0]}'.")
            
        for col in self.cat_cols:
            nunique = self.df[col].nunique()
            if nunique > 0 and nunique <= 5:
                insights.append(f"'{col}' has only {nunique} unique categories, making it a good candidate for grouping or classification.")
                break 
                
        constants = [col for col in self.df.columns if self.df[col].nunique() == 1]
        if constants:
            insights.append(f"'{constants[0]}' contains a single constant value for all records and provides no variance.")
            
        if len(self.numeric_cols) >= 2:
            corr_matrix = self.df[self.numeric_cols].corr()
            corr_values = corr_matrix.values.copy()
            np.fill_diagonal(corr_values, 0)
            corr_matrix = pd.DataFrame(corr_values, index=corr_matrix.index, columns=corr_matrix.columns)
            if not corr_matrix.empty and not corr_matrix.isna().all().all():
                max_corr = corr_matrix.max().max()
                if max_corr > 0.7:
                    cols = corr_matrix.columns
                    found = False
                    for i in cols:
                        for j in cols:
                            if corr_matrix.loc[i, j] == max_corr:
                                insights.append(f"Strong positive correlation ({max_corr:.2f}) found between '{i}' and '{j}'.")
                                found = True
                                break
                        if found: break
                        
        dups = self.df.duplicated().sum()
        if dups > 0:
            insights.append(f"The dataset contains {dups} fully duplicated rows.")
            
        if len(insights) < 10 and self.numeric_cols:
            insights.append(f"Analyzed {len(self.numeric_cols)} numerical features for distributions and central tendencies.")
        if len(insights) < 10 and self.cat_cols:
            insights.append(f"Analyzed {len(self.cat_cols)} categorical features for frequency and cardinality.")
        if len(insights) < 10:
            insights.append(f"Total dataset footprint is approximately {round(self.df.memory_usage(deep=True).sum() / (1024 * 1024), 2)} MB.")
            
        return insights
