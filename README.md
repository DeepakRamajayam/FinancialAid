# ⚠️Real Word Problem!!

College students usually rely on pocket money from their families as their primary source of income.
Most of this money is spent through UPI transactions, but students often spend without tracking where the money goes or why it was spent. 
This lack of financial awareness leads to poor money management habit.

# 💸 FinanceFlow

FinanceFlow is a smart personal finance tracker designed for college students to help them manage pocket money effectively.
It extracts transactions from bank statements, categorizes them, visualizes spending patterns, and even provides AI-powered financial insights through a chatbot.

-------------------------------------------------------------------------------------------------
# 🚀 Project Workflow

1. 📂Upload Bank Statement – Student uploads .xls bank statement via React frontend.

2. ⚙️Backend Parsing – Django backend parses the file (pandas + xlrd/openpyxl).

3. 🧹Data Cleaning – Extract and normalize fields (Date, Description, Debit, Credit, Balance).

4. 🧠Transaction Classification:- 

* 💸Debits → Classified into categories (Food, Transport, Shopping, etc.) using rule-based + ML/NLP.

* 💰Credits → Rule-based classification (Scholarship, Interest, Income).

5. 🗄️Database Storage – Structured data stored in MySQL.

6. 📊Visualization – React frontend displays charts:-

* 🥧Pie chart → category spend breakdown.

* 📊Bar chart → month-wise debit vs credit.

* 📈Line chart → balance trend.

7. 🤖AI Insights – LangChain + Gemini LLM answer finance queries in plain English.

--------------------------------------------------------------------------------------------------------

#🛠️ Tech Stack

* 🎨Frontend: React.js (Charts: Chart.js / Recharts / D3.js)

* ⚡Backend: Django REST API

* 🗄️Database: MySQL

* 🤖AI/ML:-

-> 📝NLP text classification for transactions

-> 💬LLM chatbot using LangChain + Gemini Flash 2.0 API

* Languages: 🐍Python, ⚛️JavaScript

--------------------------------------------------------------------------------------------------------













