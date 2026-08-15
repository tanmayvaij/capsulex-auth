"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import { useAppTitle } from "@/hooks/useAppTitle";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"security" | "platform">("security");
  const [allowPublicRegistration, setAllowPublicRegistration] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await apiFetch("/api/admin/auth/config", { role: "admin" });
        if (res.ok) {
          const data = await res.json();
          setAllowPublicRegistration(data.allow_public_registration);
        }
      } catch (error) {
        console.error("Failed to load config", error);
      }
    };
    fetchConfig();
  }, []);

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
          onClick={() => setActiveTab("security")}
          className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "security" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <ShieldCheck className="h-4 w-4" />
          Security Options
        </button>
        <button 
          onClick={() => setActiveTab("platform")}
          className={`pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "platform" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <SettingsIcon className="h-4 w-4" />
          Platform Configuration
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

        {activeTab === "security" && (
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
        )}

        {activeTab === "platform" && (
        <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
          <div>
            <h3 className="text-xl font-semibold mb-1 text-foreground flex items-center gap-2">
              Registration Settings
            </h3>
            <p className="text-sm text-muted-foreground mb-6">Control how developers can access the platform.</p>
          </div>

          <div className="flex items-center justify-between p-5 border border-border bg-background/30 rounded-lg">
            <div className="space-y-0.5">
              <h4 className="text-sm font-semibold text-foreground">Allow Public Registration</h4>
              <p className="text-xs text-muted-foreground">If disabled, new developers cannot sign up and the registration page will be hidden.</p>
            </div>
            
            <button
              onClick={async () => {
                const newVal = !allowPublicRegistration;
                setConfigLoading(true);
                try {
                  const res = await apiFetch("/api/admin/auth/config", {
                    method: "PATCH",
                    role: "admin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ allow_public_registration: newVal })
                  });
                  if (res.ok) {
                    setAllowPublicRegistration(newVal);
                    setSuccessMsg(`Public registration has been ${newVal ? 'enabled' : 'disabled'}.`);
                  }
                } catch (e) {
                  setErrorMsg("Failed to update registration settings.");
                } finally {
                  setConfigLoading(false);
                }
              }}
              disabled={configLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 ${allowPublicRegistration ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowPublicRegistration ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
