"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const res = await fetch(`/api/auth?key=${encodeURIComponent(code)}`);
    if (res.ok) {
      router.push("/");
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-xs">
        <h1 className="text-2xl font-bold text-center">🔐 Acceso</h1>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          className="border rounded-lg px-4 py-2 text-center text-lg tracking-widest"
          autoFocus
        />
        {error && (
          <p className="text-red-500 text-sm text-center">Wrong code, try again</p>
        )}
        <button
          type="submit"
          disabled={loading || !code}
          className="bg-black text-white rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </main>
  );
}
