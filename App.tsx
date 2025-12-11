import React, { useState, useEffect, useRef } from 'react';
import { Send, Activity, Settings, Database, Lock } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import AgentStatusCard from './components/AgentStatusCard';
import { Message, Sender, AgentType, AgentStatus } from './types';
import { AGENTS_CONFIG } from './constants';
import { GeminiService } from './services/geminiService';

const geminiService = new GeminiService();

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulation States
  const [activeAgent, setActiveAgent] = useState<AgentType | null>(null);
  const [isAgentWorking, setIsAgentWorking] = useState(false);

  // Initialize Agent Statuses
  const [agents, setAgents] = useState<AgentStatus[]>(
    AGENTS_CONFIG.map(config => ({
        id: config.id,
        name: config.name,
        description: config.description,
        isBusy: false
    }))
  );

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || isAgentWorking) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: Sender.USER,
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
        // Convert internal messages to Gemini history format
        const history = messages.map(m => ({
            role: m.sender === Sender.USER ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        const response = await geminiService.sendMessage(
            history,
            userMsg.text,
            // Callback: Tool Started
            (toolName) => {
                const agentId = getAgentIdFromTool(toolName);
                if (agentId) {
                    setIsLoading(false); // Coordinator stopped thinking, handed off
                    setIsAgentWorking(true);
                    setActiveAgent(agentId);
                    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, isBusy: true } : a));
                    
                    // Add a system log message
                    setMessages(prev => [...prev, {
                        id: Date.now().toString() + '_sys',
                        sender: Sender.SYSTEM,
                        text: `KOORDINATOR: Meneruskan permintaan ke ${getAgentName(agentId)}...`,
                        timestamp: new Date(),
                        metadata: { isToolCall: true, agentName: getAgentName(agentId) }
                    }]);
                }
            },
            // Callback: Tool Completed
            (result, agentId) => {
                 // Format the output display. Prefer the smart analysis if available.
                 let displayValid = "";
                 if (result.result.agent_analysis) {
                    displayValid = `[ANALISIS CERDAS SUB-AGEN]\n${result.result.agent_analysis}`;
                 } else {
                    displayValid = `RAW OUTPUT: ${JSON.stringify(result.result, null, 2)}`;
                 }

                 setMessages(prev => [...prev, {
                    id: Date.now().toString() + '_agent',
                    sender: Sender.AGENT,
                    text: displayValid,
                    timestamp: new Date(),
                    metadata: { agentName: getAgentName(agentId) }
                }]);
            }
        );

        // Final Coordinator Response
        setMessages(prev => [...prev, {
            id: Date.now().toString() + '_bot',
            sender: Sender.COORDINATOR,
            text: response.text,
            timestamp: new Date()
        }]);

    } catch (error) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: Sender.SYSTEM,
            text: "Error: Gagal terhubung ke Koordinator Pusat (Cek API Key).",
            timestamp: new Date()
        }]);
    } finally {
        setIsLoading(false);
        setIsAgentWorking(false);
        setActiveAgent(null);
        setAgents(prev => prev.map(a => ({ ...a, isBusy: false })));
    }
  };

  // Helper to map tool names back to Agent Enums
  const getAgentIdFromTool = (toolName: string): AgentType | null => {
      if (toolName.includes('rekam_medis')) return AgentType.MEDICAL_RECORDS;
      if (toolName.includes('manajemen_pasien')) return AgentType.PATIENT_MANAGEMENT;
      if (toolName.includes('penjadwal')) return AgentType.APPOINTMENT;
      if (toolName.includes('penagihan')) return AgentType.BILLING;
      return null;
  };

  const getAgentName = (id: AgentType) => AGENTS_CONFIG.find(c => c.id === id)?.name;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-purple-500/30">
      
      {/* LEFT: Sidebar / Command Center Status */}
      <div className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3 text-purple-400 mb-1">
                <Activity className="w-6 h-6" />
                <h1 className="font-bold tracking-wider text-lg">HOSPITAL OS</h1>
            </div>
            <p className="text-xs text-slate-500 font-mono">PUSAT KOMANDO LAYANAN v2.0</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-2">Sub-Agen Aktif</div>
            {agents.map(agent => (
                <AgentStatusCard 
                    key={agent.id} 
                    status={agent} 
                    isActive={activeAgent === agent.id} 
                />
            ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                <Lock className="w-3 h-3" />
                <span>Enkripsi End-to-End Aktif</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
                <Database className="w-3 h-3" />
                <span>Database Pasien Terhubung</span>
            </div>
        </div>
      </div>

      {/* RIGHT: Main Chat Area */}
      <div className="flex-1 flex flex-col relative">
         {/* Mobile Header */}
         <div className="md:hidden p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <h1 className="font-bold text-purple-400">Hospital Command</h1>
            <div className="flex items-center gap-2">
                {activeAgent && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </div>
         </div>

        <ChatInterface 
            messages={messages} 
            isLoading={isLoading} 
            isAgentWorking={isAgentWorking}
            activeAgent={activeAgent}
        />

        {/* Input Area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="max-w-4xl mx-auto relative flex items-center gap-2">
                <div className="flex-1 bg-slate-800 rounded-xl flex items-center p-1 border border-slate-700 focus-within:border-purple-500 transition-colors shadow-lg">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Masukkan perintah koordinator..."
                        className="flex-1 bg-transparent border-none text-sm text-white px-4 py-3 focus:outline-none placeholder:text-slate-500"
                        disabled={isLoading || isAgentWorking}
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isLoading || isAgentWorking}
                        className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed m-1"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <p className="text-center text-[10px] text-slate-600 mt-2 font-mono">
                Sistem dilindungi UU Perlindungan Data Pribadi (PDP). Akses rekam medis diawasi.
            </p>
        </div>
      </div>
    </div>
  );
}