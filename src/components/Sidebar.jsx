import React, { useState } from 'react';
import { MessageSquare, RefreshCw, X, Plus, Star, Trash2, Folder, ChevronDown, ChevronRight, Clock, Calendar, AlertTriangle } from 'lucide-react';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, allChats, currentChatId, setCurrentChatId, startNewChat, toggleImportant, deleteChat, fetchModels }) => {

  const [openFolders, setOpenFolders] = useState({
    important: false,
    recent: true,
    lastWeek: false,
    lastMonth: false,
    older: false,
    expiring: true // ১১ মাস পুরনোগুলো দেখার জন্য এটি ডিফল্ট খোলা রাখলাম
  });

  const toggleFolder = (folderName) => {
    setOpenFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  // ২. চ্যাট ক্যাটাগরি লজিক
  const categorize = (chats) => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const month = 30 * day;
    const year = 365 * day;
    const elevenMonths = 11 * month;

    const otherChats = chats.filter(c => c.id !== currentChatId);

    return {
      important: otherChats.filter(c => c.isImportant),
      recent: otherChats.filter(c => !c.isImportant && (now - c.timestamp) < 7 * day),
      lastWeek: otherChats.filter(c => !c.isImportant && (now - c.timestamp) >= 7 * day && (now - c.timestamp) < 14 * day),
      lastMonth: otherChats.filter(c => !c.isImportant && (now - c.timestamp) >= 14 * day && (now - c.timestamp) < 60 * day),
      older: otherChats.filter(c => !c.isImportant && (now - c.timestamp) >= 60 * day && (now - c.timestamp) < elevenMonths),
      // ১১ মাস থেকে ১২ মাস এর মধ্যের চ্যাট
      expiring: otherChats.filter(c => !c.isImportant && (now - c.timestamp) >= elevenMonths && (now - c.timestamp) < year)
    };
  };

  const groups = categorize(allChats);
  const activeChat = allChats.find(c => c.id === currentChatId);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const onTouchStart = (e) => { setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (touchStart - touchEnd > 70) setIsSidebarOpen(false);
  };

  const ChatItem = ({ chat, isActive }) => (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
        isActive ? 'bg-blue-600/20 border-blue-500/40 border shadow-lg' : 'hover:bg-gray-800/50 border border-transparent'
      }`}
      onClick={() => { setCurrentChatId(chat.id); setIsSidebarOpen(false); }}
    >
      <MessageSquare size={14} className={isActive ? 'text-blue-400' : 'text-gray-500'} />
      <span className={`flex-1 text-[11px] truncate font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>{chat.title}</span>
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); toggleImportant(chat.id); }} className="p-1">
          <Star size={14} className={chat.isImportant ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="p-1">
          <Trash2 size={14} className="text-gray-700 hover:text-red-500" />
        </button>
      </div>
    </div>
  );

  const FolderSection = ({ id, title, icon: Icon, list, color, badgeColor }) => (
    <div className="mb-2">
      <button onClick={() => toggleFolder(id)} className="w-full flex items-center gap-3 p-2 hover:bg-gray-800/40 rounded-lg transition-all">
        {openFolders[id] ? <ChevronDown size={14} className="text-gray-600" /> : <ChevronRight size={14} className="text-gray-600" />}
        <Folder size={15} className={color || "text-gray-600"} fill={openFolders[id] && list.length > 0 ? "currentColor" : "none"} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${color || "text-gray-500"}`}>{title}</span>
        <span className={`ml-auto text-[9px] px-1.5 rounded-full ${badgeColor || "text-gray-700 bg-gray-800/50"}`}>{list.length}</span>
      </button>

      {openFolders[id] && (
        <div className="mt-1 ml-4 border-l border-gray-800/50 pl-2">
          {list.length > 0 ? list.map(c => <ChatItem key={c.id} chat={c} />) : <p className="text-[9px] text-gray-700 py-2 italic ml-6">Empty</p>}
        </div>
      )}
    </div>
  );

  return (
    <div
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
      className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static left-0 top-0 w-72 h-full bg-[#111418] border-r border-gray-800 transition-transform duration-300 z-[70] flex flex-col shadow-2xl`}
    >
      <div className="p-5 pt-20 flex-1 flex flex-col overflow-hidden">

        <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden absolute top-6 right-6 p-2 bg-gray-800/50 text-gray-400 rounded-full"><X size={20} /></button>

        <button onClick={startNewChat} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm flex items-center justify-center gap-2 font-black shadow-lg mb-6 uppercase">
          <Plus size={18} /> Start New Chat
        </button>

        {activeChat && (
          <div className="mb-6">
            <p className="text-[9px] text-blue-500/60 font-black uppercase tracking-[0.2em] px-2 mb-2">Current Session</p>
            <ChatItem chat={activeChat} isActive={true} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
          <FolderSection id="important" title="Important" icon={Star} list={groups.important} color="text-yellow-500" />
          <FolderSection id="recent" title="Recent" icon={Clock} list={groups.recent} />
          <FolderSection id="lastWeek" title="Last Week" icon={Calendar} list={groups.lastWeek} />
          <FolderSection id="lastMonth" title="Last Month" icon={Calendar} list={groups.lastMonth} />
          <FolderSection id="older" title="Older" icon={Calendar} list={groups.older} />

          {/* 🎯 ১১ মাস পুরনো চ্যাট ফোল্ডার (Expiring Soon) */}
          <FolderSection
            id="expiring"
            title="Expiring Soon"
            icon={AlertTriangle}
            list={groups.expiring}
            color="text-orange-500"
            badgeColor="bg-orange-500/20 text-orange-400"
          />
        </div>

        {/* ⚠️ Warning Message Area */}
        <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
           <div className="flex gap-2 mb-1">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Auto-Deletion Policy</p>
           </div>
           <p className="text-[9px] text-gray-500 leading-relaxed">
             Chats older than 1 year will be auto-deleted. Please mark chats as <b>Important</b> to keep them forever.
           </p>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-800">
          <button onClick={fetchModels} className="w-full py-2.5 hover:bg-gray-800 rounded-xl text-[11px] flex items-center justify-center gap-2 text-gray-500 transition-all mb-2">
            <RefreshCw size={12} /> Reload Models
          </button>
          <div className="text-[9px] text-gray-800 text-center font-black tracking-widest uppercase py-1">Ollama GUI • v2.5</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
