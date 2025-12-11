import React, { useRef, useEffect } from 'react';
import { Message, Sender, AgentType } from '../types';
import { AGENTS_CONFIG } from '../constants';
import { Bot, User, Cpu, ShieldAlert, ArrowRight } from 'lucide-react';

interface Props {
  messages: Message[];
  isLoading: boolean;
  isAgentWorking: boolean;
  activeAgent: AgentType | null;
}

const ChatInterface: React.FC<Props> = ({ messages, isLoading, isAgentWorking, activeAgent }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAgentWorking]);

  const getAgentConfig = (type: AgentType) => AGENTS_CONFIG.find(c => c.id === type);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden relative">
        {/* Background Grid Decoration */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        
      <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
        
        {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                <Cpu className="w-16 h-16 mb-4" />
                <p>Sistem Pusat Komando Siap.</p>
                <p className="text-sm">Menunggu instruksi...</p>
            </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === Sender.USER ? 'items-end' : 'items-start'}`}>
            
            {/* Metadata / Sender Label */}
            <div className="flex items-center gap-2 mb-1 px-1">
                {msg.sender === Sender.USER ? (
                    <>
                        <span className="text-xs text-slate-400 font-mono">OPERATOR</span>
                        <User className="w-3 h-3 text-blue-400" />
                    </>
                ) : msg.sender === Sender.COORDINATOR ? (
                    <>
                        <Bot className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-400 font-mono">KOORDINATOR</span>
                    </>
                ) : (
                    <>
                         <div className={`w-2 h-2 rounded-full ${msg.sender === Sender.AGENT ? 'bg-cyan-400' : 'bg-slate-500'}`}></div>
                         <span className="text-xs text-cyan-400 font-mono">OUTPUT SISTEM</span>
                    </>
                )}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-lg relative ${
                msg.sender === Sender.USER
                  ? 'bg-blue-600 text-white rounded-tr-sm'
                  : msg.sender === Sender.COORDINATOR 
                    ? 'bg-slate-800 text-slate-200 border border-purple-500/30 rounded-tl-sm'
                    : 'bg-cyan-950/30 border border-cyan-500/30 text-cyan-100 rounded-tl-sm w-full font-mono text-xs'
              }`}
            >
                {/* Special styling for Tool Calls within the message stream */}
                {msg.metadata?.isToolCall ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-slate-400 border-b border-slate-700/50 pb-2 mb-1">
                            <ArrowRight className="w-3 h-3" />
                            <span>Mendelegasikan ke: <span className="text-white font-bold">{msg.metadata.agentName}</span></span>
                        </div>
                        <div className="opacity-80">
                            {msg.text}
                        </div>
                    </div>
                ) : (
                    msg.text
                )}

                {/* Secure Data Badge for Medical Records */}
                {msg.metadata?.agentName?.includes("Rekam Medis") && msg.sender !== Sender.USER && (
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-red-400 bg-red-950/30 p-1 px-2 rounded w-fit border border-red-900/50">
                        <ShieldAlert className="w-3 h-3" />
                        <span>DATA SENSITIF - ENKRIPSI AKTIF</span>
                    </div>
                )}
            </div>
            
            <span className="text-[10px] text-slate-600 mt-1 px-1">
                {msg.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}

        {/* Loading Indicator (Coordinator Thinking) */}
        {isLoading && !isAgentWorking && (
            <div className="flex items-start gap-3 animate-pulse">
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Bot className="w-4 h-4 text-slate-400" />
                 </div>
                 <div className="bg-slate-800/50 rounded-lg px-4 py-2">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                 </div>
            </div>
        )}

        {/* Active Agent Working Indicator */}
        {isAgentWorking && activeAgent && (
             <div className="flex flex-col items-center justify-center p-4 my-4 border border-dashed border-slate-700 rounded-lg bg-slate-900/50">
                 <div className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Eksekusi Sub-Agen Berjalan</div>
                 {(() => {
                    const conf = getAgentConfig(activeAgent);
                    return (
                        <div className={`flex items-center gap-3 px-4 py-2 rounded-full border ${conf?.bg} ${conf?.border} ${conf?.color}`}>
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 bg-current`}></span>
                            </span>
                            <span className="text-sm font-bold">{conf?.name}</span>
                        </div>
                    );
                 })()}
             </div>
        )}

      </div>
    </div>
  );
};

export default ChatInterface;