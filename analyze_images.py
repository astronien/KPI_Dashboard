import google.generativeai as genai
import os

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel('gemini-2.5-flash')

img_dir = '/Users/astronien/.gemini/antigravity/brain/a28dc17b-31c8-435f-9718-b49c377cca7d/.system_generated/click_feedback/'
files = sorted([f for f in os.listdir(img_dir) if f.startswith('click_feedback_1775844')])

def upload_file(path):
    print(f"Uploading {path}...")
    return genai.upload_file(path)

uploaded_files = [upload_file(os.path.join(img_dir, f)) for f in files]

prompt = """
These are screenshots of a Google Apps Script Sales Dashboard.
Please list EVERY SINGLE METRIC, CHART, TABLE, and FILTER shown across these tabs.
Pay close attention to what columns are in the tables, what KPI cards exist at the top, and any special features (e.g. Export buttons, specific drop-downs).
I need to know EXACTLY what UI elements and data points are present so I can replicate them precisely in my React app.
"""

response = model.generate_content([prompt] + uploaded_files)
print("\n--- ANALYSIS ---")
print(response.text)
