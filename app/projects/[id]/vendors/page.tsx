
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { AddVendorButton, DeleteVendorButton } from '../../components/ProjectModals';

export default async function VendorsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('project_id', id)
        .order('name', { ascending: true });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Vendor Management</h1>
                    <p className="text-zinc-400">Track contracts and contact details.</p>
                </div>
                <AddVendorButton projectId={id} />
            </div>

            {error && <div className="text-red-500">Error: {error.message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors?.map((vendor) => (
                    <div key={vendor.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-amber-500/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-4 right-4">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${vendor.status === 'confirmed' ? 'bg-green-900/20 text-green-500 border-green-500/30' :
                                vendor.status === 'contacted' ? 'bg-blue-900/20 text-blue-500 border-blue-500/30' :
                                    'bg-zinc-800 text-zinc-500 border-zinc-700'
                                }`}>
                                {vendor.status}
                            </span>
                        </div>

                        <DeleteVendorButton id={vendor.id} projectId={id} />

                        <div className="mb-4">
                            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-amber-500 text-xl border border-zinc-700 mb-4 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-store"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">{vendor.name}</h3>
                            <p className="text-sm text-zinc-400 uppercase tracking-wide font-mono mt-1">{vendor.category}</p>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-zinc-800">
                            {vendor.contact_person && (
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                    <i className="fa-regular fa-user w-4 text-center"></i>
                                    <span>{vendor.contact_person}</span>
                                </div>
                            )}
                            {vendor.phone && (
                                <div className="flex items-center justify-between gap-2 text-sm text-zinc-400">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-phone w-4 text-center"></i>
                                        <span>{vendor.phone}</span>
                                    </div>
                                    <a href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}`} target="_blank" className="text-green-500 hover:text-green-400">
                                        <i className="fa-brands fa-whatsapp text-lg"></i>
                                    </a>
                                </div>
                            )}
                            {vendor.email && (
                                <div className="flex items-center justify-between gap-2 text-sm text-zinc-400">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-envelope w-4 text-center"></i>
                                        <span>{vendor.email}</span>
                                    </div>
                                    <a href={`mailto:${vendor.email}`} className="text-blue-500 hover:text-blue-400">
                                        <i className="fa-solid fa-paper-plane"></i>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {(!vendors || vendors.length === 0) && (
                    <div className="col-span-full py-12 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl">
                        No vendors added yet.
                    </div>
                )}
            </div>
        </div>
    );
}
