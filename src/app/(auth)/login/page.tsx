"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Metadata } from "next";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Login failed");
        return;
      }

      const role: string = json.data?.user?.role ?? "";
      if (role === "SUPER_ADMIN") router.push("/super-admin");
      else if (role === "ADMIN")  router.push("/admin");
      else                        router.push("/student");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-50 border border-border rounded-card p-8"
      style={{ boxShadow: "var(--shadow-modal)" }}>

      {/* Wordmark */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink tracking-tight">
          Placement ERP
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-ink-muted block">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@institution.edu"
            className="w-full h-9 px-3 rounded-md text-sm bg-surface border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 disabled:opacity-40"
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-ink-muted block">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-9 px-3 rounded-md text-sm bg-surface border border-border text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors duration-80 disabled:opacity-40"
            disabled={loading}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-below" role="alert">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-9 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover active:bg-[#3D68E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-80 mt-2"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
