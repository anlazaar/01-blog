import { PostResponse } from '../POST/PostResponse';

export interface UserPublicProfileDTO {
  id: string;
  username: string;
  firstname: string;
  lastname: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  following?: boolean;
  posts: PostResponse[];
}
