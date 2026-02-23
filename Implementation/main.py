from concurrent.futures import ThreadPoolExecutor, as_completed
from chunker import chunk_by_lines
from rule_engine import analyze_chunk

file_path = r"D:\Infosys\P1\data\news_articles.txt"


# -------- Processing Function --------
def process_chunk(chunk_data):
    """
    This function will run in parallel.
    It processes one chunk using rule engine.
    """

    result = analyze_chunk(chunk_data["text"])

    return {
        "chunk_id": chunk_data["chunk_id"],
        "start_line": chunk_data["start_line"],
        "end_line": chunk_data["end_line"],
        "analysis": result
    }


# -------- Main Execution --------
def main():

    print("\nStarting Parallel Processing...\n")

    chunks = chunk_by_lines(file_path, lines_per_chunk=100)

    results = []

    # Create thread pool with 4 worker threads
    with ThreadPoolExecutor(max_workers=4) as executor:

        # Submit each chunk to thread pool
        futures = [executor.submit(process_chunk, chunk)
                   for chunk in chunks]

        # Collect results as they complete
        for future in as_completed(futures):
            result = future.result()
            results.append(result)

            print(f"Chunk {result['chunk_id']} completed "
                  f"(Lines {result['start_line']} - {result['end_line']})")
            print("Analysis:", result["analysis"])
            print("-" * 60)

    print("\nAll chunks processed in parallel.\n")


if __name__ == "__main__":
    main()