import re
from .models import Keyword

# Lazy-loaded: model only initialised on first keyword extraction call,
# not on every manage.py command or server startup.
_kw_model = None

def _get_model():
    global _kw_model
    if _kw_model is None:
        from keybert import KeyBERT
        _kw_model = KeyBERT()
    return _kw_model


def clean_content(content: str) -> str:
    """
    Clean content before keyword extraction:
    - Remove URLs
    - Remove special characters and symbols
    - Remove very short words
    - Fix merged words (e.g. "odoothe" → remove)
    - Remove repeated whitespace
    """
    # Remove URLs
    content = re.sub(r'http\S+|www\.\S+', '', content)

    # Remove email addresses
    content = re.sub(r'\S+@\S+', '', content)

    # Remove special characters but keep spaces and basic punctuation
    content = re.sub(r'[^a-zA-Z0-9\s\-]', ' ', content)

    # Remove standalone numbers
    content = re.sub(r'\b\d+\b', '', content)

    # Remove very short tokens (1-2 chars) — removes noise like "s", "th", "nd"
    content = re.sub(r'\b\w{1,2}\b', '', content)

    # Remove known garbage patterns — merged brand+word combos
    content = re.sub(r'\bodoo\w+', 'odoo', content, flags=re.IGNORECASE)

    # Collapse multiple spaces
    content = re.sub(r'\s+', ' ', content).strip()

    return content


def guess_intent(keyword_str: str) -> str:
    """Keyword intent classification"""
    kw_lower = keyword_str.lower()

    informational_triggers = ['how', 'what', 'why', 'when', 'where', 'guide', 'tutorial', 'tips', 'learn']
    transactional_triggers = ['buy', 'price', 'cheap', 'order', 'purchase', 'discount', 'coupon']
    commercial_triggers = ['best', 'top', 'vs', 'review', 'comparison']

    tokens = set(re.findall(r'\w+', kw_lower))

    if any(t in transactional_triggers for t in tokens):
        return 'transactional'
    elif any(t in commercial_triggers for t in tokens):
        return 'commercial'
    elif any(t in informational_triggers for t in tokens):
        return 'informational'

    return 'informational'


def calculate_difficulty(keyword_str: str, content: str) -> int:
    """Basic length & frequency based difficulty scoring"""
    score = 50
    words = keyword_str.split()

    if len(words) > 3:
        score -= 20
    elif len(words) == 1:
        score += 30

    freq = content.lower().count(keyword_str.lower())
    if freq > 5:
        score -= 10

    return max(1, min(100, score))


def extract_keywords(content, project_id=None, save_to_db=False):

    if not content or len(content.strip()) < 50:
        return []

    # Clean content before passing to KeyBERT
    cleaned = clean_content(content)

    if len(cleaned.strip()) < 50:
        return []

    try:
        raw_keywords = _get_model().extract_keywords(
            cleaned,
            keyphrase_ngram_range=(1, 2),
            stop_words="english",
            top_n=10
        )
    except Exception:
        return []

    results = []

    for kw_tuple in raw_keywords:
        kw_str = kw_tuple[0].strip()

        # Skip garbage keywords
        if len(kw_str) < 4:
            continue
        if re.search(r'\d', kw_str):  # skip keywords with numbers
            continue
        if len(kw_str.split()) == 1 and len(kw_str) > 15:  # skip very long single words (merged)
            continue

        intent = guess_intent(kw_str)
        diff = calculate_difficulty(kw_str, cleaned)

        results.append({
            "keyword": kw_str,
            "intent_type": intent,
            "difficulty_score": diff
        })

        if save_to_db and project_id:
            try:
                Keyword.objects.get_or_create(
                    project_id=project_id,
                    keyword=kw_str,
                    defaults={
                        'intent_type': intent,
                        'difficulty_score': diff
                    }
                )
            except Exception:
                pass

    return [r["keyword"] for r in results]