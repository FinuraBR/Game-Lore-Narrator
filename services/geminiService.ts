// services/geminiService.ts

import { GoogleGenAI, Modality } from "@google/genai";
import { pcmToWav, base64ToUint8Array, AUDIO_SAMPLE_RATE } from "./audioUtils";

const API_KEY = process.env.API_KEY || '';

// Initialize client
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Extracts lore text from an image using Gemini 3 Pro (Vision).
 * Uses Thinking Mode for high precision segmentation.
 */
export const extractLoreText = async (base64Image: string): Promise<string> => {
  console.log(`[Gemini Service] Starting OCR extraction. Image size: ${base64Image.length} chars`);
  
  if (!base64Image) throw new Error("No image provided");

  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      
      // 1. SAFETY SETTINGS
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ],

      // 2. TOOLS
      tools: [
        { googleSearch: {} }
      ],

      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `You are a specialized OCR engine for video game screenshots.
Your Task: Analyze the image and extract only the narrative (lore) text.

Visual Processing Rules:
1. SEGMENTATION: Visually differentiate what is "document/paper" from the game's UI/HUD.
2. EXCLUSION: Ignore all peripheral UI elements: Menus (ESC, Options, Start), button commands (Press 'A' to Zoom), counters (Level, Resources).
3. EXTRACTION: Transcribe the body text exactly as it appears, respecting all original punctuation and paragraph breaks.
4. OUTPUT: Provide only the clean text, without any additional comments.`
          }
        ]
      },

      config: {
        thinkingConfig: { 
          includeThoughts: false, 
          thinkingBudget: 32000 
        },
        temperature: 1.0, 
      }
    });

    const text = response.text;
    console.log(`[Gemini Service] OCR Response received. Length: ${text?.length || 0} chars`);
    
    if (!text) throw new Error("No text extracted");
    return text.trim();

  } catch (error) {
    console.error("[Gemini Service] OCR Error:", error);
    throw error;
  }
};

/**
 * Translates the extracted text to Brazilian Portuguese.
 */
export const translateLoreText = async (text: string): Promise<string> => {
  console.log(`[Gemini Service] Starting Translation. Input length: ${text.length} chars`);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [{ text: `Act as a professional translator. Translate the following video game lore text to Brazilian Portuguese. Maintain the original tone, formatting, and atmosphere:\n\n${text}` }]
      }
    });
    
    const translated = response.text?.trim() || text;
    console.log(`[Gemini Service] Translation complete. Output length: ${translated.length} chars`);
    return translated;

  } catch (error) {
    console.error("[Gemini Service] Translation Error:", error);
    throw error;
  }
};

/**
 * Generates speech from text using Gemini 2.5 Flash TTS with custom settings.
 */
export const generateLoreNarration = async (
  text: string,
  stylePrompt: string,
  voiceName: string,
  temperature: number
): Promise<string> => {
  console.log(`[Gemini Service] Generating Audio. Voice: ${voiceName}, Temp: ${temperature}, Text Length: ${text.length}`);

  if (!text) throw new Error("No text to narrate");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro-preview-tts', 

      // 1. SYSTEM INSTRUCTION
      systemInstruction: {
        parts: [{ text: stylePrompt }]
      },

      // 2. CONTEÚDO
      contents: {
        parts: [{ text: text }]
      },

      // 3. SAFETY SETTINGS
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ],
      
      config: {
        temperature: temperature, 
        responseModalities: [Modality.AUDIO], 
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }
          }
        },
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned from API");
    }

    console.log(`[Gemini Service] Audio data received. Base64 Size: ${base64Audio.length}`);
    console.log(`[Gemini Service] Prompt: ${response}`);

    // Convert Base64 PCM to WAV Blob using the constant Sample Rate
    const pcmData = base64ToUint8Array(base64Audio);
    console.log(`[Gemini Service] Converted to Uint8Array. Size: ${pcmData.byteLength} bytes`);

    const wavBlob = pcmToWav(pcmData, AUDIO_SAMPLE_RATE, 1); 
    console.log(`[Gemini Service] WAV Blob created. Size: ${wavBlob.size} bytes. MIME: ${wavBlob.type}`);

    // Create a local URL for the Blob
    const url = URL.createObjectURL(wavBlob);
    console.log(`[Gemini Service] Audio URL created: ${url}`);
    
    return url;

  } catch (error) {
    console.error("[Gemini Service] TTS Error:", error);
    throw error;
  }
};

/**
 * Rapidly summarizes the lore text.
 */
export const summarizeLore = async (text: string): Promise<string> => {
  console.log("[Gemini Service] Summarizing text...");
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ text: `Summarize this in a concise sentence:\n\n${text}` }] }
    });
    console.log("[Gemini Service] Summary generated.");
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("[Gemini Service] Summary Error:", error);
    return "Summary failed.";
  }
};