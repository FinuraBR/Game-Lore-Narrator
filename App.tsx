// App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Gamepad2, Mic2, ScanEye } from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import ExtractionPanel from './components/ExtractionPanel';
import { AppState } from './types';
import { extractLoreText, generateLoreNarration, summarizeLore, translateLoreText } from './services/geminiService';

const DEFAULT_OCR_PROMPT = `You are a specialized OCR engine for video game screenshots.
Your Task: Analyze the image and extract only the narrative (lore) text.

Visual Processing Rules:
1. SEGMENTATION: Visually differentiate what is "document/paper" from the game's UI/HUD.
2. EXCLUSION: Ignore all peripheral UI elements: Menus (ESC, Options, Start), button commands (Press 'A' to Zoom), counters (Level, Resources).
3. EXTRACTION: Transcribe the body text exactly as it appears, respecting all original punctuation and paragraph breaks.
4. OUTPUT: Provide only the clean text, without any additional comments.`;

const STORAGE_KEYS = {
  OCR_PROMPT: 'vgs_ocr_prompt'
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    imageSrc: null,
    extraction: { text: '', isProcessing: false },
    audio: { url: '', isGenerating: false },
    summary: null,
    isSummarizing: false,
  });

  // Estado para o prompt de OCR
  const [ocrPrompt, setOcrPrompt] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.OCR_PROMPT) || DEFAULT_OCR_PROMPT;
  });

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.OCR_PROMPT, ocrPrompt);
  }, [ocrPrompt]);

  const handleImageSelected = useCallback(async (base64: string) => {
    console.log("[App] Image selected/pasted. Starting process...");
    
    // Reset state for new image
    setState(prev => ({
      ...prev,
      imageSrc: base64,
      extraction: { text: '', isProcessing: true, error: undefined },
      audio: { url: '', isGenerating: false, error: undefined },
      summary: null,
      isSummarizing: false,
    }));

    try {
      // 1. Extract Text (PASSANDO O PROMPT PERSONALIZADO AQUI)
      const text = await extractLoreText(base64, ocrPrompt);
      console.log("[App] Text extraction successful. Updating state.");
      setState(prev => ({
        ...prev,
        extraction: { text, isProcessing: false },
      }));
    } catch (error) {
      console.error("[App] Text extraction failed:", error);
      setState(prev => ({
        ...prev,
        extraction: { 
            text: '', 
            isProcessing: false, 
            error: error instanceof Error ? error.message : "Failed to process image" 
        }
      }));
    }
  }, [ocrPrompt]); // Dependência adicionada

  // Global Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          console.log("[App] Paste event detected with image.");
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              handleImageSelected(base64);
            };
            reader.readAsDataURL(blob);
          }
          break; // Only take the first image
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handleImageSelected]);

  const handleNarrate = async (
    text: string, 
    stylePrompt: string, 
    voice: string, 
    temperature: number
  ) => {
    console.log(`[App] Narrate requested. Voice: ${voice}, Temp: ${temperature}`);
    
    // IMPORTANT: Revoke old URL to prevent memory leaks
    if (state.audio.url) {
      console.log(`[App] Revoking old audio URL: ${state.audio.url}`);
      URL.revokeObjectURL(state.audio.url);
    }

    setState(prev => ({
      ...prev,
      audio: { ...prev.audio, isGenerating: true, error: undefined }
    }));

    try {
      const audioUrl = await generateLoreNarration(text, stylePrompt, voice, temperature);
      console.log(`[App] Audio generated successfully. New URL: ${audioUrl}`);
      setState(prev => ({
        ...prev,
        audio: { url: audioUrl, isGenerating: false }
      }));
    } catch (error) {
      console.error("[App] Audio generation failed:", error);
      setState(prev => ({
        ...prev,
        audio: { url: '', isGenerating: false, error: "Audio generation failed. Please try again." }
      }));
    }
  };

  const handleSummarize = async (text: string) => {
      console.log("[App] Summarize requested.");
      setState(prev => ({ ...prev, isSummarizing: true }));
      const summary = await summarizeLore(text);
      setState(prev => ({ ...prev, summary, isSummarizing: false }));
  };

  const handleTranslate = async (text: string) => {
    console.log("[App] Translate requested.");
    
    // Show processing state in extraction panel
    setState(prev => ({
      ...prev,
      extraction: { ...prev.extraction, isProcessing: true }
    }));

    try {
      const translated = await translateLoreText(text);
      console.log("[App] Translation successful.");
      setState(prev => ({
        ...prev,
        extraction: { text: translated, isProcessing: false }
      }));
    } catch (error) {
      console.error("[App] Translation failed:", error);
      setState(prev => ({
        ...prev,
        extraction: { ...prev.extraction, isProcessing: false, error: "Translation failed." }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center gap-3 pb-6 border-b border-slate-800">
          <div className="p-3 bg-cyan-950 rounded-lg border border-cyan-900 shadow-lg shadow-cyan-900/20">
            <Mic2 className="text-cyan-400" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Voice Generation <span className="text-cyan-400">Studio</span>
            </h1>
            <p className="text-slate-500 text-sm">
              OCR extraction • Neural TTS • Style Control
            </p>
          </div>
          <div className="ml-auto hidden md:block text-right">
              <span className="text-xs bg-slate-900 border border-slate-700 px-2 py-1 rounded text-slate-400">
                  Gemini 3 Pro + Gemini 2.5 Flash
              </span>
          </div>
        </header>

        {/* Main Content Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[calc(100vh-200px)]">
          
          {/* Left Panel: Image Input + OCR Settings */}
          <section className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-[400px]">
              <ImageUploader 
                onImageSelected={handleImageSelected} 
                currentImage={state.imageSrc} 
              />
            </div>
            
            {/* OCR Settings Panel */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-slate-300 pb-2 border-b border-slate-800/50">
                <ScanEye size={16} className="text-cyan-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Vision OCR Prompt</span>
              </div>
              
              <textarea 
                value={ocrPrompt}
                onChange={(e) => setOcrPrompt(e.target.value)}
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 focus:ring-1 focus:ring-cyan-500 focus:outline-none resize-none font-mono leading-relaxed"
                placeholder="Enter instructions for the Vision model..."
              />
              <div className="text-[10px] text-slate-500 flex justify-between">
                 <span>Instructions for Gemini 3 Pro Vision</span>
                 <button 
                    onClick={() => setOcrPrompt(DEFAULT_OCR_PROMPT)}
                    className="hover:text-cyan-400 underline decoration-dotted"
                 >
                    Reset to Default
                 </button>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300">How to use:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Paste any game screenshot (Ctrl+V)</li>
                <li>Verify and edit the extracted text</li>
                <li>Adjust voice, style, and temperature</li>
                <li>Generate high-fidelity audio narration</li>
              </ul>
            </div>
          </section>

          {/* Right Panel: Extraction & Output */}
          <section className="h-full min-h-[400px]">
            <ExtractionPanel 
              content={state.extraction} 
              audio={state.audio}
              onNarrate={handleNarrate}
              summary={state.summary}
              onSummarize={handleSummarize}
              isSummarizing={state.isSummarizing}
              onTranslate={handleTranslate}
            />
          </section>

        </main>
      </div>
    </div>
  );
};

export default App;