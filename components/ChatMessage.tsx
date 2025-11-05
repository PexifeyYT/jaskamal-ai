
import React from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  const renderPart = (part: any, index: number) => {
    if (part.text) {
      return (
        <p key={index} className="whitespace-pre-wrap">
          {part.text}
        </p>
      );
    }
    if (part.inlineData) {
      const src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      if (part.inlineData.mimeType.startsWith('image/')) {
        return <img key={index} src={src} alt="user upload" className="mt-2 rounded-lg max-w-xs" />;
      }
    }
    return null;
  };
  
  const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-slate-500 flex-shrink-0 flex items-center justify-center">
      <span className="text-white font-bold text-sm">U</span>
    </div>
  );
  
  const ModelIcon = () => (
      <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-2h2v2h-2zm4.25-6.09l-1.5 1.5C13.04 13.12 12.5 13.5 12.5 14.5h-1c0-1.5 1-2.5 1.75-3.25l1.25-1.25C15.04 9.46 15.5 8.91 15.5 8c0-1.38-1.12-2.5-2.5-2.5S10.5 6.62 10.5 8H9c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .91-.46 1.75-1.25 2.91z"/>
          </svg>
      </div>
  );


  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <ModelIcon />}
      <div
        className={`max-w-xl p-4 rounded-2xl ${
          isUser
            ? 'bg-blue-600/70 text-white rounded-br-none'
            : 'bg-slate-700/60 text-slate-100 rounded-bl-none'
        }`}
      >
        {message.parts.map(renderPart)}
      </div>
      {isUser && <UserIcon />}
    </div>
  );
};

export default ChatMessage;
