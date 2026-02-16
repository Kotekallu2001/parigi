
import { GoogleGenAI } from "@google/genai";
import { WorkLog } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async analyzeWorkLogs(logs: WorkLog[], userName: string): Promise<string> {
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
