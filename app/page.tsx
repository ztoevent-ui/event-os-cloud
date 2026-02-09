import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-4xl font-bold mb-8 text-gray-900">Event OS</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                <Link
                    href="/apps/wedding-hub"
                    className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 flex flex-col items-center text-center space-y-4 w-64"
                >
                    <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-xl">
                        <i className="fa-solid fa-heart"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Wedding Hub</h2>
                        <p className="text-sm text-gray-500 mt-1">Manage wedding details & guests</p>
                    </div>
                </Link>
                <Link
                    href="/apps/lucky-draw"
                    className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition border border-gray-100 flex flex-col items-center text-center space-y-4 w-64"
                >
                    <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xl">
                        <i className="fa-solid fa-ticket"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Lucky Draw</h2>
                        <p className="text-sm text-gray-500 mt-1">Event lucky draw system</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
