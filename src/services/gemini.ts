import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestAddress(input: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user is typing their delivery address: "${input}". 
    Please suggest a complete, accurate address based on this input. 
    Return ONLY the suggested address string, nothing else. 
    Use Google Maps grounding for accuracy.`,
    config: {
      tools: [{ googleMaps: {} }],
    },
  });

  return response.text?.trim() || "";
}

export async function chatWithGemini(messages: { role: 'user' | 'model', content: string }[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are 'Vibrant AI', a helpful and friendly assistant for a premium food delivery app called 'Vibrant'. You help users with their orders, profile, and general questions about the app. Be concise and professional.",
    },
  });

  // Reconstruct history
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  const lastMessage = messages[messages.length - 1].content;
  
  // Note: sendMessage only accepts message string
  const response = await chat.sendMessage({ message: lastMessage });
  return response.text;
}
