// components/AudioPlayer.tsx

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, FastForward, Download } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.25);

  useEffect(() => {
    if (src && audioRef.current) {
      console.log(`[AudioPlayer] New source loaded: ${src}`);
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play()
        .then(() => console.log("[AudioPlayer] Autoplay started"))
        .catch(e => console.log("[AudioPlayer] Autoplay blocked (interaction needed)", e));
      setIsPlaying(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
      console.log(`[AudioPlayer] Playback rate set to ${playbackRate}x`);
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      console.log("[AudioPlayer] Paused");
    } else {
      audioRef.current.play();
      console.log("[AudioPlayer] Playing");
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration;
    if (!isNaN(total)) {
      if (duration === 0) setDuration(total);
      setProgress((current / total) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    console.log(`[AudioPlayer] Metadata loaded. Duration: ${audioRef.current.duration}s`);
    setDuration(audioRef.current.duration);
    audioRef.current.playbackRate = playbackRate;
  };

  const handleEnded = () => {
    console.log("[AudioPlayer] Playback ended");
    setIsPlaying(false);
    setProgress(100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setProgress(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-slate-800 rounded-lg p-4 border border-slate-700 shadow-xl mt-4">
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
      />
      
      <div className="flex flex-col gap-4">
        {/* Progress Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono w-10 text-right">
            {formatTime(audioRef.current?.currentTime || 0)}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400"
          />
          <span className="text-xs text-slate-400 font-mono w-10">
            {formatTime(duration)}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-y-3">
          <div className="flex items-center gap-4">
             {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            
            <button 
              onClick={() => {
                if(audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                  setIsPlaying(true);
                  console.log("[AudioPlayer] Restarted");
                }
              }}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              title="Restart"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Speed Control */}
            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-2 py-1 border border-slate-700">
               <FastForward size={14} className="text-slate-400" />
               <select 
                 value={playbackRate}
                 onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                 className="bg-transparent text-xs font-mono text-slate-300 outline-none cursor-pointer"
               >
                 <option value="0.75">0.75x</option>
                 <option value="1.0">1.0x</option>
                 <option value="1.25">1.25x</option>
                 <option value="1.5">1.5x</option>
                 <option value="1.75">1.75x</option>
                 <option value="2.0">2.0x</option>
               </select>
            </div>

            {/* Volume & Download */}
            <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
              <a 
                href={src} 
                download={`lore_narration_${Date.now()}.wav`}
                onClick={() => console.log("[AudioPlayer] Download clicked")}
                className="text-slate-400 hover:text-cyan-400 transition-colors"
                title="Download .wav"
              >
                <Download size={18} />
              </a>

              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-slate-400 hover:text-white">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    setIsMuted(val === 0);
                    if (audioRef.current) audioRef.current.volume = val;
                    }}
                    className="w-16 h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-slate-400 hover:accent-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-center">
         <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-semibold">Gemini 2.5 TTS • PCM to WAV</p>
      </div>
    </div>
  );
};

export default AudioPlayer;