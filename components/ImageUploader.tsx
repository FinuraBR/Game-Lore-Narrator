// components/ImageUploader.tsx

import React, { useRef, useState } from 'react';
import { Upload, ImageIcon, ClipboardPaste } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string) => void;
  currentImage: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelected, currentImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    console.log(`[ImageUploader] File received: ${file.name} (${file.type})`);
    if (!file.type.startsWith('image/')) {
        console.warn("[ImageUploader] Rejected non-image file.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      console.log(`[ImageUploader] File converted to Base64 (length: ${result.length})`);
      onImageSelected(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div 
      className={`relative h-full w-full min-h-[300px] rounded-xl border-2 transition-all duration-200 ease-in-out flex flex-col items-center justify-center overflow-hidden bg-slate-900/50 group
        ${isDragging ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-700 hover:border-slate-600'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {currentImage ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img 
            src={currentImage} 
            alt="Uploaded lore" 
            className="max-w-full max-h-full object-contain" 
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 pointer-events-none">
            <p className="text-white font-medium">Paste (Ctrl+V) to replace</p>
          </div>
        </div>
      ) : (
        <div className="text-center p-6 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-cyan-400 shadow-lg shadow-cyan-900/20">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-semibold text-slate-200 mb-2">Upload Screenshot</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
            Drag & drop an image here, or click to select
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-800/50 py-2 px-4 rounded-full w-fit mx-auto border border-slate-700">
             <ClipboardPaste size={14} />
             <span>Supports Global Paste (Ctrl+V)</span>
          </div>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

export default ImageUploader;