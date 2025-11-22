import { GoogleGenAI, Modality, Type } from "@google/genai";

// Standard client for flash/pro text tasks
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Specialized client helper that ensures a user-selected key for Paid services (Video/Pro Image)
const getPaidAiClient = async () => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey && window.aistudio.openSelectKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }
  // Re-instantiate to pick up the injected key if it changed
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Fast AI Response using Gemini Flash Lite
 * Used for quick UI element generation or simple feedback
 */
export const generateFastResponse = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  // Using the latest alias for lite as per instructions
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: prompt,
  });
  return response.text || "";
};

/**
 * Evaluate Practice Submission
 * Uses Gemini to provide feedback on a user's completed task
 */
export const evaluatePracticeSubmission = async (scenario: string, task: string, submission: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `
    You are an expert AI Sales Coach.
    
    SCENARIO: ${scenario}
    TASK ASSIGNED: ${task}
    
    USER'S SUBMISSION (Output they generated using AI):
    ${submission}
    
    Please provide brief, constructive feedback on their submission. 
    Did they meet the goal? Is the tone appropriate? 
    Give a score out of 10 and one specific tip for improvement.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Using standard flash for better reasoning than lite
    contents: prompt,
  });
  return response.text || "Could not evaluate submission.";
};

/**
 * Chatbot using Gemini 3 Pro Preview
 * Advanced reasoning for the "Sherpa Guide" chat
 */
export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], newMessage: string) => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    history: history,
    config: {
      systemInstruction: "You are 'Sherpa Tenzing', a friendly, encouraging, and wise guide helping a novice user learn how to use AI (Gemini and NotebookLM). Use mountaineering metaphors. Keep responses concise and helpful.",
    }
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "";
};

/**
 * Image Generation using Gemini 3 Pro Image Preview
 * Requires Aspect Ratio and Size controls
 */
export const generateSherpaImage = async (
  prompt: string, 
  aspectRatio: string = "1:1", 
  imageSize: string = "1K"
): Promise<string | null> => {
  // Use paid client check for Pro Image model
  const ai = await getPaidAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image gen error:", error);
    throw error;
  }
};

/**
 * Text to Speech using Gemini 2.5 Flash TTS
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, guide-like voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Decode Logic
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
    return audioBuffer;

  } catch (e) {
    console.error("TTS Error", e);
    return null;
  }
};

// Helper for TTS decoding
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}