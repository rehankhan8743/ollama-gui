import React, { useState } from 'react';
import { Terminal, Menu, X, ChevronDown, Server, Settings2 } from 'lucide-react';

const Navbar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  selectedModel,
  setSelectedModel,
  models,
  status,
  ollamaUrl,
  setOllamaUrl
}) => {
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState(ollamaUrl);
  return (
    <header className="sticky top-0 z-50 bg-[#161b22] border-b border-gray-800 p-3 px-5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <button 
          className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
        </button>
        <div className="hidden md:flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-md">
            <Terminal size={18} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">Ollama GUI</span>
        </div>
      </div>

      {/* ড্রপডাউন সিলেক্টর */}
      <div className="relative">
        <select 
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="appearance-none bg-[#21262d] border border-gray-700 text-white text-sm rounded-xl px-4 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-[#30363d] transition-all font-medium min-w-[150px] md:min-w-[200px]"
        >
          {models.length > 0 ? (
            models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)
          ) : (
            <option>No Models Active</option>
          )}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
          <ChevronDown size={16} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Ollama URL Config Button */}
        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="p-2 hover:bg-gray-800 rounded-lg transition"
          title="Configure Ollama Server"
        >
          <Settings2 size={18} className={showUrlInput ? 'text-blue-400' : 'text-gray-400'} />
        </button>
        <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-[10px] uppercase font-bold text-gray-500 hidden sm:inline">{status}</span>
      </div>

      {/* Ollama URL Input Modal */}
      {showUrlInput && (
        <div className="absolute top-full right-0 mt-2 mr-4 bg-[#21262d] border border-gray-700 rounded-xl p-4 shadow-2xl z-50 min-w-[300px]">
          <div className="flex items-center gap-2 mb-2">
            <Server size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-white">Ollama Server URL</span>
          </div>
          <input
            type="text"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            placeholder="http://localhost:11434"
            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 mb-3"
          />
          <p className="text-[10px] text-gray-500 mb-3">
            For APK: Use your computer&apos;s IP (e.g., http://192.168.1.5:11434)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setOllamaUrl(tempUrl);
                setShowUrlInput(false);
              }}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTempUrl(ollamaUrl);
                setShowUrlInput(false);
              }}
              className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
