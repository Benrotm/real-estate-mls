
export function formatCurrency(amount: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatCompactCurrency(amount: number, currency = 'EUR'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(amount);
}
