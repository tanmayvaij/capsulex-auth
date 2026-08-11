"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { useAppTitle } from "@/hooks/useAppTitle";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/auth/password", {
        method: "PATCH",
        role: "admin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to update password");
      }

      setSuccessMsg("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2 text-foreground">Admin Settings</h2>
        <p className="text-muted-foreground">Manage your master administrator account preferences.</p>
      </div>

      <div className="flex border-b border-border w-full gap-6">
        <button 
          className="pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors border-primary text-foreground"
        >
          <ShieldCheck className="h-4 w-4" />
          Security Options
        </button>
      </div>

      <div className="bg-card border border-border rounded-md p-8 shadow-sm">
        {successMsg && (
          <div className="mb-6 p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-500 font-medium">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-medium">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-6 max-w-md animate-in fade-in duration-300">
          <div>
            <h3 className="text-xl font-semibold mb-1 text-foreground flex items-center gap-2">
              Update Password
            </h3>
            <p className="text-sm text-muted-foreground mb-6">Ensure your account is using a long, random password.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground ml-1">Current Password</label>
            <input 
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="flex h-12 w-full rounded-md border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground ml-1">New Password</label>
            <input 
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="flex h-12 w-full rounded-md border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground ml-1">Confirm New Password</label>
            <input 
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="flex h-12 w-full rounded-md border border-input/50 bg-background/50 px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-all disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-md text-sm font-semibold transition-all disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] h-12 px-6 shadow-sm"
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Save Password"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
