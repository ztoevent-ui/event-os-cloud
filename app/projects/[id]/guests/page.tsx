'use client';
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function GuestListPage() {
    const { id } = useParams();
    const [attendees, setAttendees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const { pageBreakIds } = usePrint();
    const projectId = Array.isArray(id) ? id[0] : id;

    useEffect(() => {
        fetchProjectData();
        fetchAttendees();
    }, [projectId]);

    const fetchProjectData = async () => {
        const { data } = await supabase.from('projects').select('type').eq('id', projectId).single();
        setProject(data);
    };

    const isWedding = project?.type === 'wedding' || project?.type === 'wedding_fair';
    const theme = isWedding ? {
        primary: 'text-pink-500',
        bg: 'bg-pink-500',
        hover: 'hover:bg-pink-400',
        border: 'border-pink-500/30',
        accentBg: 'bg-pink-500/10',
        accentText: 'text-pink-500',
        accentBorder: 'border-pink-500/20'
    } : {
        primary: 'text-[#0056B3]',
        bg: 'bg-[#0056B3]',
        hover: 'hover:bg-[#0056B3]',
        border: 'border-white/10',
        accentBg: 'bg-[#0056B3]/10',
        accentText: 'text-[#0056B3]',
        accentBorder: 'border-[#0056B3]/30'
    };

    const fetchAttendees = async () => {
        try {
            const { data, error } = await supabase
                .from('attendees')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAttendees(data || []);
        } catch (error: any) {
            console.error('Error fetching attendees:', error);
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className={`bg-zinc-900 border ${theme.border} p-6 rounded-2xl shadow-sm flex justify-between items-center`}>
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight">Guest List</h1>
                    <p className="text-zinc-400 font-medium">Manage attendees and ticket holders.</p>
                </div>
                <div className="flex gap-4">
                    <PrintReportButton title="Guest List" />
                    <a 
                        href={`/apps/ticketing/registration?project_id=${projectId}`} 
                        target="_blank" 
                        className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider ${theme.bg} text-black ${theme.hover} transition shadow-lg print:hidden`}
                    >
                        <i className="fa-solid fa-link mr-2"></i> Registration Link
                    </a>
                </div>
            </header>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-zinc-900/50 text-zinc-500 font-black text-[10px] uppercase tracking-widest border-b border-zinc-800">
                        <tr>
                            <th className="px-8 py-5">Name</th>
                            <th className="px-8 py-5">Phone</th>
                            <th className="px-8 py-5">Ticket</th>
                            <th className="px-8 py-5">Status</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-12 opacity-50 text-zinc-500 italic">Gathering guest data...</td></tr>
                        ) : attendees.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-zinc-500 italic">No guests registered yet.</td></tr>
                        ) : (
                            attendees.map((guest) => (
                                <React.Fragment key={guest.id}>
                                    <tr className={`hover:bg-white/5 transition group ${pageBreakIds.includes(guest.id) ? 'print:break-before-page' : ''}`}>
                                        <td className="px-8 py-5 font-bold text-white group-hover:text-zinc-200 print:text-black">{guest.name}</td>
                                        <td className="px-8 py-5 text-zinc-500 font-mono text-xs print:text-black">{guest.phone || '-'}</td>
                                        <td className="px-8 py-5">
                                            <span className={`font-mono ${theme.accentText} ${theme.accentBg} ${theme.accentBorder} border rounded-lg text-xs px-2.5 py-1.5 font-bold print:text-black print:bg-white print:border-zinc-200`}>
                                                {guest.ticket_code}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            {guest.checked_in ? (
                                                <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 print:text-black print:border-zinc-200">
                                                    Checked In
                                                </span>
                                            ) : (
                                                <span className="bg-zinc-800 text-zinc-500 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-700 print:text-black print:border-zinc-200">
                                                    Registered
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-right print:hidden">
                                            <button onClick={() => handleDelete(guest.id)} className="text-zinc-600 hover:text-red-500 transition-colors p-2">
                                                <i className="fa-solid fa-trash text-sm"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr className="print:hidden">
                                        <td colSpan={5} className="p-0">
                                            <PrintBreakTrigger id={guest.id} />
                                        </td>
                                    </tr>
                                </React.Fragment>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <style jsx global>{`
                @media print {
                    @page { margin: 15mm; }
                    html, body, main {
                        background: white !important;
                        color: black !important;
                    }
                    .print\\:hidden, nav, header, footer, button {
                        display: none !important;
                    }
                    .bg-zinc-900, .bg-zinc-800 {
                        background: transparent !important;
                        color: black !important;
                        border-color: #eee !important;
                    }
                    .text-white, .text-zinc-400, .text-zinc-500 {
                        color: black !important;
                    }
                    .print\\:break-before-page {
                        break-before: page !important;
                    }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #eee !important; padding: 8px !important; color: black !important; font-size: 10pt !important; }
                    thead { display: table-header-group !important; }
                }
            `}</style>
        </div>
    );
}
