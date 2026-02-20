"use client";

import { cn } from "@/lib/utils";
import { Smile } from "lucide-react";

interface TopNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
    // Secondary Tabs (Sub-nav for Home)
    const secondaryTabs = [
        { name: "HOW TO USE", value: "guide" },
        { name: "OVERVIEW", value: "overview" },
        { name: "ROTH STRATEGY", value: "roth" },
        { name: "SEPP DISTRIBUTION", value: "sepp" },
        { name: "TAX ANALYSIS", value: "tax" },
        { name: "SETTINGS", value: "settings" },
    ];

    return (
        <div className="bg-white border-b border-border shadow-sm">
            <div className="container mx-auto max-w-7xl px-4 flex items-center h-16">
                {/* Logo Area */}
                <div className="flex items-center gap-4 mr-8 border-r border-border pr-6 h-full">
                    <div className="h-12 w-12 flex items-center justify-center">
                        <img src="/branding/logo.png" alt="Early Lunch Logo" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="font-black text-xl tracking-tighter text-foreground">EARLY LUNCH</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Retirement Visualizer</span>
                    </div>
                </div>

                {/* Tabs */}
                <nav className="flex h-full space-x-6">
                    {secondaryTabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => onTabChange(tab.value)}
                            className={cn(
                                "flex items-center text-xs font-bold text-muted-foreground hover:text-primary h-full border-b-2 border-transparent transition-colors uppercase tracking-wide",
                                // Active State
                                activeTab === tab.value
                                    ? "text-primary border-primary"
                                    : ""
                            )}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
