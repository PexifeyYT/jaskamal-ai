
import { GoogleGenAI } from "@google/genai";
import { MessagePart } from '../types';

const MODEL_NAME = 'gemini-2.5-flash';

async function getGenerativeModel() {
  // It's recommended to create a new GoogleGenAI instance for each call
  // to ensure you're using the latest API key from the environment.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateResponse = async (history: { role: string; parts: MessagePart[] }[], promptParts: MessagePart[]): Promise<string> => {
  try {
    const ai = await getGenerativeModel();

    const contents = promptParts.map(part => {
        if (part.inlineData) {
            return {
                inlineData: {
                    mimeType: part.inlineData.mimeType,
                    data: part.inlineData.data,
                }
            };
        }
        return { text: part.text || '' };
    });

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: contents },
    });
    
    return response.text;
  } catch (error) {
    console.error('Error generating response from Gemini:', error);
    if (error instanceof Error) {
        return `Error: An issue occurred while contacting the AI. ${error.message}`;
    }
    return 'An unknown error occurred while contacting the AI.';
  }
};
