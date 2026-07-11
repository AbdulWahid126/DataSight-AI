import os
import uuid
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg') # Headless backend for Flask
import matplotlib.pyplot as plt
from datetime import datetime

class VisualizationEngine:
    def __init__(self, df: pd.DataFrame, app_static_folder: str, file_id: str):
        self.df = df
        self.static_folder = app_static_folder
        self.file_id = file_id
        
        # Ensure charts directory exists
        self.charts_dir = os.path.join(self.static_folder, 'charts')
        if not os.path.exists(self.charts_dir):
            os.makedirs(self.charts_dir)
            
        # Determine column types
        self.numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        self.date_cols = [c for c in self.df.columns if pd.api.types.is_datetime64_any_dtype(self.df[c])]
        self.cat_cols = [c for c in self.df.columns if c not in self.numeric_cols and c not in self.date_cols]

    def _recommend_strategy(self):
        """Returns tuple: (chart_type, x_col, y_col)"""
        if self.date_cols and self.numeric_cols:
            # Line Chart
            return 'line', self.date_cols[0], self.numeric_cols[0]
            
        if self.cat_cols:
            # Pick categorical column with fewest unique values
            best_cat = min(self.cat_cols, key=lambda c: self.df[c].nunique())
            nunique = self.df[best_cat].nunique()
            
            if 0 < nunique <= 7:
                # Pie Chart
                return 'pie', best_cat, None
            elif 7 < nunique <= 20 and self.numeric_cols:
                # Bar Chart
                return 'bar', best_cat, self.numeric_cols[0]
            elif nunique > 20 and self.numeric_cols:
                # Horizontal Bar for many categories (top 15)
                return 'hbar', best_cat, self.numeric_cols[0]
                
        if len(self.numeric_cols) >= 2:
            # Scatter Plot
            return 'scatter', self.numeric_cols[0], self.numeric_cols[1]
            
        if len(self.numeric_cols) == 1:
            # Histogram
            return 'histogram', self.numeric_cols[0], None
            
        # Fallback if only string columns with high cardinality
        if self.cat_cols:
            return 'bar', self.cat_cols[0], None
            
        return None, None, None

    def generate(self):
        chart_type, x_col, y_col = self._recommend_strategy()
        
        if not chart_type:
            raise ValueError("Could not determine a suitable chart for this dataset.")
            
        # Generate Chart
        filename = f"{self.file_id}_{chart_type}_{uuid.uuid4().hex[:6]}.png"
        filepath = os.path.join(self.charts_dir, filename)
        
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Style
        plt.style.use('dark_background')
        fig.patch.set_facecolor('#0f172a') # Tailwind slate-950
        ax.set_facecolor('#0f172a')
        color = '#3b82f6' # Tailwind blue-500
        
        explanation = ""
        
        if chart_type == 'line':
            df_agg = self.df.groupby(x_col)[y_col].sum().sort_index()
            ax.plot(df_agg.index, df_agg.values, color=color, linewidth=2, marker='o')
            ax.set_title(f"{y_col} Over Time")
            ax.set_xlabel(x_col)
            ax.set_ylabel(y_col)
            explanation = f"The line chart shows the trend of {y_col} across {x_col}. It tracks changes sequentially over time."
            
        elif chart_type == 'pie':
            counts = self.df[x_col].value_counts()
            ax.pie(counts.values, labels=counts.index, autopct='%1.1f%%', startangle=90, colors=plt.cm.Paired.colors)
            ax.set_title(f"Distribution of {x_col}")
            top_cat = counts.index[0]
            explanation = f"The {top_cat} category represents the largest share ({round(counts.values[0]/counts.sum()*100, 1)}%) of {x_col}."
            
        elif chart_type == 'bar':
            if y_col:
                df_agg = self.df.groupby(x_col)[y_col].sum().sort_values(ascending=False).head(15)
                ax.bar(df_agg.index.astype(str), df_agg.values, color=color)
                ax.set_ylabel(f"Total {y_col}")
                title = f"Top 15 {x_col} by {y_col}"
                top_cat = df_agg.index[0]
                explanation = f"The bar chart highlights that '{top_cat}' has the highest total {y_col}."
            else:
                counts = self.df[x_col].value_counts().head(15)
                ax.bar(counts.index.astype(str), counts.values, color=color)
                ax.set_ylabel("Frequency")
                title = f"Top 15 Most Frequent {x_col}"
                explanation = f"The bar chart shows the frequency of the top categories in {x_col}."
                
            ax.set_title(title)
            ax.set_xlabel(x_col)
            plt.xticks(rotation=45, ha='right')
            
        elif chart_type == 'hbar':
            df_agg = self.df.groupby(x_col)[y_col].sum().sort_values(ascending=True).tail(15)
            ax.barh(df_agg.index.astype(str), df_agg.values, color=color)
            ax.set_title(f"Top 15 {x_col} by {y_col}")
            ax.set_xlabel(f"Total {y_col}")
            ax.set_ylabel(x_col)
            top_cat = df_agg.index[-1]
            explanation = f"The horizontal bar chart shows '{top_cat}' leading in {y_col} compared to other categories."
            
        elif chart_type == 'scatter':
            ax.scatter(self.df[x_col], self.df[y_col], color=color, alpha=0.6)
            ax.set_title(f"Relationship between {x_col} and {y_col}")
            ax.set_xlabel(x_col)
            ax.set_ylabel(y_col)
            explanation = f"The scatter plot explores the correlation and spread between {x_col} and {y_col}."
            
        elif chart_type == 'histogram':
            ax.hist(self.df[x_col].dropna(), bins=30, color=color, edgecolor='white')
            ax.set_title(f"Distribution of {x_col}")
            ax.set_xlabel(x_col)
            ax.set_ylabel("Frequency")
            explanation = f"The histogram shows the underlying frequency distribution of {x_col}."

        ax.grid(True, linestyle='--', alpha=0.3, color='gray')
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
        plt.close(fig)
        
        return {
            "chart_type": chart_type.capitalize().replace('Hbar', 'Horizontal Bar') + " Chart",
            "chart_path": f"/static/charts/{filename}",
            "explanation": explanation
        }
