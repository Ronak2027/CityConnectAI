import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hi! I am CleanCity AI Assistant 👋. How can I help you today with smart city maintenance, reporting an issue, or tracking your complaints?',
      actions: [
        { label: 'Report Civic Issue', action: 'NAVIGATE_REPORT' },
        { label: 'Check Complaint Status', action: 'CHECK_STATUS' }
      ]
    }
  ]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSend = async (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chatbot/query', {
        message: textToSend,
        citizenId: user?.id
      });

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.data.reply,
        actions: res.data.actions || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: 'I am having trouble reaching the civic AI service right now. Please try again shortly.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action === 'NAVIGATE_REPORT' || action === 'START_REPORT_GARBAGE' || action === 'START_REPORT_ROAD') {
      setIsOpen(false);
      navigate('/citizen');
    } else if (action === 'CHECK_STATUS' || action === 'NAVIGATE_COMPLAINTS') {
      handleSend('What is the status of my complaints?');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 md:w-96 h-[460px] bg-white rounded-card shadow-2xl border border-brand-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-brand-emerald text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">CleanCity AI Assistant</h4>
                  <div className="flex items-center gap-1.5 text-[11px] opacity-90">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span>Live Operations Agent</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-brand-bg text-xs">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[85%] ${
                    msg.sender === 'user' 
                      ? 'bg-brand-emerald text-white rounded-br-none font-medium' 
                      : 'bg-white text-brand-text border border-brand-border rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Actions buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleActionClick(act.action)}
                          className="px-3 py-1 bg-white border border-brand-emerald/40 text-brand-emerald hover:bg-brand-emerald hover:text-white rounded-full font-semibold transition-all shadow-xs"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-brand-muted text-xs p-2">
                  <Sparkles className="w-4 h-4 animate-spin text-brand-emerald" />
                  <span>AI processing request...</span>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-white border-t border-brand-border flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask CleanCity AI..."
                className="flex-1 text-xs px-3 py-2 border border-brand-border rounded-xl outline-none focus:border-brand-emerald"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="w-9 h-9 rounded-xl bg-brand-emerald text-white flex items-center justify-center hover:bg-[#066749] transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-brand-emerald text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-2 border-white"
      >
        <MessageSquare className="w-7 h-7" />
      </button>
    </div>
  );
}
