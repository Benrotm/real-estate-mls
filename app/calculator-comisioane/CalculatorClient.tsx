'use server';

import React from 'react';
import CalculatorClientUI from './CalculatorClientUI';

export default async function CalculatorClient({ initialSettings, user }: { initialSettings: any; user: any }) {
    return <CalculatorClientUI initialSettings={initialSettings} user={user} />;
}
