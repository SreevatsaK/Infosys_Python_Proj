"""
chunker.py  —  Universal Text Chunker
Chunk size = number of LINES / ROWS (not words)
Supports: .txt .csv .json .jsonl .xml .md .log  +  raw text strings
Handles:  any file size, any encoding, empty files — never raises
"""

import os
import csv
import json
import re


# ─────────────────────────────────────────
#  MAIN ENTRY POINT
# ─────────────────────────────────────────
def get_chunks(source, chunk_size: int = 100) -> list:
    """
    source     — file path (str) OR raw text string
    chunk_size — number of LINES (or ROWS for csv) per chunk
    Returns list of { chunk_id, text } dicts. Never raises.
    """
    chunk_size = max(1, int(chunk_size))

    # ── raw text string (not a file path) ──
    if not os.path.exists(str(source)):
        text = str(source).strip()
        if not text:
            return []
        return _lines_to_chunks(text.splitlines(), chunk_size)

    # ── file ──
    ext = os.path.splitext(str(source))[1].lower()
    try:
        if ext == ".csv":
            return _chunk_csv(source, chunk_size)
        elif ext == ".json":
            return _chunk_json(source, chunk_size)
        elif ext == ".jsonl":
            return _chunk_jsonl(source, chunk_size)
        elif ext == ".xml":
            return _chunk_xml(source, chunk_size)
        else:
            # .txt .md .log and anything else → plain text
            return _chunk_txt(source, chunk_size)
    except Exception as e:
        print(f"[chunker] Error reading {source}: {e}")
        return []


# ─────────────────────────────────────────
#  CORE HELPER — split lines into chunks
# ─────────────────────────────────────────
def _lines_to_chunks(lines: list, chunk_size: int) -> list:
    """Take a list of text lines, group into chunks of chunk_size lines."""
    lines = [l for l in lines if l.strip()]   # drop blank lines
    if not lines:
        return []
    chunks = []
    for i in range(0, len(lines), chunk_size):
        group = lines[i : i + chunk_size]
        chunks.append({
            "chunk_id": len(chunks) + 1,
            "text":     "\n".join(group)
        })
    return chunks


# ─────────────────────────────────────────
#  FORMAT HANDLERS
# ─────────────────────────────────────────

def _chunk_txt(path, chunk_size):
    """Plain text — each non-empty line is one 'row'."""
    text = _safe_read(path)
    lines = text.splitlines()
    return _lines_to_chunks(lines, chunk_size)


def _chunk_csv(path, chunk_size):
    """
    CSV — each data row becomes one text line.
    Header is skipped. chunk_size = rows per chunk.
    Handles Windows CRLF, any encoding.
    """
    rows = []
    with open(path, "r", encoding="utf-8", errors="replace", newline="") as f:
        reader = csv.reader(f)
        header = next(reader, None)          # skip header row

        for row in reader:
            # Join all non-empty cells into readable text
            line = " | ".join(
                str(cell).strip() for cell in row if str(cell).strip()
            )
            if line:
                rows.append(line)

    return _lines_to_chunks(rows, chunk_size)


def _chunk_json(path, chunk_size):
    """JSON — flattens to text lines then chunks."""
    raw = _safe_read(path)
    if not raw.strip():
        return []
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        # treat as plain text fallback
        return _lines_to_chunks(raw.splitlines(), chunk_size)

    lines = _flatten_to_lines(data)
    return _lines_to_chunks(lines, chunk_size)


def _chunk_jsonl(path, chunk_size):
    """JSONL — one JSON object per line."""
    lines = []
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for raw_line in f:
            raw_line = raw_line.strip()
            if not raw_line:
                continue
            try:
                obj = json.loads(raw_line)
                lines.append(" ".join(str(v) for v in _iter_leaf_values(obj)))
            except json.JSONDecodeError:
                lines.append(raw_line)
    return _lines_to_chunks(lines, chunk_size)


def _chunk_xml(path, chunk_size):
    """XML — strip tags, split into lines."""
    raw = _safe_read(path)
    text = re.sub(r"<[^>]+>", " ", raw)
    text = re.sub(r"[ \t]+", " ", text)
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    return _lines_to_chunks(lines, chunk_size)


# ─────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────

def _safe_read(path) -> str:
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            with open(path, "r", encoding=enc) as f:
                return f.read()
        except (UnicodeDecodeError, LookupError):
            continue
    with open(path, "rb") as f:
        return f.read().decode("utf-8", errors="replace")


def _flatten_to_lines(obj) -> list:
    lines = []
    if isinstance(obj, list):
        for item in obj:
            lines.extend(_flatten_to_lines(item))
    elif isinstance(obj, dict):
        line = " | ".join(
            f"{k}: {v}" for k, v in obj.items()
            if not isinstance(v, (dict, list)) and str(v).strip()
        )
        if line:
            lines.append(line)
        for v in obj.values():
            if isinstance(v, (dict, list)):
                lines.extend(_flatten_to_lines(v))
    elif obj is not None:
        s = str(obj).strip()
        if s:
            lines.append(s)
    return lines


def _iter_leaf_values(obj):
    if isinstance(obj, dict):
        for v in obj.values():
            yield from _iter_leaf_values(v)
    elif isinstance(obj, list):
        for item in obj:
            yield from _iter_leaf_values(item)
    elif obj is not None:
        yield obj