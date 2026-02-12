'use client';

import { useState } from 'react';

type Guest = {
    id: number;
    name: string;
    email: string;
    rsvp: 'Attending' | 'Declined' | 'Pending';
    diet: string;
    table: string;
    avatarColor?: string;
};

export default function GuestsPage() {
    const [guests, setGuests] = useState<Guest[]>([
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', rsvp: 'Attending', diet: 'Vegan', table: 'Unassigned', avatarColor: 'from-pink-100 to-rose-100 text-pink-600' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', rsvp: 'Attending', diet: 'None', table: 'Table 1', avatarColor: 'from-blue-100 to-cyan-100 text-blue-600' },
        { id: 3, name: 'Charlie Davis', email: 'charlie@example.com', rsvp: 'Declined', diet: '-', table: '-', avatarColor: 'from-purple-100 to-indigo-100 text-purple-600' },
        { id: 4, name: 'Diana Evans', email: 'diana@example.com', rsvp: 'Pending', diet: '-', table: 'Unassigned', avatarColor: 'from-yellow-100 to-orange-100 text-orange-600' },
        { id: 5, name: 'Ethan Hunt', email: 'ethan@imf.org', rsvp: 'Attending', diet: 'Gluten Free', table: 'Table 2', avatarColor: 'from-green-100 to-emerald-100 text-green-600' },
    ]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newGuest, setNewGuest] = useState({ name: '', email: '' });

    // Filter guests
    const filteredGuests = guests.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddGuest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGuest.name) return;

        const colors = [
            'from-pink-100 to-rose-100 text-pink-600',
            'from-blue-100 to-cyan-100 text-blue-600',
            'from-purple-100 to-indigo-100 text-purple-600',
            'from-green-100 to-emerald-100 text-green-600',
            'from-yellow-100 to-orange-100 text-orange-600',
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const guest: Guest = {
            id: Date.now(),
            name: newGuest.name,
            email: newGuest.email || '-',
            rsvp: 'Pending',
            diet: '-',
            table: 'Unassigned',
            avatarColor: randomColor
        };

        setGuests([...guests, guest]);
        setNewGuest({ name: '', email: '' });
        setIsModalOpen(false);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Are you sure you want to remove this guest?')) {
            setGuests(guests.filter(g => g.id !== id));
        }
    };

    return (
        <div className="max-w-6xl mx-auto relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Guest List</h1>
                    <p className="text-gray-500">Manage your invites and track RSVPs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Search guests..."
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-white hover:border-gray-300 transition bg-white">
                        <i className="fa-solid fa-file-export text-gray-400"></i> Export
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-pink-600 rounded-lg text-sm font-bold text-white hover:bg-pink-700 shadow-lg shadow-pink-200 transition"
                    >
                        <i className="fa-solid fa-plus"></i> Add Guest
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-4">
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium whitespace-nowrap">
                    All Guests <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs ml-2">{guests.length}</span>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 text-sm font-medium text-green-700 whitespace-nowrap">
                    Attending <span className="bg-white text-green-700 px-2 py-0.5 rounded-full text-xs ml-2">{guests.filter(g => g.rsvp === 'Attending').length}</span>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 text-sm font-medium text-red-700 whitespace-nowrap">
                    Declined <span className="bg-white text-red-700 px-2 py-0.5 rounded-full text-xs ml-2">{guests.filter(g => g.rsvp === 'Declined').length}</span>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-500 whitespace-nowrap">
                    Pending <span className="bg-white text-gray-400 px-2 py-0.5 rounded-full text-xs ml-2">{guests.filter(g => g.rsvp === 'Pending').length}</span>
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
                            {filteredGuests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                        No guests found. Try adding one!
                                    </td>
                                </tr>
                            ) : filteredGuests.map((guest) => (
                                <tr key={guest.id} className="hover:bg-gray-50 transition group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${guest.avatarColor || 'from-gray-100 to-slate-200 text-gray-600'} flex items-center justify-center font-bold text-sm`}>
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
                                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button onClick={() => handleDelete(guest.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition">
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Guest Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Add New Guest</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form onSubmit={handleAddGuest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                                    placeholder="e.g. John Doe"
                                    value={newGuest.name}
                                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition"
                                    placeholder="e.g. john@example.com"
                                    value={newGuest.email}
                                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 shadow-md shadow-pink-200"
                                >
                                    Add Guest
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
