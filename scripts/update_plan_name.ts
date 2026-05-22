import { Client } from 'pg';

async function main() {
    const client = new Client({
        connectionString: 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log("Connected directly to Supabase DB!");

        // 1. Fetch plans matching "Pro Real"
        const planRes = await client.query("SELECT * FROM public.plans WHERE name = 'Pro Real'");
        console.log(`Found ${planRes.rows.length} plans named 'Pro Real':`);
        planRes.rows.forEach(r => console.log(` - ID: ${r.id}, Role: ${r.role}, Price: ${r.price}`));

        // 2. Fetch plan_features matching "Pro Real"
        const featRes = await client.query("SELECT COUNT(*) FROM public.plan_features WHERE plan_name = 'Pro Real'");
        console.log(`Found ${featRes.rows[0].count} features associated with 'Pro Real'.`);

        // 3. Update plans table
        const updatePlanRes = await client.query(
            "UPDATE public.plans SET name = 'Broker' WHERE name = 'Pro Real' RETURNING *"
        );
        console.log(`Updated ${updatePlanRes.rowCount} plan rows to 'Broker'.`);

        // 4. Update plan_features table
        const updateFeatRes = await client.query(
            "UPDATE public.plan_features SET plan_name = 'Broker' WHERE plan_name = 'Pro Real' RETURNING *"
        );
        console.log(`Updated ${updateFeatRes.rowCount} feature rows to 'Broker'.`);

        // 5. Verify the updates
        const finalPlans = await client.query("SELECT * FROM public.plans WHERE name = 'Broker'");
        console.log(`Verification: Found ${finalPlans.rows.length} plans named 'Broker' now.`);

    } catch (e: any) {
        console.error("Failed to run DB update:", e.message);
    } finally {
        await client.end();
    }
}
main();
