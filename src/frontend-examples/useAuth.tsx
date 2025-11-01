import { useState, useEffect, useCallback } from "react";

type User = {
  id: string;
  fullName: string;
  email: string;
  demoBalance: number;
} | null;

export function useAuth() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      setUser(data.user || null);
    } catch (err) {
      setUser(null);
      setError(err.message || "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Registration failed");
      }
      const data = await res.json();
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "include" });
      setUser(null);
    } catch (_) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, error, login, register, logout, fetchMe };
}
