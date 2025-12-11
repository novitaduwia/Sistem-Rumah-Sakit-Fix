import React from 'react';
import { AgentStatus } from '../types';
import { AGENTS_CONFIG } from '../constants';
import { Activity, ShieldCheck, UserCheck, Calendar, CreditCard } from 'lucide-react';

interface Props {
  status: AgentStatus;
  isActive: boolean;
}

const AgentStatusCard: React.FC<Props> = ({ status, isActive }) => {
  const config = AGENTS_CONFIG.find(c => c.id === status.id);
  
  const getIcon = () => {
    switch(status.id) {
        case 'MEDICAL_RECORDS': return <ShieldCheck className="w-5 h-5" />;
        case 'PATIENT_MANAGEMENT': return <UserCheck className="w-5 h-5" />;
        case 'APPOINTMENT': return <Calendar className="w-5 h-5" />;
        case 'BILLING': return <CreditCard className="w-5 h-5" />;
        default: return <Activity className="w-5 h-5" />;
    }
  };

  if (!config) return null;

  return (
    <div className={`p-4 rounded-lg border transition-all duration-300 ${
      isActive 
        ? `${config.bg} ${config.border} ring-1 ring-offset-1 ring-offset-slate-900 ring-${config.color.split('-')[1]}-500` 
        : 'bg-slate-800 border-slate-700 opacity-60'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-2 font-semibold ${config.color}`}>
            {getIcon()}
            <span className="text-sm">{config.name}</span>
        </div>
        {isActive && (
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-${config.color.split('-')[1]}-400`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 bg-${config.color.split('-')[1]}-500`}></span>
            </span>
        )}
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">
        {config.description}
      </p>
      {isActive && (
          <div className="mt-3 text-xs font-mono text-slate-300 bg-slate-900/50 p-2 rounded animate-pulse">
            Processing Request...
          </div>
      )}
    </div>
  );
};

export default AgentStatusCard;