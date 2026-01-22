import { fetchUsers } from '@/app/lib/admin';
import UserTable from './UserTable';
import { Users } from 'lucide-react';

export default async function UserManagement() {
    const users = await fetchUsers();

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-blue-500" />
                        User Management
                    </h1>
                    <p className="text-slate-400">
                        Manage user roles, monitor usage, and grant bonus privileges.
                        <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-slate-800 text-xs border border-slate-700">
                            {users?.length || 0} Total Users
                        </span>
                    </p>
                </header>

                <div className="grid gap-8">
                    <UserTable users={users || []} />
                </div>
            </div>
        </div>
    );
}
