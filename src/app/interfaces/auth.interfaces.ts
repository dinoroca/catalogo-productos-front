export interface User {
  id: string;
  username: string;
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface DecodedToken {
  id: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}
