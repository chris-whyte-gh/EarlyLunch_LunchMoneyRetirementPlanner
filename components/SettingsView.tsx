"use client";

import React, { useEffect, useState } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { Save, Trash2, CheckCircle, AlertCircle, Key, Search, RefreshCw, Info } from 'lucide-react';
import { Asset } from '@/lib/lunchmoney';
import { categorizeAsset, getCategoryDisplayName } from '@/lib/assetCategorization';
import { STORAGE_KEYS } from '@/lib/constants';

export function SettingsView() {
    const [token, setToken] = useState('');
    const [birthYear, setBirthYear] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [status, setStatus] = useState<'idle' | 'saved' | 'removed'>('idle');
    const [excludedIds, setExcludedIds] = useState<number[]>([]);
    const [spendingSourceIds, setSpendingSourceIds] = useState<number[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [previousToken, setPreviousToken] = useState('');

    // Debug Data State
    const [assets, setAssets] = useState<Asset[]>([]);
    const [debugLoading, setDebugLoading] = useState(false);
    const [debugError, setDebugError] = useState<string | null>(null);

    const fetchDebugData = async (apiToken: string) => {
        setDebugLoading(true);
        setDebugError(null);
        try {
            const headers: HeadersInit = { 'Authorization': `Bearer ${apiToken}` };
            const res = await fetch('/api/lunchmoney', { headers });

            if (!res.ok) throw new Error(`API Error: ${res.status}`);

            const data = await res.json();
            const fetchedAssets = data.assets || [];
            setAssets(fetchedAssets);
            
            // Auto-set Income/Spending checkboxes based on categorization
            const autoExcludedIds: number[] = [];
            const autoSpendingSourceIds: number[] = [];
            
            fetchedAssets.forEach((asset: Asset) => {
                const category = categorizeAsset(asset);
                // Portfolio Assets: Retirement accounts + investment accounts
                if (category === 'preTax' || category === 'roth' || 
                    (category === 'taxable' && (asset.type_name.includes('Brokerage') || 
                                              asset.type_name.includes('Investment') ||
                                              asset.type_name.includes('Stock') ||
                                              asset.type_name.includes('ETF')))) {
                    // Include in portfolio (don't exclude)
                }
                // Spending Tracking: Checking, savings, credit cards
                else if (category === 'taxable' && 
                        (asset.type_name.includes('Checking') || 
                         asset.type_name.includes('Savings') ||
                         asset.type_name.includes('Credit'))) {
                    autoSpendingSourceIds.push(asset.id);
                }
                // Exclude: Loans, mortgages, other non-assets
                else if (category === 'other') {
                    autoExcludedIds.push(asset.id);
                }
            });
            
            // Only update if user hasn't manually set preferences
            if (excludedIds.length === 0) {
                setExcludedIds(autoExcludedIds);
            }
            if (spendingSourceIds.length === 0) {
                setSpendingSourceIds(autoSpendingSourceIds);
            }
        } catch (e: any) {
            setDebugError(e.message);
            setAssets([]);
        } finally {
            setDebugLoading(false);
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (storedToken) {
            setToken(storedToken);
            // Auto-fetch data if token exists
            fetchDebugData(storedToken);
        }

        const storedBirthYear = localStorage.getItem(STORAGE_KEYS.BIRTH_YEAR);
        if (storedBirthYear) setBirthYear(storedBirthYear);

        const storedBirthMonth = localStorage.getItem(STORAGE_KEYS.BIRTH_MONTH);
        if (storedBirthMonth) setBirthMonth(storedBirthMonth);

        const storedExcluded = localStorage.getItem(STORAGE_KEYS.EXCLUDED_ASSETS);
        if (storedExcluded) {
            try {
                setExcludedIds(JSON.parse(storedExcluded));
            } catch (e) {
                console.error("Failed to parse excluded assets", e);
            }
        }

        const storedSpending = localStorage.getItem(STORAGE_KEYS.SPENDING_SOURCES);
        if (storedSpending) {
            try {
                setSpendingSourceIds(JSON.parse(storedSpending));
            } catch (e) {
                console.error("Failed to parse spending sources", e);
            }
        }
        setIsLoaded(true);
    }, []);

    const handleSave = () => {
        const isNewToken = token.trim() && !previousToken.trim();
        
        if (token.trim()) {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token.trim());
        }
        if (birthYear.trim()) {
            localStorage.setItem(STORAGE_KEYS.BIRTH_YEAR, birthYear.trim());
        }
        if (birthMonth.trim()) {
            localStorage.setItem(STORAGE_KEYS.BIRTH_MONTH, birthMonth.trim());
        }

        // Save IDs
        localStorage.setItem(STORAGE_KEYS.EXCLUDED_ASSETS, JSON.stringify(excludedIds));
        localStorage.setItem(STORAGE_KEYS.SPENDING_SOURCES, JSON.stringify(spendingSourceIds));

        setPreviousToken(token.trim());
        setStatus('saved');
        setTimeout(() => setStatus('idle'), 3000);

        // Auto-redirect to QuickStart if this is a new token
        if (isNewToken) {
            setTimeout(() => {
                // Trigger QuickStart by setting active tab to 'overview' and showQuickStart to true
                const event = new CustomEvent('showQuickStart');
                window.dispatchEvent(event);
            }, 1000);
        }
    };

    const toggleExclusion = (id: number) => {
        setExcludedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const toggleSpendingSource = (id: number) => {
        setSpendingSourceIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(x => x !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleRemove = () => {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.BIRTH_YEAR);
        localStorage.removeItem(STORAGE_KEYS.BIRTH_MONTH);
        setToken('');
        setBirthYear('');
        setBirthMonth('');
        setStatus('removed');
        setAssets([]);
        setTimeout(() => setStatus('idle'), 3000);
    };





    // Auto-save IDs whenever they change (only after initial load)
    useEffect(() => {
        if (isLoaded && status === 'idle') {
            localStorage.setItem(STORAGE_KEYS.EXCLUDED_ASSETS, JSON.stringify(excludedIds));
            localStorage.setItem(STORAGE_KEYS.SPENDING_SOURCES, JSON.stringify(spendingSourceIds));
        }
    }, [excludedIds, spendingSourceIds, status, isLoaded]);

    // Derived state for sorting
    const sortedAssets = [...assets].sort((a, b) => {
        const aExcluded = excludedIds.includes(a.id);
        const bExcluded = excludedIds.includes(b.id);

        // Included (false) comes before Excluded (true)
        if (aExcluded === bExcluded) return 0;
        return aExcluded ? 1 : -1;
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* API Key Card */}
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Key className="w-5 h-5 text-emerald-700" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">API Configuration</h3>
                        <p className="text-sm text-muted-foreground">Manage your connection to Lunch Money.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            Lunch Money Access Token
                        </label>
                        <input
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Enter your Access Token (e.g. tr_...)"
                            className="w-full bg-slate-50 border border-input rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                            Your token is stored securely in your browser&apos;s local storage. We do not store it on any server.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Birth Year
                            </label>
                            <input
                                type="number"
                                value={birthYear}
                                onChange={(e) => setBirthYear(e.target.value)}
                                placeholder="e.g. 1990"
                                className="w-full bg-slate-50 border border-input rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                Birth Month
                            </label>
                            <select
                                value={birthMonth}
                                onChange={(e) => setBirthMonth(e.target.value)}
                                className="w-full bg-slate-50 border border-input rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono appearance-none"
                            >
                                <option value="">Select...</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                disabled={!token.trim() && !birthYear.trim()}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                Save Token
                            </button>

                            {status === 'saved' && (
                                <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium animate-in fade-in slide-in-from-left-2">
                                    <CheckCircle className="w-4 h-4" />
                                    Saved!
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleRemove}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove
                        </button>
                    </div>

                    {status === 'removed' && (
                        <div className="bg-amber-50 text-amber-800 text-sm px-4 py-2 rounded-lg border border-amber-200 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Token removed. You will need to re-enter it to fetch data.
                        </div>
                    )}
                </div>
            </div>

            {/* Debugger Card */}
            <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-4 items-start animate-in fade-in slide-in-from-top-2">
                    <div className="bg-blue-100 p-2 rounded-lg mt-0.5">
                        <Info className="w-4 h-4 text-blue-700" />
                    </div>
                    <div className="text-xs leading-relaxed text-blue-900">
                        <p className="font-bold mb-1 text-[13px]">How this works:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><span className="font-bold">Portfolio:</span> Include retirement accounts (401k, IRA, Roth) and investments. These count toward your retirement net worth and projections.</li>
                            <li><span className="font-bold">Spending:</span> Track monthly expenses from checking, savings, and credit cards. This helps calculate your actual monthly burn rate.</li>
                        </ul>
                        <p className="mt-2 text-[10px] italic">Tip: Most accounts are automatically categorized. You can override any selection to match your preferences.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Search className="w-5 h-5 text-blue-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">Data Connection Inspector</h3>
                            <p className="text-sm text-muted-foreground">Check which assets are being pulled.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchDebugData(token)}
                        disabled={!token || debugLoading}
                        className="text-sm border border-input px-3 py-2 rounded-md hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                    >
                        <RefreshCw className={cn("w-3 h-3", debugLoading && "animate-spin")} />
                        {debugLoading ? 'Fetching...' : 'Test Connection'}
                    </button>
                </div>

                {debugError && (
                    <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm border border-red-200 mb-4">
                        Connection Error: {debugError}
                    </div>
                )}

                {!debugLoading && assets.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden text-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-border">
                                <tr>
                                    <th className="p-3 font-semibold text-muted-foreground w-12 text-center" title="Include in Retirement Portfolio">Portfolio</th>
                                    <th className="p-3 font-semibold text-muted-foreground w-12 text-center" title="Track Monthly Spending">Spending</th>
                                    <th className="p-3 font-semibold text-muted-foreground w-1/3">Asset Name</th>
                                    <th className="p-3 font-semibold text-muted-foreground">Type / Subtype</th>
                                    <th className="p-3 font-semibold text-muted-foreground text-right">Balance</th>
                                    <th className="p-3 font-semibold text-muted-foreground">Detected Category</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sortedAssets.map(asset => {
                                    const cat = categorizeAsset(asset);
                                    let catColor = "bg-gray-100 text-gray-800";
                                    if (cat === 'preTax') catColor = "bg-yellow-100 text-yellow-800";
                                    if (cat === 'roth') catColor = "bg-emerald-100 text-emerald-800";
                                    if (cat === 'taxable') catColor = "bg-blue-100 text-blue-800";

                                    const isExcluded = excludedIds.includes(asset.id);

                                    return (
                                        <tr key={asset.id} className={cn("hover:bg-slate-50/50 transition-opacity", isExcluded && "opacity-50 grayscale")}>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!isExcluded}
                                                    onChange={() => toggleExclusion(asset.id)}
                                                    className="accent-primary w-4 h-4 cursor-pointer"
                                                    title="Count toward retirement portfolio and net worth"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={spendingSourceIds.includes(asset.id)}
                                                    onChange={() => toggleSpendingSource(asset.id)}
                                                    className="accent-blue-500 w-4 h-4 cursor-pointer"
                                                    title="Track monthly expenses from this account"
                                                />
                                            </td>
                                            <td className="p-3 font-medium text-foreground">{asset.name}</td>
                                            <td className="p-3 text-muted-foreground">{asset.type_name} {asset.subtype_name && `/ ${asset.subtype_name}`}</td>
                                            <td className="p-3 text-right font-mono">{formatCurrency(asset.balance)}</td>
                                            <td className="p-3">
                                                <select
                                                    value={cat}
                                                    onChange={(e) => {
                                                        // Store manual category override in localStorage
                                                        const overrides = JSON.parse(localStorage.getItem('assetCategoryOverrides') || '{}');
                                                        overrides[asset.id] = e.target.value as 'taxable' | 'preTax' | 'roth' | 'other';
                                                        localStorage.setItem('assetCategoryOverrides', JSON.stringify(overrides));
                                                        // Refresh the display
                                                        window.location.reload();
                                                    }}
                                                    className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border-0 cursor-pointer", catColor)}
                                                >
                                                    <option value="taxable">Taxable</option>
                                                    <option value="preTax">Pre-Tax</option>
                                                    <option value="roth">Roth</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!debugLoading && assets.length === 0 && !debugError && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        Click &quot;Test Connection&quot; to view your raw Lunch Money data.
                    </p>
                )}
            </div>

            <div className="bg-slate-50 border border-border rounded-xl p-6 text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">How to get a token:</p>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                    <li>Log in to your <strong>Lunch Money</strong> account.</li>
                    <li>Go to <strong>Settings</strong> → <strong>Developers</strong>.</li>
                    <li>Select &quot;Request New Access Token&quot;.</li>
                    <li>Copy the new token and paste it above.</li>
                </ol>
            </div>
        </div >
    );
}
