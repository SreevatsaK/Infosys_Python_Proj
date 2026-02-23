def chunk_by_lines(file_path, lines_per_chunk=50):
    """
    Splits file into chunks based on number of lines.
    Yields chunk metadata and content.
    """
    with open(file_path, "r", encoding="utf-8") as file:
        chunk = []
        start_line = 1
        current_line = 0
        chunk_id = 1

        for line in file:
            current_line += 1
            chunk.append(line.strip())

            if len(chunk) >= lines_per_chunk:
                yield {
                    "chunk_id": chunk_id,
                    "start_line": start_line,
                    "end_line": current_line,
                    "text": "\n".join(chunk)
                }
                chunk = []
                chunk_id += 1
                start_line = current_line + 1

        if chunk:
            yield {
                "chunk_id": chunk_id,
                "start_line": start_line,
                "end_line": current_line,
                "text": "\n".join(chunk)
            }


def chunk_by_words(file_path, words_per_chunk=200):
    """
    Splits file into chunks based on number of words.
    Returns metadata similar to chunk_by_lines().
    """

    with open(file_path, "r", encoding="utf-8") as file:
        text = file.read()

    words = text.split()
    total_words = len(words)

    chunk_id = 1

    for start in range(0, total_words, words_per_chunk):
        end = min(start + words_per_chunk, total_words)

        chunk_text = " ".join(words[start:end])

        yield {
            "chunk_id": chunk_id,
            "start_word": start + 1,
            "end_word": end,
            "text": chunk_text
        }

        chunk_id += 1