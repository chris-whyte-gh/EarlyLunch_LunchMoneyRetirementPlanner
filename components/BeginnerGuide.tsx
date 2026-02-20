"use client";

import React from 'react';
import { BookOpen, TrendingUp, AlertTriangle, MousePointer2, Calculator } from 'lucide-react';

export function BeginnerGuide() {
    return (
        <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 border-b border-border">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/20 p-2 rounded-lg">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">How to use "Early Lunch"</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                    A quick, basic guide to understanding your retirement projection. No complex finance degree required.
                </p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                <section className="space-y-6">
                    <div className="flex gap-4">
                        <div className="mt-1">
                            <div className="bg-emerald-100 p-2 rounded-full">
                                <TrendingUp className="h-4 w-4 text-emerald-600" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">Real vs. Nominal (The Numbers)</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                This is the most important toggle!
                                <br />• <span className="text-amber-600 font-bold uppercase text-xs">Nominal</span> is the actual number you'd see on your bank statement in the future. It looks big, but inflation makes things more expensive.
                                <br />• <span className="text-emerald-600 font-bold uppercase text-xs">Real</span> is much better. It shows the value in <strong>today's dollars</strong>. If it says you have $100k, that means you can buy $100k worth of stuff at today's prices.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="mt-1">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <MousePointer2 className="h-4 w-4 text-blue-600" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">Playing with the Chart</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                You can literally click and drag on the chart to "change things up" for a specific time in your life.
                                <br />• <strong>Drag to Add:</strong> Want to spend more between age 40 and 50? Just drag across those years on the chart.
                                <br />• <strong>The Result:</strong> It creates a new "Phase" below the chart where you can set a custom spending or return rate for just those years.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex gap-4">
                        <div className="mt-1">
                            <div className="bg-amber-100 p-2 rounded-full">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">The Stress Test</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                Ever wonder what happens if the market crashes right when you retire?
                                <br />Switch on the <strong>Stress Test</strong> in "Advanced Controls". It simulates a historical crash (like the year 2000) starting the day you stop working. If your green line stays above zero, you're in good shape!
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="mt-1">
                            <div className="bg-slate-100 p-2 rounded-full">
                                <Calculator className="h-4 w-4 text-slate-600" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">Coast FIRE (The Shortcut)</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                This number tells you: "If I never saved another penny starting today, would I still be okay at my retirement age?"
                                <br />• <strong>Actual Spending:</strong> You can now go to <strong>Settings</strong> and mark accounts (like credit cards) as "Spending Sources".
                                <br />• <strong>The Toggle:</strong> Click "Use Actual Spend" on the Dashboard to see your Coast FIRE number based on <em>real-world data</em> instead of a guess.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="bg-muted/30 p-6 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground italic">
                    Tip: Most people start with the "Overview" tab and move to "Roth" or "SEPP" only for advanced planning.
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/10 px-2 py-0.5 rounded">Early Lunch v1.0</span>
                </div>
            </div>
        </div>
    );
}
