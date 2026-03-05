import sqlite3
from datetime import datetime

DB_NAME = r"D:\Infosys\P1\data\text_processing.db"


def create_database():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS processed_articles")

    cursor.execute("""
        CREATE TABLE processed_articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text_chunk TEXT,
            sentiment_score INTEGER,
            sentiment_label TEXT,
            tags TEXT,
            timestamp TEXT
        )
    """)

    # Index for faster search
    cursor.execute("""
        CREATE INDEX idx_sentiment_score
        ON processed_articles(sentiment_score)
    """)

    conn.commit()
    conn.close()


def insert_article(text, analysis):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO processed_articles (
            text_chunk,
            sentiment_score,
            sentiment_label,
            tags,
            timestamp
        )
        VALUES (?, ?, ?, ?, ?)
    """, (
        text,
        analysis["sentiment_score"],
        analysis["sentiment_label"],
        ",".join(analysis["detected_keywords"]),
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()
def insert_articles_batch(articles):

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    data_to_insert = []

    for article in articles:
        text = article["text"]
        analysis = article["analysis"]

        data_to_insert.append((
            text,
            analysis["sentiment_score"],
            analysis["sentiment_label"],
            ",".join(analysis["themes"]),
        ))

    cursor.executemany("""
        INSERT INTO processed_articles (
            text_chunk,
            sentiment_score,
            sentiment_label,
            tags,
            timestamp
        )
        VALUES (?, ?, ?, ?, datetime('now'))
    """, data_to_insert)

    conn.commit()
    conn.close()