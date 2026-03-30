import React from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';

const Sidebar = ({ isSidebarOpen, setMessages, fetchModels }) => {
  return (
    <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static w-64 h-full bg-[#161b22] border-r border-gray-800 transition-transform duration-300 z-40 p-5 flex flex-col`}>
      <div className="space-y-4 flex-1 pt-4">
         <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest px-2">Menu</p>
         <button onClick={() => setMessages([])} className="w-full py-3 bg-[#21262d] hover:bg-gray-800 border border-gray-700 rounded-xl text-xs flex items-center justify-center gap-2 transition-all">
            <MessageSquare size={14} /> Clear History
         </button>
         <button onClick={fetchModels} className="w-full py-3 hover:bg-gray-800 rounded-xl text-xs flex items-center justify-center gap-2 transition-all">
            <RefreshCw size={14} /> Reload Models
         </button>
      </div>
    </div>
  );
};

export default Sidebar;

