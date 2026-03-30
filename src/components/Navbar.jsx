import React from 'react';
import { Terminal, Menu, X, ChevronDown } from 'lucide-react';

const Navbar = ({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  selectedModel, 
  setSelectedModel, 
  models, 
  status 
}) => {
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
         <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
         <span className="text-[10px] uppercase font-bold text-gray-500 hidden sm:inline">{status}</span>
      </div>
    </header>
  );
};

export default Navbar;
