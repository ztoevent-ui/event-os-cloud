'use client';

import { useState } from 'react';

export default function SchedulePage() {
    const [activeTab, setActiveTab] = useState<'contacts' | 'itinerary' | 'reception'>('itinerary');

    return (
        <div className="max-w-7xl mx-auto h-full flex flex-col">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Butler Schedule</h1>
                    <p className="text-gray-500">Run sheets, contact lists, and event coordination.</p>
                </div>
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
            </header>

            <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                {activeTab === 'contacts' && <ContactsView />}
                {activeTab === 'itinerary' && <ItineraryView />}
                {activeTab === 'reception' && <ReceptionView />}
            </div>
        </div>
    );
}

function ContactsView() {
    const contacts = [
        { role: 'Wedding Butler', name: 'TONY WONG WUI KUOK', phone: '105029356', email: 'cldyktirly@gmail.com', desc: '新人总代理, 和所有厂商接洽' },
        { role: 'Trainee Butler', name: 'Connie Wong', phone: '-', email: '-', desc: '和所有活动/节目表演者沟通' },
        { role: 'EMCEE', name: 'Fredz', phone: '017-863 5556', email: '-', desc: '主持' },
        { role: 'Make Up Artist', name: 'Alison', phone: '016-883 6232', email: '-', desc: 'Ensuring bride looks best' },
        { role: 'AV Room Controller', name: 'Promenade Hotel IT Team', phone: '-', email: '-', desc: 'Sound and Visual Control' },
        { role: 'Photographer', name: 'Hedges & Walter', phone: '-', email: '-', desc: 'Shooting' },
        { role: 'Decorator', name: 'Unforgettable EP', phone: '-', email: '-', desc: 'Backdrop & Hall Deco' },
        { role: 'Flower', name: 'Sophia Creation', phone: '60129104262', email: '-', desc: 'Hand Bouquet & Corsage' },
    ];

    return (
        <div className="overflow-auto h-full">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {contacts.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{c.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.phone}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{c.desc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ItineraryView() {
    return (
        <div className="overflow-auto h-full p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Day 1 */}
                <div className="space-y-4">
                    <h3 className="font-black text-xl text-gray-900 border-b border-gray-200 pb-2">22nd August (FRI)</h3>
                    <div className="space-y-0">
                        {[
                            { time: '12:00 PM', item: 'Pick Up Wedding Car For Deco', venue: 'Promenade Hotel', pic: 'Sophia Creation' },
                            { time: '12:00 PM', item: 'Wedding Reception Hall Deco', venue: 'Promenade Hotel', pic: 'UEP' },
                            { time: '3:00 PM', item: 'Tea Ceremony', venue: 'Annysia Home', pic: '-' },
                            { time: '5:30 PM', item: 'Wedding Car Deco', venue: 'Sophia Creation', pic: 'Sophia Creation' },
                            { time: '6:15 PM', item: 'Deliver Wedding Car Back', venue: 'Promenade Hotel', pic: 'Sophia Creation' },
                            { time: '6:30 PM', item: 'Rest & Shower', venue: '-', pic: '-' },
                            { time: '8:00 PM', item: 'Wedding Reception Rehearsal', venue: 'Promenade Hotel', pic: 'Wedding Butler' },
                            { time: '8:30 PM', item: 'Video Test Run', venue: 'Promenade Hotel', pic: '-' },
                            { time: '8:45 PM', item: 'Music Test Run', venue: 'Promenade Hotel', pic: 'Wedding Butler' }
                        ].map((e, i) => (
                            <div key={i} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg transition border-l-2 border-transparent hover:border-blue-500">
                                <div className="w-20 font-bold text-gray-500 text-sm whitespace-nowrap">{e.time}</div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-900 text-sm">{e.item}</div>
                                    <div className="text-xs text-blue-600 mt-1 flex gap-2">
                                        <span><i className="fa-solid fa-location-dot"></i> {e.venue}</span>
                                        {e.pic !== '-' && <span><i className="fa-solid fa-user"></i> {e.pic}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day 2 */}
                <div className="space-y-4">
                    <h3 className="font-black text-xl text-gray-900 border-b border-gray-200 pb-2">23rd August (SAT)</h3>
                    <div className="space-y-0">
                        {[
                            { time: '5:00 AM', item: 'MUA Arrived for Bride Makeup', venue: 'Promenade Hotel', pic: 'Room 636' },
                            { time: '7:00 AM', item: 'P&Videographer Arrived', venue: 'Promenade Hotel', pic: 'Calvin' },
                            { time: '8:35 AM', item: 'Depart to Church', venue: 'Promenade Hotel', pic: 'Wedding Butler' },
                            { time: '9:00 AM', item: 'Holy Matrimony', venue: 'St. Anthony Church', pic: 'Pastor Andy' },
                            { time: '11:00 AM', item: 'Outdoor Shooting', venue: 'Outdoor', pic: 'Calvin & Hedges' },
                            { time: '12:30 PM', item: 'Rest & Shower', venue: 'Promenade Hotel', pic: '-' },
                            { time: '5:00 PM', item: 'All Staff Arrived', venue: '-', pic: '-' },
                            { time: '6:30 PM', item: 'Guest Arriving', venue: '-', pic: '-' },
                            { time: '7:00 PM', item: 'Wedding Reception', venue: '-', pic: '-' },
                            { time: '10:30 PM', item: 'End of Ceremony', venue: '-', pic: '-' },
                        ].map((e, i) => (
                            <div key={i} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg transition border-l-2 border-transparent hover:border-pink-500">
                                <div className="w-20 font-bold text-gray-500 text-sm whitespace-nowrap">{e.time}</div>
                                <div className="flex-1">
                                    <div className="font-bold text-gray-900 text-sm">{e.item}</div>
                                    <div className="text-xs text-pink-600 mt-1 flex gap-2">
                                        <span><i className="fa-solid fa-location-dot"></i> {e.venue}</span>
                                        {e.pic !== '-' && <span><i className="fa-solid fa-user"></i> {e.pic}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReceptionView() {
    const program = [
        { time: '1830-1900', course: 'No Course', activity: 'Guests To Be Seated', pic: '-', song: '-' },
        { time: '1900-1910', course: 'No Course', activity: 'Groom & Bride Parents Marching In', pic: '-', song: 'Sape Instrumental' },
        { time: '', course: 'No Course', activity: 'Groom & Bride 1st Marching', pic: '-', song: 'Sape Instrumental' },
        { time: '1910-1925', course: '-', activity: 'Grace before Meals', pic: '-', song: '-' },
        { time: '', course: '1st & 2nd', activity: 'Sape Solo Playing by Nash', pic: '-', song: '-' },
        { time: '1925-1930', course: '-', activity: 'Wakil Parent Speech', pic: 'Both side', song: '-' },
        { time: '1930-1945', course: 'No Course', activity: 'On Cue: Play Morning Holy Matrimony Video', pic: '-', song: '-' },
        { time: '1945-1955', course: '3rd Course', activity: 'Family Group Photo Approximate 20pax, 2 line', pic: '-', song: 'BGM looping' },
        { time: '', course: '-', activity: 'Toasting Ceremony', pic: '-', song: '-' },
        { time: '1955-2000', course: 'No Course', activity: 'On Cue: Play Pre Wedding Shooting Slide Show', pic: '-', song: '-' },
        { time: '', course: '4th Course', activity: 'NewlyWed Special Singing Session', pic: '-', song: 'Andmesh - Cinta Luar Biasa' },
        { time: '2000-2015', course: '5th Course', activity: 'Shoes Game', pic: 'EMCEE', song: '-' },
        { time: '', course: '6th Course', activity: 'Thanks Giving Sharing by Newlywed', pic: 'Newlywed', song: '-' },
        { time: '2005 onwards', course: '7th Course', activity: 'Open for Singing & Dancing', pic: '-', song: '-' },
    ];

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
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {program.map((p, i) => (
                        <tr key={i} className={`hover:bg-gray-50 ${p.course === 'No Course' ? 'bg-orange-50/30' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 border-r border-gray-100">{p.time}</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium border-r border-gray-100 ${p.course === 'No Course' ? 'text-orange-500' : 'text-gray-900'}`}>{p.course}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 border-r border-gray-100">{p.activity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">{p.pic}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.song}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
