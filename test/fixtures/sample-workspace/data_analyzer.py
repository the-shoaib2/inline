"""
Data Analysis and Visualization Tool
A comprehensive Python module for analyzing and visualizing data
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict, Tuple, Optional
import json
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')

class DataAnalyzer:
    """Main class for data analysis operations"""

    def __init__(self, data_source: str = None):
        self.data = None
        self.metadata = {
            'created_at': datetime.now(),
            'last_modified': datetime.now(),
            'source': data_source,
            'operations_performed': []
        }

        if data_source:
            self.load_data(data_source)

    def load_data(self, file_path: str) -> None:
        """Load data from various file formats"""
        try:
            if file_path.endswith('.csv'):
                self.data = pd.read_csv(file_path)
            elif file_path.endswith('.json'):
                self.data = pd.read_json(file_path)
            elif file_path.endswith('.xlsx'):
                self.data = pd.read_excel(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_path}")

            self.metadata['last_modified'] = datetime.now()
            self.metadata['operations_performed'].append(f"Loaded data from {file_path}")

        except Exception as e:
            raise Exception(f"Error loading data: {str(e)}")

    def generate_sample_data(self, rows: int = 1000) -> None:
        """Generate sample data for testing"""
        np.random.seed(42)

        self.data = pd.DataFrame({
            'id': range(1, rows + 1),
            'name': [f'Item_{i}' for i in range(1, rows + 1)],
            'category': np.random.choice(['A', 'B', 'C', 'D'], rows),
            'value': np.random.normal(100, 25, rows),
            'quantity': np.random.poisson(10, rows),
            'date': pd.date_range('2023-01-01', periods=rows, freq='D'),
            'active': np.random.choice([True, False], rows, p=[0.7, 0.3])
        })

        self.metadata['operations_performed'].append(f"Generated {rows} rows of sample data")

    def get_summary_statistics(self) -> Dict:
        """Generate comprehensive summary statistics"""
        if self.data is None:
            raise ValueError("No data loaded")

        summary = {
            'shape': self.data.shape,
            'columns': list(self.data.columns),
            'dtypes': self.data.dtypes.to_dict(),
            'missing_values': self.data.isnull().sum().to_dict(),
            'numeric_summary': self.data.describe().to_dict()
        }

        # Add categorical summaries
        categorical_cols = self.data.select_dtypes(include=['object', 'category']).columns
        for col in categorical_cols:
            summary[f'{col}_value_counts'] = self.data[col].value_counts().to_dict()

        return summary

    def filter_data(self, conditions: Dict) -> 'DataAnalyzer':
        """Filter data based on conditions"""
        if self.data is None:
            raise ValueError("No data loaded")

        filtered_data = self.data.copy()

        for column, condition in conditions.items():
            if isinstance(condition, dict):
                if 'min' in condition:
                    filtered_data = filtered_data[filtered_data[column] >= condition['min']]
                if 'max' in condition:
                    filtered_data = filtered_data[filtered_data[column] <= condition['max']]
                if 'values' in condition:
                    filtered_data = filtered_data[filtered_data[column].isin(condition['values'])]
            else:
                filtered_data = filtered_data[filtered_data[column] == condition]

        new_analyzer = DataAnalyzer()
        new_analyzer.data = filtered_data
        new_analyzer.metadata = self.metadata.copy()
        new_analyzer.metadata['operations_performed'].append(f"Filtered data: {conditions}")

        return new_analyzer

    def group_and_aggregate(self, group_by: str, aggregations: Dict) -> pd.DataFrame:
        """Group data and perform aggregations"""
        if self.data is None:
            raise ValueError("No data loaded")

        result = self.data.groupby(group_by).agg(aggregations).reset_index()

        self.metadata['operations_performed'].append(
            f"Grouped by {group_by} with aggregations: {aggregations}"
        )

        return result

    def create_visualization(self, plot_type: str, **kwargs) -> str:
        """Create various types of visualizations"""
        if self.data is None:
            raise ValueError("No data loaded")

        plt.style.use('seaborn-v0_8')
        fig, ax = plt.subplots(figsize=(10, 6))

        if plot_type == 'histogram':
            column = kwargs.get('column', self.data.select_dtypes(include=[np.number]).columns[0])
            ax.hist(self.data[column], bins=kwargs.get('bins', 30), alpha=0.7)
            ax.set_xlabel(column)
            ax.set_ylabel('Frequency')
            ax.set_title(f'Distribution of {column}')

        elif plot_type == 'scatter':
            x_col = kwargs.get('x', self.data.select_dtypes(include=[np.number]).columns[0])
            y_col = kwargs.get('y', self.data.select_dtypes(include=[np.number]).columns[1])
            ax.scatter(self.data[x_col], self.data[y_col], alpha=0.6)
            ax.set_xlabel(x_col)
            ax.set_ylabel(y_col)
            ax.set_title(f'{x_col} vs {y_col}')

        elif plot_type == 'bar':
            column = kwargs.get('column', self.data.select_dtypes(include=['object']).columns[0])
            value_counts = self.data[column].value_counts()
            ax.bar(value_counts.index, value_counts.values)
            ax.set_xlabel(column)
            ax.set_ylabel('Count')
            ax.set_title(f'Count of {column}')
            plt.xticks(rotation=45)

        elif plot_type == 'line':
            x_col = kwargs.get('x', self.data.columns[0])
            y_col = kwargs.get('y', self.data.columns[1])
            ax.plot(self.data[x_col], self.data[y_col], marker='o')
            ax.set_xlabel(x_col)
            ax.set_ylabel(y_col)
            ax.set_title(f'{y_col} over {x_col}')

        # Save plot
        filename = f"plot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        plt.tight_layout()
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        plt.close()

        self.metadata['operations_performed'].append(f"Created {plot_type} plot: {filename}")

        return filename

    def export_results(self, filename: str, format: str = 'csv') -> None:
        """Export analysis results"""
        if self.data is None:
            raise ValueError("No data loaded")

        if format == 'csv':
            self.data.to_csv(filename, index=False)
        elif format == 'json':
            self.data.to_json(filename, orient='records', indent=2)
        elif format == 'excel':
            self.data.to_excel(filename, index=False)
        else:
            raise ValueError(f"Unsupported export format: {format}")

        self.metadata['operations_performed'].append(f"Exported data to {filename}")

    def get_metadata(self) -> Dict:
        """Return analysis metadata"""
        return self.metadata


class ReportGenerator:
    """Generate analysis reports"""

    @staticmethod
    def generate_summary_report(analyzer: DataAnalyzer) -> str:
        """Generate a comprehensive summary report"""
        summary = analyzer.get_summary_statistics()
        metadata = analyzer.get_metadata()

        report = f"""
DATA ANALYSIS REPORT
===================

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Data Source: {metadata.get('source', 'Unknown')}

DATASET OVERVIEW
----------------
Shape: {summary['shape'][0]} rows × {summary['shape'][1]} columns
Columns: {', '.join(summary['columns'])}

MISSING VALUES
--------------
"""

        for col, missing in summary['missing_values'].items():
            if missing > 0:
                report += f"{col}: {missing} ({missing/summary['shape'][0]*100:.1f}%)\n"

        report += "\nOPERATIONS PERFORMED\n-------------------\n"
        for op in metadata['operations_performed']:
            report += f"• {op}\n"

        return report


# Example usage and testing
def main():
    """Main function for demonstration"""
    print("Data Analysis Tool Demo")
    print("=" * 50)

    # Create analyzer and generate sample data
    analyzer = DataAnalyzer()
    analyzer.generate_sample_data(500)

    # Get summary statistics
    summary = analyzer.get_summary_statistics()
    print(f"Dataset shape: {summary['shape']}")
    print(f"Columns: {summary['columns']}")

    # Filter data
    filtered_analyzer = analyzer.filter_data({
        'value': {'min': 80, 'max': 120},
        'active': True
    })

    print(f"Filtered dataset shape: {filtered_analyzer.data.shape}")

    # Group and aggregate
    grouped_data = analyzer.group_and_aggregate('category', {
        'value': ['mean', 'std'],
        'quantity': ['sum', 'count']
    })

    print("\nGrouped data:")
    print(grouped_data)

    # Create visualization
    plot_file = analyzer.create_visualization('histogram', column='value', bins=20)
    print(f"\nCreated visualization: {plot_file}")

    # Generate report
    report = ReportGenerator.generate_summary_report(analyzer)
    print(report)

    # Export results
    analyzer.export_results('analysis_results.csv', 'csv')
    print("Results exported to analysis_results.csv")


if __name__ == "__main__":
    main()
