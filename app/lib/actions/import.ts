'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Simple CSV Parser helper
function parseCSV(csvText: string) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

    return lines.slice(1).map(line => {
        // Handle quoted values containing commas
        const values: string[] = [];
        let inQuotes = false;
        let currentValue = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim().replace(/^"|"$/g, ''));

        const entry: Record<string, string> = {};
        headers.forEach((header, index) => {
            if (values[index] !== undefined) {
                entry[header] = values[index];
            }
        });
        return entry;
    });
}

export async function importPropertiesFromCSV(formData: FormData) {
    const file = formData.get('file') as File;

    if (!file) {
        return { error: 'No file uploaded' };
    }

    try {
        const text = await file.text();
        const records = parseCSV(text);

        if (records.length === 0) {
            return { error: 'CSV file is empty or invalid format' };
        }

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'You must be logged in to import properties' };
        }

        let successCount = 0;
        const errors: string[] = [];

        for (const record of records) {
            // Basic required fields validation
            if (!record.title || !record.price) {
                console.warn('Skipping invalid record:', record);
                continue;
            }

            const propertyData = {
                user_id: user.id,
                title: record.title,
                price: parseFloat(record.price) || 0,
                currency: record.currency?.toUpperCase() || 'EUR',
                type: record.type || 'Apartment',
                listing_type: record.listing_type || 'For Sale',
                address: record.address || '',
                // Map other fields as needed with defaults
                status: 'active',
                created_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase
                .from('properties')
                .insert(propertyData);

            if (insertError) {
                console.error('Import error for record:', record.title, insertError);
                errors.push(`Failed to import "${record.title}"`);
            } else {
                successCount++;
            }
        }

        return {
            count: successCount,
            error: errors.length > 0 ? `Imported ${successCount} properties. ${errors.length} failed.` : undefined
        };

    } catch (error) {
        console.error('CSV Processing Error:', error);
        return { error: 'Failed to process CSV file' };
    }
}
