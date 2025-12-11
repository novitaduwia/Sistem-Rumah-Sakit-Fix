export enum Sender {
  USER = 'USER',
  COORDINATOR = 'COORDINATOR',
  SYSTEM = 'SYSTEM',
  AGENT = 'AGENT'
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
  metadata?: {
    agentName?: string;
    isToolCall?: boolean;
    toolName?: string;
    toolArgs?: any;
    processingTime?: number;
  };
}

export enum AgentType {
  COORDINATOR = 'COORDINATOR',
  MEDICAL_RECORDS = 'MEDICAL_RECORDS',
  PATIENT_MANAGEMENT = 'PATIENT_MANAGEMENT',
  APPOINTMENT = 'APPOINTMENT',
  BILLING = 'BILLING'
}

export interface AgentStatus {
  id: AgentType;
  name: string;
  description: string;
  isBusy: boolean;
  lastActive?: Date;
}

export interface ToolCallResult {
  toolName: string;
  result: any;
}