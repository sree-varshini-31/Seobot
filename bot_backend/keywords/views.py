from collections import Counter
import re

def extract_keywords(text):
    # Extract meaningful words (length >= 4)
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())

    # Count frequency
    freq = Counter(words)

    # Return top 10 keywords
    return [word for word, _ in freq.most_common(10)]