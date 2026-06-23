import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { signIn } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type ConnectionStatus = "checking" | "ok" | "error";
type Mode = "login" | "setup";

export default function Login() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("checking");
  const [connDetail, setConnDetail] = useState("");
  const [mode, setMode] = useState<Mode>("login");

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from("users").select("id").limit(1);
        if (error) {
          if (error.message.includes("relation") || error.message.includes("does not exist")) {
            setConnStatus("error");
            setConnDetail("Tables not found — run SUPABASE_SCHEMA.sql in Supabase SQL Editor first.");
          } else if (error.message.includes("Invalid API key") || error.message.includes("JWT")) {
            setConnStatus("error");
            setConnDetail("Invalid API key — check VITE_SUPABASE_ANON_KEY secret.");
          } else {
            setConnStatus("ok");
            setConnDetail("Connected to Supabase");
          }
        } else {
          setConnStatus("ok");
          setConnDetail("Connected to Supabase");
        }
      } catch (e: any) {
        setConnStatus("error");
        setConnDetail("Cannot reach Supabase — check VITE_SUPABASE_URL (must be https://xxxx.supabase.co)");
      }
    }
    checkConnection();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Wrong email or password. Create your account below if you haven't yet.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Email not confirmed — check your inbox for a Supabase confirmation link.");
        } else {
          setError(error.message);
        }
        return;
      }
      setLocation("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      // 1. Create auth user via Supabase signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned from signup");

      const userId = authData.user.id;

      // 2. Insert profile row in users table
      const { error: profileError } = await supabase.from("users").insert({
        id: userId,
        name: name || email.split("@")[0],
        employee_id: "ADMIN001",
        designation: "System Administrator",
        mobile: "",
        email,
        role: "admin",
        office_id: null,
        active: true,
      });

      if (profileError) {
        // Profile insert failed — still show partial success
        setSuccess(
          "Auth account created! But inserting into users table failed: " +
          profileError.message +
          ". Run SUPABASE_SCHEMA.sql first, then try signing in."
        );
        return;
      }

      // 3. Check if email confirmation is needed
      if (authData.session) {
        // Logged in immediately — redirect
        setLocation("/dashboard");
      } else {
        setSuccess(
          "Account created! If email confirmation is enabled in Supabase, check your inbox (" +
          email +
          ") and click the confirmation link, then come back to sign in. Otherwise just sign in now."
        );
        setMode("login");
      }
    } catch (err: any) {
      if (err.message?.includes("User already registered")) {
        setError("This email is already registered. Sign in instead.");
        setMode("login");
      } else {
        setError(err.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-primary/10 -skew-y-6 transform origin-top-left -z-10" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md space-y-5">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground w-8 h-8">
              <circle cx="12" cy="7" r="4" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" />
              <path d="M18 3c1.5 1 2.5 2.5 2.5 4.5" /><path d="M6 3C4.5 4 3.5 5.5 3.5 7.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">India Post</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest font-semibold">Tensa Postal Beat</p>
        </div>

        {/* Connection status banner */}
        <div className={`flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm border ${
          connStatus === "checking" ? "bg-muted/50 border-border text-muted-foreground" :
          connStatus === "ok" ? "bg-green-500/10 border-green-500/30 text-green-400" :
          "bg-destructive/10 border-destructive/30 text-destructive"
        }`}>
          {connStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
          {connStatus === "ok" && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
          {connStatus === "error" && <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{connStatus === "checking" ? "Checking Supabase connection..." : connDetail}</span>
        </div>

        {/* Success message */}
        {success && (
          <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2.5 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Login / Setup card */}
        <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{mode === "login" ? "Sign In" : "Create Admin Account"}</CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Enter your credentials to access the platform"
                : "First-time setup: create the master administrator account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={mode === "login" ? handleLogin : handleSetup} className="space-y-4">
              {mode === "setup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Akash B S P"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="postman@indiapost.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password {mode === "setup" && <span className="text-muted-foreground font-normal">(min 6 chars)</span>}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === "setup" ? 6 : undefined}
                  className="bg-background"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || connStatus === "checking"}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {mode === "login" ? "Secure Login" : "Create Admin Account"}
              </Button>

              <div className="text-center text-sm">
                {mode === "login" ? (
                  <button
                    type="button"
                    onClick={() => { setMode("setup"); setError(null); setSuccess(null); }}
                    className="text-primary hover:underline"
                  >
                    First time? Create admin account →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    ← Back to sign in
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Setup help when connection fails */}
        {connStatus === "error" && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 space-y-2 text-sm">
              <p className="font-semibold text-yellow-400">Fix Supabase connection first:</p>
              <ol className="space-y-1.5 text-muted-foreground list-decimal list-inside">
                <li>Go to Supabase → Project Settings → API</li>
                <li>Copy <strong>Project URL</strong> → set as <code className="bg-muted px-1 rounded text-xs">VITE_SUPABASE_URL</code></li>
                <li>Copy <strong>anon / public key</strong> → set as <code className="bg-muted px-1 rounded text-xs">VITE_SUPABASE_ANON_KEY</code></li>
                <li>Run <code className="bg-muted px-1 rounded text-xs">SUPABASE_SCHEMA.sql</code> in SQL Editor</li>
              </ol>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Authorized personnel only. Activities are logged.
        </p>
      </div>
    </div>
  );
}
