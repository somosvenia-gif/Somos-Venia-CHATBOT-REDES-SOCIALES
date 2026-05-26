export type Platform = 'whatsapp' | 'instagram' | 'facebook';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'bot';
  timestamp: string; // e.g. "10:45 AM"
}

export interface Customer {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  platform: Platform;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  lastMessage: string;
  lastInteractionTime: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  tags: string[];
  notes: string;
  aiActive: boolean;
  messages: Message[];
}

export interface CRMStats {
  totalContacts: number;
  totalContactsGrowth: string;
  whatsappActive: number;
  whatsappActivePercent: number;
  instagramActive: number;
  instagramActivePercent: number;
  facebookActive: number;
  facebookActivePercent: number;
}

// Flow nodes for the Automation Builder
export interface FlowNode {
  id: string;
  type: 'trigger' | 'action' | 'logic';
  icon: string;
  title: string;
  description: string;
  status?: string;
  x: number;
  y: number;
}

export interface FlowConnection {
  fromId: string;
  toId: string;
}
