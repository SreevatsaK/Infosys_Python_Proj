# 🚀 Parallel Text Processing Engine
A **High-performance Parallel Text Processing Engine** built using **Python, multiprocessing, and SQLite** to efficiently process and analyze large volumes of  data. 

---
## 📰 Project Overview

The **Parallel News Text Processing Engine** is designed to process large news datasets efficiently by distributing workloads across multiple CPU cores.

The platform enables:

- ⚡ High-speed processing of large news datasets  
- 🧠 Rule-based sentiment analysis  
- 🏷 Automatic theme classification  
- 🗄 Structured storage of results in SQLite database  
- 🔎 Efficient querying and filtering of processed articles  

The system can handle **large datasets (50,000+ articles)** using scalable parallel processing.

---

## 🏗️ Architecture Flow
```text
Database (CSV Text file)
        ↓
Chunker Module (Dynamic Line-Based Chunking)
        ↓
ThreadPoolExecutor (Parallel Processing Layer)
        ↓
Rule Engine (Sentiment + Keyword Analysis)
        ↓
Results Collection (SQLite)
```
---

## 🛠 Tech Stack

<div align="center">

### Backend

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Multiprocessing](https://img.shields.io/badge/Multiprocessing-Parallel%20Processing-blue?style=for-the-badge)
![Regex](https://img.shields.io/badge/Regex-Text%20Processing-green?style=for-the-badge)
![Rule-Based NLP](https://img.shields.io/badge/NLP-Rule--Based-orange?style=for-the-badge)

---

### Database

![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

---

### Development Tools

![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)
![DB Browser](https://img.shields.io/badge/DB%20Browser%20for%20SQLite-Database-blue?style=for-the-badge)
![Git](https://img.shields.io/badge/Git-Version%20Control-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)

</div>

# ✨ Key Features

## ⚡ Parallel Processing
- Processes large text datasets using multiple CPU cores
- Chunk-based workload distribution for better performance

## 🧠 Rule-Based Text Analysis
Each article undergoes:
- Sentiment score calculation
- Sentiment classification
- Theme detection
- Word tokenization

## 🏷 Theme Classification
Articles are categorized into themes such as:
- Economy
- Politics
- Technology
- Sports
- World
- General

## 🗄 Structured Database Storage

Processed results are stored in a SQLite database with the following schema:

| Column | Description |
|------|-------------|
| id | Unique record ID |
| text_chunk | News article text |
| sentiment_score | Calculated sentiment score |
| sentiment_label | Positive / Negative / Neutral |
| tags | Detected themes |
| timestamp | Processing time |

---

# 📂 Project Structure

```
Parallel-News-Text-Processing-Engine
📁Implementation
├── main.py              # Main parallel processing pipeline
├── chunker.py           # CSV chunking logic
├── rule_engine.py       # Sentiment and theme analysis
├── database.py          # SQLite database operations
│
├── data
│   ├── News_articles_50k.csv
│   └── text_processing.db
│
└── README.md
```

---

# ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/SreevatsaK/Parallel-News-Text-Processing-Engine.git
```

### 2️⃣ Navigate to the Project Folder

```bash
cd Parallel-News-Text-Processing-Engine
```

### 3️⃣ Install Required Packages

```bash
pip install pandas
```

### 4️⃣ Run the Processing Engine

```bash
python main.py
```

---

# 📊 Performance

The system is optimized using:

- Parallel multiprocessing
- Chunk-based workload distribution
- Batch database insertion
- Indexed SQLite queries

Example benchmark with **50,000 news articles**:

```
Parallel Execution Time ≈ ~3 seconds
```

---

# 🎯 Future Improvements

- Advanced search and filtering system
- CSV export functionality
- Interactive analytics dashboard
- Web-based user interface
- Automated reporting system

---

# 🎓 Learning Outcomes

This project helped in understanding:

- Parallel computing in Python
- Large-scale text processing
- Rule-based NLP techniques
- Database indexing and storage
- Performance optimization in backend systems

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository  
2. Create a new branch  
3. Commit your changes  
4. Submit a pull request  

---

# 📜 License

This project is developed for **educational and learning purposes**.

---

# 👨‍💻 Author

**Sreevatsa K**

LinkedIn  
https://www.linkedin.com/in/sreevatsa-kottapalli-266830280

GitHub  
https://github.com/SreevatsaK

---

⭐ If you like this project, consider giving it a **star on GitHub**!
