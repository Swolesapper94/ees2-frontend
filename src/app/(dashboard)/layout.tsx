"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { api } from "@/lib/api/client";
import { X } from "lucide-react";

interface User {
  email?: string;
  firstName: string;
  lastName: string;
  rank: string;
  roles: string[];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    api
      .get<User>("/users/me")
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar canViewAdmin={Boolean(user?.roles.includes("ADMIN"))} className="hidden md:flex" />
      {mobileNavOpen && (
        <div className="fixed inset-0 z-[90] flex bg-black/45 animate-in fade-in duration-150 md:hidden" role="dialog" aria-modal="true" aria-label="Main navigation">
          <div className="relative h-full animate-in slide-in-from-left duration-200">
            <Sidebar canViewAdmin={Boolean(user?.roles.includes("ADMIN"))} className="h-full" />
            <button type="button" onClick={() => setMobileNavOpen(false)} className="absolute right-3 top-3 rounded-sm bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close navigation">
              <X className="h-5 w-5" />
            </button>
          </div>
          <button type="button" className="flex-1" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation overlay" />
        </div>
      )}
      <div className="min-w-0 flex flex-1 flex-col overflow-hidden">
        <TopNav onOpenMenu={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
