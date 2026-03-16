import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined, options: { maxDecimals?: number, notation?: 'standard' | 'compact' } = {}) {
    if (value === null || value === undefined) return '---';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '---';

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: options.maxDecimals ?? 0,
        notation: options.notation ?? 'standard'
    }).format(num);
}
