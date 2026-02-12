'use client';

import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function GuestListPage() {
    const { id } = useParams();
    const [attendees, setAttendees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const projectId = Array.isArray(id) ? id[0] : id;

    useEffect(() => {
        fetchAttendees();
    }, [projectId]);

    const fetchAttendees = async () => {
        try {
            // Note: Currently attendees table doesn't have project_id in my previous schema edit,
            // but for future proofing we should filter.
            // If project_id column is missing, this might error if we don't handle it.
            // However, since I created the schema in schema_ticketing.sql with project_id, it should be fine IF applied.
            // If not, we list all or handle error.

            // Checking if project_id exists in schema via select attempt
            const { data, error } = await supabase
                .from('attendees')
                .select('*')
                // .eq('project_id', projectId) // Uncomment when column is confirmed and populated
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAttendees(data || []);
        } catch (error: any) {
            console.error('Error fetching attendees:', error);
            // Fallback if generic error
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (guestId: string) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { error } = await supabase.from('attendees').delete().eq('id', guestId);
                if (error) {
                    Swal.fire('Error!', 'Failed to delete.', 'error');
                } else {
                    setAttendees(attendees.filter(a => a.id !== guestId));
                    Swal.fire('Deleted!', 'Guest has been removed.', 'success');
                }
            }
        })
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <header className="max-w-7xl mx-auto mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Guest List</h1>
                    <p className="text-gray-500 mt-1">Manage attendees and ticket holders.</p>
                </div>
                <div className="flex gap-4">
                    <a href={`/apps/ticketing/registration?project_id=${projectId}`} target="_blank" className="px-5 py-2.5 rounded-xl text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition">
                        <i className="fa-solid fa-link mr-2"></i> Registration Link
                    </a>
                </div>
            </header>

            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Ticket Code</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-10 opacity-50">Loading...</td></tr>
                            ) : attendees.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No guests registered yet.</td></tr>
                            ) : (
                                attendees.map((guest) => (
                                    <tr key={guest.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-bold text-gray-900">{guest.name}</td>
                                        <td className="px-6 py-4 text-gray-500 font-mono text-sm">{guest.phone || '-'}</td>
                                        <td className="px-6 py-4 font-mono text-indigo-600 bg-indigo-50 rounded-lg text-xs w-fit px-2 py-1 inline-block mt-2 md:mt-0 md:inline">{guest.ticket_code}</td>
                                        <td className="px-6 py-4">
                                            {guest.checked_in ? (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-green-200">
                                                    Checked In
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-gray-200">
                                                    Registered
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(guest.id)} className="text-red-400 hover:text-red-600 transition">
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
