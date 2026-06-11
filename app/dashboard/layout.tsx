"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth.store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MessageSquarePlus, Users, UserCheck, RefreshCw, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    label: "Generators",
    items: [
      { title: "Connection Request", href: "/dashboard", icon: Users },
      { title: "Referral Request", href: "/dashboard/referral", icon: UserCheck },
      { title: "Recruiter Reply", href: "/dashboard/recruiter", icon: MessageSquarePlus },
      { title: "Follow-Up", href: "/dashboard/followup", icon: RefreshCw },
    ],
  },
  {
    label: "History",
    items: [
      { title: "My Generations", href: "/dashboard/history", icon: Clock },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (!token) router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <div className="px-4 py-4 border-b border-border">
              <h1 className="text-base font-semibold tracking-tight">LinkedIn Copilot</h1>
              {user && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.username}
                </p>
              )}
            </div>
            {navItems.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={pathname === item.href}
                          render={<Link href={item.href} />}
                        >
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center h-14 px-4 border-b border-border">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
