import { NextResponse } from 'next/server';
import { getDemoData } from '@/lib/demoData';
import { getLunchMoneyClient, isLunchMoneyUnauthorized, LunchMoneyError } from '@/lib/lunchmoney';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token || token === 'your_token_here') {
            return NextResponse.json({
                error: 'Lunch Money API Token is missing or invalid. Please configure it in Settings.',
                code: 'MISSING_TOKEN',
            }, { status: 401 });
        }

        if (token.toLowerCase() === 'demo') {
            return NextResponse.json(getDemoData());
        }

        const client = getLunchMoneyClient(token);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);

        const fmt = (d: Date) => d.toISOString().split('T')[0];

        const [assets, transactions, budgets, categories] = await Promise.all([
            client.getAssets(),
            client.getTransactions(fmt(startDate), fmt(endDate)),
            client.getBudgets(),
            client.getCategories(),
        ]);

        return NextResponse.json({ assets, transactions, budgets, categories });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown Lunch Money API error';
        console.error('Lunch Money API Error Detail:', message);

        const isUnauthorized = isLunchMoneyUnauthorized(error);
        const status = error instanceof LunchMoneyError ? (error.status ?? 500) : (isUnauthorized ? 401 : 500);

        return NextResponse.json({
            error: message,
            code: isUnauthorized ? 'INVALID_TOKEN' : 'API_ERROR',
        }, { status: isUnauthorized ? 401 : status });
    }
}
