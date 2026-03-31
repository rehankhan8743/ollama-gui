import React from 'react';
import { ArrowUp, ArrowDown, Lock, Unlock } from 'lucide-react';

const ScrollButtons = ({ scrollContainerRef, autoScroll, setAutoScroll }) => {

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="fixed right-4 bottom-28 flex flex-col gap-2 z-20">
      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className="p-2 bg-[#161b22]/80 backdrop-blur-md border border-gray-700 rounded-full text-gray-400 hover:text-white shadow-xl active:scale-90 transition-all"
        title="Scroll to Top"
      >
        <ArrowUp size={18} />
      </button>

      {/* Auto Scroll Toggle (Free Scroll) */}
      <button
        onClick={() => setAutoScroll(!autoScroll)}
        className={`p-2 backdrop-blur-md border rounded-full shadow-xl active:scale-90 transition-all ${
          autoScroll
          ? 'bg-blue-600/20 border-blue-500 text-blue-400'
          : 'bg-gray-800/80 border-gray-600 text-gray-500'
        }`}
        title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF (Free Scroll)"}
      >
        {autoScroll ? <Lock size={18} /> : <Unlock size={18} />}
      </button>

      {/* Scroll to Bottom */}
      <button
        onClick={scrollToBottom}
        className="p-2 bg-[#161b22]/80 backdrop-blur-md border border-gray-700 rounded-full text-gray-400 hover:text-white shadow-xl active:scale-90 transition-all"
        title="Scroll to Bottom"
      >
        <ArrowDown size={18} />
      </button>
    </div>
  );
};

export default ScrollButtons;
