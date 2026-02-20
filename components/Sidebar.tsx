"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Wallet,
    PiggyBank,
    LineChart,
    Settings,
    LogOut
} from "lucide-react";

const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Transactions", href: "/transactions", icon: Wallet, disabled: true },
    { name: "Recurring", href: "/recurring", icon: PiggyBank, disabled: true },
    { name: "Analyze", href: "/analyze", icon: LineChart, disabled: true },
    { name: "Settings", href: "/settings", icon: Settings, disabled: true },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl">
            <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        LM
                    </div>
                    <span>Lunch Money</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {navItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.disabled ? '#' : item.href}
                        aria-disabled={item.disabled}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            pathname === item.href
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-white",
                            item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-border">
                <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-white transition-colors">
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
}
