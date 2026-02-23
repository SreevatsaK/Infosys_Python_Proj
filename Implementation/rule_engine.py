import re

# Define positive and negative word sets
POSITIVE_WORDS = {
    "growth", "profit", "improved", "success",
    "breakthrough", "record", "strong", "confidence"
}

NEGATIVE_WORDS = {
    "decline", "failure", "crash", "error",
    "issue", "problem", "crisis", "breach",
    "protest", "loss"
}

KEYWORDS = {
    "error", "failure", "crash", "crisis",
    "issue", "breach", "decline", "protest"
}


def analyze_chunk(chunk_text):
    """
    Analyzes a chunk of text and returns:
    - positive word count
    - negative word count
    - sentiment score
    - detected keywords
    """

    # Normalize text (lowercase + remove punctuation)
    words = re.findall(r'\b\w+\b', chunk_text.lower())

    positive_count = 0
    negative_count = 0
    detected_keywords = set()

    for word in words:
        if word in POSITIVE_WORDS:
            positive_count += 1

        if word in NEGATIVE_WORDS:
            negative_count += 1

        if word in KEYWORDS:
            detected_keywords.add(word)

    sentiment_score = positive_count - negative_count

    return {
        "positive_count": positive_count,
        "negative_count": negative_count,
        "sentiment_score": sentiment_score,
        "detected_keywords": list(detected_keywords)
    }