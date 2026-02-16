
export enum Role {
  ADMIN = 'Admin',
  CLUSTER_FRP = 'Cluster FRP',
  FRP = 'FRP',
  CRP = 'CRP',
  PROJECT_STAFF = 'Project Staff'
}

export enum WorkStatus {
  WORKING = 'Working',
  LEAVE = 'Leave',
  HOLIDAY = 'Holiday'
}

export interface User {
  username: string;
  role: Role;
  createdDate?: string;
  password?: string;
}

export interface WorkLog {
  date: string;
  username: string;
  village: string;
  activity: string;
  workDetails: string;
  status: WorkStatus;
  reason?: string;
  timestamp?: string;
  photoUrl?: string;
  location?: string;
}

export interface GalleryItem {
  imageUrl: string;
  activity: string;
  village: string;
  date: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
