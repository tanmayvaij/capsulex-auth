"use client";

import { useState, useEffect } from "react";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DeveloperProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [developer, setDeveloper] = useState<any>(null);

  useEffect(() => {
    const fetchDev = async () => {
      try {
        const res = await apiFetch("/api/developer/auth/me");
        if (res.ok) {
          setDeveloper(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch developer", error);
      }
    };
    fetchDev();
  }, []);

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
      const res = await apiFetch("/api/developer/auth/password", {
        method: "PATCH",
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
    <div className="flex-1 space-y-6">
      
      {/* Header Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Developer Profile</CardTitle>
            <CardDescription>Manage your developer account preferences and security.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-16 w-16 bg-primary/20 text-primary font-bold text-2xl ring-1 ring-primary/20">
              <AvatarFallback className="bg-transparent">{developer ? developer.email.charAt(0).toUpperCase() : "U"}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight">Personal Information</h3>
              <p className="text-sm text-muted-foreground">Email: <span className="font-medium text-foreground">{developer?.email || "Loading..."}</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex border-b w-full">
        <button className="pb-4 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors border-primary text-foreground">
          <ShieldCheck className="h-4 w-4" />
          Security Options
        </button>
      </div>

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

          <form onSubmit={handlePasswordReset} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Current Password</label>
              <Input 
                type="password"
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">New Password</label>
              <Input 
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Confirm New Password</label>
              <Input 
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
