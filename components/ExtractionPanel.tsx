// components/ExtractionPanel.tsx

import React, { useEffect, useRef, useState } from 'react';
import { FileText, Mic, Sparkles, Zap, BrainCircuit, Settings2, Languages, ToggleLeft, ToggleRight } from 'lucide-react';
import { ExtractedContent, AudioContent } from '../types';
import AudioPlayer from './AudioPlayer';

interface ExtractionPanelProps {
  content: ExtractedContent;
  audio: AudioContent;
  summary: string | null;
  isSummarizing: boolean;
  onNarrate: (text: string, stylePrompt: string, voice: string, temperature: number) => void;
  onSummarize: (text: string) => void;
  onTranslate: (text: string) => void;
}

const DEFAULT_STYLE_PROMPT = `Narrate in Brazilian Portuguese. Adopt a grave, professional, and mysterious tone, capturing the atmosphere of the game 'Control' (Federal Bureau of Control). The delivery should be serious, immersive, and slightly clinical, like a government agent reading a classified file about paranormal events. Avoid a cheerful or energetic tone; keep it grounded and eerie.`;

const AVAILABLE_VOICES = [
  'Iapetus',
  'Fenrir',
  'Puck',
  'Charon',
  'Kore',
  'Zephyr',
  'Aoede',
  'Algenib'
];

// Local Storage Keys
const STORAGE_KEYS = {
  STYLE: 'vgs_style_prompt',
  VOICE: 'vgs_voice_selection',
  TEMP: 'vgs_temperature',
  AUTO_GEN: 'vgs_auto_generate',
  AUTO_PLAY: 'vgs_auto_play'
};

const ExtractionPanel: React.FC<ExtractionPanelProps> = ({ 
  content, 
  audio, 
  onNarrate,
  summary,
  onSummarize,
  isSummarizing,
  onTranslate
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  
  // Local state with LocalStorage initialization
  const [editableText, setEditableText] = useState('');
  
  const [stylePrompt, setStylePrompt] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.STYLE) || DEFAULT_STYLE_PROMPT;
  });
  
  const [selectedVoice, setSelectedVoice] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.VOICE) || 'Algenib';
  });
  
  const [temperature, setTemperature] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEMP);
    return saved ? parseFloat(saved) : 1.0;
  });

  // Novos Estados para Automação
  const [autoGenerate, setAutoGenerate] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.AUTO_GEN) === 'true';
  });

  const [autoPlay, setAutoPlay] = useState(() => {
    // Padrão true se não existir, ou o valor salvo
    const saved = localStorage.getItem(STORAGE_KEYS.AUTO_PLAY);
    return saved === null ? true : saved === 'true';
  });

  // Persistence Effects
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STYLE, stylePrompt); }, [stylePrompt]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.VOICE, selectedVoice); }, [selectedVoice]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TEMP, temperature.toString()); }, [temperature]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUTO_GEN, autoGenerate.toString()); }, [autoGenerate]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUTO_PLAY, autoPlay.toString()); }, [autoPlay]);

  // Sync extracted text to local state when processing finishes and text exists
  useEffect(() => {
    if (content.text && !content.isProcessing) {
      console.log("[ExtractionPanel] Syncing extracted text to editable area.");
      setEditableText(content.text);
      if(textRef.current) {
         textRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [content.text, content.isProcessing]);

  // --- LÓGICA DE AUTO-GERAÇÃO ---
  // Monitora quando um novo texto chega e a extração termina
  useEffect(() => {
    // Se a opção estiver ativa
    if (autoGenerate) {
      // Se tiver texto extraído, não estiver processando, e NÃO tiver áudio gerado ainda (nem gerando)
      // Nota: App.tsx limpa audio.url quando uma nova imagem sobe.
      if (content.text && !content.isProcessing && !audio.url && !audio.isGenerating && !content.error) {
        console.log("[ExtractionPanel] Auto-generating audio detected.");
        onNarrate(content.text, stylePrompt, selectedVoice, temperature);
      }
    }
  }, [content.text, content.isProcessing, autoGenerate, audio.url, audio.isGenerating, content.error, onNarrate, stylePrompt, selectedVoice, temperature]);

  if (content.error) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 border-2 border-red-900/50 bg-red-950/10 rounded-xl">
        <div className="text-center">
          <p className="text-red-400 font-semibold text-lg mb-2">Extraction Failed</p>
          <p className="text-red-300/70 text-sm max-w-sm">{content.error}</p>
        </div>
      </div>
    );
  }

  if (content.isProcessing) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 border-2 border-slate-700 bg-slate-800/30 rounded-xl animate-pulse">
        <div className="relative">
          <BrainCircuit size={48} className="text-cyan-500 animate-bounce" />
          <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20"></div>
        </div>
        <h3 className="mt-6 text-xl font-bold text-cyan-500">Processing...</h3>
        <p className="text-slate-400 mt-2 text-sm">Gemini is analyzing the artifact.</p>
        <div className="w-48 h-1 bg-slate-700 mt-6 rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 animate-[progress_1.5s_ease-in-out_infinite] w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!content.text && !editableText) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
        <FileText size={48} className="mb-4 opacity-50" />
        <p>No lore detected yet.</p>
        <p className="text-sm mt-1">Upload or paste an image to begin extraction.</p>
      </div>
    );
  }

  return (
    <div ref={textRef} className="flex flex-col h-full gap-4">
      
      {/* 1. Editable Text Area */}
      <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative group flex flex-col min-h-[200px]">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Decrypted Text
            </h3>
            
            <div className="flex items-center gap-3">
               <button 
                  onClick={() => {
                      console.log("[ExtractionPanel] Translate clicked.");
                      onTranslate(editableText);
                  }}
                  className="text-xs flex items-center gap-1 text-cyan-500 hover:text-cyan-400 transition-colors"
                  title="Translate to PT-BR"
              >
                  <Languages size={12} />
                  Translate
              </button>

              <button 
                  onClick={() => {
                      console.log("[ExtractionPanel] Summarize clicked.");
                      onSummarize(editableText);
                  }}
                  disabled={isSummarizing || !!summary}
                  className="text-xs flex items-center gap-1 text-amber-500 hover:text-amber-400 disabled:opacity-50 transition-colors"
              >
                  <Zap size={12} />
                  {isSummarizing ? "Summarizing..." : "Quick Summary"}
              </button>
            </div>
        </div>
        
        <textarea 
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            className="flex-1 w-full bg-transparent border-none resize-none font-mono text-slate-200 text-sm md:text-base focus:ring-0 focus:outline-none p-0 leading-relaxed custom-scrollbar"
            placeholder="Text will appear here..."
        />
        
        {/* Summary Overlay if exists */}
        {summary && (
            <div className="mt-3 bg-amber-950/20 border border-amber-900/50 rounded p-3 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Flash Summary</h4>
                <p className="text-amber-100/80 text-xs italic">"{summary}"</p>
            </div>
        )}
      </div>

      {/* 2. Voice Generation Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        
        {/* Header + Automation Toggles */}
        <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2 text-slate-300">
                <Settings2 size={16} />
                <span className="text-sm font-semibold">Voice Generation Settings</span>
            </div>

            <div className="flex items-center gap-4">
                {/* Auto Gen Toggle */}
                <button 
                    onClick={() => setAutoGenerate(!autoGenerate)}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
                    title="Automatically generate audio when text is extracted"
                >
                    {autoGenerate ? <ToggleRight size={20} className="text-cyan-500" /> : <ToggleLeft size={20} />}
                    <span>Auto-Gen</span>
                </button>

                {/* Auto Play Toggle */}
                <button 
                    onClick={() => setAutoPlay(!autoPlay)}
                    className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
                    title="Automatically play audio when ready"
                >
                    {autoPlay ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                    <span>Auto-Play</span>
                </button>
            </div>
        </div>

        {/* Style Prompt */}
        <div>
            <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Voice Style Prompt</label>
            <textarea 
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                className="w-full h-24 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 focus:ring-1 focus:ring-cyan-500 focus:outline-none resize-none"
            />
        </div>

        {/* Controls Row */}
        <div className="grid grid-cols-2 gap-4">
            {/* Voice Selection */}
            <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-2">Voice Model</label>
                <select 
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-cyan-500 outline-none"
                >
                    {AVAILABLE_VOICES.map(voice => (
                        <option key={voice} value={voice}>{voice}</option>
                    ))}
                </select>
            </div>

            {/* Temperature Slider */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-slate-500 uppercase">Temperature</label>
                    <span className="text-xs font-mono text-cyan-400">{temperature.toFixed(1)}</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
            </div>
        </div>

        {/* Narrate Button */}
        <button 
            onClick={() => {
                console.log("[ExtractionPanel] Generate Narration clicked.");
                onNarrate(editableText, stylePrompt, selectedVoice, temperature);
            }}
            disabled={audio.isGenerating || !editableText.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-indigo-900/30 active:scale-[0.98]"
        >
            {audio.isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Generating Audio...</span>
              </>
            ) : (
              <>
                <Mic size={18} />
                <span>Generate Narration</span>
              </>
            )}
        </button>
      </div>

      {/* 3. Audio Player Area */}
      
      {/* Visual Loading Removed as requested */}

      {/* Player (Só aparece se NÃO estiver gerando e TIVER url) */}
      {!audio.isGenerating && audio.url && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           {/* Passamos a prop autoPlayEnabled baseada no estado do painel */}
           <AudioPlayer src={audio.url} autoPlayEnabled={autoPlay} />
        </div>
      )}
      
      {audio.error && (
        <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-sm mt-2">
            Error: {audio.error}
        </div>
      )}
    </div>
  );
};

export default ExtractionPanel;