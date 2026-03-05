import csv

def chunk_csv_by_rows(file_path, rows_per_chunk=5000, text_column="content"):
    """
    Splits large CSV file into row-based chunks.
    Memory efficient streaming approach.
    """

    with open(file_path, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        chunk = []
        chunk_id = 1
        start_row = 1
        current_row = 0

        for row in reader:
            current_row += 1

            # Extract only text column
            chunk.append(row[text_column])

            if len(chunk) >= rows_per_chunk:
                yield {
                    "chunk_id": chunk_id,
                    "start_row": start_row,
                    "end_row": current_row,
                    "text": "\n".join(chunk)
                }

                chunk = []
                chunk_id += 1
                start_row = current_row + 1

        # Last remaining chunk
        if chunk:
            yield {
                "chunk_id": chunk_id,
                "start_row": start_row,
                "end_row": current_row,
                "text": "\n".join(chunk)
            }