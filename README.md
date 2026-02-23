# 🚀 Parallel News Text Processing Engine

## 🌟 Project Objective
This project implements a scalable parallel text processing system in **Python** that analyzes large news article datasets using:

* **Dynamic chunking**
* **Rule-based sentiment scoring**
* **Keyword detection**
* **Parallel execution**
* **Modular system design**

The system processes large text files efficiently by dividing them into smaller chunks and executing analysis concurrently.

---

## 📰 Text Domain Definition
This system processes structured news article text to analyze:

* 📊 **Sentiment polarity** (positive vs negative trends)
* ⚠️ **Critical event detection** (crisis, crash, failure, protest, etc.)
* 📌 **Keyword pattern extraction**

### The dataset includes articles from multiple domains such as:
1. Politics
2. Technology
3. Economy
4. Sports
5. Global Events

---

## 🏗️ Architecture Flow
```text
news_articles.txt
        ↓
Chunker Module (Dynamic Line-Based Chunking)
        ↓
ThreadPoolExecutor (Parallel Processing Layer)
        ↓
Rule Engine (Sentiment + Keyword Analysis)
        ↓
Results Collection
```
---

## 🔁 Processing Pipeline

1. **Read input file:**
   The system starts by loading the source `news_articles.txt` into memory.
   
2. **Break into configurable chunks:**
   Dynamic line-based chunking is applied to ensure memory efficiency and even distribution.
   
3. **Submit chunks to thread pool:**
   Each chunk is dispatched as a separate task to the `ThreadPoolExecutor` layer.
   
4. **Analyze each chunk concurrently:**
   The **Rule Engine** runs in parallel, performing:
   * 📊 Sentiment Polarity Analysis
   * ⚠️ Critical Event Detection
   * 📌 Keyword Pattern Extraction
   
5. **Collect structured results:**
   All processed data is aggregated from the threads into a final, structured output format.
