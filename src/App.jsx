import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ScrollButtons from './components/ScrollButtons';
import { Cpu, Square, Send, Upload, Download, FolderOpen } from 'lucide-react';
import { behaviors, getBehaviorPrompt, getBehaviorName } from './behaviors';
import { storage } from './utils/storage';
import { exportToFile } from './utils/fileExport';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeBehavior, setActiveBehavior] = useState('balanced');
  const [customBehaviors, setCustomBehaviors] = useState([]);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');

  const abortControllerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatImportInputRef = useRef(null);

  // ১. অ্যাপ লোড হওয়ার সময় ডেটা আনা
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load saved settings
        const savedUrl = await storage.get('ollamaUrl');
        if (savedUrl) setOllamaUrl(savedUrl);

        const savedBehavior = await storage.get('selectedBehavior');
        if (savedBehavior) setActiveBehavior(savedBehavior);

        const savedCustom = await storage.get('customBehaviors');
        if (savedCustom) setCustomBehaviors(JSON.parse(savedCustom));

        // Load chats
        const saved = await storage.get(STORAGE_KEY);
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
      setIsLoaded(true);
      fetchModels();
    };
    loadData();
  }, []);

  // ২. অল চ্যাট সেভ করা - শুধুমাত্র লোড হওয়ার পর এবং ডেটা থাকলে
  useEffect(() => {
    if (isLoaded) {
      storage.set(STORAGE_KEY, JSON.stringify(allChats)).catch(err =>
        console.error('Failed to save chats:', err)
      );
    }
  }, [allChats, isLoaded]);

  // Save selected behavior
  useEffect(() => {
    storage.set('selectedBehavior', activeBehavior);
  }, [activeBehavior]);

  // Save custom behaviors
  useEffect(() => {
    storage.set('customBehaviors', JSON.stringify(customBehaviors));
  }, [customBehaviors]);

  // Save Ollama URL
  useEffect(() => {
    storage.set('ollamaUrl', ollamaUrl);
  }, [ollamaUrl]);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${ollamaUrl}/api/tags`);
      const data = await res.json();
      setModels(data.models || []);
      if (data.models?.length > 0 && !selectedModel) setSelectedModel(data.models[0].name);
      setStatus('connected');
    } catch (err) { setStatus('disconnected'); }
  };

  // Re-fetch models when URL changes
  useEffect(() => {
    if (isLoaded) fetchModels();
  }, [ollamaUrl]);

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

  // ৫.৫ চ্যাট রিনেম করা
  const renameChat = (id, newTitle) => {
    setAllChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  // বর্তমান চ্যাট অবজেক্ট খুঁজে বের করা
  const currentChat = allChats.find(c => c.id === currentChatId) || null;

  // ৬. EXPORT চ্যাট ফাংশন
  const exportChats = async (type = 'all') => {
    let dataToExport;
    let filename;

    if (type === 'current' && currentChat) {
      dataToExport = [currentChat];
      filename = `chat-${currentChat.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`;
    } else {
      dataToExport = allChats;
      filename = `ollama-chats-backup-${new Date().toISOString().split('T')[0]}.json`;
    }

    try {
      const result = await exportToFile(dataToExport, filename);
      if (result.success && result.path) {
        alert('✅ Chat exported!\n\nFile saved to:\n' + result.path + '\n\nUse a file manager to access it (Android/data/com.ollaui.rehan/files/Documents/).');
      } else {
        alert('✅ Chat exported successfully!');
      }
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  // ৭. IMPORT চ্যাট ফাংশন
  const importChats = (file, mode = 'sidebar') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) {
          alert('Invalid file format. Expected an array of chats.');
          return;
        }

        // Validate imported data
        const validChats = imported.filter(chat => {
          return chat && chat.id && chat.title && Array.isArray(chat.messages);
        });

        if (validChats.length === 0) {
          alert('No valid chats found in the file.');
          return;
        }

        // Force import: generate new IDs for all imported chats to avoid conflicts
        const newChats = validChats.map((chat, index) => ({
          ...chat,
          id: Date.now().toString() + '_' + index, // Generate new unique ID
          timestamp: Date.now(), // Update timestamp
          isImportant: chat.isImportant || false // Ensure isImportant exists
        }));
        console.log('New chats to import:', newChats);
        const mergedChats = [...newChats, ...allChats];

        setAllChats(mergedChats);
        console.log('Total chats after import:', mergedChats.length);

        // Mode 'continue' = Load first imported chat for continuing conversation
        if (mode === 'continue' && newChats.length > 0) {
          const firstImportedChat = newChats[0];
          setCurrentChatId(firstImportedChat.id);
          alert(`Loaded "${firstImportedChat.title}". You can continue the conversation.`);
        } else {
          setIsSidebarOpen(true); // Open sidebar to show imported chats
          alert(`Imported ${newChats.length} chat(s). Check the Recent folder.`);
        }
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // ৬. মেসেজ পাঠানো এবং স্ট্রিমিং
  const sendMessage = async () => {
    if (!input || !selectedModel || isGenerating) return;

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

    // Get behavior prompt and inject it into API call
    const behaviorPrompt = getBehaviorPrompt(activeBehavior);
    const messagesToSend = [...(currentChat?.messages || []), userMsg];

    // Add system prompt for first message of a chat
    if (currentChat?.messages.length === 0) {
      messagesToSend.unshift({ role: 'system', content: behaviorPrompt });
    }

    setAllChats(prev => prev.map(chat => {
      if (chat.id === activeId) {
        const isFirstMsg = chat.messages.length === 0;
        return {
          ...chat,
          messages: [...chat.messages, userMsg, initialAssistantMsg],
          title: isFirstMsg ? input.slice(0, 25) + "..." : chat.title,
          behavior: activeBehavior // Save which behavior was used
        };
      }
      return chat;
    }));

    setInput('');
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel, messages: messagesToSend, stream: true }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        let errorMsg = `Ollama returned ${response.status}`;
        if (response.status === 429) {
          errorMsg = 'AI is busy. Please wait a moment and try again.';
        } else if (response.status === 503) {
          errorMsg = `Model "${selectedModel}" is not loaded. It may need ${response.headers.get('x-ollama-keep-alive') || 'a moment'} to load.`;
        } else {
          try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
          } catch {}
        }
        throw new Error(errorMsg);
      }

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
    } catch (err) {
      if (err.name !== 'AbortError') {
        if (err.message && err.message !== 'NetworkError') {
          // Show error in the assistant message
          setAllChats(prev => prev.map(c => c.id === activeId ? {
            ...c,
            messages: c.messages.map((m, idx) => idx === c.messages.length - 1 ? { ...m, content: `⚠️ ${err.message}` } : m)
          } : c));
        } else {
          setStatus('disconnected');
        }
      }
    }
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
        ollamaUrl={ollamaUrl} setOllamaUrl={setOllamaUrl}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}
        <Sidebar
          isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
          allChats={allChats} currentChatId={currentChatId}
          setCurrentChatId={setCurrentChatId} startNewChat={startNewChat}
          toggleImportant={toggleImportant} deleteChat={deleteChat} renameChat={renameChat}
          fetchModels={fetchModels}
          exportChats={exportChats} importChats={importChats}
          currentChat={currentChat}
          selectedBehavior={activeBehavior}
          setSelectedBehavior={setActiveBehavior}
          customBehaviors={customBehaviors}
          setCustomBehaviors={setCustomBehaviors}
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
              <div className="absolute right-4 bottom-4 flex gap-2">
                {/* Import & Continue Button */}
                <button
                  onClick={() => chatImportInputRef.current?.click()}
                  className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl shadow-lg transition-all"
                  title="Import chat to continue conversation"
                >
                  <FolderOpen size={20} />
                </button>

                {isGenerating ? (
                  <button onClick={stopGeneration} className="p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20"><Square size={20} fill="currentColor" /></button>
                ) : (
                  <button onClick={sendMessage} disabled={!currentChatId} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg disabled:opacity-30"><Send size={20} /></button>
                )}
              </div>

              {/* Hidden import input for chat area */}
              <input
                ref={chatImportInputRef}
                type="file"
                accept=".json,application/json,text/plain,*/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    importChats(file, 'continue'); // Import and continue mode
                    e.target.value = '';
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
