import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // or Service role

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    // 1. Fetch Lead
    const leadId = '984ef191-a12f-42e2-ae69-d70263ecc09d';
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
        
    console.log("LEAD:", leadError || lead);

    // 2. Fetch Property
    const propId = '7ef214bc-6a3e-414d-9e09-5261026c84e3';
    const { data: prop, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propId)
        .single();
        
    console.log("PROPERTY:", propError || prop);
    
    if (prop) {
        console.log("Property Status:", prop.status);
    }
}
check();
