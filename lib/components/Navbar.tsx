"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  CheckSquare, 
  FileText, 
  Calendar, 
  Brain, 
  Users, 
  Building2 
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/content", label: "Content", icon: FileText },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/team", label: "Team", icon: Users },
  { href: "/office", label: "Office", icon: Building2 },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="flex h-16 items-center px-6">
        <div className="mr-8">
          <span className="text-xl font-bold text-primary">Mission Control</span>
        </div>
        <div className="flex space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
