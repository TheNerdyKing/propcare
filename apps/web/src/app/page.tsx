import Link from 'next/link';

export default function RootPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">PropCare</h1>
            <p className="text-lg text-gray-600 mb-8">AI-Powered Property Management</p>
            <Link
                href="/login"
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
                Go to Portal
            </Link>
        </div>
    );
}
