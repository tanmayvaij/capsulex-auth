"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle, Settings as SettingsIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
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
    <div className="w-full space-y-8 p-6 lg:p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Admin Settings</h2>
        <p className="text-muted-foreground">Manage your master administrator account preferences.</p>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security Options
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Platform Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="security" className="space-y-6 max-w-md animate-in fade-in duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Update Password</CardTitle>
              <CardDescription>Ensure your account is using a long, random password.</CardDescription>
            </CardHeader>
            <CardContent>
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

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input 
                    type="password"
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input 
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input 
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full mt-4">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="space-y-6 max-w-2xl animate-in fade-in duration-300">
          <Card>
            <CardHeader>
              <CardTitle>Registration Settings</CardTitle>
              <CardDescription>Control how developers can access the platform.</CardDescription>
            </CardHeader>
            <CardContent>
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

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-semibold">Allow Public Registration</h4>
                  <p className="text-xs text-muted-foreground">If disabled, new developers cannot sign up and the registration page will be hidden.</p>
                </div>
                
                <Switch
                  checked={allowPublicRegistration}
                  disabled={configLoading}
                  onCheckedChange={async (newVal) => {
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
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
