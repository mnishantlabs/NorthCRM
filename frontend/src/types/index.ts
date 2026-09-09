export type UserRole = 'admin' | 'agent';

export type BusinessStatus =
  | 'new'
  | 'called'
  | 'busy'
  | 'interested'
  | 'not_interested'
  | 'no_answer'
  | 'callback'
  | 'meeting_scheduled'
  | 'proposal_sent'
  | 'closed_won'
  | 'closed_lost'
  | 'spam';

export interface UserType {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessType {
  id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  google_maps_url: string | null;
  category: string | null;
  assigned_agent: UserType | null;
  status: BusinessStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallLogType {
  id: string;
  business_id: string;
  agent_id: string;
  call_date: string;
  duration: number | null;
  call_result: BusinessStatus;
  notes: string | null;
  created_at: string;
  agent?: UserType;
  business?: BusinessType;
}

export type FollowUpStatus = 'pending' | 'completed' | 'missed' | 'cancelled';

export interface FollowUpType {
  id: string;
  business_id: string;
  agent_id: string;
  followup_date: string;
  status: FollowUpStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  agent?: UserType;
  business?: BusinessType;
  business_name?: string;
  agent_name?: string;
}

export type DealStatus =
  | 'prospect'
  | 'negotiation'
  | 'proposal'
  | 'closed_won'
  | 'closed_lost';

export interface DealType {
  id: string;
  business_id: string;
  service_id: string | null;
  estimated_value: string | number | null;
  closing_probability: number | null;
  status: DealStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  business?: BusinessType;
  service?: ServiceType;
  business_name?: string;
  service_name?: string;
}

export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DashboardStats {
  today_calls: number;
  pending_calls: number;
  completed_calls: number;
  interested_clients: number;
  callbacks_today: number;
  deals_closed: number;
  revenue: number;
  monthly_sales: number;
}

export interface CallsPerDay {
  date: string;
  count: number;
}

export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  calls_count: number;
  deals_closed: number;
  revenue: number;
}

export interface SalesData {
  month: string;
  revenue: number;
}

export interface LeadStatus {
  status: string;
  count: number;
}

export interface PaginationType {
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface PaginatedResponse<T> extends PaginationType {
  items: T[];
}

export interface ApiError {
  detail: string;
}