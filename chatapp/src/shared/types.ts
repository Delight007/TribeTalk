export interface User {
  _id: string;
  username?: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationCode?: string;
  codeExpiresAt?: Date;
  name: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  gender?: string;
  interests?: string[];
  dateOfBirth?: Date;
  following?: string[]; // 👈 users this user is following
  followers?: string[]; // 👈 users following this user
  token?: string; // 👈 JWT token for client-side use
  createdAt?: Date;
  updatedAt?: Date;
}
