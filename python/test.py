import fitz  # PyMuPDF
import json
import asyncio
from beeai_framework.backend import ChatModel, UserMessage


# STEP 1: Extract raw text from PDF 
def extract_text_from_pdf(path: str) -> str:
    text = ""
    with fitz.open(path) as doc:
        for page in doc:
            text += page.get_text()
    return text.strip()


# STEP 2: Use Granite to extract structured JSON 
async def extract_structured_json(raw_text: str) -> dict:
    model = ChatModel.from_name("ollama:granite3.3:8b")

    prompt = f"""
You are an intelligent assistant. Extract structured knowledge from the company report below and return it in VALID JSON format.

--- REPORT START ---
{raw_text}
--- REPORT END ---

Extract and return JSON in the following format ONLY:

{{
  "company_name": "...",
  "fiscal_year": "...",
  "revenue": "...",
  "net_income": "...",
  "major_events": ["...", "..."],
  "acquisition": "...",
  "future_plans": "...",
  "performance_summary": ["...", "..."]
}}

Do NOT include markdown, explanations, or surrounding text. Respond with JSON only.
"""

    response = await model.create(messages=[UserMessage(prompt)])
    output = response.get_text_content().strip()

    # Extract pure JSON substring
    start_idx = output.find("{")
    end_idx = output.rfind("}") + 1
    json_string = output[start_idx:end_idx]

    try:
        return json.loads(json_string)
    except json.JSONDecodeError:
        print("⚠️ Even after extraction, still invalid JSON.")
        print("Raw extracted JSON:")
        print(json_string)
        raise

# === STEP 3: Save to Knowledge Base ===
def save_to_knowledge_base(data: dict, doc_id: str, filename: str = "knowledge_base.json"):
    knowledge_base = {doc_id: data}
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(knowledge_base, f, indent=2, ensure_ascii=False)

# === MAIN SCRIPT ===
async def main():
    pdf_path = "Zulu Annual Financial Report 2024.pdf"  
    doc_id = "zulu_2024" 

    print("🟢 Extracting text from PDF...")
    raw_text = extract_text_from_pdf(pdf_path)

    print("🧠 Asking Granite to extract structured JSON...")
    structured_data = await extract_structured_json(raw_text)

    print("💾 Saving to knowledge_base.json...")
    save_to_knowledge_base(structured_data, doc_id)

    print("✅ Done! Your structured knowledge base has been saved.")

if __name__ == "__main__":
    asyncio.run(main())
