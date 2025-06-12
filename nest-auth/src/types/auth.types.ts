export type AuthInput = { username: string; password: string };
export type SignInData = { username: string; userId: number };
export type AuthResult = {
  accessToken: string;
  userId: number;
  userName: string;
};
