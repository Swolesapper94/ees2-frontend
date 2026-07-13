import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  LifeBuoy,
  LogOut,
  UserCircle,
  RefreshCw,
  Bug,
} from "lucide-react";
import { SupportChatModal } from "@/components/support/SupportChatModal";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { api } from "@/lib/api/client";
import { NOTIFICATIONS_REFRESH_EVENT } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils/cn";

interface DevAuthUser {
  firstName?: string;
  lastName?: string;
  rank?: string;
  email?: string;
  profilePictureUrl?: string | null;
}

function getDevUser(): DevAuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("devAuth");
  if (!raw) return null;
  // Format: "Bearer dev:<email>:testpass"
  const email = raw.split(":")[1] ?? "";
  return { email };
}

function getInitials(user: DevAuthUser | null): string {
  if (!user?.email) return "U";
  const parts = user.email.replace("dev:", "").split(".");
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [seedingNotifications, setSeedingNotifications] = useState(false);
  const [fullUser, setFullUser] = useState<DevAuthUser | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const devUser = getDevUser();
  const isDev = process.env.NODE_ENV !== "production";

  // Fetch full user data with profile picture URL
  useEffect(() => {
    if (devUser?.email) {
      api.get<DevAuthUser>("/users/me").then(setFullUser).catch(console.error);
    }
  }, [devUser?.email]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    const timer = setTimeout(() => document.addEventListener("mousedown", handle), 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handle);
    };
  }, [open]);

  function handleSignOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("devAuth");
    }
    router.push("/dev-login");
  }

  async function seedTestNotifications() {
    setSeedingNotifications(true);
    try {
      await api.get("/dev/seed-notifications");
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
    } catch {
      alert("Failed to seed notifications");
    } finally {
      setSeedingNotifications(false);
    }
  }

  function handleOption(fn: () => void) {
    setOpen(false);
    fn();
  }

  const menuItems = [
    {
      icon: UserCircle,
      label: "My Profile",
      description: "View account & unit info",
      action: () => router.push("/profile"),
    },
    {
      icon: Settings,
      label: "Settings",
      description: "Notification preferences",
      action: () => router.push("/settings"),
    },
    ...(isDev
      ? [
          {
            icon: RefreshCw,
            label: "Switch Persona",
            description: "Dev only — change test user",
            action: () => router.push("/dev-login"),
            devOnly: true,
          },
        ]
      : []),
    {
      icon: LifeBuoy,
      label: "Support",
      description: "Chat with EES Support bot",
      action: () => setSupportOpen(true),
      highlight: true,
    },
  ];

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          type="button"
          aria-label="Account menu"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center justify-center rounded-full transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserAvatar
            src={fullUser?.profilePictureUrl}
            initials={getInitials(devUser)}
            size="md"
          />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-card shadow-[var(--shadow-panel)]">
            {/* User identity header */}
            <div className="border-b border-border px-3 py-3">
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  src={fullUser?.profilePictureUrl}
                  initials={getInitials(devUser)}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {devUser?.email?.replace("dev:", "") ?? "Soldier"}
                  </p>
                  {isDev && (
                    <p className="text-[10px] font-medium uppercase tracking-wider text-amber-600">
                      Dev Mode
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleOption(item.action)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted",
                    item.devOnly && "opacity-70",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      item.highlight
                        ? "text-[var(--color-od-green)]"
                        : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        item.highlight
                          ? "text-[var(--color-od-green)]"
                          : "text-foreground",
                      )}
                    >
                      {item.label}
                      {item.devOnly && (
                        <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
                          dev
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Sign Out */}
            <div className="border-t border-border py-1">
              {isDev && (
                <>
                  {/* Dev notification test buttons */}
                  <button
                    type="button"
                    disabled={seedingNotifications}
                    onClick={() =>
                      handleOption(seedTestNotifications)
                    }
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <Bug className="h-4 w-4 flex-shrink-0 text-amber-600" />
                    <span className="text-sm font-medium text-amber-600">
                      {seedingNotifications
                        ? "Loading..."
                        : "📧 Test Notifications"}
                    </span>
                  </button>
                  <div className="border-t border-border" />
                </>
              )}
              <button
                type="button"
                onClick={() => handleOption(handleSignOut)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <LogOut className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Support Chat Modal — outside the dropdown so it persists when menu closes */}
      {supportOpen && (
        <SupportChatModal onClose={() => setSupportOpen(false)} />
      )}
    </>
  );
}
