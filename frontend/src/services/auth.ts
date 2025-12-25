import api, { setAuthToken } from "./api";

export async function login(email: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const res = await api.post("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const token = res.data?.access_token as string;
  if (token) setAuthToken(token);
  return token;
}

export function logout() {
  setAuthToken(null);
}
