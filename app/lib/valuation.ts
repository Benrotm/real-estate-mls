import { Property } from './properties';

export interface ValuationResult {
    estimatedValue: number;
    range: {
        min: number;
        max: number;
    };
    factors: {
        basePrice: number;
        typeAdjustment: number;
        floorAdjustment: number;
        featureBonus: number;
        interiorBonus: number;
        // New fields for UI display (percentages)
        marketComparisonPercent: number;
        floorPositionPercent: number;
        buildingTypePercent: number;
        premiumFeaturesPercent: number;
        interiorFurnishingPercent: number;
    };
    comparables: {
        id: number;
        address: string;
        price: number;
        similarity: number;
    }[];
}

export function calculateValuation(property: Property): ValuationResult {
    // 1. Comparative Price (Base)
    const avgSqftPrice = property.location_city === 'Beverly Hills' ? 1200 :
        property.location_city === 'Paris' ? 5000 : // EUR/sqft approx
            600; // Austin/General

    // Market Comparison Logic
    // Simulate market average being slightly different
    const marketAvgSqft = avgSqftPrice * (1 + (Math.random() * 0.2 - 0.1)); // +/- 10%
    const marketComparisonPercent = Math.round(((avgSqftPrice - marketAvgSqft) / marketAvgSqft) * 100);

    let basePrice = (property.area_usable || 0) * avgSqftPrice;

    // Adjust base if it's wildly off from the listed price (for mock consistency)
    const marketVariance = Math.random() * 0.1 - 0.05; // +/- 5%
    basePrice = property.price * (1 + marketVariance);

    // 2. Type of Building Adjustment
    let typeAdjustment = 0;
    let buildingTypePercent = 0;
    switch (property.type) {
        case 'House': typeAdjustment = 1.15; buildingTypePercent = 15; break;
        case 'Apartment': typeAdjustment = 1.0; buildingTypePercent = 0; break;
        case 'Commercial': typeAdjustment = 1.10; buildingTypePercent = 10; break;
        case 'Industrial': typeAdjustment = 0.95; buildingTypePercent = -5; break;
        case 'Land': typeAdjustment = 0.90; buildingTypePercent = -10; break;
        case 'Business': typeAdjustment = 1.05; buildingTypePercent = 5; break;
        default: typeAdjustment = 1.0; buildingTypePercent = 0;
    }
    const typeValue = basePrice * (typeAdjustment - 1);

    // 3. Floor Adjustment (For Apartments)
    let floorAdjustment = 0;
    let floorPositionPercent = 0;
    if (property.type === 'Apartment' && property.floor) {
        if (property.floor > 10) {
            floorAdjustment = property.floor * 1000;
            floorPositionPercent = Math.min(15, property.floor); // Up to 15%
        } else if (property.floor === 1) {
            floorAdjustment = -10000;
            floorPositionPercent = -5;
        } else {
            floorPositionPercent = 2; // Slight bonus for mid floors
            floorAdjustment = 2000;
        }
    }

    // 4. Interior Design & Features
    // internal rating not in new schema, assuming default
    const interiorScore = 5;
    const interiorBonus = (interiorScore - 5) * 15000;
    // Calculate percentage relative to base price approx, capped reasonable
    const interiorFurnishingPercent = Math.min(20, Math.max(-10, (interiorScore - 5) * 3));

    const featureCount = property.features.length;
    const featureBonus = featureCount * 5000;
    const premiumFeaturesPercent = Math.min(25, featureCount * 2); // 2% per feature

    // Total Calculation
    let estimatedValue = basePrice + floorAdjustment + interiorBonus + featureBonus;

    // Round to nearest 1000
    estimatedValue = Math.round(estimatedValue / 1000) * 1000;

    const range = {
        min: estimatedValue * 0.95,
        max: estimatedValue * 1.05
    };

    return {
        estimatedValue,
        range,
        factors: {
            basePrice,
            typeAdjustment: typeValue,
            floorAdjustment,
            featureBonus,
            interiorBonus,
            marketComparisonPercent,
            floorPositionPercent,
            buildingTypePercent,
            premiumFeaturesPercent,
            interiorFurnishingPercent
        },
        comparables: [
            { id: 101, address: 'Nearby Property A', price: estimatedValue * 0.98, similarity: 92 },
            { id: 102, address: 'Nearby Property B', price: estimatedValue * 1.03, similarity: 88 },
            { id: 103, address: 'Nearby Property C', price: estimatedValue * 0.96, similarity: 85 },
        ]
    };
}
