export interface UserPublicProfile {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface CommentResponse {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  author: UserPublicProfile;
}

