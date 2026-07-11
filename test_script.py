import requests
import json

base_url = "http://127.0.0.1:5000"

def test_api():
    print("Testing /api/upload ...")
    with open('test_data.csv', 'w') as f:
        f.write("Name,Age,Sales,Date\nAlice,30,100,2023-01-01\nBob,25,200,2023-01-02\nCharlie,35,150,2023-01-03\n")
        
    with open('test_data.csv', 'rb') as f:
        res = requests.post(f"{base_url}/api/upload", files={'file': f})
        
    print(res.status_code, res.text)
    data = res.json()
    file_id = data.get('file_id')
    
    if file_id:
        print("\nTesting /api/analyze ...")
        res2 = requests.post(f"{base_url}/api/analyze", json={'file_id': file_id})
        print(res2.status_code, res2.text[:200])
        
        print("\nTesting /api/ask ...")
        res3 = requests.post(f"{base_url}/api/ask", json={'file_id': file_id, 'question': 'average age'})
        print(res3.status_code, res3.text)
        
        print("\nTesting /api/generate-chart ...")
        res4 = requests.post(f"{base_url}/api/generate-chart", json={'file_id': file_id})
        print(res4.status_code, res4.text)

if __name__ == '__main__':
    test_api()
