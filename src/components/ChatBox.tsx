import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Headset, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'customer' | 'admin';
  timestamp: Date;
}

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Welcome to Elite Support. How can Uncle Tee assist you today?",
      sender: 'admin',
      timestamp: new Date()
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'customer',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Simulate Admin Response (Uncle Tee)
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: "Understood. Our luxury assets are moving fast. An agent will be with you shortly to finalize your request.",
        sender: 'admin',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 left-6 md:left-auto md:right-6 z-[100] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 left-0 md:left-auto md:right-0 w-[calc(100vw-3rem)] md:w-[400px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black italic">UT</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <h4 className="text-white text-[10px] font-black uppercase tracking-widest leading-none">Uncle Tee Support</h4>
                  <p className="text-slate-400 text-[8px] mt-1.5 uppercase font-bold tracking-tighter">Luxury Concierge Active</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.sender === 'customer' ? "ml-auto items-end" : "items-start"
                  )}
                >
                  <div 
                    className={cn(
                      "p-3 rounded-2xl text-xs leading-relaxed",
                      msg.sender === 'customer' 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-white border border-slate-100 text-slate-800 shadow-sm rounded-tl-none font-medium"
                    )}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 px-1">
                    {msg.sender === 'customer' ? 'You' : 'Elite Concierge'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
              <div className="relative">
                <input 
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Inquire about an asset..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium pr-12"
                />
                <button 
                  type="submit"
                  disabled={!message.trim()}
                  className="absolute right-2 top-2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[8px] text-slate-400 text-center mt-3 uppercase font-bold tracking-widest">End-to-End Encryption Secured</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative",
          isOpen ? "bg-slate-900 text-white rotate-90" : "bg-indigo-600 text-white hover:bg-slate-900"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 bg-emerald-500 text-[8px] font-black italic text-white px-1.5 py-0.5 rounded border-2 border-white shadow-lg animate-bounce">
            LIVE
          </div>
        )}
      </motion.button>
    </div>
  );
}
