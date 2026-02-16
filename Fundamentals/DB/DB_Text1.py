import sqlite3

# 1. Connect to (or create) the database file
connection = sqlite3.connect('Text_DB1.db')
cursor = connection.cursor()

# 2. Create the table with two columns: line and expression
cursor.execute('''
    CREATE TABLE IF NOT EXISTS lines (
        line TEXT,
        expression TEXT
    )
''')

# 3. Prepare the 5 rows of data
data_to_insert = [
    ("Complete day was wasted", "SAD"),
    ("I just won the marathon!", "HAPPY"),
    ("The printer broke down again", "ANGRY"),
    ("I am looking forward to the vacation", "EXCITED"),
    ("The movie was quite boring", "BORED")
]

# 4. Insert the data into the table
cursor.executemany('INSERT INTO lines (line, expression) VALUES (?, ?)', data_to_insert)

# 5. Commit changes and close
connection.commit()
print(f"Successfully inserted {len(data_to_insert)} rows.")

# Verification: Let's read it back
cursor.execute("SELECT * FROM lines")
for row in cursor.fetchall():
    print(f"Text: {row[0]} | Mood: {row[1]}")

connection.close()
