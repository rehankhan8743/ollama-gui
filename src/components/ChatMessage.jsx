import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatMessage = ({ msg, selectedModel }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full mb-4`}>
      <div className={`relative group max-w-[85vw] md:max-w-[75%] p-4 rounded-2xl overflow-hidden ${
        msg.role === 'user' 
        ? 'bg-blue-600 text-white shadow-xl ml-10' 
        : 'bg-[#161b22] border border-gray-800 text-gray-200 mr-10'
      }`}>
        <div className="text-[9px] mb-2 opacity-50 uppercase font-bold tracking-widest">
          {msg.role === 'user' ? 'USER' : selectedModel}
        </div>
        
        {/* চ্যাট বডির জন্য Markdown Renderer - স্ক্রলিং ফিক্সড করা হয়েছে */}
        <div className="text-sm md:text-base prose prose-invert max-w-full overflow-x-auto break-words">
          <ReactMarkdown
            children={msg.content || '▋'}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <div className="my-4 w-full overflow-x-auto rounded-lg border border-gray-700 bg-[#0d1117]">
                    <SyntaxHighlighter
                      children={String(children).replace(/\n$/, '')}
                      style={atomDark}
                      language={match[1]}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        fontSize: '0.85rem',
                        backgroundColor: 'transparent'
                      }}
                      {...props}
                    />
                  </div>
                ) : (
                  <code className="bg-gray-800 px-1 rounded text-pink-400 font-mono" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          />
        </div>

        {/* কপি বাটন */}
        {msg.content && msg.role === 'assistant' && (
          <button 
            onClick={handleCopy}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

