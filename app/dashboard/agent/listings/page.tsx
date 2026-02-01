export default function AgentListingsPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">My Listings</h1>
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 mb-4">You haven't listed any properties yet.</p>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors">
                    Add New Property
                </button>
            </div>
        </div>
    );
}
