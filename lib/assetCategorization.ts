import { Asset } from './lunchmoney';

export interface CategorizedAssets {
    taxable: number;
    preTax: number;
    roth: number;
    other: number;
}

export interface AssetCategory {
    accountType: 'taxable' | 'preTax' | 'roth' | 'other';
    balance: number;
    assets: Asset[];
}

/**
 * Asset categorization mapping based on LunchMoney asset types and subtypes
 * This automatically categorizes accounts for retirement planning
 */
const ASSET_CATEGORIZATION_MAP = {
    // Pre-tax retirement accounts
    preTax: {
        types: [
            '401(k)',
            '401k', 
            '403(b)',
            '403b',
            'Traditional IRA',
            'IRA',
            'SEP IRA',
            'Simple IRA',
            'Pension',
            'Thrift Savings Plan',
            'TSP'
        ],
        subtypes: [
            'traditional',
            'pre-tax',
            '401k',
            '403b',
            'sep',
            'simple',
            'pension',
            'tsp'
        ],
        namePatterns: [
            /401k?/i,
            /403b?/i,
            /traditional.*ira/i,
            /sep.*ira/i,
            /simple.*ira/i,
            /pension/i,
            /thrift.*savings/i
        ]
    },
    
    // Roth accounts
    roth: {
        types: [
            'Roth IRA',
            'Roth 401(k)',
            'Roth 401k',
            'Roth 403(b)',
            'Roth 403b',
            'Roth'
        ],
        subtypes: [
            'roth',
            'roth ira',
            'roth 401k',
            'roth 403b'
        ],
        namePatterns: [
            /roth.*ira/i,
            /roth.*401k?/i,
            /roth.*403b?/i,
            /^roth$/i
        ]
    },
    
    // Taxable brokerage and cash accounts
    taxable: {
        types: [
            'Checking',
            'Savings',
            'Brokerage',
            'Investment',
            'Cash',
            'Money Market',
            'CD',
            'Treasury',
            'Stock',
            'ETF',
            'Mutual Fund'
        ],
        subtypes: [
            'checking',
            'savings',
            'brokerage',
            'investment',
            'cash',
            'money market',
            'cd',
            'treasury',
            'taxable'
        ],
        namePatterns: [
            /checking/i,
            /savings/i,
            /brokerage/i,
            /investment/i,
            /cash/i,
            /money.*market/i,
            /cd/i,
            /treasury/i
        ]
    }
};

/**
 * Categorize a single asset based on LunchMoney type and subtype
 */
export function categorizeAsset(asset: Asset): 'taxable' | 'preTax' | 'roth' | 'other' {
    const { type_name, subtype_name, name } = asset;
    
    // Check pre-tax accounts first (most specific)
    const preTaxConfig = ASSET_CATEGORIZATION_MAP.preTax;
    if (
        preTaxConfig.types.includes(type_name) ||
        (subtype_name && preTaxConfig.subtypes.includes(subtype_name)) ||
        preTaxConfig.namePatterns.some(pattern => pattern.test(name))
    ) {
        return 'preTax';
    }
    
    // Check Roth accounts
    const rothConfig = ASSET_CATEGORIZATION_MAP.roth;
    if (
        rothConfig.types.includes(type_name) ||
        (subtype_name && rothConfig.subtypes.includes(subtype_name)) ||
        rothConfig.namePatterns.some(pattern => pattern.test(name))
    ) {
        return 'roth';
    }
    
    // Check taxable accounts
    const taxableConfig = ASSET_CATEGORIZATION_MAP.taxable;
    if (
        taxableConfig.types.includes(type_name) ||
        (subtype_name && taxableConfig.subtypes.includes(subtype_name)) ||
        taxableConfig.namePatterns.some(pattern => pattern.test(name))
    ) {
        return 'taxable';
    }
    
    // Default to other if no match
    return 'other';
}

/**
 * Categorize all assets and return categorized totals
 */
export function categorizeAssets(assets: Asset[]): CategorizedAssets {
    const categorized: CategorizedAssets = {
        taxable: 0,
        preTax: 0,
        roth: 0,
        other: 0
    };
    
    assets.forEach(asset => {
        const balance = parseFloat(asset.balance) || 0;
        const category = categorizeAsset(asset);
        categorized[category] += balance;
    });
    
    return categorized;
}

/**
 * Get detailed categorization with asset lists
 */
export function getDetailedAssetCategorization(assets: Asset[]): AssetCategory[] {
    const categories: AssetCategory[] = [
        { accountType: 'taxable', balance: 0, assets: [] },
        { accountType: 'preTax', balance: 0, assets: [] },
        { accountType: 'roth', balance: 0, assets: [] },
        { accountType: 'other', balance: 0, assets: [] }
    ];
    
    assets.forEach(asset => {
        const balance = parseFloat(asset.balance) || 0;
        const category = categorizeAsset(asset);
        const categoryIndex = categories.findIndex(c => c.accountType === category);
        
        if (categoryIndex !== -1) {
            categories[categoryIndex].balance += balance;
            categories[categoryIndex].assets.push(asset);
        }
    });
    
    return categories;
}

/**
 * Get human-readable category name
 */
export function getCategoryDisplayName(category: 'taxable' | 'preTax' | 'roth' | 'other'): string {
    switch (category) {
        case 'taxable':
            return 'Taxable Accounts';
        case 'preTax':
            return 'Pre-Tax Retirement';
        case 'roth':
            return 'Roth Accounts';
        case 'other':
            return 'Other Accounts';
        default:
            return 'Unknown';
    }
}

/**
 * Get category description for user understanding
 */
export function getCategoryDescription(category: 'taxable' | 'preTax' | 'roth' | 'other'): string {
    switch (category) {
        case 'taxable':
            return 'Checking, savings, brokerage, and investment accounts';
        case 'preTax':
            return 'Traditional 401(k), IRA, and other pre-tax retirement accounts';
        case 'roth':
            return 'Roth IRA, Roth 401(k), and other post-tax retirement accounts';
        case 'other':
            return 'Accounts that don\'t fit standard retirement categories';
        default:
            return 'Uncategorized accounts';
    }
}
