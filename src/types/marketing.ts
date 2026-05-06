import { Timestamp } from 'firebase/firestore';

export type Role = "owner" | "editor" | "commenter" | "viewer";

export type CampaignStatus = "Planeando" | "Activa" | "Pausada" | "Completada" | "Cancelada";
export type CampaignType = "Email" | "Social" | "Paid Ads" | "SEO" | "Influencer" | "Event" | "PR" | "Content";
export type ContentStatus = "Idea" | "Brief" | "En Producción" | "En Revisión" | "Aprobado" | "Programado" | "Publicado" | "Archivado";
export type LeadStatus = "Nuevo" | "Contactado" | "Calificado" | "Propuesta" | "Negociación" | "Ganado" | "Perdido";
export type TaskStatus = "Backlog" | "To Do" | "En Progreso" | "En Revisión" | "Completado" | "Bloqueado";
export type Priority = "Urgente" | "Alta" | "Media" | "Baja";
export type Platform = "Instagram" | "Facebook" | "TikTok" | "LinkedIn" | "Twitter/X" | "YouTube" | "Google Ads" | "Email" | "Blog" | "Podcast";

export interface Workspace {
  id: string;
  name: string;
  members: Record<string, Role>; // { [userId]: "owner"|"editor"|"commenter"|"viewer" }
  createdAt: number;
}

export interface Base {
  id: string;
  workspaceId: string;
  name: string;
  members: Record<string, Role>;
  isPublic: boolean;
  createdAt: number;
}

export interface Table {
  id: string;
  baseId: string;
  name: string;
  primaryFieldId: string;
  order: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  type: CampaignType;
  channels: Platform[];
  objective: string;
  budget: number;
  spent: number;
  revenue: number;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  owner: string;        // userId
  team: string[];       // userIds
  tags: string[];
  notes: string;
  baseId: string;
  tableId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContentItem {
  id: string;
  title: string;
  campaignId: string;
  contentType: string;
  platforms: Platform[];
  status: ContentStatus;
  publishDate: Timestamp | null;
  publishTime: string;
  copywriter: string;
  designer: string;
  caption: string;
  hashtags: string;
  attachments: Attachment[];
  approvedBy: string;
  approvalDate: Timestamp | null;
  reach: number;
  clicks: number;
  conversions: number;
  engagementScore: number;
  baseId: string;
  tableId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  campaignId: string;
  status: LeadStatus;
  score: number;
  assignedTo: string;
  lastContact: Timestamp | null;
  nextFollowUp: Timestamp | null;
  value: number;
  notes: string;
  tags: string[];
  baseId: string;
  tableId: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
  storagePath: string;
}
