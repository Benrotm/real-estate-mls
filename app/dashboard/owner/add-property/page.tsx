import { Metadata } from 'next';
import AddPropertyClient from './AddPropertyClient';

export const metadata: Metadata = {
    title: 'Add New Property | Owner Dashboard',
    description: 'List a new property for sale or rent.',
};

export default function AddPropertyPage() {
    return <AddPropertyClient />;
}
