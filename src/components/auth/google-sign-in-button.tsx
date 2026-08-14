"use client";

import { LoaderCircle, LogIn } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function GoogleSignInButton({ configured }: { configured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    if (!configured || loading) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const redirectTo = new URL("/auth/callback", window.location.origin).toString();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (signInError) throw signInError;
    } catch {
      setError("Sign-in could not start. Check the Supabase and Google provider configuration, then retry.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button className="w-full" disabled={!configured || loading} onClick={signIn}>
        {loading ? <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <LogIn className="size-5" aria-hidden="true" />}
        {loading ? "Opening Google…" : "Continue with Google"}
      </Button>
      {!configured ? <p className="mt-3 text-center text-sm leading-6 text-slate-500">Sign-in becomes available after the development Supabase project is configured.</p> : null}
      {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800" role="alert">{error}</p> : null}
    </div>
  );
}
