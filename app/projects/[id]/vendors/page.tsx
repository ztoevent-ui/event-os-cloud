
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { AddVendorButton, VendorCard } from '../../components/ProjectModals';

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
                    <VendorCard key={vendor.id} vendor={vendor} projectId={id} />
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
