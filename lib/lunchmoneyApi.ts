import type { Asset, Budget, Category, Transaction } from './lunchmoney';

export interface LunchMoneyApiResponse {
    assets: Asset[];
    transactions: Transaction[];
    budgets: Budget[];
    categories: Category[];
}

export class LunchMoneyApiError extends Error {
    code?: string;
    status: number;

    constructor(message: string, status: number, code?: string) {
        super(message);
        this.name = 'LunchMoneyApiError';
        this.status = status;
        this.code = code;
    }
}

async function parseApiError(res: Response): Promise<LunchMoneyApiError> {
    const errorData = await res.json().catch(() => ({}));
    return new LunchMoneyApiError(
        errorData.error || `Lunch Money API Error: ${res.status}`,
        res.status,
        errorData.code,
    );
}

export async function fetchLunchMoneyData(token: string): Promise<LunchMoneyApiResponse> {
    const res = await fetch('/api/lunchmoney', {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
        throw await parseApiError(res);
    }

    return res.json();
}

export async function fetchLunchMoneyCategories(token: string): Promise<Category[]> {
    const data = await fetchLunchMoneyData(token);
    return data.categories ?? [];
}
