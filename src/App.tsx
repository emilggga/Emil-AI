/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2, Plus, Menu, X, Github, ExternalLink, Paperclip, Image as ImageIcon, FileText, Music, Video, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Message, chatWithEmilStream } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileAttachment {
  mimeType: string;
  data: string;
  name: string;
  type: 'image' | 'audio' | 'video' | 'file';
  previewUrl?: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        const mimeType = file.type;
        let type: 'image' | 'audio' | 'video' | 'file' = 'file';
        
        if (mimeType.startsWith('image/')) type = 'image';
        else if (mimeType.startsWith('audio/')) type = 'audio';
        else if (mimeType.startsWith('video/')) type = 'video';

        const newAttachment: FileAttachment = {
          mimeType,
          data: base64Data,
          name: file.name,
          type,
          previewUrl: type === 'image' ? URL.createObjectURL(file) : undefined
        };
        
        setAttachments(prev => [...prev, newAttachment]);
      };
      
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index].previewUrl) {
        URL.revokeObjectURL(updated[index].previewUrl!);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input,
      attachments: attachments.map(a => ({
        mimeType: a.mimeType,
        data: a.data,
        name: a.name,
        type: a.type
      }))
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const assistantMessage: Message = { role: 'model', content: '' };
      setMessages(prev => [...prev, assistantMessage]);

      let fullResponse = '';
      const stream = chatWithEmilStream(newMessages);

      for await (const chunk of stream) {
        if (chunk) {
          fullResponse += chunk;
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', content: fullResponse };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Error chatting with Emil:', error);
      setMessages(prev => [
        ...prev,
        { role: 'model', content: 'Atvainojiet, radās kļūda. Lūdzu, mēģiniet vēlreiz.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-[#1a0a0d] text-gray-100 overflow-hidden relative">
      <div className="latvia-bg" />
      
      {/* Sidebar for Desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#2a1014] border-r border-[#9E1B32]/20 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#9E1B32] rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Emil AI</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={clearChat}
            className="flex items-center gap-2 w-full p-3 mb-4 bg-white/5 hover:bg-white/10 border border-[#9E1B32]/30 rounded-xl transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Jauna saruna
          </button>

          <div className="flex-1 overflow-y-auto space-y-2">
            <div className="px-2 py-4 text-xs text-gray-500 uppercase tracking-wider font-semibold">
              Pēdējās sarunas
            </div>
            <div className="px-3 py-2 text-sm text-gray-400 italic">
              Vēsture ir tukša
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-[#9E1B32]/20 space-y-1">
            <div className="p-3 text-xs text-center text-gray-500 font-medium">
              Latvijas Tehnoloģijas 🇱🇻
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-[#9E1B32]/20 bg-[#1a0a0d]/80 backdrop-blur-md sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2 lg:hidden">
            <Sparkles className="w-5 h-5 text-[#9E1B32]" />
            <span className="font-bold">Emil AI</span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#9E1B32]/10 border border-[#9E1B32]/20 rounded-full">
              <div className="w-2 h-2 bg-[#9E1B32] rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-[#9E1B32] uppercase tracking-widest">Sistēma Tiešsaistē</span>
            </div>
            <button 
              onClick={clearChat}
              className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-[#9E1B32] transition-colors"
              title="Notīrīt sarunu"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 bg-[#9E1B32] rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-[#9E1B32]/20"
                >
                  <Sparkles className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight">Kā es varu jums palīdzēt?</h2>
                <p className="text-gray-400 max-w-md mx-auto mb-12">
                  Es esmu Emil, jūsu AI asistents. Es varu palīdzēt ar programmēšanu, rakstīšanu, ideju ģenerēšanu vai vienkārši atbildēt uz jautājumiem.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                  {[
                    "Pastāsti par Latvijas vēsturi",
                    "Uzraksti dzejoli par Rīgu",
                    "Kā pagatavot pelēkos zirņus?",
                    "Iesaki skaistas vietas Latvijā"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="p-4 text-left bg-white/5 hover:bg-white/10 border border-[#9E1B32]/20 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <p className="text-sm font-medium text-gray-200">{suggestion}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={cn(
                    "flex gap-4 p-4 rounded-2xl",
                    message.role === 'user' ? "bg-white/5 ml-auto max-w-[85%]" : "bg-transparent mr-auto w-full"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                    message.role === 'user' ? "bg-[#9E1B32] order-last" : "bg-[#9E1B32]"
                  )}>
                    {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                      {message.role === 'user' ? 'Jūs' : 'Emil AI'}
                    </div>
                    
                    {/* Display user attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {message.attachments.map((att, i) => (
                          <div key={i} className="relative group">
                            {att.mimeType.startsWith('image/') ? (
                              <img 
                                src={`data:${att.mimeType};base64,${att.data}`} 
                                alt={att.name} 
                                className="max-w-[200px] max-h-[200px] rounded-lg border border-white/10"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg text-xs border border-white/10">
                                <FileText className="w-4 h-4" />
                                <span className="truncate max-w-[100px]">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="markdown-body">
                      <Markdown>{message.content}</Markdown>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-4 p-4">
                <div className="w-8 h-8 rounded-lg bg-[#9E1B32] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-[#9E1B32] rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-[#9E1B32] rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-[#9E1B32] rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gradient-to-t from-[#1a0a0d] via-[#1a0a0d] to-transparent">
          <div className="max-w-3xl mx-auto relative">
            
            {/* Attachment Previews */}
            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="flex flex-wrap gap-2 mb-3 p-2 bg-[#2a1014] border border-[#9E1B32]/30 rounded-xl"
                >
                  {attachments.map((att, i) => (
                    <div key={i} className="relative group">
                      {att.type === 'image' ? (
                        <img 
                          src={att.previewUrl} 
                          alt="preview" 
                          className="w-16 h-16 object-cover rounded-lg border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 flex flex-col items-center justify-center bg-white/5 rounded-lg border border-white/10 p-1">
                          {att.type === 'audio' ? <Music className="w-6 h-6" /> : 
                           att.type === 'video' ? <Video className="w-6 h-6" /> : 
                           <FileText className="w-6 h-6" />}
                          <span className="text-[8px] truncate w-full text-center mt-1">{att.name}</span>
                        </div>
                      )}
                      <button 
                        onClick={() => removeAttachment(i)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="relative group">
              <div className="absolute left-2 bottom-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-[#9E1B32] hover:bg-white/5 rounded-xl transition-all"
                  title="Pievienot failu"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  multiple
                />
              </div>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Rakstiet Emil AI..."
                rows={1}
                className="w-full bg-[#2a1014] border border-[#9E1B32]/30 rounded-2xl py-4 pl-12 pr-14 focus:outline-none focus:ring-2 focus:ring-[#9E1B32]/50 resize-none transition-all placeholder:text-gray-600"
                style={{ minHeight: '56px', maxHeight: '200px' }}
              />
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className="absolute right-2 bottom-2 p-2 bg-[#9E1B32] text-white rounded-xl hover:bg-[#7d1528] disabled:opacity-50 disabled:hover:bg-[#9E1B32] transition-all shadow-lg shadow-[#9E1B32]/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-[10px] text-center text-gray-600 mt-3 uppercase tracking-widest font-bold">
              Emil AI var kļūdīties. Pārbaudiet svarīgu informāciju.
            </p>
          </div>
        </div>
      </main>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
