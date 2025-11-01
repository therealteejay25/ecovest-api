import { useState, useEffect } from "react";

export function useChat() {
  const [history, setHistory] = useState<
    { role: string; content: string; timestamp?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat/history", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message || "Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const sendMessage = async (message: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      setHistory((prev) => [
        ...prev,
        { role: "user", content: message },
        { role: "assistant", content: data.reply },
      ]);
      return data.reply;
    } catch (err) {
      setError(err.message || "Chat failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch("/api/chat/history", {
        method: "DELETE",
        credentials: "include",
      });
      setHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  return { history, loading, error, sendMessage, loadHistory, clearHistory };
}
