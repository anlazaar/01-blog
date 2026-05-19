export interface DashboardUser {
  id: string;
  username: string;
  email: string;
  role: string;
  banned: boolean;
  avatarUrl?: string;
}

export interface DashboardPost {
  id: string;
  title: string;
  author: { id: string; username: string };
  createdAt: string;
}

export interface DashboardReport {
  id: string;
  reason: string;
  resolved: boolean;
  reporter: { username: string };
  reportedUser: { id: string; username: string };
  reportedPost?: { id: string };
  type: string;
  createdAt: string;
}
