export default function SavedSearchesPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Saved Searches</h1>
            <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">No saved searches yet.</p>
                <button className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                    Start Searching
                </button>
            </div>
        </div>
    );
}
