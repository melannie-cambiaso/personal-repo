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
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
        <h1 className="text-center text-2xl font-bold">🔐 Acceso</h1>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          className="rounded-lg border px-4 py-2 text-center text-lg tracking-widest"
          autoFocus
        />
        {error && <p className="text-center text-sm text-red-500">Wrong code, try again</p>}
        <button
          type="submit"
          disabled={loading || !code}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "..." : "Enter"}
        </button>
      </form>
    </main>
  );
}
