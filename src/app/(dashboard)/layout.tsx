"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { api } from "@/lib/api/client";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[DashboardLayout] Effect running...");
    api
      .get<User>("/users/me")
      .then((userData) => {
        console.log("[DashboardLayout] User fetched successfully:", userData?.email, "Roles:", userData?.roles);
        setUser(userData);
      })
      .catch((err) => {
        console.error("[DashboardLayout] Failed to fetch user:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch user");
        setUser(null);
      })
      .finally(() => {
        console.log("[DashboardLayout] Setting loading to false");
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
