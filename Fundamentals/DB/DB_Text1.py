import sqlite3

connection = sqlite3.connect('Text_DB1.db')
cursor = connection.cursor()

cursor.execute(
    CREATE TABLE IF NOT EXISTS lines (
        line TEXT,
        expression TEXT
    )
)

data_to_insert = [
    ("Complete day was wasted", "SAD"),
    ("I just won the marathon!", "HAPPY"),
    ("The printer broke down again", "ANGRY"),
    ("I am looking forward to the vacation", "EXCITED"),
    ("The movie was quite boring", "BORED")
]

cursor.executemany('INSERT INTO lines (line, expression) VALUES (?, ?)', data_to_insert)

connection.commit()
print(f"Successfully inserted {len(data_to_insert)} rows.")

cursor.execute("SELECT * FROM lines")
for row in cursor.fetchall():
    print(f"Text: {row[0]} | Mood: {row[1]}")

connection.close()

