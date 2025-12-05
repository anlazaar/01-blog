import { Role } from '../role.model';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio: string;
  firstname: string;
  lastname: string;
}
