import { getUserFeatures } from "@/app/lib/auth/features";
import DashboardClient from "./DashboardClient";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const features = await getUserFeatures();

    return (
        <DashboardClient features={features}>
            {children}
        </DashboardClient>
    );
}
