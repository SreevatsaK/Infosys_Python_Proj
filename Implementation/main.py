from concurrent.futures import ProcessPoolExecutor, as_completed
from chunker import chunk_csv_by_rows
from rule_engine import analyze_chunk
from database import create_database, insert_articles_batch
import time
import os


# -------- FILE PATH --------
file_path = r"D:\Infosys\P1\data\News_articles_50k.csv"


# -------- Processing Function --------
def process_chunk(chunk_data):
    """
    Processes one chunk.
    Each article inside the chunk is analyzed individually.
    Runs inside separate process.
    """

    import os
    import time

    worker_id = os.getpid()
    start_time = time.time()

    articles = chunk_data["text"].split("\n")

    processed_articles = []

    for article in articles:
        analysis = analyze_chunk(article)

        processed_articles.append({
            "text": article,
            "analysis": analysis
        })

    end_time = time.time()

    return {
        "chunk_id": chunk_data["chunk_id"],
        "articles": processed_articles,
        "worker_id": worker_id,
        "processing_time": end_time - start_time
    }


# -------- Main Execution --------
def main():

    print("\n===== PARALLEL TEXT PROCESSING ENGINE =====\n")

    # Initialize database
    print("Initializing Database...")
    create_database()

    # Load CSV chunks
    print("Loading and chunking CSV file...")
    chunks = list(chunk_csv_by_rows(file_path, rows_per_chunk=5000))
    print(f"Total Chunks Created: {len(chunks)}\n")

    print("Running Parallel Processing...\n")

    start_par = time.time()

    max_workers = os.cpu_count()
    print(f"Using {max_workers} CPU cores...\n")

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_chunk, chunk)
                   for chunk in chunks]

        processing_order = 1

        for future in as_completed(futures):
            result = future.result()

            # 🔥 FAST batch insert
            insert_articles_batch(result["articles"])

            print(f"[Order {processing_order}] "
                  f"Chunk {result['chunk_id']} "
                  f"processed by Worker PID {result['worker_id']} "
                  f"in {result['processing_time']:.2f} sec")

            processing_order += 1

    end_par = time.time()
    parallel_time = end_par - start_par

    print(f"\nParallel Execution Time: {parallel_time:.2f} seconds")
    print("\n===== PROCESSING COMPLETED SUCCESSFULLY =====\n")


if __name__ == "__main__":
    main()