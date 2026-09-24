import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import {
  ACCEPTED_AUDIO_EXTENSIONS,
  MAX_AUDIO_SIZE_BYTES,
  MAX_AUDIO_SIZE_MB,
} from '../../lib/constants';
import { VoiceAudioPreview } from '../voice/VoiceAudioPreview';

interface AudioDropzoneProps {
  onFileSelected: (file: File, previewUrl: string) => void;
  onClear: () => void;
  selectedFile: File | null;
  previewUrl: string | null;
  error?: string | null;
  className?: string;
}

export const AudioDropzone: React.FC<AudioDropzoneProps> = ({
  onFileSelected,
  onClear,
  selectedFile,
  previewUrl,
  error,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateAndProcessFile = (file: File) => {
    setLocalError(null);

    // Validate size
    if (file.size > MAX_AUDIO_SIZE_BYTES) {
      setLocalError(`File exceeds maximum size of ${MAX_AUDIO_SIZE_MB}MB (${(file.size / (1024 * 1024)).toFixed(1)}MB)`);
      return;
    }

    // Validate extension
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_AUDIO_EXTENSIONS.includes(ext)) {
      setLocalError(`Unsupported audio extension '${ext}'. Accepted: ${ACCEPTED_AUDIO_EXTENSIONS.join(', ')}`);
      return;
    }

    // Create browser audio preview URL
    const url = URL.createObjectURL(file);
    onFileSelected(file, url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const triggerPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const displayError = error || localError;

  return (
    <div id="audio-dropzone-wrapper" className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        id="audio-file-input"
        accept={ACCEPTED_AUDIO_EXTENSIONS.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!selectedFile ? (
        <div
          id="audio-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerPicker}
          className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
              : 'border-slate-700/80 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/70'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h4 className="text-sm font-semibold text-white tracking-wide mb-1">
            Drop reference audio file or <span className="text-cyan-400 underline underline-offset-4">browse</span>
          </h4>

          <p className="text-xs text-slate-400 max-w-sm mb-3">
            High quality reference speech without background noise produces the most accurate neural clone.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">WAV</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">MP3</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">FLAC</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">OGG</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">M4A</span>
            <span className="text-cyan-400/80 ml-1">• Max {MAX_AUDIO_SIZE_MB}MB</span>
          </div>
        </div>
      ) : (
        <div
          id="audio-file-selected-card"
          className="p-4 rounded-2xl border border-cyan-500/40 bg-cyan-950/20 backdrop-blur-md space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white truncate max-w-[240px] sm:max-w-md">
                  {selectedFile.name}
                </h5>
                <p className="text-xs font-mono text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'audio file'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="clear-audio-file-btn"
              onClick={onClear}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Remove audio file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Audio Preview playback */}
          {previewUrl && (
            <VoiceAudioPreview
              src={previewUrl}
              voiceName={selectedFile.name}
              duration={4.0}
            />
          )}

          <div className="flex items-center justify-between text-xs font-mono text-emerald-400 pt-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Audio validated for neural encoding
            </span>
            <button
              type="button"
              onClick={triggerPicker}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Change file
            </button>
          </div>
        </div>
      )}

      {displayError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
};
