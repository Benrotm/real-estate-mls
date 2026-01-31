import { redirect } from 'next/navigation';
import { isSuperAdmin } from '../../lib/auth';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // const authorized = await isSuperAdmin();

    // if (!authorized) {
    //     redirect('/unauthorized');
    // }

    return (
        <div className="admin-secured-context">
            {children}
        </div>
    );
}
