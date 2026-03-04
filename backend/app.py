from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, Optional
from pathlib import Path
import json
import re
from difflib import SequenceMatcher

from analysis_logic import (
    weekly_progress_rate,
    goal_achievement_percentage,
    time_to_goal_estimation,
    calorie_adjustment_engine,
    goal_tracking_function,
)

app = FastAPI(title="Fit Coach Backend")

# allow frontend to call backend
# السماح للواجهة الأمامية بالاتصال بالباكند.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later set to your frontend url
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    analytics: Optional[Dict[str, Any]] = None
    language: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    metrics: Dict[str, Any] = {}


class WelcomeResponse(BaseModel):
    reply: str

RESPONSES_PATH = Path(__file__).resolve().parent / "responses.json"
INTENTS_PATH = Path(__file__).resolve().parent / "conversation_intents.json"
NUTRITION_PROGRAMS_PATH = Path(__file__).resolve().parent / "nutrition_programs.json"
FOODS_DATA_PATH = Path(__file__).resolve().parent / "foods_data.json"


# Load static response templates used by chat routing.
# تحميل قوالب الردود الثابتة المستخدمة في توجيه المحادثة.
def _load_responses() -> Dict[str, Any]:
    with RESPONSES_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


# Load intent patterns; return empty structure if file is missing.
# تحميل أنماط النوايا، وإرجاع بنية فارغة إذا كان الملف غير موجود.
def _load_intents() -> Dict[str, Any]:
    if not INTENTS_PATH.exists():
        return {"intents": []}
    with INTENTS_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


# Load nutrition program records from JSON list format.
# تحميل برامج التغذية من ملف JSON بصيغة قائمة.
def _load_nutrition_programs() -> list[Dict[str, Any]]:
    if not NUTRITION_PROGRAMS_PATH.exists():
        return []
    with NUTRITION_PROGRAMS_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if isinstance(data, list):
        return data
    return []


# Load food catalog from JSON object with `items` list.
# تحميل دليل الأطعمة من كائن JSON يحتوي على قائمة `items`.
def _load_foods_data() -> list[Dict[str, Any]]:
    if not FOODS_DATA_PATH.exists():
        return []
    with FOODS_DATA_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)
    if isinstance(data, dict):
        items = data.get("items", [])
        if isinstance(items, list):
            return items
    return []


RESPONSES = _load_responses()
INTENTS = _load_intents()
NUTRITION_PROGRAMS = _load_nutrition_programs()
FOODS_DATA = _load_foods_data()


# Detect whether any Arabic script appears in text.
# التحقق من وجود أي أحرف عربية داخل النص.
def _is_arabic_text(text: str) -> bool:
    return any("\u0600" <= ch <= "\u06FF" for ch in text)


# Pick response language from message content first, then explicit request language.
# اختيار لغة الرد من محتوى الرسالة أولًا ثم من اللغة المرسلة صراحةً.
def _pick_language(req: ChatRequest) -> str:
    if _is_arabic_text(req.message):
        return "ar"
    if req.language in {"ar", "en"}:
        return req.language
    return "ar" if _is_arabic_text(req.message) else "en"


# Return the first candidate string or fallback when list is empty.
# إرجاع أول خيار متاح أو قيمة بديلة عند فراغ القائمة.
def _pick_first(items: list[str], fallback: str) -> str:
    return items[0] if items else fallback


# Normalize user text for intent matching (case, punctuation, spacing).
# تهيئة نص المستخدم لمطابقة النوايا (الأحرف، علامات الترقيم، المسافات).
def _normalize_text(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^\w\s\u0600-\u06FF']", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text


# Choose a response variant that matches target language preference.
# اختيار نسخة الرد الأنسب حسب اللغة المستهدفة.
def _pick_response_by_language(responses: list[str], lang: str) -> str:
    if not responses:
        return ""
    if lang == "ar":
        arabic_items = [item for item in responses if _is_arabic_text(item)]
        return arabic_items[0] if arabic_items else responses[0]
    english_items = [item for item in responses if not _is_arabic_text(item)]
    return english_items[0] if english_items else responses[0]


# Check whether a normalized intent pattern matches a normalized message.
# التحقق من تطابق نمط نية مهيأ مع رسالة مهيأة.
def _pattern_matches(message_norm: str, pattern_norm: str) -> bool:
    if not pattern_norm:
        return False
    if pattern_norm == message_norm:
        return True
    if " " in pattern_norm:
        return pattern_norm in message_norm
    return pattern_norm in message_norm.split()


# Try exact/pattern intent matching from conversation_intents.json.
# محاولة مطابقة النوايا المباشرة/النمطية من ملف conversation_intents.json.
def _intent_match_reply(message: str, lang: str) -> Optional[str]:
    message_norm = _normalize_text(message)
    for intent in INTENTS.get("intents", []):
        for pattern in intent.get("patterns", []):
            pattern_norm = _normalize_text(str(pattern))
            if _pattern_matches(message_norm, pattern_norm):
                return _pick_response_by_language(intent.get("responses", []), lang)
    return None


# Build welcome message from greeting intent, with responses.json fallback.
# إنشاء رسالة الترحيب من نية التحية مع الرجوع إلى responses.json عند الحاجة.
def _get_welcome_reply(lang: str) -> str:
    for intent in INTENTS.get("intents", []):
        if intent.get("tag") == "greeting":
            reply = _pick_response_by_language(intent.get("responses", []), lang)
            if reply:
                return reply

    categories = RESPONSES.get("categories", {})
    return _pick_first(categories.get("greetings", {}).get(lang, []), "Hello")


# Lightweight greeting detector for chat shortcuts.
# كاشف تحية خفيف لاختصارات المحادثة.
def _is_greeting(msg: str) -> bool:
    msg_lower = msg.lower()
    words = ["hi", "hello", "hey", "مرحبا", "اهلا", "أهلا", "السلام عليكم"]
    return any(word in msg_lower for word in words)


# Detect whether message asks for progress analytics.
# اكتشاف ما إذا كانت الرسالة تطلب تحليل التقدم.
def _is_progress_intent(msg: str) -> bool:
    msg_lower = msg.lower()
    words = ["progress", "analysis", "eta", "track", "تقدم", "تحليل", "المدة"]
    return any(word in msg_lower for word in words)


# Detect whether message asks for workouts/exercise plans.
# اكتشاف ما إذا كانت الرسالة تطلب تمارين/خطط تدريب.
def _is_workout_intent(msg: str) -> bool:
    msg_lower = msg.lower()
    words = ["workout", "exercise", "plan", "training", "تمرين", "خطة"]
    return any(word in msg_lower for word in words)


# Detect whether message asks for nutrition/meal guidance.
# اكتشاف ما إذا كانت الرسالة تطلب توجيهًا غذائيًا/وجبات.
def _is_nutrition_intent(msg: str) -> bool:
    msg_lower = msg.lower()
    words = ["nutrition", "meal", "diet", "calories", "protein", "تغذية", "سعرات", "بروتين"]
    return any(word in msg_lower for word in words)


# Normalize Arabic/English tokens for robust lookup against food names.
# تهيئة الكلمات العربية/الإنجليزية لتحسين البحث عن أسماء الأطعمة.
def _normalize_lookup_text(text: str) -> str:
    text = text.strip().lower()
    text = text.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا")
    text = text.replace("ى", "ي").replace("ة", "ه")
    text = re.sub(r"[\u064B-\u065F\u0670\u0640]", "", text)
    text = re.sub(r"[^\w\u0600-\u06FF]", "", text)
    return text


# Detect food-knowledge questions (benefits, alternatives, suitable-for, etc.).
# اكتشاف أسئلة معرفة الأطعمة (الفوائد، البدائل، الملاءمة...إلخ).
def _is_food_intent(msg: str) -> bool:
    msg_lower = msg.lower()
    words = [
        "food", "foods", "fruit", "fruits", "vegetable", "vegetables", "grain", "protein source",
        "اكل", "أكل", "غذاء", "فوائد", "مناسب", "بدائل", "خضار", "فواكه", "حبوب", "بروتينات", "نظام غذائي"
    ]
    return any(word in msg_lower for word in words)


# Clean Arabic text artifacts and merge split tokens for better output quality.
# تنظيف شوائب النص العربي ودمج الكلمات المقطعة لتحسين جودة المخرجات.
def _clean_arabic_text(value: str) -> str:
    if not isinstance(value, str):
        return ""
    text = value
    text = re.sub(r"[A-Za-z]+", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    tokens = text.split(" ")
    merged: list[str] = []
    i = 0
    while i < len(tokens):
        current = tokens[i]
        if not current:
            i += 1
            continue
        while i + 1 < len(tokens):
            nxt = tokens[i + 1]
            if not nxt:
                i += 1
                continue
            if not re.fullmatch(r"[\u0600-\u06FF]+", current) or not re.fullmatch(r"[\u0600-\u06FF]+", nxt):
                break
            if current in {"ال", "و", "ل", "ب", "ك"}:
                current = current + nxt
                i += 1
                continue
            if len(current) <= 2 and len(nxt) >= 3:
                current = current + nxt
                i += 1
                continue
            break
        merged.append(current)
        i += 1

    text = " ".join(merged)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# Return the first available text field for a food item based on language/key priority.
# إرجاع أول حقل نصي متاح لعنصر الطعام حسب أولوية اللغة/المفاتيح.
def _food_text(item: Dict[str, Any], keys: list[str], lang: str) -> str:
    for key in keys:
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return _clean_arabic_text(value) if lang == "ar" else value.strip()
    return ""


# Return a cleaned list field for a food item based on language/key priority.
# إرجاع حقل قائمة منظف لعنصر الطعام حسب أولوية اللغة/المفاتيح.
def _food_list(item: Dict[str, Any], keys: list[str], lang: str) -> list[str]:
    for key in keys:
        value = item.get(key)
        if isinstance(value, list) and value:
            if lang == "ar":
                return [_clean_arabic_text(str(v)) for v in value if str(v).strip()]
            return [str(v).strip() for v in value if str(v).strip()]
    return []


# Identify noisy fragments that should not appear in end-user responses.
# تحديد المقاطع المزعجة التي لا يجب أن تظهر في ردود المستخدم النهائي.
def _is_noise_fragment(value: str) -> bool:
    text = value.strip()
    if not text:
        return True
    markers = ["الحالت", "الحاله", "الصحيه", "المناسب لها", "suitable", "healthy condition"]
    if any(marker in text.lower() for marker in markers):
        return True
    if text.count("(") > 1 or text.count(")") > 1:
        return True
    return False


# Remove noisy/empty entries from food-related lists.
# إزالة العناصر الفارغة/المزعجة من القوائم المرتبطة بالطعام.
def _clean_food_list(values: list[str]) -> list[str]:
    cleaned: list[str] = []
    for value in values:
        item = value.strip(" -،,.")
        if _is_noise_fragment(item):
            continue
        cleaned.append(item)
    return cleaned


# Filter nutrient lists to concise nutrient-like values only.
# تصفية قوائم العناصر الغذائية إلى قيم مختصرة تشبه العناصر الغذائية فقط.
def _clean_nutrient_list(values: list[str]) -> list[str]:
    cleaned: list[str] = []
    for value in values:
        item = value.strip(" -،,.")
        if not item or _is_noise_fragment(item):
            continue
        lower = item.lower()
        if any(token in lower for token in ["مناسب", "مرضى", "دايت", "suitable", "patients"]):
            continue
        if ":" in item:
            continue
        if len(item.split()) > 4:
            continue
        if len(item) > 30:
            continue
        cleaned.append(item)
    return cleaned


# Final Arabic response polishing pass (spacing, punctuation, token joins).
# مرحلة أخيرة لتحسين الرد العربي (المسافات، علامات الترقيم، دمج الكلمات).
def _polish_arabic_reply(text: str) -> str:
    if not isinstance(text, str):
        return ""
    out = re.sub(r"\s+", " ", text).strip()
    for _ in range(3):
        out = re.sub(r"([\u0600-\u06FF]{2,})\s+([\u0600-\u06FF])\s+([\u0600-\u06FF]{2,})", r"\1\2\3", out)
        out = re.sub(r"([\u0600-\u06FF]{2,})\s+(و[\u0600-\u06FF]{1,2})\b", r"\1\2", out)
    out = re.sub(r"\s+([،,:؛.!?])", r"\1", out)
    out = re.sub(r"\s+", " ", out).strip()
    return out


# Find best matching food item using exact-like match first, then fuzzy matching.
# إيجاد أفضل عنصر طعام مطابق عبر مطابقة شبه دقيقة أولًا ثم مطابقة ضبابية.
def _find_food_item(message: str) -> Optional[Dict[str, Any]]:
    if not FOODS_DATA:
        return None
    message_norm = _normalize_lookup_text(message)
    msg_tokens = [
        _normalize_lookup_text(token)
        for token in re.split(r"\s+", message.strip())
        if token.strip()
    ]
    if not message_norm:
        return None

    # Pass 1: longest substring match over normalized food-name variants.
    # المرحلة 1: اختيار أطول تطابق جزئي بين صيغ أسماء الطعام المهيأة.
    best_item: Optional[Dict[str, Any]] = None
    best_len = -1
    for item in FOODS_DATA:
        raw_names = [
            str(item.get("name_ar_ar", "")).strip(),
            str(item.get("name_ar", "")).strip(),
            str(item.get("name_en", "")).strip(),
        ]
        for name in raw_names:
            if not name:
                continue
            name_norm = _normalize_lookup_text(name)
            variants = {name_norm}
            if name_norm.startswith("ال") and len(name_norm) > 2:
                variants.add(name_norm[2:])
            for variant in variants:
                if variant and variant in message_norm:
                    if len(variant) > best_len:
                        best_item = item
                        best_len = len(variant)

    if best_item is not None:
        return best_item

    # Pass 2: fuzzy token similarity fallback when exact-style match fails.
    # المرحلة 2: استخدام تشابه ضبابي بين الكلمات عند فشل المطابقة شبه الدقيقة.
    best_ratio = 0.0
    for item in FOODS_DATA:
        raw_names = [
            str(item.get("name_ar_ar", "")).strip(),
            str(item.get("name_ar", "")).strip(),
            str(item.get("name_en", "")).strip(),
        ]
        for name in raw_names:
            if not name:
                continue
            base = _normalize_lookup_text(name)
            candidates = {base}
            if base.startswith("ال") and len(base) > 2:
                candidates.add(base[2:])
            for candidate in candidates:
                if not candidate:
                    continue
                for token in msg_tokens:
                    if not token:
                        continue
                    ratio = SequenceMatcher(None, token, candidate).ratio()
                    if ratio > best_ratio and ratio >= 0.72:
                        best_ratio = ratio
                        best_item = item
    return best_item


# Build contextual food response (benefits/nutrients/suitability/alternatives/summary).
# إنشاء رد غذائي سياقي (فوائد/عناصر/ملاءمة/بدائل/ملخص).
def _build_food_reply(message: str, lang: str) -> Optional[str]:
    item = _find_food_item(message)
    if not item:
        if _is_food_intent(message):
            if lang == "en":
                return "I can provide food info. Tell me the exact food name in Arabic (for example: التفاح، الرز، الشوفان)."
            return "أقدر أوضح معلومات الأكل، بس اكتب اسم الطعام بشكل مباشر مثل: التفاح، الرز، الشوفان."
        return None

    # Pull localized fields from dataset with fallback ordering.
    # جلب الحقول المترجمة من البيانات مع ترتيب احتياطي.
    if lang == "ar":
        name = _food_text(item, ["name_ar_ar", "name_ar", "name_en"], lang) or "الطعام"
        category = _food_text(item, ["category_ar", "category"], lang)
        benefits = _clean_food_list(_food_list(item, ["benefits_ar", "benefits"], lang))
        nutrients = _clean_nutrient_list(_food_list(item, ["nutrients_ar", "nutrients"], lang))
        suitable_for = _clean_food_list(_food_list(item, ["suitable_for_ar", "suitable_for"], lang))
        alternatives = _clean_food_list(_food_list(item, ["healthy_alternatives_ar", "healthy_alternatives"], lang))
        notes = _food_text(item, ["notes_ar", "notes"], lang)
    else:
        name = _food_text(item, ["name_en", "name_ar_ar", "name_ar"], lang) or "Food"
        category = _food_text(item, ["category_en", "category"], lang)
        benefits = _clean_food_list(_food_list(item, ["benefits_en", "benefits_ar", "benefits"], lang))
        nutrients = _clean_nutrient_list(_food_list(item, ["nutrients_en", "nutrients_ar", "nutrients"], lang))
        suitable_for = _clean_food_list(_food_list(item, ["suitable_for_en", "suitable_for_ar", "suitable_for"], lang))
        alternatives = _clean_food_list(_food_list(item, ["healthy_alternatives_en", "healthy_alternatives_ar", "healthy_alternatives"], lang))
        notes = _food_text(item, ["notes_en", "notes_ar", "notes"], lang)

    # Detect user question angle to return the most relevant slice.
    # اكتشاف زاوية السؤال لإرجاع الجزء الأكثر صلة.
    msg = message.lower()
    asks_benefits = any(word in msg for word in ["فوائد", "benefit", "benefits"])
    asks_nutrients = any(word in msg for word in ["عناصر", "مغذيات", "nutrient", "nutrients"])
    asks_suitable = any(word in msg for word in ["مناسب", "يناسب", "suitable", "suit", "condition", "مرضى", "سكري", "ضغط", "قلب"])
    asks_alternatives = any(word in msg for word in ["بديل", "بدائل", "alternative", "alternatives"])

    if lang == "en":
        if asks_benefits and benefits:
            top = ", ".join(str(x) for x in benefits[:3])
            return f"Benefits of {name}: {top}."

        if asks_nutrients and nutrients:
            top = ", ".join(str(x) for x in nutrients[:6])
            return f"Nutrients in {name}: {top}."

        if asks_suitable and suitable_for:
            top = ", ".join(str(x) for x in suitable_for[:4])
            return f"For {name}: {top}."

        if asks_alternatives and alternatives:
            top = ", ".join(str(x) for x in alternatives[:6])
            return f"Healthy alternatives for {name}: {top}."

        summary_benefit = str(benefits[0]) if benefits else ""
        summary_nutrient = str(nutrients[0]) if nutrients else ""
        summary_alt = str(alternatives[0]) if alternatives else ""
        summary_note = notes if notes else ""

        return (
            f"{name} ({category}): {summary_benefit}. "
            f"Main nutrient: {summary_nutrient}. "
            f"Note: {summary_note}. "
            f"Suggested alternative: {summary_alt}."
        )

    display_name = name
    display_category = category
    b = "، ".join(str(x) for x in benefits[:3]) if benefits else ""
    n = "، ".join(str(x) for x in nutrients[:4]) if nutrients else ""
    s = "، ".join(str(x) for x in suitable_for[:3]) if suitable_for else ""
    a = "، ".join(str(x) for x in alternatives[:4]) if alternatives else ""

    if asks_benefits and benefits:
        return f"{display_name} ({display_category})\n• الفوائد: {b}"

    if asks_nutrients and nutrients:
        return f"{display_name} ({display_category})\n• العناصر الغذائية: {n}"

    if asks_suitable and suitable_for:
        return f"{display_name} ({display_category})\n• مناسب لـ: {s}"

    if asks_alternatives and alternatives:
        return f"{display_name} ({display_category})\n• بدائل صحية: {a}"

    summary_benefit = str(benefits[0]) if benefits else ""
    summary_nutrient = str(nutrients[0]) if nutrients else ""
    summary_alt = str(alternatives[0]) if alternatives else ""
    summary_note = notes if notes else ""

    return (
        f"{display_name} ({display_category})\n"
        f"• فائدة مهمة: {summary_benefit}\n"
        f"• عنصر غذائي: {summary_nutrient}\n"
        f"• بديل مقترح: {summary_alt}\n"
        f"• ملاحظة: {summary_note}"
    )


# Extract plausible body weight from free text (supports kg/kيلو formats).
# استخراج وزن الجسم المحتمل من النص الحر (يدعم kg/كيلو).
def _extract_weight_kg(message: str) -> Optional[int]:
    match = re.search(r"\b(\d{2,3})\s*(kg|كيلو|كغ)?\b", message.lower())
    if not match:
        return None
    try:
        value = int(match.group(1))
    except ValueError:
        return None
    if 30 <= value <= 250:
        return value
    return None


# Detect high-level nutrition objective from user message.
# اكتشاف الهدف الغذائي العام من رسالة المستخدم.
def _detect_nutrition_goal(message: str) -> Optional[str]:
    msg = message.lower()
    if any(token in msg for token in ["cut", "cutting", "lose", "loss", "تنشيف", "نزول", "خسارة"]):
        return "cutting"
    if any(token in msg for token in ["bulk", "bulking", "gain", "muscle gain", "تضخيم", "زيادة"]):
        return "bulking"
    return None


# Split bilingual text fields formatted as "AR / EN" and return selected side.
# تقسيم النصوص الثنائية اللغة بصيغة "AR / EN" وإرجاع الجزء المطلوب.
def _pick_bilingual_text(value: str, lang: str) -> str:
    if not isinstance(value, str):
        return ""
    if " / " not in value:
        return value
    left, right = value.split(" / ", 1)
    return right.strip() if lang == "en" else left.strip()


# Build nutrition program recommendation based on inferred goal and weight.
# إنشاء توصية برنامج غذائي حسب الهدف والوزن المستنتجين.
def _build_nutrition_program_reply(message: str, lang: str) -> Optional[str]:
    if not NUTRITION_PROGRAMS:
        return None

    goal = _detect_nutrition_goal(message)
    weight_kg = _extract_weight_kg(message)

    # Start with all plans, then narrow by goal and weight if available.
    # البدء بجميع الخطط ثم التضييق حسب الهدف والوزن عند توفرهما.
    candidates = NUTRITION_PROGRAMS
    if goal:
        candidates = [item for item in candidates if goal in str(item.get("goal", "")).lower()]
        if not candidates:
            candidates = NUTRITION_PROGRAMS

    if weight_kg is not None:
        weight_matches = [
            item
            for item in candidates
            if int(item.get("weight_range_kg", {}).get("min", 0)) <= weight_kg <= int(item.get("weight_range_kg", {}).get("max", 10_000))
        ]
        if weight_matches:
            candidates = weight_matches

    # Pick best available candidate (currently first match strategy).
    # اختيار أفضل مرشح متاح (حاليًا باستخدام أول تطابق).
    chosen = candidates[0] if candidates else None
    if not chosen:
        return None

    calories = chosen.get("calorie_range", {})
    macros = chosen.get("macro_split", {})
    description = _pick_bilingual_text(str(chosen.get("description", "")), lang)

    meals = chosen.get("sample_meals", [])
    first_meal = meals[0] if meals else {}
    meal_type = _pick_bilingual_text(str(first_meal.get("meal_type", "")), lang)
    meal_desc = _pick_bilingual_text(str(first_meal.get("description", "")), lang)

    tips = chosen.get("tips", [])
    first_tip = _pick_bilingual_text(str(tips[0]), lang) if tips else ""

    if lang == "en":
        return (
            f"{chosen.get('id', 'Nutrition Plan')}: {description} "
            f"Calories {calories.get('min', '-')}-{calories.get('max', '-')}/day. "
            f"Macros P{macros.get('protein_pct', '-')}% C{macros.get('carbs_pct', '-')}% F{macros.get('fat_pct', '-')}%. "
            f"Sample meal ({meal_type}): {meal_desc}. "
            f"Tip: {first_tip}"
        )

    return (
        f"{chosen.get('id', 'خطة تغذية')}: {description} "
        f"السعرات {calories.get('min', '-')}-{calories.get('max', '-')} يوميًا. "
        f"التوزيع: بروتين {macros.get('protein_pct', '-')}%، كارب {macros.get('carbs_pct', '-')}%، دهون {macros.get('fat_pct', '-')}%. "
        f"وجبة مثال ({meal_type}): {meal_desc}. "
        f"نصيحة: {first_tip}"
    )


# Build progress-analysis response from templates plus computed metrics.
# بناء رد تحليل التقدم باستخدام القوالب والمقاييس المحسوبة.
def _build_progress_reply(lang: str, metrics: Dict[str, Any], analytics: Dict[str, Any]) -> str:
    templates = RESPONSES.get("categories", {}).get("progress_analysis", {}).get("templates", [])
    goal = analytics.get("goal", {})
    profile = analytics.get("profile", {})

    weekly_change = analytics.get("weekly_weight_change_kg", 0)
    remaining_kg = round(float(profile.get("current_weight", 0)) - float(goal.get("target_weight", 0)), 2)
    eta_weeks = metrics.get("eta", {}).get("eta_weeks")
    calorie_delta = abs(metrics.get("calorie_adjustment", {}).get("adjustment", 0))

    # Select default template, then switch to stalled template when needed.
    # اختيار القالب الافتراضي ثم التحويل لقالب التعثر عند الحاجة.
    selected = next((t for t in templates if t.get("id") == "PA001"), None)
    if metrics.get("eta", {}).get("status") in {"stalled_or_off_track", "insufficient_data"}:
        selected = next((t for t in templates if t.get("id") == "PA002"), selected)

    if not selected:
        return "Progress data received." if lang == "en" else "تم استلام بيانات التقدم."

    template = selected.get("response_en") if lang == "en" else selected.get("response_ar")
    return template.format(
        weekly_change=weekly_change,
        remaining_kg=remaining_kg,
        eta_weeks=eta_weeks if eta_weeks is not None else "-",
        calorie_delta=calorie_delta,
    )


# Main response router that decides which subsystem should answer.
# موجّه الرد الرئيسي الذي يحدد أي جزء من النظام سيجيب.
def _build_chat_reply(req: ChatRequest, metrics: Dict[str, Any]) -> str:
    categories = RESPONSES.get("categories", {})
    lang = _pick_language(req)

    # Priority 1: explicit intent-pattern reply.
    # الأولوية 1: رد مطابق لنمط نية صريح.
    intent_reply = _intent_match_reply(req.message, lang)
    if intent_reply:
        return intent_reply

    # Priority 2: greeting shortcut.
    # الأولوية 2: اختصار التحية.
    if _is_greeting(req.message):
        return _pick_first(categories.get("greetings", {}).get(lang, []), "Hello")

    # Priority 3: progress explanation when analytics payload is provided.
    # الأولوية 3: شرح التقدم عند توفر بيانات التحليل.
    if _is_progress_intent(req.message) and req.analytics:
        return _build_progress_reply(lang, metrics, req.analytics)

    # Priority 4: food knowledge reply.
    # الأولوية 4: رد معرفة الأطعمة.
    food_reply = _build_food_reply(req.message, lang)
    if food_reply:
        return food_reply

    # Priority 5: nutrition plan reply.
    # الأولوية 5: رد خطة التغذية.
    if _is_nutrition_intent(req.message):
        nutrition_reply = _build_nutrition_program_reply(req.message, lang)
        if nutrition_reply:
            return nutrition_reply
        nutrition_templates = categories.get("nutrition_plans", {}).get("templates", [])
        if nutrition_templates:
            item = nutrition_templates[0]
            return item.get("response_en") if lang == "en" else item.get("response_ar")

    # Priority 6: workout template reply.
    # الأولوية 6: رد قالب التمارين.
    if _is_workout_intent(req.message):
        workout_templates = categories.get("exercise_plans", {}).get("templates", [])
        if workout_templates:
            item = workout_templates[0]
            return item.get("response_en") if lang == "en" else item.get("response_ar")

    # Priority 7: safe fallback when message is outside supported scope.
    # الأولوية 7: رد احتياطي آمن عندما تكون الرسالة خارج النطاق المدعوم.
    return _pick_first(categories.get("out_of_scope_responses", {}).get(lang, []), "I can help with fitness only.")


# Lightweight health probe endpoint for uptime checks.
# نقطة فحص صحة بسيطة للتحقق من تشغيل الخدمة.
@app.get("/health")
def health():
    return {"status": "ok"}


# Returns initial welcome message localized by query parameter.
# إرجاع رسالة الترحيب الأولية حسب لغة معامل الاستعلام.
@app.get("/api/chat/welcome", response_model=WelcomeResponse)
def chat_welcome(language: str = "en"):
    lang = "ar" if language == "ar" else "en"
    return {"reply": _get_welcome_reply(lang)}


# Main chat endpoint: computes metrics (if analytics present) then builds reply.
# نقطة المحادثة الرئيسية: تحسب المقاييس (إن توفرت التحليلات) ثم تبني الرد.
@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    metrics: Dict[str, Any] = {}

    # Only compute analytics-derived metrics when client provides analytics payload.
    # حساب المقاييس المشتقة من التحليلات فقط عند إرسالها من العميل.
    if req.analytics:
        current_week = req.analytics.get("current_week")
        previous_week = req.analytics.get("previous_week")
        goal = req.analytics.get("goal") or {}
        profile = req.analytics.get("profile") or {}
        monthly_stats = req.analytics.get("monthly_stats", {})
        weekly_trends = req.analytics.get("weekly_trend_last_4", [])
        weekly_weight_change = req.analytics.get("weekly_weight_change_kg")
        target_weekly_change = req.analytics.get("target_weekly_change_kg")

        # Week-over-week training/adherence progress.
        # تقدم التدريب والالتزام من أسبوع لآخر.
        if current_week and previous_week:
            metrics["weekly_progress_rate"] = weekly_progress_rate(current_week, previous_week)

        # Goal completion percentage.
        # نسبة إنجاز الهدف.
        if goal and profile:
            metrics["goal_achievement_pct"] = goal_achievement_percentage(goal, profile, monthly_stats)

        # ETA estimation from recent trend history.
        # تقدير الوقت المتبقي من اتجاه الأسابيع الأخيرة.
        if goal and profile and weekly_trends:
            metrics["eta"] = time_to_goal_estimation(goal, profile, weekly_trends)

        # Calorie recommendation update based on trend vs target.
        # تحديث توصية السعرات بناءً على الاتجاه الحالي مقابل الهدف.
        if goal and profile and "current_calories" in profile:
            metrics["calorie_adjustment"] = calorie_adjustment_engine(
                goal.get("type", "maintenance"),
                profile.get("current_calories", 0),
                weekly_weight_change,
                target_weekly_change,
            )

        # Consolidated high-level goal status.
        # الحالة الموحّدة عالية المستوى للهدف.
        if goal and profile:
            metrics["goal_status"] = goal_tracking_function(goal, profile, monthly_stats, weekly_trends)

    # Build final localized reply from intent-routing logic and computed metrics.
    # بناء الرد النهائي المترجم اعتمادًا على توجيه النوايا والمقاييس المحسوبة.
    lang = _pick_language(req)
    reply = _build_chat_reply(req, metrics)
    if lang == "ar":
        reply = _polish_arabic_reply(reply)
    return {"reply": reply, "metrics": metrics}