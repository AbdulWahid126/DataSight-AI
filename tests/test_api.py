import unittest
import os
import json
import pandas as pd
from app import create_app
from app.services.question_engine import QuestionEngine
from app.services.ai_service import GeminiService, MissingAPIKeyError

class APITestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SECRET_KEY': 'test_secret'})
        self.client = self.app.test_client()
        self.df = pd.DataFrame({
            'Product': ['Laptop', 'Phone', 'Desk'],
            'Category': ['Electronics', 'Electronics', 'Furniture'],
            'Sales': [1000.0, 500.0, 300.0],
            'Profit': [200.0, 100.0, 50.0]
        })
        
    def test_rule_classifier(self):
        engine = QuestionEngine(self.df)
        
        # Simple statistical/structural keywords
        self.assertEqual(engine.classify("average sales"), "RULE_ENGINE")
        self.assertEqual(engine.classify("median profit"), "RULE_ENGINE")
        self.assertEqual(engine.classify("standard deviation of sales"), "RULE_ENGINE")
        self.assertEqual(engine.classify("dataset shape"), "RULE_ENGINE")
        self.assertEqual(engine.classify("columns in dataset"), "RULE_ENGINE")
        self.assertEqual(engine.classify("data types"), "RULE_ENGINE")
        self.assertEqual(engine.classify("how many rows"), "RULE_ENGINE")
        
        # Complex concepts/explain keywords -> Gemini
        self.assertEqual(engine.classify("why are laptop sales high?"), "GEMINI")
        self.assertEqual(engine.classify("explain the profit patterns"), "GEMINI")
        self.assertEqual(engine.classify("give recommendations for product categories"), "GEMINI")

    def test_rule_execution(self):
        engine = QuestionEngine(self.df)
        
        # Test Median
        res = engine.ask("median sales")
        self.assertTrue(res['success'])
        self.assertIn("500", res['answer'])
        
        # Test Std Dev
        res = engine.ask("standard deviation of profit")
        self.assertTrue(res['success'])
        self.assertIn("76.38", res['answer']) # std of [200, 100, 50] is ~76.38
        
        # Test Shape
        res = engine.ask("what is the shape of dataset")
        self.assertTrue(res['success'])
        self.assertIn("3 rows", res['answer'])
        
        # Test Columns
        res = engine.ask("what are the columns")
        self.assertTrue(res['success'])
        self.assertIn("Product", res['answer'])
        
        # Test Data Types
        res = engine.ask("data types")
        self.assertTrue(res['success'])
        self.assertIn("float64", res['answer'])

        # Test Rows
        res = engine.ask("number of rows")
        self.assertTrue(res['success'])
        self.assertIn("3", res['answer'])

    def test_gemini_missing_api_key(self):
        # Temporarily unset GEMINI_API_KEY from environment to trigger error
        original_key = os.environ.get("GEMINI_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]
            
        try:
            with self.assertRaises(MissingAPIKeyError):
                GeminiService.generate_qa_response("concept?", "test.csv", [], {}, [], {})
        finally:
            # Restore
            if original_key is not None:
                os.environ["GEMINI_API_KEY"] = original_key

if __name__ == '__main__':
    unittest.main()
