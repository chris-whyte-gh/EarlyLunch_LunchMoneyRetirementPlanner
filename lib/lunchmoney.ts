import {
    LunchMoneyClient as SdkClient,
    LunchMoneyError,
    type Category as SdkCategory,
    type ManualAccount,
    type PlaidAccount as SdkPlaidAccount,
    type Transaction as SdkTransaction,
} from '@lunch-money/lunch-money-js-v2';
import { z } from 'zod';

// --- App-level types (stable shape used across the UI) ---

export const AssetSchema = z.object({
    id: z.number(),
    type_name: z.string(),
    subtype_name: z.string().optional().nullable(),
    name: z.string(),
    balance: z.string(),
    balance_as_of: z.string(),
    currency: z.string(),
    institution_name: z.string().optional().nullable(),
    created_at: z.string(),
    is_plaid: z.boolean().optional(),
});

export const TransactionSchema = z.object({
    id: z.number(),
    date: z.string(),
    payee: z.string(),
    amount: z.string(),
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

export const CategorySchema = z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().optional().nullable(),
    is_income: z.boolean(),
    exclude_from_budget: z.boolean(),
    exclude_from_totals: z.boolean(),
    updated_at: z.string(),
    created_at: z.string(),
    is_group: z.boolean(),
    group_id: z.number().nullable(),
    order: z.number(),
    children: z.array(z.any()).optional(),
});

export const BudgetSchema = z.object({
    category_name: z.string(),
    category_id: z.number(),
    category_group_name: z.string().optional().nullable(),
    is_income: z.boolean(),
    exclude_from_budget: z.boolean(),
    exclude_from_totals: z.boolean(),
    amount: z.string(),
    currency: z.string(),
    spent: z.string(),
    data: z.record(z.string(), z.any()).optional(),
});

export type Asset = z.infer<typeof AssetSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Budget = z.infer<typeof BudgetSchema>;

export { LunchMoneyError };

function formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
}

function currentMonthRange(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: formatDate(start), end: formatDate(end) };
}

function mapManualAccount(account: ManualAccount): Asset {
    return {
        id: account.id,
        type_name: account.type,
        subtype_name: account.subtype,
        name: account.display_name || account.name,
        balance: account.balance,
        balance_as_of: account.balance_as_of,
        currency: account.currency,
        institution_name: account.institution_name,
        created_at: account.created_at || account.balance_as_of,
        is_plaid: false,
    };
}

function mapPlaidAccount(account: SdkPlaidAccount): Asset {
    return {
        id: account.id,
        type_name: account.type,
        subtype_name: account.subtype,
        name: account.display_name || account.name,
        balance: account.balance,
        balance_as_of: account.last_import || new Date().toISOString(),
        currency: account.currency,
        institution_name: account.institution_name,
        created_at: account.date_linked,
        is_plaid: true,
    };
}

function mapTransaction(tx: SdkTransaction): Transaction {
    return {
        id: tx.id,
        date: tx.date,
        payee: tx.payee,
        amount: tx.amount,
        currency: tx.currency,
        notes: tx.notes ?? null,
        category_id: tx.category_id,
        recurring_id: tx.recurring_id,
        asset_id: tx.manual_account_id,
        plaid_account_id: tx.plaid_account_id,
        status: tx.status,
        is_group: tx.is_group_parent ?? false,
        group_id: tx.group_parent_id ?? null,
        parent_id: tx.split_parent_id ?? null,
        original_name: tx.original_name ?? null,
    };
}

function mapCategory(category: SdkCategory): Category {
    return {
        id: category.id,
        name: category.name,
        description: category.description,
        is_income: category.is_income,
        exclude_from_budget: category.exclude_from_budget,
        exclude_from_totals: category.exclude_from_totals,
        updated_at: category.updated_at,
        created_at: category.created_at,
        is_group: category.is_group,
        group_id: category.group_id,
        order: category.order ?? 0,
        children: category.is_group ? category.children : undefined,
    };
}

// --- API Client (v2 SDK wrapper) ---

export class LunchMoneyClient {
    private sdk: SdkClient;

    constructor(token: string) {
        this.sdk = new SdkClient({ apiKey: token });
    }

    async getAssets(): Promise<Asset[]> {
        const [manualAccounts, plaidAccounts] = await Promise.all([
            this.sdk.manualAccounts.getAll(),
            this.sdk.plaidAccounts.getAll(),
        ]);
        return [
            ...manualAccounts.map(mapManualAccount),
            ...plaidAccounts.map(mapPlaidAccount),
        ];
    }

    async getTransactions(startDate?: string, endDate?: string): Promise<Transaction[]> {
        const transactions: Transaction[] = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
            const response = await this.sdk.transactions.getAll({
                start_date: startDate,
                end_date: endDate,
                limit,
                offset,
            });
            transactions.push(...response.transactions.map(mapTransaction));
            hasMore = response.hasMore;
            offset += limit;
        }

        return transactions;
    }

    async getPlaidAccounts(): Promise<Asset[]> {
        const accounts = await this.sdk.plaidAccounts.getAll();
        return accounts.map(mapPlaidAccount);
    }

    async getBudgets(startDate?: string, endDate?: string): Promise<Budget[]> {
        const range = startDate && endDate
            ? { start: startDate, end: endDate }
            : currentMonthRange();

        const [summary, categories] = await Promise.all([
            this.sdk.summary.get({
                start_date: range.start,
                end_date: range.end,
            }),
            this.sdk.categories.getAll(),
        ]);

        const categoryMap = new Map(categories.map(c => [c.id, c]));

        return summary.categories.flatMap(summaryCategory => {
            const category = categoryMap.get(summaryCategory.category_id);
            const budgeted = summaryCategory.totals?.budgeted;
            if (!category || budgeted == null || budgeted <= 0) return [];

            const spent = (summaryCategory.totals?.other_activity ?? 0)
                + (summaryCategory.totals?.recurring_activity ?? 0);

            return [{
                category_id: summaryCategory.category_id,
                category_name: category.name,
                category_group_name: null,
                is_income: category.is_income,
                exclude_from_budget: category.exclude_from_budget,
                exclude_from_totals: category.exclude_from_totals,
                amount: String(budgeted),
                currency: 'usd',
                spent: String(spent),
            }];
        });
    }

    async getCategories(): Promise<Category[]> {
        const categories = await this.sdk.categories.getAll();
        return categories.map(mapCategory);
    }

    async getRetirementContributions(
        categoryIds: number[],
        startDate?: string,
        endDate?: string
    ): Promise<number> {
        if (categoryIds.length === 0) return 0;

        const transactions = await this.getTransactions(startDate, endDate);
        return transactions
            .filter(t => t.category_id && categoryIds.includes(t.category_id))
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    }
}

export function getLunchMoneyClient(token?: string | null) {
    const fromEnv = process.env.LUNCH_MONEY_ACCESS_TOKEN;
    const finalToken = token || (fromEnv === 'your_token_here' ? null : fromEnv);

    if (!finalToken) {
        throw new Error('Lunch Money Access Token is missing. Please configure it in the app settings.');
    }
    return new LunchMoneyClient(finalToken);
}

export function isLunchMoneyUnauthorized(error: unknown): boolean {
    if (error instanceof LunchMoneyError) {
        return error.status === 401;
    }
    if (error instanceof Error) {
        return error.message.includes('401') || error.message.toLowerCase().includes('unauthorized');
    }
    return false;
}
