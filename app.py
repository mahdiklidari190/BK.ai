from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import asyncio
import aiohttp
import logging
import numpy as np
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM
import sympy as sp
import re

app = Flask(__name__)
CORS(app)

# تنظیمات لاگ‌گیری
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedAIAssistant:
    def __init__(self):
        self.embedding_model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        self.llm_tokenizer = AutoTokenizer.from_pretrained("microsoft/DialoGPT-large")
        self.llm_model = AutoModelForCausalLM.from_pretrained("microsoft/DialoGPT-large")
        if self.llm_tokenizer.pad_token is None:
            self.llm_tokenizer.pad_token = self.llm_tokenizer.eos_token
        
        self.intent_patterns = {
            'math': [r'محاسبه', r'ریاضی', r'حل کن', r'بعلاوه', r'منهای', r'ضرب', r'تقسیم'],
            'search': [r'جستجو', r'اخبار', r'جدید', r'به روز', r'سرچ', r'information', r'info'],
            'general': [r'سلام', r'حالت', r'چطوری', r'خداحافظ', r'help', r'کمک']
        }

    async def understand_intent(self, user_input: str) -> Dict[str, Any]:
        intent_scores = {}
        user_embedding = self.embedding_model.encode([user_input])[0]
        
        for intent, patterns in self.intent_patterns.items():
            pattern_embeddings = self.embedding_model.encode(patterns)
            similarities = np.dot(pattern_embeddings, user_embedding) / (
                np.linalg.norm(pattern_embeddings, axis=1) * np.linalg.norm(user_embedding)
            )
            intent_scores[intent] = np.max(similarities)
        
        dominant_intent = max(intent_scores, key=intent_scores.get)
        return {
            'intent': dominant_intent,
            'confidence': intent_scores[dominant_intent],
            'scores': intent_scores
        }

    async def enhanced_web_search(self, query: str, max_results: int = 5) -> List[Dict]:
        # برای سادگی، در این نمونه، از جستجوی واقعی صرف نظر می‌کنیم و نتایج نمونه برمی‌گردانیم.
        # در عمل باید از APIهای جستجو استفاده کنید.
        sample_results = [
            {"title": "نتیجه نمونه ۱", "snippet": "این یک نتیجه نمونه برای نمایش است."},
            {"title": "نتیجه نمونه ۲", "snippet": "نمونه‌ای دیگر از نتیجه جستجو."}
        ]
        return sample_results

    async def generate_intelligent_response(self, user_input: str, context: List[str] = None) -> str:
        intent_analysis = await self.understand_intent(user_input)
        
        if intent_analysis['confidence'] < 0.3:
            return await self.generate_llm_response(user_input, context)
        
        if intent_analysis['intent'] == 'math':
            return await self.solve_advanced_math(user_input)
        
        elif intent_analysis['intent'] == 'search':
            search_results = await self.enhanced_web_search(user_input)
            return self.format_search_results(search_results, user_input)
        
        else:
            return await self.generate_llm_response(user_input, context)

    async def solve_advanced_math(self, problem: str) -> str:
        try:
            # سعی می‌کنیم اعداد و عملگرها را استخراج کنیم
            # این یک regex ساده برای تشخیص عبارات ریاضی است
            match = re.search(r'([0-9\+\-\*\/\(\)\.]+)', problem)
            if match:
                expr = match.group(1)
                result = eval(expr)  # توجه: استفاده از eval می‌تواند خطرناک باشد و فقط برای نمونه است.
                return f"نتیجه: {expr} = {result}"
            else:
                return "عبارت ریاضی معتبری یافت نشد."
        except Exception as e:
            return f"خطا در حل مسئله ریاضی: {str(e)}"

    def format_search_results(self, search_results, query):
        formatted = f"نتایج جستجو برای '{query}':\n"
        for i, res in enumerate(search_results, 1):
            formatted += f"{i}. {res['title']}: {res['snippet']}\n"
        return formatted

    async def generate_llm_response(self, user_input: str, context: List[str] = None) -> str:
        try:
            conversation_history = context[-5:] if context else []
            full_prompt = "\n".join(conversation_history + [f"User: {user_input}", "AI: "])
            
            inputs = self.llm_tokenizer.encode(full_prompt, return_tensors="pt")
            outputs = self.llm_model.generate(
                inputs,
                max_length=len(inputs[0]) + 100,
                num_return_sequences=1,
                temperature=0.8,
                do_sample=True,
                pad_token_id=self.llm_tokenizer.eos_token_id
            )
            
            response = self.llm_tokenizer.decode(outputs[0], skip_special_tokens=True)
            return response.split("AI: ")[-1].strip()
            
        except Exception as e:
            logger.error(f"LLM generation error: {str(e)}")
            return "متأسفم، در پردازش درخواست شما مشکلی پیش آمده است."

# ایجاد یک نمونه از دستیار
assistant = AdvancedAIAssistant()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json['message']
    # در اینجا می‌توانیم تاریخچه مکالمه را نیز مدیریت کنیم (برای سادگی نادیده گرفته شده)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    response = loop.run_until_complete(assistant.generate_intelligent_response(user_message))
    return jsonify({'response': response})

if __name__ == '__main__':
    app.run(debug=True)
