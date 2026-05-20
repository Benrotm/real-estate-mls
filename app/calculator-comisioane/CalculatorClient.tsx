'use server';

import React from 'react';
import CalculatorClientUI from './CalculatorClientUI';

export default async function CalculatorClient({ initialSettings }: { initialSettings: any }) {
    return <CalculatorClientUI initialSettings={initialSettings} />;
}
