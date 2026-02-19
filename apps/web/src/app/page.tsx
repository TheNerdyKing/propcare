import { redirect } from 'next/navigation';

export default function RootPage() {
    redirect('/login');
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p className="text-gray-500">Redirecting to login...</p>
        </div>
    );
}
