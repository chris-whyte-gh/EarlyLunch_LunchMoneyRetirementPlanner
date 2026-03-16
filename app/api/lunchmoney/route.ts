import { NextResponse } from 'next/server';
import { getLunchMoneyClient } from '@/lib/lunchmoney';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '').trim();

        if (!token || token === 'your_token_here') {
            return NextResponse.json({
                error: "Lunch Money API Token is missing or invalid. Please configure it in Settings.",
                code: 'MISSING_TOKEN'
            }, { status: 401 });
        }

        if (token.toLowerCase() === 'demo') {
            return NextResponse.json({
                assets: [
                    { id: 1, name: 'Main Checking', balance: '12500.50', type_name: 'Checking', subtype_name: 'Cash', is_plaid: false },
                    { id: 2, name: 'Tech 401k', balance: '450000.00', type_name: '401k', subtype_name: 'Pre-Tax', is_plaid: false },
                    { id: 3, name: 'Growth Roth IRA', balance: '185000.00', type_name: 'IRA', subtype_name: 'Roth', is_plaid: false },
                    { id: 4, name: 'Brokerage (VTSAX)', balance: '320000.00', type_name: 'Brokerage', subtype_name: 'Taxable', is_plaid: false },
                ],
                transactions: [] // Mocked for now to avoid complexity
            });
        }

        const client = getLunchMoneyClient(token);

        // Fetch last 12 months of transactions
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);

        const fmt = (d: Date) => d.toISOString().split('T')[0];

        const [manualAssets, plaidAccounts, transactions, budgets] = await Promise.all([
            client.getAssets(),
            client.getPlaidAccounts(),
            client.getTransactions(fmt(startDate), fmt(endDate)),
            client.getBudgets(fmt(startDate), fmt(endDate))
        ]);

        const mappedPlaidAssets = plaidAccounts.map(acc => ({
            id: acc.id,
            type_name: acc.type,
            subtype_name: acc.subtype,
            name: acc.display_name || acc.name,
            balance: acc.balance,
            balance_as_of: acc.last_import || new Date().toISOString(),
            currency: acc.currency,
            institution_name: acc.institution_name,
            created_at: new Date().toISOString(),
            is_plaid: true
        }));

        const assets = [...manualAssets, ...mappedPlaidAssets];
        return NextResponse.json({ assets, transactions, budgets });

    } catch (error: any) {
        console.error("Lunch Money API Error Detail:", error.message);
        const isUnauthorized = error.message.includes('401') || error.message.includes('Unauthorized');

        return NextResponse.json({
            error: error.message,
            code: isUnauthorized ? 'INVALID_TOKEN' : 'API_ERROR'
        }, { status: isUnauthorized ? 401 : 500 });
    }
}
