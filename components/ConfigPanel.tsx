"use client";

import React from 'react';
import { ModelingParams } from '@/lib/modeling';
import { cn } from '@/lib/utils';

import styles from './ConfigPanel.module.css';

interface ConfigPanelProps {
    params: ModelingParams;
    onChange: (params: ModelingParams) => void;
    className?: string;
    activeTab?: string;
    birthYear?: number;
}

interface InputGroupProps {
    label: string;
    value: number;
    onChange: (val: string) => void;
    step?: number;
    suffix?: string;
    disabled?: boolean;
}

const InputGroup = ({ label, value, onChange, step = 1, suffix = '', disabled = false }: InputGroupProps) => {
    // Local state for performant typing without triggering parent re-renders
    const [localValue, setLocalValue] = React.useState(value.toString());

    // Sync local value if prop changes externally (e.g. from a different tab calculation)
    React.useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleBlur = () => {
        if (!disabled) onChange(localValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <div className={styles.inputGroup}>
            <label className={styles.label}>
                {label}
            </label>
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    inputMode="decimal"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={cn(
                        styles.input,
                        disabled && styles.inputDisabled
                    )}
                />
                {suffix && <span className={styles.suffix}>{suffix}</span>}
            </div>
        </div>
    );
};

export function ConfigPanel({ params, onChange, className, activeTab = 'overview', birthYear }: ConfigPanelProps) {

    const handleChange = (key: keyof ModelingParams, value: string, scale: number = 1) => {
        // Remove currency symbols or commas if user adds them
        const cleanValue = value.replace(/[$,]/g, '');
        const numValue = parseFloat(cleanValue);

        if (!isNaN(numValue)) {
            onChange({ ...params, [key]: numValue / scale });
        }
    };

    return (
        <div className={cn(styles.panel, className)}>

            <div className={styles.header}>
                <h3 className={styles.headerTitle}>Scenarios</h3>
                <div className={styles.badges}>
                    {activeTab === 'roth' && <span className={styles.badgeRoth}>Roth Mode</span>}
                    {activeTab === 'sepp' && <span className={styles.badgeSepp}>SEPP Mode</span>}
                    {birthYear && (
                        <div className={styles.ageBadge}>
                            Age {params.currentAge}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {(activeTab === 'overview' || activeTab === 'tax') && (
                    <>
                        {!birthYear && (
                            <InputGroup
                                label="Current Age"
                                value={params.currentAge}
                                onChange={(v) => handleChange('currentAge', v)}
                            />
                        )}
                        <InputGroup label="Retirement Age" value={params.retirementAge} onChange={(v) => handleChange('retirementAge', v)} />
                        <InputGroup label="Life Expectancy" value={params.lifeExpectancy} onChange={(v) => handleChange('lifeExpectancy', v)} />
                        <div className={styles.divider} />
                        <InputGroup label="Annual Return" value={Math.round(params.annualReturn * 10000) / 100} onChange={(v) => handleChange('annualReturn', v, 100)} step={0.1} suffix="%" />
                        <InputGroup label="Inflation" value={Math.round(params.inflationRate * 10000) / 100} onChange={(v) => handleChange('inflationRate', v, 100)} step={0.1} suffix="%" />
                        <InputGroup label="Safe Withdrawal" value={Math.round(params.safeWithdrawalRate * 10000) / 100} onChange={(v) => handleChange('safeWithdrawalRate', v, 100)} step={0.1} suffix="%" />
                        <div className={styles.divider} />
                    </>
                )}

                <h4 className={styles.sectionTitle}>Tax & Strategies</h4>
                {(activeTab === 'overview' || activeTab === 'tax') && (
                    <>
                        <InputGroup label="Est. Tax Rate" value={Math.round(params.effectiveTaxRate * 10000) / 100} onChange={(v) => handleChange('effectiveTaxRate', v, 100)} step={0.1} suffix="%" />

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Withdrawal Strategy</label>
                            <select
                                value={params.withdrawalStrategy || 'sequence'}
                                onChange={(e) => onChange({ ...params, withdrawalStrategy: e.target.value as any })}
                                className={styles.select}
                            >
                                <option value="sequence">Sequence (Taxable-Pretax-Roth)</option>
                                <option value="pro-rata">Pro-rata (Balanced Drawdown)</option>
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <div className="flex items-center justify-between">
                                <label className={styles.label}>Enforce Roth 5-Year Rule</label>
                                <input
                                    type="checkbox"
                                    checked={params.enforceRothFiveYearRule !== false}
                                    onChange={(e) => onChange({ ...params, enforceRothFiveYearRule: e.target.checked })}
                                    className={styles.checkbox}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">Seasoning required for penalty-free conversion withdrawals.</p>
                        </div>
                    </>
                )}

                {(activeTab === 'roth') && (
                    <div className={cn(styles.rothSection, styles.rothSectionActive)}>
                        <h5 className={cn(styles.rothTitle, styles.rothTitleActive)}>Roth Conversion Strategy</h5>
                        <InputGroup label="Annual Conversion" value={params.rothConversionAmount} onChange={(v) => handleChange('rothConversionAmount', v)} step={1000} suffix="$" />
                        <div className="grid grid-cols-2 gap-2">
                            <InputGroup label="Start Age" value={params.rothConversionStartAge} onChange={(v) => handleChange('rothConversionStartAge', v)} />
                            <InputGroup label="End Age" value={params.rothConversionEndAge} onChange={(v) => handleChange('rothConversionEndAge', v)} />
                        </div>
                    </div>
                )}

                {(activeTab === 'sepp') && (
                    <div className={cn(styles.seppSection, styles.seppSectionActive)}>
                        <div className={styles.seppHeader}>
                            <h5 className={cn(styles.seppTitle, styles.seppTitleActive)}>SEPP (72t) Distribution</h5>
                            <input
                                type="checkbox"
                                checked={params.enableSEPP}
                                onChange={(e) => onChange({ ...params, enableSEPP: e.target.checked })}
                                className={styles.checkbox}
                            />
                        </div>
                        {params.enableSEPP && (
                            <>
                                <InputGroup label="SEPP Start Age" value={params.seppStartAge} onChange={(v) => handleChange('seppStartAge', v)} />

                                <div className={styles.seppInfo}>
                                    <p className="font-semibold">How this works:</p>
                                    <ul className={styles.seppList}>
                                        <li> Automatically calculates max annual withdrawal using the <strong>Amortization Method</strong>.</li>
                                        <li> Uses your <strong>Annual Return</strong> and <strong>Life Expectancy</strong>.</li>
                                        <li> Runs until age 59.5 (or 5 years, whichever is later) to avoid early withdrawal penalties.</li>
                                        <li> <em>Note: Does not currently factor in Social Security or Pensions.</em></li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {(activeTab === 'overview') && (
                    <>
                        <div className={styles.divider} />
                        <InputGroup label="Monthly Contribution" value={params.monthlyContribution} onChange={(v) => handleChange('monthlyContribution', v)} step={100} suffix="$" />
                        <InputGroup label="Current Pre-Tax" value={params.currentPreTax} onChange={(v) => handleChange('currentPreTax', v)} step={1000} suffix="$" />
                        <InputGroup label="Current Roth" value={params.currentRoth} onChange={(v) => handleChange('currentRoth', v)} step={1000} suffix="$" />
                        <InputGroup label="Current Taxable" value={params.currentTaxable} onChange={(v) => handleChange('currentTaxable', v)} step={1000} suffix="$" />
                    </>
                )}
            </div>
        </div>
    );
}
