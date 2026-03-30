import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import { Cpu, Square, Send } from 'lucide-react';

const STORAGE_KEY = 'ollama_gui_messages';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [status, setStatus] = useState('connected'); 
  
  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);

  // ১. অ্যাপ লোড হওয়ার সময় সেভ করা মেসেজগুলো নিয়ে আসা
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    fetchModels();
  }, []);

  // ২. যখনই নতুন মেসেজ আসবে, তখনই সেটি লোকাল স্টোরেজে সেভ করা
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const fetchModels = async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      const data = await res.json();
      setModels(data.models || []);
      if (data.models?.length > 0 && !selectedModel) setSelectedModel(data.models[0].name);
      setStatus('connected');
    } catch (err) {
      setStatus('disconnected');
      setTimeout(fetchModels, 5000);
    }
  };

  const sendMessage = async () => {
    if (!input || !selectedModel || isGenerating) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, messages: [...messages, userMsg], stream: true }),
        signal: abortControllerRef.current.signal
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line) continue;
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              acc += json.message.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].content = acc;
                return updated;
              });
            }
          } catch (e) {}
        }
      }
    } catch (err) { 
      if (err.name !== 'AbortError') setStatus('disconnected'); 
    } finally { setIsGenerating(false); }
  };

  const stopGeneration = () => { 
    if (abortControllerRef.current) abortControllerRef.current.abort(); 
    setIsGenerating(false); 
  };

  // চ্যাট হিস্ট্রি মুছে ফেলার ফাংশন
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  useEffect(() => { 
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages]);

  return (
    <div className="flex h-screen bg-[#0d1117] text-gray-300 overflow-hidden font-sans flex-col">
      <Navbar 
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        selectedModel={selectedModel} setSelectedModel={setSelectedModel}
        models={models} status={status}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isSidebarOpen={isSidebarOpen} 
          setMessages={clearChat} // এখানে clearChat ফাংশনটি পাঠালাম
          fetchModels={fetchModels} 
        />

        <div className="flex-1 flex flex-col relative bg-[#0d1117]">
          <div className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                <Cpu size={80} />
                <p className="text-2xl font-black uppercase tracking-[0.5em]">Ollama</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} selectedModel={selectedModel} />
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 lg:p-10">
            <div className="max-w-4xl mx-auto relative group">
              <textarea
                className="w-full bg-[#161b22] border border-gray-800 rounded-2xl p-5 pr-16 outline-none focus:border-blue-500 transition-all resize-none shadow-2xl min-h-[60px]"
                placeholder={`Ask anything...`}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              />
              <div className="absolute right-4 bottom-4">
                {isGenerating ? (
                  <button onClick={stopGeneration} className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"><Square size={20} fill="currentColor" /></button>
                ) : (
                  <button onClick={sendMessage} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><Send size={20} /></button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

