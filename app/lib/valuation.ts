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
    // In a real app, this would use DB queries for similar location/sqft
    const avgSqftPrice = property.location.city === 'Beverly Hills' ? 1200 :
        property.location.city === 'Paris' ? 5000 : // EUR/sqft approx
            600; // Austin/General

    let basePrice = property.specs.sqft * avgSqftPrice;

    // Adjust base if it's wildly off from the listed price (for mock consistency)
    // We want the valuation to be somewhat realistic relative to the listing
    const marketVariance = Math.random() * 0.1 - 0.05; // +/- 5%
    basePrice = property.price * (1 + marketVariance);

    // 2. Type of Building Adjustment
    let typeAdjustment = 0;
    switch (property.specs.type) {
        case 'House': typeAdjustment = 1.15; break; // +15% premium
        case 'Apartment': typeAdjustment = 1.0; break;
        case 'Commercial': typeAdjustment = 1.10; break;
        case 'Industrial': typeAdjustment = 0.95; break;
        case 'Land': typeAdjustment = 0.90; break;
        case 'Business': typeAdjustment = 1.05; break;
        default: typeAdjustment = 1.0;
    }
    const typeValue = basePrice * (typeAdjustment - 1);

    // 3. Floor Adjustment (For Apartments)
    let floorAdjustment = 0;
    if (property.specs.type === 'Apartment' && property.specs.floor) {
        if (property.specs.floor > 10) {
            floorAdjustment = property.specs.floor * 1000; // $1k per floor above 10
        } else if (property.specs.floor === 1) {
            floorAdjustment = -10000; // Ground floor discount
        }
    }

    // 4. Interior Design & Features
    const interiorScore = property.specs.interiorRating || 5;
    const interiorBonus = (interiorScore - 5) * 15000; // $15k per point above average

    const featureCount = property.features.length;
    const featureBonus = featureCount * 5000; // $5k per feature

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
            interiorBonus
        },
        comparables: [
            { id: 101, address: 'Nearby Property A', price: estimatedValue * 0.98, similarity: 92 },
            { id: 102, address: 'Nearby Property B', price: estimatedValue * 1.03, similarity: 88 },
            { id: 103, address: 'Nearby Property C', price: estimatedValue * 0.96, similarity: 85 },
        ]
    };
}
