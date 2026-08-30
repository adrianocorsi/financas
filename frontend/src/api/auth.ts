import { apiClient, tokenStorage } from "./client";
import { User } from "../types";

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", { email, password });
  tokenStorage.setTokens(data.accessToken, data.refreshToken);
  return data.user;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", { name, email, password });
  tokenStorage.setTokens(data.accessToken, data.refreshToken);
  return data.user;
}

export function logout(): void {
  tokenStorage.clear();
}
