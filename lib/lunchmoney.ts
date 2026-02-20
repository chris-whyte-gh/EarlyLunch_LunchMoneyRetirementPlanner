import { z } from 'zod';

const LUNCH_MONEY_API_BASE = 'https://dev.lunchmoney.app/v1';

// --- Zod Schemas for Validation ---

export const AssetSchema = z.object({
    id: z.number(),
    type_name: z.string(),
    subtype_name: z.string().optional().nullable(),
    name: z.string(),
    balance: z.string(), // Lunch Money returns balance as string
    balance_as_of: z.string(),
    currency: z.string(),
    institution_name: z.string().optional().nullable(),
    created_at: z.string(),
});

export const TransactionSchema = z.object({
    id: z.number(),
    date: z.string(),
    payee: z.string(),
    amount: z.string(), // Lunch Money returns amount as string
    currency: z.string(),
    notes: z.string().optional().nullable(),
    category_id: z.number().optional().nullable(),
    recurring_id: z.number().optional().nullable(),
    asset_id: z.number().optional().nullable(),
    plaid_account_id: z.number().optional().nullable(),
    status: z.string(),
    is_group: z.boolean().optional(),
    group_id: z.number().optional().nullable(),
    parent_id: z.number().optional().nullable(),
    external_id: z.string().optional().nullable(),
    original_name: z.string().optional().nullable(),
    type: z.string().optional(),
    subtype: z.string().optional(),
    fees: z.string().optional().nullable(),
    price: z.string().optional().nullable(),
    quantity: z.string().optional().nullable(),
});

export type Asset = z.infer<typeof AssetSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;

// --- API Client ---

export class LunchMoneyClient {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${LUNCH_MONEY_API_BASE}${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            ...options?.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Lunch Money API Error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        return response.json();
    }

    async getAssets(): Promise<Asset[]> {
        const data = await this.fetch<{ assets: Asset[] }>('/assets');
        return data.assets;
    }

    async getTransactions(startDate?: string, endDate?: string): Promise<Transaction[]> {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const queryString = params.toString() ? `?${params.toString()}` : '';
        const data = await this.fetch<{ transactions: Transaction[] }>(`/transactions${queryString}`);

        // Validate with Zod (optional, but good for safety)
        // We can filter out invalid ones or just return valid ones
        return data.transactions;
    }

    async getPlaidAccounts(): Promise<PlaidAccount[]> {
        const data = await this.fetch<{ plaid_accounts: PlaidAccount[] }>('/plaid_accounts');
        return data.plaid_accounts;
    }
}

export const PlaidAccountSchema = z.object({
    id: z.number(),
    name: z.string(),
    display_name: z.string().optional().nullable(),
    type: z.string(), // e.g. "depository", "credit", "investment"
    subtype: z.string().optional().nullable(), // e.g. "checking", "401k"
    institution_name: z.string(),
    balance: z.string(), // Lunch Money returns balance as string
    currency: z.string(),
    status: z.string(),
    last_import: z.string().optional().nullable(),
});

export type PlaidAccount = z.infer<typeof PlaidAccountSchema>;

// Singleton instance helper
export function getLunchMoneyClient(token?: string | null) {
    const fromEnv = process.env.LUNCH_MONEY_ACCESS_TOKEN;
    const finalToken = token || (fromEnv === 'your_token_here' ? null : fromEnv);

    if (!finalToken) {
        throw new Error('Lunch Money Access Token is missing. Please configure it in the app settings.');
    }
    return new LunchMoneyClient(finalToken);
}
