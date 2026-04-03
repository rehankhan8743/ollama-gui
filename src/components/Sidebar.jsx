import React, { useState } from 'react';

import { MessageSquare, RefreshCw, X, Plus, Star, Trash2, Folder, ChevronDown, ChevronRight, Clock, Calendar, AlertTriangle, Upload, Download, Edit2, Check, X as XIcon, Settings, ChevronLeft, Bot, Sparkles, MessageCircle } from 'lucide-react';
import { behaviors, getBehaviorPrompt, getBehaviorName } from '../behaviors';
import { exportToFile } from '../utils/fileExport';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, allChats, currentChatId, setCurrentChatId, startNewChat, toggleImportant, deleteChat, renameChat, fetchModels, exportChats, importChats, currentChat, selectedBehavior, setSelectedBehavior, customBehaviors, setCustomBehaviors }) => {

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
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const fileInputRef = React.useRef(null);


  // Settings state

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [activeSettingsTab, setActiveSettingsTab] = useState(null);

  // Use prop-based selected behavior with fallback
  const sel = selectedBehavior || 'balanced';
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [editingBehavior, setEditingBehavior] = useState(null);

  const onTouchStart = (e) => { setTouchStart(e.targetTouches[0].clientX); };
  const onTouchMove = (e) => { setTouchEnd(e.targetTouches[0].clientX); };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (touchStart - touchEnd > 70) setIsSidebarOpen(false);
  };

    // Behavior functions
  const addCustomBehavior = () => {
    if (customName.trim() && customPrompt.trim()) {
      const newBehavior = { id: Date.now().toString(), name: customName.trim(), prompt: customPrompt.trim() };
      setCustomBehaviors(prev => [...prev, newBehavior]);
      setCustomName('');
      setCustomPrompt('');
      setIsAddingCustom(false);
    }
  };

  const updateCustomBehavior = (id) => {
    if (customName.trim() && customPrompt.trim()) {
      setCustomBehaviors(prev => prev.map(b => b.id === id ? { ...b, name: customName.trim(), prompt: customPrompt.trim() } : b));
      setEditingBehavior(null);
      setCustomName('');
      setCustomPrompt('');
    }
  };

  const deleteCustomBehavior = (id) => {
    setCustomBehaviors(prev => prev.filter(b => b.id !== id));
    if (sel === id) setSelectedBehavior('balanced');
  };

  const startEditingBehavior = (behavior) => {
    setEditingBehavior(behavior.id);
    setCustomName(behavior.name);
    setCustomPrompt(behavior.prompt);
  };

  const getAllBehaviors = () => {
    const defaults = Object.entries(behaviors.default).map(([key, val]) => ({ ...val, id: key }));
    return [...defaults, ...customBehaviors];
  };

  const getCurrentBehavior = () => {
    if (behaviors.default[sel]) return behaviors.default[sel];
    return customBehaviors.find(b => b.id === sel) || behaviors.default.balanced;
  };

  // Export a single chat by ID
  const exportSingleChat = async (chat) => {
    const dataToExport = [chat];
    const filename = `chat-${chat.title.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.json`;

    try {
      await exportToFile(dataToExport, filename);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
  };

  const ChatItem = ({ chat, isActive }) => {
    const isEditing = editingChatId === chat.id;

    const startEditing = (e) => {
      e.stopPropagation();
      setEditingChatId(chat.id);
      setEditTitle(chat.title);
    };

    const saveRename = (e) => {
      e?.stopPropagation();
      if (editTitle.trim()) {
        renameChat(chat.id, editTitle.trim());
      }
      setEditingChatId(null);
    };

    const cancelRename = (e) => {
      e?.stopPropagation();
      setEditingChatId(null);
    };

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 mb-1">
          <MessageSquare size={14} className="text-blue-400" />
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename(e);
              if (e.key === 'Escape') cancelRename(e);
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="flex-1 bg-transparent text-[11px] text-white outline-none border-none"
            placeholder="Enter chat name..."
          />
          <div className="flex gap-1">
            <button onClick={saveRename} className="p-1.5 rounded hover:bg-green-600/30 transition-colors" title="Save">
              <Check size={14} className="text-green-400" />
            </button>
            <button onClick={cancelRename} className="p-1.5 rounded hover:bg-red-600/30 transition-colors" title="Cancel">
              <XIcon size={14} className="text-red-400" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mb-1 ${
          isActive ? 'bg-blue-600/20 border-blue-500/40 border shadow-lg' : 'hover:bg-gray-800/50 border border-transparent'
        }`}
        onClick={() => { setCurrentChatId(chat.id); setIsSidebarOpen(false); }}
      >
        <MessageSquare size={14} className={isActive ? 'text-blue-400' : 'text-gray-500'} />
        <span className={`flex-1 text-[11px] truncate font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>{chat.title}</span>
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); exportSingleChat(chat); }}
            className="p-1.5 rounded hover:bg-gray-700/50 transition-colors"
            title="Export this chat"
          >
            <Download size={14} className="text-gray-600 hover:text-blue-400" />
          </button>
          <button onClick={startEditing} className="p-1.5 rounded hover:bg-gray-700/50 transition-colors" title="Rename">
            <Edit2 size={14} className="text-gray-600 hover:text-green-400" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); toggleImportant(chat.id); }} className="p-1.5 rounded hover:bg-gray-700/50 transition-colors">
            <Star size={14} className={chat.isImportant ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600 hover:text-yellow-400'} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="p-1.5 rounded hover:bg-gray-700/50 transition-colors">
            <Trash2 size={14} className="text-gray-600 hover:text-red-500" />
          </button>
        </div>
      </div>
    );
  };

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
          {/* Import/Export Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => exportChats('all')}
              className="py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl text-[10px] flex items-center justify-center gap-1.5 text-gray-400 transition-all"
              title="Export All Chats"
            >
              <Download size={12} /> Export All
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl text-[10px] flex items-center justify-center gap-1.5 text-gray-400 transition-all"
              title="Import Chats"
            >
              <Upload size={12} /> Import
            </button>
          </div>

          {/* Export Current Chat Button (only when chat is active) */}
          {currentChat && (
            <button
              onClick={() => exportChats('current')}
              className="w-full py-2.5 mb-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl text-[10px] flex items-center justify-center gap-1.5 text-blue-400 transition-all"
              title="Export Current Chat"
            >
              <Download size={12} /> Export Current Chat
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json,text/plain,*/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                importChats(file);
                e.target.value = ''; // Reset input
              }
            }}
            className="hidden"
          />

          <button onClick={fetchModels} className="w-full py-2.5 hover:bg-gray-800 rounded-xl text-[11px] flex items-center justify-center gap-2 text-gray-500 transition-all mb-2">
            <RefreshCw size={12} /> Reload Models
          </button>


          {/* Settings Button */}
          <button

            onClick={() => { setIsSettingsOpen(true); setActiveSettingsTab('behaviour'); }}
            className="w-full py-2.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl text-[11px] flex items-center justify-center gap-2 text-gray-400 transition-all"
          >

            <Settings size={12} /> Settings
          </button>
          <div className="text-[9px] text-gray-800 text-center font-black tracking-widest uppercase py-1">Ollama GUI • v2.6</div>
        </div>
      </div>


      {/* Settings Panel */}

      {isSettingsOpen && (
        <div className="absolute inset-0 bg-[#111418] z-50 flex flex-col">

          {/* Settings Header */}
          <div className="p-4 border-b border-gray-800 flex items-center gap-3">
            <button

              onClick={() => setIsSettingsOpen(false)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-400" />
            </button>

            <h2 className="text-sm font-bold text-white">Settings</h2>
          </div>


          {/* Settings Tabs */}
          <div className="flex border-b border-gray-800">
            <button

              onClick={() => setActiveSettingsTab('behaviour')}
              className={`flex-1 py-3 text-[11px] font-medium transition-colors flex items-center justify-center gap-2 ${

                activeSettingsTab === 'behaviour' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              <Sparkles size={12} /> Behaviour
            </button>
          </div>


          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-4">

            {activeSettingsTab === 'behaviour' && (
              <div className="space-y-4">
                {/* Current Behavior Display */}
                <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Active Behavior</p>
                  <p className="text-sm font-bold text-white">{getCurrentBehavior().name}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{getCurrentBehavior().prompt.slice(0, 60)}...</p>
                </div>

                {/* Default Behaviors */}
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Default Behaviors</p>
                  <div className="space-y-2">
                    {Object.entries(behaviors.default).map(([key, behavior]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedBehavior(key)}
                        className={`w-full p-3 rounded-xl text-left transition-all border ${
                          sel === key
                            ? 'bg-blue-600/20 border-blue-500/40'
                            : 'bg-gray-800/30 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Bot size={14} className={sel === key ? 'text-blue-400' : 'text-gray-500'} />
                          <span className={`text-xs font-medium ${sel === key ? 'text-white' : 'text-gray-400'}`}>
                            {behavior.name}
                          </span>
                          {sel === key && (
                            <span className="ml-auto text-[9px] text-blue-400">Active</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Behaviors */}
                {customBehaviors.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Custom Behaviors</p>
                    <div className="space-y-2">
                      {customBehaviors.map((behavior) => (
                        <div key={behavior.id}>
                          {editingBehavior === behavior.id ? (
                            <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl space-y-2">
                              <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="w-full bg-gray-900 rounded-lg px-3 py-2 text-xs text-white outline-none border border-gray-700 focus:border-blue-500"
                                placeholder="Behavior name..."
                              />
                              <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                className="w-full bg-gray-900 rounded-lg px-3 py-2 text-xs text-white outline-none border border-gray-700 focus:border-blue-500 resize-none"
                                rows={3}
                                placeholder="Enter system prompt..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateCustomBehavior(behavior.id)}
                                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => { setEditingBehavior(null); setCustomName(''); setCustomPrompt(''); }}
                                  className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedBehavior(behavior.id)}
                              className={`w-full p-3 rounded-xl text-left transition-all border ${
                                sel === behavior.id
                                  ? 'bg-blue-600/20 border-blue-500/40'
                                  : 'bg-gray-800/30 border-gray-800 hover:border-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <MessageCircle size={14} className={sel === behavior.id ? 'text-blue-400' : 'text-gray-500'} />
                                <span className={`text-xs font-medium ${sel === behavior.id ? 'text-white' : 'text-gray-400'}`}>
                                  {behavior.name}
                                </span>
                                {sel === behavior.id && (
                                  <span className="ml-auto text-[9px] text-blue-400">Active</span>
                                )}
                              </div>
                              <div className="flex gap-1 mt-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); startEditingBehavior(behavior); }}
                                  className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                                  title="Edit"
                                >
                                  <Edit2 size={12} className="text-gray-500 hover:text-green-400" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteCustomBehavior(behavior.id); }}
                                  className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={12} className="text-gray-500 hover:text-red-400" />
                                </button>
                              </div>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Custom Behavior */}
                {isAddingCustom ? (
                  <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-white mb-2">Create Custom Behavior</p>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-gray-900 rounded-lg px-3 py-2 text-xs text-white outline-none border border-gray-700 focus:border-blue-500"
                      placeholder="Behavior name (e.g., 'Teacher')..."
                    />
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="w-full bg-gray-900 rounded-lg px-3 py-2 text-xs text-white outline-none border border-gray-700 focus:border-blue-500 resize-none"
                      rows={3}
                      placeholder="Enter system prompt describing the behavior..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={addCustomBehavior}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs text-white"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => { setIsAddingCustom(false); setCustomName(''); setCustomPrompt(''); }}
                        className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingCustom(true)}
                    className="w-full py-2.5 border border-dashed border-gray-700 hover:border-gray-600 rounded-xl text-[11px] text-gray-500 hover:text-gray-400 flex items-center justify-center gap-2 transition-all"
                  >
                    <Plus size={14} /> Create Custom Behavior
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
