"""公开验收测试，数值为独立的合成样例。"""
import unittest
from checker import compare

class CompareTests(unittest.TestCase):
    def test_equal_without_tolerance(self):
        self.assertEqual(compare(8, 8), {"status": "match", "difference": 0})
    def test_missing(self):
        self.assertEqual(compare(None, 8), {"status": "unknown", "difference": None})
    def test_missing_tolerance(self):
        self.assertEqual(compare(8, 9), {"status": "unknown", "difference": 1})
    def test_within_tolerance(self):
        self.assertEqual(compare(8, 9, 1), {"status": "match", "difference": 1})
    def test_outside_tolerance(self):
        self.assertEqual(compare(8, 10, 1), {"status": "different", "difference": 2})
    def test_negative_tolerance(self):
        with self.assertRaises(ValueError): compare(8, 9, -1)

if __name__ == '__main__': unittest.main()
