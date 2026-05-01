'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { PrintReportButton } from '../../components/ProjectModals';
import { PrintBreakTrigger } from '../../components/PrintBreakTrigger';
import { usePrint } from '../../components/PrintContext';

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
                .eq('project_id', projectId)
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
        <div className="flex flex-col flex-1 animate-in fade-in duration-700">
            {/* ── Page Header + Action Bar ── */}
            <div className="print:hidden flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div className="flex flex-col">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0056B3] mb-2">Participant Hub</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-none font-['Urbanist']">
                        Guest Registry
                    </h1>
                </div>

                {/* Action Hub */}
                <div className="flex flex-wrap items-center gap-3">
                    <PrintReportButton title="Guest List" />
                    <a 
                        href={`/apps/ticketing/registration?project_id=${projectId}`} 
                        target="_blank" 
                        className="h-11 px-8 rounded-xl bg-white text-black font-black text-[10px] tracking-widest uppercase hover:bg-zinc-200 transition-all flex items-center gap-2.5 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                        <i className="fa-solid fa-link text-[10px]" /> Registration Link
                    </a>
                </div>
            </div>

            {/* ── Guest List ── */}
            <div className="flex flex-col gap-8">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 px-2">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Verified Attendees</h2>
                    <span className="text-[9px] font-black bg-white/5 text-zinc-600 px-3 py-1 rounded-full border border-white/5 font-mono">
                        {attendees.length}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {loading ? (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-30">
                            <i className="fa-solid fa-spinner fa-spin text-4xl mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Registry...</p>
                        </div>
                    ) : attendees.length === 0 ? (
                        <div className="col-span-full py-32 border border-dashed border-white/5 rounded-[32px] bg-white/[0.02] flex flex-col items-center justify-center opacity-30">
                            <i className="fa-solid fa-users-slash text-4xl mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No participants detected</p>
                        </div>
                    ) : (
                        attendees.map((guest) => (
                            <React.Fragment key={guest.id}>
                                <div className={`bg-white/[0.03] border border-white/5 p-8 rounded-[32px] flex flex-col hover:border-[#0056B3]/40 transition-all group relative overflow-hidden print:bg-white print:border-zinc-200 print:text-black ${pageBreakIds.includes(guest.id) ? 'print:break-before-page pt-8' : ''}`}>
                                    {/* Status Badge */}
                                    <div className="mb-6 flex justify-between items-start">
                                        <div className={`w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-lg ${guest.checked_in ? 'text-emerald-500' : 'text-[#0056B3]'} group-hover:scale-110 transition-transform`}>
                                            <i className={`fa-solid ${guest.checked_in ? 'fa-user-check' : 'fa-user'}`} />
                                        </div>
                                        <span className={`text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border ${
                                            guest.checked_in 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : 'bg-white/5 text-zinc-500 border-white/10'
                                        }`}>
                                            {guest.checked_in ? 'Checked In' : 'Registered'}
                                        </span>
                                    </div>

                                    {/* Identity */}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none mb-3 font-['Urbanist'] group-hover:text-[#4da3ff] transition-colors">
                                            {guest.name}
                                        </h3>
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">
                                            {guest.phone || 'No Contact'}
                                        </p>
                                        
                                        <div className="bg-black/20 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-1">Access Code</span>
                                                <span className="text-xs font-mono font-black text-[#4da3ff] tracking-widest">
                                                    {guest.ticket_code}
                                                </span>
                                            </div>
                                            <i className="fa-solid fa-qrcode text-zinc-800 text-xl" />
                                        </div>
                                    </div>

                                    {/* Action Hub */}
                                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-2">
                                        <button onClick={() => handleDelete(guest.id)} className="w-10 h-10 rounded-xl bg-red-500/5 text-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center print:hidden">
                                            <i className="fa-solid fa-trash-can text-sm" />
                                        </button>
                                    </div>
                                </div>
                                <div className="print:hidden">
                                    <PrintBreakTrigger id={guest.id} />
                                </div>
                            </React.Fragment>
                        ))
                    )}
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4 portrait; margin: 15mm; }
                    html, body, main { background: white !important; color: black !important; }
                    .print\\:hidden, nav, header, footer, button { display: none !important; }
                    .bg-white\\/\\[0\\.03\\], .bg-white\\/\\[0\\.02\\] { background: transparent !important; border: 1px solid #eee !important; border-radius: 12px !important; }
                    .text-white, .text-zinc-600 { color: black !important; }
                }
            `}</style>
        </div>
    );
}
