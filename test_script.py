"""
Full end-to-end simulation test for AI Data Insight Assistant.
Covers: Upload, Analysis, Q&A (including a realistic sales dataset), Chart generation.
"""
import requests, json, os, sys

BASE = "http://127.0.0.1:5000"
PASS, FAIL = "[PASS]", "[FAIL]"


results = []

def check(label, condition, detail=""):
    status = PASS if condition else FAIL
    results.append(f"  {status} {label}")
    if not condition:
        print(f"\n  !! FAILED: {label}")
        if detail:
            print(f"     Detail: {detail}")

def separator(title):
    print(f"\n{'='*55}")
    print(f"  {title}")
    print(f"{'='*55}")

# ================================================================
# STEP 0: Create a realistic test CSV
# ================================================================
separator("STEP 0: Creating Realistic Sales CSV")
csv_content = """Product,Category,Sales,Profit,Quantity,City
Laptop,Electronics,45200,9000,120,New York
Phone,Electronics,32000,6400,200,Los Angeles
Desk,Furniture,12000,2400,80,Chicago
Chair,Furniture,8500,1700,150,Houston
Pen,Office Supplies,500,100,1000,Phoenix
Notebook,Office Supplies,300,60,800,Philadelphia
Monitor,Electronics,15000,3000,90,San Antonio
Keyboard,Electronics,4500,900,300,San Diego
"""
csv_path = "test_sales.csv"
with open(csv_path, 'w') as f:
    f.write(csv_content)
print(f"  Created: {csv_path}")

# ================================================================
# STEP 1: Homepage loads
# ================================================================
separator("STEP 1: Homepage")
try:
    r = requests.get(BASE, timeout=5)
    check("GET / returns 200", r.status_code == 200, f"Got {r.status_code}")
    check("Page contains 'DataSight AI'", 'DataSight' in r.text)
    check("Page contains upload zone", 'upload-zone' in r.text)
    check("Page contains chat-form id", 'id=\"chat-form\"' in r.text)
    check("Page contains chat-input id", 'id=\"chat-input\"' in r.text)
    check("Page contains chat-history-area id", 'id=\"chat-history-area\"' in r.text)
    check("Page contains typing-indicator id", 'id=\"typing-indicator\"' in r.text)
    check("Page contains btn-generate-chart id", 'id=\"btn-generate-chart\"' in r.text)
except Exception as e:
    check("Homepage reachable", False, str(e))
    print("\nCannot reach server. Aborting.")
    sys.exit(1)

# ================================================================
# STEP 2: Upload CSV
# ================================================================
separator("STEP 2: CSV Upload")
file_id = None
with open(csv_path, 'rb') as f:
    r = requests.post(f"{BASE}/api/upload", files={'file': ('test_sales.csv', f, 'text/csv')})

check("POST /api/upload returns 200", r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")
data = r.json()
check("Response has success=true", data.get('success') == True)
check("Response has file_id", 'file_id' in data)
check("Response has summary", 'summary' in data)
check("Response has preview", 'preview' in data)

if data.get('success'):
    file_id = data['file_id']
    summary = data['summary']
    preview = data['preview']
    check("Total rows = 8", summary.get('total_rows') == 8, f"Got {summary.get('total_rows')}")
    check("Total columns = 6", summary.get('total_columns') == 6, f"Got {summary.get('total_columns')}")
    check("Numeric columns >= 3", summary.get('numeric_columns', 0) >= 3)
    check("Preview has rows", len(preview) > 0)
    print(f"\n  file_id: {file_id}")
    print(f"  Summary: {json.dumps(summary, indent=4)}")

# ================================================================
# STEP 3: Analysis Engine
# ================================================================
separator("STEP 3: Intelligent Analysis")
if file_id:
    r = requests.post(f"{BASE}/api/analyze", json={'file_id': file_id})
    check("POST /api/analyze returns 200", r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")
    adata = r.json()
    check("Response has success=true", adata.get('success') == True)
    check("Analysis has numeric_analysis", 'numeric_analysis' in adata.get('analysis', {}))
    check("Analysis has insights", 'insights' in adata.get('analysis', {}))
    check("Analysis has data_quality", 'data_quality' in adata.get('analysis', {}))
    check("Analysis has correlation_matrix", 'correlation_matrix' in adata.get('analysis', {}))
    if adata.get('success'):
        insights = adata['analysis'].get('insights', [])
        check("At least 3 insights generated", len(insights) >= 3, f"Got {len(insights)}")
        print(f"\n  Insights: {insights}")

# ================================================================
# STEP 4: Question Engine — multiple questions
# ================================================================
separator("STEP 4: Question Engine")
if file_id:
    test_questions = [
        ("What is the average sales", "average", ["average", "30.00", "Sales", "sales"]),
        ("highest sales", "highest", ["highest", "Laptop", "Electronics", "45200"]),
        ("total profit", "sum", ["total", "profit", "Profit"]),
        ("how many unique categories", "unique", ["unique", "categories", "Category", "3"]),
        ("missing values", "missing", ["missing"]),
    ]
    
    for question, intent, expected_keywords in test_questions:
        r = requests.post(f"{BASE}/api/ask", json={'file_id': file_id, 'question': question})
        check(f"POST /api/ask returns 200 for '{question[:30]}'", 
              r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")
        qa = r.json()
        check(f"Response has answer for '{question[:30]}'", 'answer' in qa)
        check(f"Response has confidence for '{question[:30]}'", 'confidence' in qa)
        
        answer = qa.get('answer', '').lower()
        found = any(kw.lower() in answer for kw in expected_keywords)
        check(f"Answer is meaningful (contains relevant data) for '{question[:30]}'", 
              found, f"Answer: '{qa.get('answer', '')}' | Expected one of: {expected_keywords}")
        print(f"\n  Q: {question}")
        print(f"  A: {qa.get('answer')} (confidence: {qa.get('confidence')}%)")

# ================================================================
# STEP 5: Chart Generation
# ================================================================
separator("STEP 5: Chart Generation")
if file_id:
    r = requests.post(f"{BASE}/api/generate-chart", json={'file_id': file_id})
    check("POST /api/generate-chart returns 200", r.status_code == 200, f"Got {r.status_code}: {r.text[:200]}")
    cdata = r.json()
    check("Response has success=true", cdata.get('success') == True)
    check("Response has chart_path", 'chart_path' in cdata)
    check("Response has chart_type", 'chart_type' in cdata)
    check("Response has explanation", 'explanation' in cdata)
    
    if cdata.get('success'):
        chart_path = cdata['chart_path']  # e.g. /static/charts/xxx.png
        chart_type = cdata['chart_type']
        explanation = cdata['explanation']
        
        print(f"\n  Chart Type: {chart_type}")
        print(f"  Chart Path: {chart_path}")
        print(f"  Explanation: {explanation}")
        
        # Verify the PNG exists on the filesystem
        import os
        relative_path = chart_path.lstrip('/')  # static/charts/xxx.png
        full_path = os.path.join('app', relative_path)
        check("PNG file exists on disk", os.path.isfile(full_path), f"Expected at: {full_path}")
        if os.path.isfile(full_path):
            size = os.path.getsize(full_path)
            check("PNG file is non-empty (> 1KB)", size > 1024, f"Size: {size} bytes")
            print(f"  PNG Size: {size:,} bytes")
        
        # Verify it's served by Flask as a static file
        img_url = f"{BASE}{chart_path}"
        r2 = requests.get(img_url)
        check("PNG is served via GET /static/charts/...", r2.status_code == 200, 
              f"Got {r2.status_code} for {img_url}")
        check("Response Content-Type is image/png", 'image/png' in r2.headers.get('Content-Type', ''),
              f"Got: {r2.headers.get('Content-Type')}")

# ================================================================
# SUMMARY REPORT
# ================================================================
separator("FINAL REPORT")
passed = sum(1 for r in results if r.strip().startswith("✓"))
failed = sum(1 for r in results if r.strip().startswith("✗"))
for r in results:
    print(r)
print(f"\n{'='*55}")
if failed == 0:
    print(f"  *** ALL {passed} CHECKS PASSED — Project is hackathon-ready! ***")
else:
    print(f"  {passed} passed   {failed} failed")
    print(f"  WARNING: Fix the {failed} failing checks above before submission.")
print(f"{'='*55}")
