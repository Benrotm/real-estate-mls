
import { Metadata } from 'next';
import AddPropertyForm from './AddPropertyForm';

export const metadata: Metadata = {
    title: 'Add New Property | Owner Dashboard',
    description: 'List a new property for sale or rent.',
};

export default function AddPropertyPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Add New Property</h1>
            <p className="text-slate-500 mb-8">Fill in the details below to list your property regardless of type.</p>

            <AddPropertyForm />
        </div>
    );
}
