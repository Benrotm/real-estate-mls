import { getUserFeatures } from "@/app/lib/auth/features";
import { getUserProfile } from "@/app/lib/auth";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [features, profile] = await Promise.all([getUserFeatures(), getUserProfile()]);

    if (
        profile && 
        profile.is_approved === false && 
        profile.role !== 'super_admin' && 
        profile.role !== 'admin' && 
        profile.role !== 'client' && 
        profile.role !== 'client_no_agency'
    ) {
        redirect('/awaiting-approval');
    }

    return (
        <DashboardClient features={features} profile={profile}>
            {children}
        </DashboardClient>
    );
}
