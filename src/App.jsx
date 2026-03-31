import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ScrollButtons from './components/ScrollButtons';
import { Cpu, Square, Send } from 'lucide-react';

const STORAGE_KEY = 'ollama_gui_v3_chats';

function App() {
  const [allChats, setAllChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [status, setStatus] = useState('connected');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false); // Track if data is loaded

  const abortControllerRef = useRef(null);
  const chatContainerRef = useRef(null);

  // ১. অ্যাপ লোড হওয়ার সময় ডেটা আনা
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        let chats = JSON.parse(saved);
        const now = Date.now();
        const oneYear = 365 * 24 * 60 * 60 * 1000;

        // ১ বছরের বেশি পুরনো এবং Important না হলে ডিলিট হবে
        const filtered = chats.filter(chat => {
          const isTooOld = (now - chat.timestamp) > oneYear;
          return !(isTooOld && !chat.isImportant);
        });

        setAllChats(filtered);
        if (filtered.length > 0) {
          setCurrentChatId(filtered[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
      setAllChats([]);
    }
    setIsLoaded(true); // Mark as loaded
    fetchModels();
  }, []);

  // ২. অল চ্যাট সেভ করা - শুধুমাত্র লোড হওয়ার পর এবং ডেটা থাকলে
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allChats));
        console.log('Saved', allChats.length, 'chats to localStorage');
      } catch (err) {
        console.error('Failed to save chats:', err);
      }
    }
  }, [allChats, isLoaded]);

  const fetchModels = async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      const data = await res.json();
      setModels(data.models || []);
      if (data.models?.length > 0 && !selectedModel) setSelectedModel(data.models[0].name);
      setStatus('connected');
    } catch (err) { setStatus('disconnected'); }
  };

  // ৩. নতুন চ্যাট শুরু করা
  const startNewChat = () => {
    const newId = Date.now().toString();
    const newChat = {
      id: newId,
      title: 'New Chat',
      messages: [],
      timestamp: Date.now(),
      isImportant: false
    };
    setAllChats(prev => [newChat, ...prev]);
    setCurrentChatId(newId);
    setIsSidebarOpen(false);
  };

  // ৪. ইম্পর্ট্যান্ট টগল করা
  const toggleImportant = (id) => {
    setAllChats(prev => prev.map(c => c.id === id ? { ...c, isImportant: !c.isImportant } : c));
  };

  // ৫. চ্যাট ডিলিট করা
  const deleteChat = (id) => {
    const updated = allChats.filter(c => c.id !== id);
    setAllChats(updated);
    if (currentChatId === id) setCurrentChatId(updated[0]?.id || null);
  };

  // বর্তমান চ্যাট অবজেক্ট খুঁজে বের করা
  const currentChat = allChats.find(c => c.id === currentChatId) || null;

  // ৬. মেসেজ পাঠানো এবং স্ট্রিমিং
  const sendMessage = async () => {
    if (!input || !selectedModel || isGenerating) return;

    // যদি কোনো চ্যাট না থাকে তবে নতুন শুরু করবে
    let activeId = currentChatId;
    if (!activeId) {
      const newId = Date.now().toString();
      const newChat = { id: newId, title: input.slice(0, 20), messages: [], timestamp: Date.now(), isImportant: false };
      setAllChats([newChat]);
      setCurrentChatId(newId);
      activeId = newId;
    }

    const userMsg = { role: 'user', content: input };
    const initialAssistantMsg = { role: 'assistant', content: '' };

    // স্টেট আপডেট
    setAllChats(prev => prev.map(chat => {
      if (chat.id === activeId) {
        const isFirstMsg = chat.messages.length === 0;
        return {
          ...chat,
          messages: [...chat.messages, userMsg, initialAssistantMsg],
          title: isFirstMsg ? input.slice(0, 25) + "..." : chat.title
        };
      }
      return chat;
    }));

    setInput('');
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, messages: [...(currentChat?.messages || []), userMsg], stream: true }),
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
          const json = JSON.parse(line);
          if (json.message?.content) {
            acc += json.message.content;
            setAllChats(prev => prev.map(c => c.id === activeId ? {
              ...c,
              messages: c.messages.map((m, idx) => idx === c.messages.length - 1 ? { ...m, content: acc } : m)
            } : c));
          }
        }
      }
    } catch (err) { if (err.name !== 'AbortError') setStatus('disconnected'); }
    finally { setIsGenerating(false); }
  };

  const stopGeneration = () => { if (abortControllerRef.current) abortControllerRef.current.abort(); setIsGenerating(false); };

  useEffect(() => {
    if (autoScroll && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [allChats, autoScroll]);

  return (
    <div className="flex h-screen bg-[#0d1117] text-gray-300 overflow-hidden font-sans flex-col relative">
      <Navbar
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        selectedModel={selectedModel} setSelectedModel={setSelectedModel}
        models={models} status={status}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}
        <Sidebar
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          allChats={allChats} currentChatId={currentChatId}
          setCurrentChatId={setCurrentChatId} startNewChat={startNewChat}
          toggleImportant={toggleImportant} deleteChat={deleteChat}
          fetchModels={fetchModels}
        />
        <ScrollButtons scrollContainerRef={chatContainerRef} autoScroll={autoScroll} setAutoScroll={setAutoScroll} />

        <div className="flex-1 flex flex-col relative bg-[#0d1117]">
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 lg:p-10 space-y-8 scroll-smooth">
            {!currentChat || currentChat.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                <Cpu size={80} />
                <p className="text-2xl font-black uppercase tracking-[0.5em]">Ollama</p>
              </div>
            ) : (
              currentChat.messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} selectedModel={selectedModel} />
              ))
            )}
          </div>
          <div className="p-4 lg:p-10 bg-gradient-to-t from-[#0d1117] to-transparent">
            <div className="max-w-4xl mx-auto relative">
              <textarea
                className="w-full bg-[#161b22] border border-gray-800 rounded-2xl p-5 pr-16 outline-none focus:border-blue-500 transition-all resize-none shadow-2xl min-h-[60px]"
                placeholder={currentChatId ? "Ask anything..." : "Click '+' to start a chat"}
                value={input}
                disabled={!currentChatId}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              />
              <div className="absolute right-4 bottom-4">
                {isGenerating ? (
                  <button onClick={stopGeneration} className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"><Square size={20} fill="currentColor" /></button>
                ) : (
                  <button onClick={sendMessage} disabled={!currentChatId} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg disabled:opacity-30"><Send size={20} /></button>
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
