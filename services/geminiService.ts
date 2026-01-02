
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getLogisticsInsights = async (dataSummary: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this logistics data and provide a concise 3-bullet point executive summary highlighting critical bottlenecks, stock concerns, or practice performance. Focus on the most urgent "Red" items.
      
      Data Summary:
      ${JSON.stringify(dataSummary, null, 2)}`,
      config: {
        systemInstruction: "You are a senior logistics analyst. Be direct, professional, and data-driven."
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Insights currently unavailable. Please check critical alerts manually.";
  }
};
