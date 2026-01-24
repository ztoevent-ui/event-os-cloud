'use client';

export default function GuestsPage() {
    const guests = [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', rsvp: 'Attending', diet: 'Vegan', table: 'Unassigned' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', rsvp: 'Attending', diet: 'None', table: 'Table 1' },
        { id: 3, name: 'Charlie Davis', email: 'charlie@example.com', rsvp: 'Declined', diet: '-', table: '-' },
        { id: 4, name: 'Diana Evans', email: 'diana@example.com', rsvp: 'Pending', diet: '-', table: 'Unassigned' },
        { id: 5, name: 'Ethan Hunt', email: 'ethan@imf.org', rsvp: 'Attending', diet: 'Gluten Free', table: 'Table 2' },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Guest List</h1>
                    <p className="text-gray-500">Manage your invites and track RSVPs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-white hover:border-gray-300 transition bg-white">
                        <i className="fa-solid fa-file-export text-gray-400"></i> Export List
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-pink-600 rounded-lg text-sm font-bold text-white hover:bg-pink-700 shadow-lg shadow-pink-200 transition">
                        <i className="fa-solid fa-plus"></i> Add Guest
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium whitespace-nowrap">
                    All Guests <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-2">156</span>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 text-sm font-medium text-green-700 whitespace-nowrap">
                    Attending <span className="bg-white text-green-700 px-2 py-0.5 rounded-full text-xs ml-2">89</span>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 text-sm font-medium text-red-700 whitespace-nowrap">
                    Declined <span className="bg-white text-red-700 px-2 py-0.5 rounded-full text-xs ml-2">4</span>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-500 whitespace-nowrap">
                    Pending <span className="bg-white text-gray-400 px-2 py-0.5 rounded-full text-xs ml-2">63</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RSVP Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dietary Req.</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Edit</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {guests.map((guest) => (
                                <tr key={guest.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 font-bold">
                                                    {guest.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{guest.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{guest.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${guest.rsvp === 'Attending' ? 'bg-green-100 text-green-800' :
                                                guest.rsvp === 'Declined' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {guest.rsvp}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {guest.diet}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm ${guest.table === 'Unassigned' ? 'text-gray-400 italic' : 'text-gray-900'}`}>
                                            {guest.table}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900">
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
