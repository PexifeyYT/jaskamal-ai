import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { generateResponse } from './services/geminiService';
import { Message, Role, MessagePart } from './types';
import { MinusIcon, SquareIcon, CloseIcon, ResetIcon } from './components/Icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  
  const getInitialState = () => {
    const initialWidth = 800;
    const initialHeight = Math.max(400, window.innerHeight * 0.7);
    return {
      position: {
        x: (window.innerWidth - initialWidth) / 2,
        y: (window.innerHeight - initialHeight) / 2,
      },
      size: {
        width: initialWidth,
        height: initialHeight,
      }
    };
  };

  const [position, setPosition] = useState(getInitialState().position);
  const [size, setSize] = useState(getInitialState().size);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleReset = () => {
    const { position: newPos, size: newSize } = getInitialState();
    setPosition(newPos);
    setSize(newSize);
  };

  useEffect(() => {
    const element = windowRef.current;
    if (!element) return;

    const observer = new ResizeObserver(entries => {
        if (!entries || entries.length === 0) return;
        const entry = entries[0];
        
        // Use borderBoxSize to align with CSS's box-sizing: border-box.
        // This prevents an infinite resize loop.
        // It's an array of objects, we use the first one.
        const borderBox = entry.borderBoxSize[0];
        if (borderBox) {
            const newWidth = borderBox.inlineSize;
            const newHeight = borderBox.blockSize;
        
            setSize(currentSize => {
                // Check to prevent loop if size hasn't changed meaningfully.
                if (Math.round(currentSize.width) !== Math.round(newWidth) || Math.round(currentSize.height) !== Math.round(newHeight)) {
                    return { width: newWidth, height: newHeight };
                }
                return currentSize;
            });
        }
    });

    observer.observe(element);

    return () => {
        observer.disconnect();
    };
  }, []);
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (!windowRef.current) return;
    setIsDragging(true);
    const rect = windowRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSendMessage = async (parts: MessagePart[]) => {
    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      parts,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        parts: msg.parts.map(p => ({
          text: p.text,
          inlineData: p.inlineData ? { mimeType: p.inlineData.mimeType, data: p.inlineData.data } : undefined
        }))
      }));

      const responseText = await generateResponse(history, parts);
      
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        parts: [{ text: responseText }],
      };
      setMessages((prev) => [...prev, modelMessage]);

    } catch (e: any) {
      setError(e.message || 'Failed to get response from AI.');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        parts: [{ text: `Error: ${e.message || 'Failed to get response.'}` }]
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={windowRef}
      className="min-h-[400px] min-w-[500px] flex flex-col bg-slate-900/70 backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden border border-slate-700/50"
      style={{
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        resize: 'both',
      }}
    >
      <header
        onMouseDown={handleMouseDown}
        className="bg-slate-800/80 p-2 pl-4 text-slate-200 text-sm font-bold border-b border-slate-700/50 flex-shrink-0 flex justify-between items-center select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span>Pexi Ai</span>
        <div className="flex items-center">
          <button onClick={handleReset} className="p-2 rounded-md hover:bg-white/10 transition-colors"><ResetIcon className="w-4 h-4 text-slate-300" /></button>
          <button className="p-2 rounded-md hover:bg-white/10 transition-colors"><MinusIcon className="w-4 h-4 text-slate-300" /></button>
          <button className="p-2 rounded-md hover:bg-white/10 transition-colors"><SquareIcon className="w-4 h-4 text-slate-300" /></button>
          <button className="p-2 rounded-md hover:bg-red-500/80 transition-colors"><CloseIcon className="w-4 h-4 text-slate-200" /></button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-20">
              <h2 className="text-3xl font-semibold mb-2">Welcome to Pexi Ai</h2>
              <p>Start a conversation by typing a message below or attaching a file.</p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex items-start gap-3 my-4">
               <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm4.25-6.09l-1.5 1.5C13.04 13.12 12.5 13.5 12.5 14.5h-1c0-1.5 1-2.5 1.75-3.25l1.25-1.25C15.04 9.46 15.5 8.91 15.5 8c0-1.38-1.12-2.5-2.5-2.5S10.5 6.62 10.5 8H9c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .91-.46 1.75-1.25 2.91z"/>
                  </svg>
               </div>
              <div className="max-w-xl p-4 rounded-2xl bg-slate-700/60 text-slate-100 rounded-bl-none">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          {error && <div className="text-red-400 text-center my-2">{error}</div>}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default App;
