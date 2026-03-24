import { getUserFeatures } from "@/app/lib/auth/features";
import { getUserProfile } from "@/app/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [features, profile] = await Promise.all([getUserFeatures(), getUserProfile()]);

    return (
        <DashboardClient features={features} profile={profile}>
            {children}
        </DashboardClient>
    );
}
