import { UserPublicProfileDTO } from '../USER/UserPublicProfileDTO';

// 1. Define CommentDTO (Matches Backend)
export interface CommentDTO {
  id: string;
  text: string;
  createdAt: string;
  author: UserPublicProfileDTO;
}

// 2. Base Post Response (For Feed / Lists)
// NO 'comments' array here. This keeps the feed light.
export interface PostResponse {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  createdAt: string;
  updatedAt: string | null;
  author: UserPublicProfileDTO;

  likeCount: number;
  commentCount: number;

  savedByCurrentUser: boolean;
  likedByCurrentUser: boolean;
}

// 3. Single Post Response (For Detail View)
// Extends Base and adds the comments list.
export interface SinglePostResponse extends PostResponse {
  comments: CommentDTO[];
}
