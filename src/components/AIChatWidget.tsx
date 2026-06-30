/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { PortalDatabase } from '../data';
import { ReligiousStaff } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface AIChatWidgetProps {
  prayerTimings: any[];
  announcements: any[];
  historySections: any[];
  activities: any[];
  administrators: any[];
  projects: any[];
  religiousStaff?: ReligiousStaff[];
}

export default function AIChatWidget({
  prayerTimings,
  announcements,
  historySections,
  activities,
  administrators,
  projects,
  religiousStaff = []
}: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested questions for users to get started instantly
  const suggestions = [
    "Namaz ke timings kya hain?",
    "Solar Project ki updates dein",
    "Masjid kab tameer hui thi?",
    "Committee members ke naam batayein",
    "Dars-e-Quran kab hota hai?"
  ];

  // Initialize with a warm welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'model',
          text: "Assalam-o-Alaikum Wa Rahmatullah Wa Barakatuh! Main Masjid Al-Habib Noorani ka AI Assistant hoon. Aap mujh se namaz ke auqat (prayer times), announcements, masjid ki tareekh (history), ya kisi bhi activity/funds ke baare mein sawal pooch sakte hain. Main Roman Urdu aur English dono mein jawab de sakta hoon!",
          timestamp: new Date()
        }
      ]);
    }
  }, [messages]);

  // Scroll to bottom whenever messages list updates
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setErrorText(null);
    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get the extra information added by the admin from LocalStorage via PortalDatabase
      const extraInfo = PortalDatabase.get<string>('ai_extra_info', '');

      // Combine relevant context for the server
      const contextData = {
        prayerTimings,
        announcements: announcements.filter(a => a.active),
        historySections,
        activities,
        administrators,
        projects,
        religiousStaff,
        extraInfo
      };

      // Format previous conversation history (excluding the current user message)
      const chatHistory = messages
        .filter(m => m.id !== 'welcome') // exclude initial welcome message to keep prompt clean
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          contextData
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: Math.random().toString(),
        role: 'model',
        text: data.reply || "Maazrat, main abhi jawab nahi de saka. Baraye mehrbani dobara koshish karen.\nSorry, I could not generate a reply. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      setErrorText("System connection mein aarzi rukawat hai. Baraye mehrbani dobara koshish karen. Connection failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (hasUnread) {
      setHasUnread(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
            className="w-[360px] sm:w-[400px] h-[520px] max-h-[80vh] bg-gradient-to-b from-pine-card to-pine-bar border border-pine-border rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 font-sans"
          >
            {/* Header */}
            <div className="bg-pine-bar/90 border-b border-pine-border/60 py-4 px-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-pine-btn">
                  <Bot className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-extrabold text-white tracking-wide flex items-center gap-1.5 uppercase">
                    Habib Noorani AI <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  </h3>
                  <p className="text-[10px] text-teal-400 font-medium">Digital Companion • Rawayati Islami Rahnumayi</p>
                </div>
              </div>
              <button 
                onClick={toggleChat}
                className="p-1.5 rounded-full hover:bg-pine-hover/20 text-pine-text-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/10">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed font-sans whitespace-pre-wrap ${
                      msg.role === 'user' 
                        ? 'bg-pine-btn text-white rounded-tr-none' 
                        : 'bg-pine-hover/40 border border-pine-border/35 text-zinc-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                    <div className="text-[9px] text-pine-text-muted/60 mt-1.5 text-right font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loader indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-pine-hover/40 border border-pine-border/35 rounded-2xl rounded-tl-none p-3 max-w-[85%] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pine-btn animate-[bounce_1.2s_infinite]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pine-btn animate-[bounce_1.2s_infinite_0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pine-btn animate-[bounce_1.2s_infinite_0.4s]" />
                  </div>
                </div>
              )}

              {/* Error block */}
              {errorText && (
                <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-3 flex items-start gap-2.5 text-red-300 text-[11px] font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorText}</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Suggestions list */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2 bg-black/5 border-t border-pine-border/20">
                <p className="text-[10px] text-pine-text-muted mb-1.5 font-bold uppercase tracking-wider">Frequently Asked Questions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sug)}
                      className="text-[10px] bg-pine-hover/20 hover:bg-pine-btn hover:text-white border border-pine-border/40 text-teal-300 py-1 px-2.5 rounded-full transition-all text-left"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="p-3 bg-pine-bar border-t border-pine-border/60 flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Sawaal likhein... Ask a question"
                disabled={isLoading}
                className="flex-1 bg-black/45 border border-pine-border py-2 px-3 text-xs text-white rounded-xl focus:outline-none focus:border-pine-btn disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="py-2 px-3.5 bg-pine-btn hover:bg-pine-btn-hover text-white rounded-xl disabled:opacity-40 disabled:hover:bg-pine-btn transition-colors flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-r from-pine-btn to-teal-500 rounded-full shadow-2xl flex items-center justify-center text-white relative cursor-pointer border border-teal-300/20"
        title="Ask Masjid AI Assistant!"
      >
        <MessageSquare className="w-6 h-6" />
        
        {/* Unread notification dot indicator */}
        {hasUnread && !isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-gold-500 border-2 border-pine-bar rounded-full flex items-center justify-center text-[8px] font-bold text-black animate-bounce">
            1
          </span>
        )}
      </motion.button>
    </div>
  );
}
