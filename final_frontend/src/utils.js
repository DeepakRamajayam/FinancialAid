// utils.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Setup Gemini
const genAI = new GoogleGenerativeAI("API KEY"); // Replace this with your actual Gemini API key
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export function convertToCSV(data) {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csv = [headers.join(",")];
  for (const row of data) {
    csv.push(headers.map((h) => JSON.stringify(row[h] || "")).join(","));
  }
  return csv.join("\n");
}

export async function getInsights(transactions) {
  const csvData = convertToCSV(transactions);

  const prompt = `You are a financial assistant analyzing transaction history in CSV format:

${csvData}

Return your insights in the following structured JSON format:
{
  "chart_insights": [
    { "label": "Food", "amount": 2500 },
    { "label": "Rent", "amount": 8000 },
    { "label": "Transport", "amount": 1000 }
  ],
  "monthly_trends": [
    { "month": "2024-01", "amount": 5000 },
    { "month": "2024-02", "amount": 6000 }
  ],
  "top_merchants": [
    { "merchant": "Amazon", "amount": 1200 },
    { "merchant": "Walmart", "amount": 900 }
  ],
  "anomalies": [
    { "date": "2024-02-15", "description": "Unusually high spending at Apple Store", "amount": 2000 }
  ],
  "summary": {
    "total_spent": 15000,
    "average_transaction": 500,
    "num_transactions": 30,
    "highest_category": "Rent"
  },
  "reports": [
    "You spent the most on Rent this month.",
    "Transport and Food were your next highest expenses."
  ],
  "suggestions": [
    "Consider cutting down on food delivery expenses.",
    "Use public transport to save on travel costs."
  ]
}
Only return JSON. Do not include markdown formatting like triple backticks.`;

  const result = await model.generateContent(prompt);
  let responseText = result.response.text().trim();

  // Remove markdown code block if present
  if (responseText.startsWith("```")) {
    responseText = responseText.replace(/```(?:json)?\n?|```/g, "").trim();
  }

  try {
    // Try to parse, but ensure all keys exist for backward compatibility
    const parsed = JSON.parse(responseText);
    return {
      chart_insights: parsed.chart_insights || [],
      monthly_trends: parsed.monthly_trends || [],
      top_merchants: parsed.top_merchants || [],
      anomalies: parsed.anomalies || [],
      summary: parsed.summary || {},
      reports: parsed.reports || [],
      suggestions: parsed.suggestions || []
    };
  } catch (e) {
    console.error("Failed to parse LLM response:", responseText);
    return { chart_insights: [], monthly_trends: [], top_merchants: [], anomalies: [], summary: {}, reports: [], suggestions: [] };
  }
}
