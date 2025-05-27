export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  PARTICIPANT = 'participant',
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  profileImageUrl: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
