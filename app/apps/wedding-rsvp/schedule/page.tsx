'use client';

import { useState, useEffect } from 'react';

export default function SchedulePage() {
    const [activeTab, setActiveTab] = useState<'contacts' | 'itinerary' | 'reception'>('itinerary');
    const [isSaving, setIsSaving] = useState(false);

    // Mock Data States
    const [contacts, setContacts] = useState([
        { id: 1, role: 'Wedding Butler', name: 'TONY WONG WUI KUOK', phone: '105029356', email: 'cldyktirly@gmail.com', desc: '新人总代理, 和所有厂商接洽' },
        { id: 2, role: 'Trainee Butler', name: 'Connie Wong', phone: '-', email: '-', desc: '和所有活动/节目表演者沟通' },
        { id: 3, role: 'EMCEE', name: 'Fredz', phone: '017-863 5556', email: '-', desc: '主持' },
        { id: 4, role: 'Make Up Artist', name: 'Alison', phone: '016-883 6232', email: '-', desc: 'Ensuring bride looks best' },
        { id: 5, role: 'AV Room Controller', name: 'Promenade Hotel IT Team', phone: '-', email: '-', desc: 'Sound and Visual Control' },
        { id: 6, role: 'Photographer', name: 'Hedges & Walter', phone: '-', email: '-', desc: 'Shooting' },
        { id: 7, role: 'Decorator', name: 'Unforgettable EP', phone: '-', email: '-', desc: 'Backdrop & Hall Deco' },
        { id: 8, role: 'Flower', name: 'Sophia Creation', phone: '60129104262', email: '-', desc: 'Hand Bouquet & Corsage' },
    ]);

    const [itinerary, setItinerary] = useState([
        { id: 1, day: 'Fri', time: '12:00 PM', item: 'Pick Up Wedding Car For Deco', venue: 'Promenade Hotel', pic: 'Sophia Creation' },
        { id: 2, day: 'Fri', time: '12:00 PM', item: 'Wedding Reception Hall Deco', venue: 'Promenade Hotel', pic: 'UEP' },
        { id: 3, day: 'Fri', time: '3:00 PM', item: 'Tea Ceremony', venue: 'Annysia Home', pic: '-' },
        { id: 4, day: 'Fri', time: '5:30 PM', item: 'Wedding Car Deco', venue: 'Sophia Creation', pic: 'Sophia Creation' },
        { id: 5, day: 'Sat', time: '5:00 AM', item: 'MUA Arrived for Bride Makeup', venue: 'Promenade Hotel', pic: 'Room 636' },
        { id: 6, day: 'Sat', time: '7:00 AM', item: 'P&Videographer Arrived', venue: 'Promenade Hotel', pic: 'Calvin' },
        { id: 7, day: 'Sat', time: '8:35 AM', item: 'Depart to Church', venue: 'Promenade Hotel', pic: 'Wedding Butler' },
        { id: 8, day: 'Sat', time: '9:00 AM', item: 'Holy Matrimony', venue: 'St. Anthony Church', pic: 'Pastor Andy' },
    ]);

    const [reception, setReception] = useState([
        { id: 1, time: '1830-1900', course: 'No Course', activity: 'Guests To Be Seated', pic: '-', song: '-' },
        { id: 2, time: '1900-1910', course: 'No Course', activity: 'Groom & Bride Parents Marching In', pic: '-', song: 'Sape Instrumental' },
        { id: 3, time: '1910-1925', course: '-', activity: 'Grace before Meals', pic: '-', song: '-' },
        { id: 4, time: '1925-1930', course: '-', activity: 'Wakil Parent Speech', pic: 'Both side', song: '-' },
        { id: 5, time: '1945-1955', course: '3rd Course', activity: 'Family Group Photo', pic: '-', song: 'BGM looping' },
    ]);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            const btn = document.getElementById('save-indicator');
            if (btn) btn.innerText = 'Saved!';
            setTimeout(() => { if (btn) btn.innerText = 'Save Changes'; }, 2000);
        }, 800);
    };

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Butler Schedule</h1>
                    <p className="text-gray-500">Run sheets, contact lists, and event coordination.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        id="save-indicator"
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white shadow-lg transition flex items-center gap-2 ${isSaving ? 'bg-gray-400 cursor-wait' : 'bg-pink-600 hover:bg-pink-700 shadow-pink-200'
                            }`}
                    >
                        {isSaving ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-cloud-arrow-up"></i>}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        {(['contacts', 'itinerary', 'reception'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                {activeTab === 'contacts' && <ContactsView contacts={contacts} setContacts={setContacts} />}
                {activeTab === 'itinerary' && <ItineraryView itinerary={itinerary} setItinerary={setItinerary} />}
                {activeTab === 'reception' && <ReceptionView reception={reception} setReception={setReception} />}
            </div>
        </div>
    );
}

function ContactsView({ contacts, setContacts }: any) {
    const handleChange = (id: number, field: string, value: string) => {
        setContacts(contacts.map((c: any) => c.id === id ? { ...c, [field]: value } : c));
    };

    return (
        <div className="overflow-auto h-full">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="w-10"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((c: any) => (
                        <tr key={c.id} className="hover:bg-gray-50 group">
                            <td className="px-6 py-2">
                                <input className="w-full bg-transparent border-transparent focus:border-pink-300 focus:ring-0 font-bold text-gray-900 text-sm rounded transition hover:bg-gray-100 px-2 py-1" value={c.role} onChange={(e) => handleChange(c.id, 'role', e.target.value)} />
                            </td>
                            <td className="px-6 py-2">
                                <input className="w-full bg-transparent border-transparent focus:border-pink-300 focus:ring-0 text-gray-700 text-sm rounded transition hover:bg-gray-100 px-2 py-1" value={c.name} onChange={(e) => handleChange(c.id, 'name', e.target.value)} />
                            </td>
                            <td className="px-6 py-2">
                                <input className="w-full bg-transparent border-transparent focus:border-pink-300 focus:ring-0 text-gray-500 text-sm rounded transition hover:bg-gray-100 px-2 py-1" value={c.phone} onChange={(e) => handleChange(c.id, 'phone', e.target.value)} />
                            </td>
                            <td className="px-6 py-2">
                                <input className="w-full bg-transparent border-transparent focus:border-pink-300 focus:ring-0 text-gray-500 text-sm rounded transition hover:bg-gray-100 px-2 py-1" value={c.desc} onChange={(e) => handleChange(c.id, 'desc', e.target.value)} />
                            </td>
                            <td className="px-2 text-center">
                                <button className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition" onClick={() => setContacts(contacts.filter((x: any) => x.id !== c.id))}>
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={5} className="px-6 py-4 text-center border-t border-dashed border-gray-200">
                            <button onClick={() => setContacts([...contacts, { id: Date.now(), role: 'New Role', name: '', phone: '', desc: '' }])} className="text-sm text-pink-500 font-bold hover:text-pink-700 flex items-center justify-center gap-2 w-full">
                                <i className="fa-solid fa-plus"></i> Add Contact
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

function ItineraryView({ itinerary, setItinerary }: any) {
    const handleChange = (id: number, field: string, value: string) => {
        setItinerary(itinerary.map((i: any) => i.id === id ? { ...i, [field]: value } : i));
    };

    return (
        <div className="overflow-auto h-full p-6">
            <h3 className="font-bold text-gray-400 uppercase text-xs mb-4 flex justify-between items-center">
                <span>Timeline</span>
                <button onClick={() => setItinerary([...itinerary, { id: Date.now(), day: 'New', time: '00:00', item: 'New Activity', venue: '-', pic: '-' }])} className="text-pink-500 hover:text-pink-700">
                    <i className="fa-solid fa-plus"></i> Add Item
                </button>
            </h3>
            <div className="space-y-4">
                {itinerary.map((item: any) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition group">
                        <div className="w-24">
                            <input className="block w-full text-xs font-bold text-gray-400 mb-1 bg-transparent border-none p-0 focus:ring-0" value={item.day} onChange={(e) => handleChange(item.id, 'day', e.target.value)} />
                            <input className="block w-full text-lg font-black text-gray-900 bg-transparent border-none p-0 focus:ring-0" value={item.time} onChange={(e) => handleChange(item.id, 'time', e.target.value)} />
                        </div>
                        <div className="flex-1 border-l-2 border-gray-100 pl-4">
                            <input className="block w-full font-bold text-gray-900 mb-2 bg-transparent border-none p-0 focus:ring-0 text-lg" value={item.item} onChange={(e) => handleChange(item.id, 'item', e.target.value)} />
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    <i className="fa-solid fa-location-dot"></i>
                                    <input className="bg-transparent border-none p-0 focus:ring-0 w-32" value={item.venue} onChange={(e) => handleChange(item.id, 'venue', e.target.value)} />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                    <i className="fa-solid fa-user"></i>
                                    <input className="bg-transparent border-none p-0 focus:ring-0 w-32" value={item.pic} onChange={(e) => handleChange(item.id, 'pic', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <button className="self-center text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-4" onClick={() => setItinerary(itinerary.filter((x: any) => x.id !== item.id))}>
                            <i className="fa-solid fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReceptionView({ reception, setReception }: any) {
    const handleChange = (id: number, field: string, value: string) => {
        setReception(reception.map((r: any) => r.id === id ? { ...r, [field]: value } : r));
    };

    return (
        <div className="overflow-auto h-full">
            <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Course</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Activities</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">PIC</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Song/AV</th>
                        <th className="w-10 border-b"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {reception.map((p: any) => (
                        <tr key={p.id} className={`hover:bg-gray-50 group`}>
                            <td className="px-6 py-2 border-r border-gray-100">
                                <input className="w-full bg-transparent border-transparent text-sm font-bold text-gray-900 focus:ring-0" value={p.time} onChange={(e) => handleChange(p.id, 'time', e.target.value)} />
                            </td>
                            <td className="px-6 py-2 border-r border-gray-100">
                                <input className={`w-full bg-transparent border-transparent text-sm font-medium focus:ring-0 ${p.course === 'No Course' ? 'text-orange-500' : 'text-gray-900'}`} value={p.course} onChange={(e) => handleChange(p.id, 'course', e.target.value)} />
                            </td>
                            <td className="px-6 py-2 border-r border-gray-100">
                                <input className="w-full bg-transparent border-transparent text-sm text-gray-900 focus:ring-0" value={p.activity} onChange={(e) => handleChange(p.id, 'activity', e.target.value)} />
                            </td>
                            <td className="px-6 py-2 border-r border-gray-100">
                                <input className="w-full bg-transparent border-transparent text-sm text-gray-500 focus:ring-0" value={p.pic} onChange={(e) => handleChange(p.id, 'pic', e.target.value)} />
                            </td>
                            <td className="px-6 py-2">
                                <input className="w-full bg-transparent border-transparent text-sm text-gray-500 focus:ring-0" value={p.song} onChange={(e) => handleChange(p.id, 'song', e.target.value)} />
                            </td>
                            <td className="px-2 text-center">
                                <button className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition" onClick={() => setReception(reception.filter((x: any) => x.id !== p.id))}>
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={6} className="px-6 py-4 text-center border-t border-dashed border-gray-200">
                            <button onClick={() => setReception([...reception, { id: Date.now(), time: '00:00', course: '-', activity: 'New Activity', pic: '-', song: '-' }])} className="text-sm text-pink-500 font-bold hover:text-pink-700 flex items-center justify-center gap-2 w-full">
                                <i className="fa-solid fa-plus"></i> Add Program Item
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
