
import React, { useState, useRef, useCallback } from 'react';
import { PaperclipIcon, SendIcon, CloseIcon } from './Icons';
import { MessagePart } from '../types';

interface ChatInputProps {
  onSendMessage: (parts: MessagePart[]) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<{ name: string; type: string; data: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const base64Data = dataUrl.split(',')[1];
        setFile({
          name: selectedFile.name,
          type: selectedFile.type,
          data: base64Data,
        });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };
  
  const removeFile = () => {
    setFile(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || (!text.trim() && !file)) return;
    
    const parts: MessagePart[] = [];
    if (file) {
      parts.push({ inlineData: { mimeType: file.type, data: file.data } });
    }
    if (text.trim()) {
      parts.push({ text: text.trim() });
    }
    
    onSendMessage(parts);
    setText('');
    removeFile();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 left-0 right-0 w-full p-4 bg-slate-900/50 backdrop-blur-md border-t border-slate-700"
    >
      <div className="max-w-4xl mx-auto">
        {file && (
          <div className="mb-2 flex items-center justify-between bg-slate-700/50 p-2 rounded-lg text-sm">
            <span className="text-slate-300 truncate">Attached: {file.name}</span>
            <button type="button" onClick={removeFile} className="p-1 rounded-full hover:bg-slate-600/50">
                <CloseIcon className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}
        <div className="relative flex items-end p-2 bg-slate-800/80 border border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 transition-shadow duration-200">
          <button
            type="button"
            onClick={handleAttachClick}
            className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
          >
            <PaperclipIcon className="w-6 h-6" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.txt,.md,.pdf,.csv"
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message or attach a file..."
            className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 resize-none border-none focus:ring-0 max-h-48 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || (!text.trim() && !file)}
            className="p-2 rounded-full bg-blue-600 text-white disabled:bg-slate-600 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
            ) : (
              <SendIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
