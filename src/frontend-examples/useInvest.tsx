import { useState } from "react";

export function useInvest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulate = async (recommendation: any, amount: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invest/simulate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation, amount }),
      });
      if (!res.ok) throw new Error("Simulation failed");
      const data = await res.json();
      return data.projection || data;
    } catch (err) {
      setError(err.message || "Simulation failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const invest = async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/invest", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Invest failed");
      const data = await res.json();
      return data;
    } catch (err) {
      setError(err.message || "Invest failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addFunds = async (investmentId: string, amount: number) => {
    try {
      const res = await fetch("/api/invest/add", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investmentId, amount }),
      });
      if (!res.ok) throw new Error("Top-up failed");
      return await res.json();
    } catch (err) {
      throw err;
    }
  };

  const sell = async (
    investmentId: string,
    opts: { amount?: number; percent?: number } = {}
  ) => {
    try {
      const res = await fetch("/api/invest/sell", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investmentId, ...opts }),
      });
      if (!res.ok) throw new Error("Sell failed");
      return await res.json();
    } catch (err) {
      throw err;
    }
  };

  const drop = async (investmentId: string) => {
    try {
      const res = await fetch("/api/invest/drop", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ investmentId }),
      });
      if (!res.ok) throw new Error("Drop failed");
      return await res.json();
    } catch (err) {
      throw err;
    }
  };

  return { loading, error, simulate, invest, addFunds, sell, drop };
}
