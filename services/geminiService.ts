import { GoogleGenAI } from "@google/genai";
import { WorkLog } from "../types";

// Safer access to process.env for various execution environments
const getApiKey = (): string => {
  try {
    // Check global window shim first, then fallback to built-in process
    return (window as any).process?.env?.API_KEY || (process as any)?.env?.API_KEY || "";
  } catch {
    return "";
  }
};

const apiKey = getApiKey();

// Initialize the AI client only if an API key is present
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const geminiService = {
  async analyzeWorkLogs(logs: WorkLog[], userName: string): Promise<string> {
    if (!ai) return "AI Analysis is disabled (API Key not configured).";
    if (!logs.length) return "No data available for analysis.";
    
    const context = logs.map(l => 
      `Date: ${l.date}, Village: ${l.village}, Activity: ${l.activity}, Details: ${l.workDetails}, Status: ${l.status}`
    ).join('\n');

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following field activity logs for ${userName} and provide a professional performance summary, highlighting key accomplishments and identifying any patterns in activities or village coverage. Keep it under 150 words.\n\nLogs:\n${context}`,
        config: {
          systemInstruction: "You are an expert field operations analyst. Provide insightful, constructive feedback based on data."
        }
      });
      return response.text || "Unable to generate analysis at this time.";
    } catch (err) {
      console.error("Gemini Error:", err);
      return "AI analysis is currently unavailable.";
    }
  }
};