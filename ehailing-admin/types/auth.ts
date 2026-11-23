export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResult {
  user: AdminUser;
  token: string;
}

export interface RequestPasswordResetInput {
  email: string;
}

export interface VerifyOtpInput {
  code: string;
}
