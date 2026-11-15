'use client';

import React, { useState, useMemo } from 'react';
import Swal from 'sweetalert2';
import { uploadICFile } from '@/app/actions/tournament-actions';
import { supabase } from '@/lib/supabaseClient';
import { DynamicPlayerFields } from './DynamicPlayerFields';

const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', 'Kids S', 'Kids M', 'Kids L', 'Kids XL'];
const DIETARY_OPTIONS = ['Standard / Halal', 'Vegetarian / 素食', 'No Beef / 不吃牛', 'No Seafood / 海鲜过敏', 'Other'];
const BLOOD_TYPES = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-', 'Unknown / 不确定'];

type Companion = {
    id: string;
    name: string;
    category: string;
    type: 'Adult' | 'Child';
    relationship: string;
    ic: string;
    gender: string;
    tshirt_size: string;
    dietary: string;
    bib_name?: string;
};

type FormProps = {
    projectId: string;
    config: any;
    onSuccess?: (summary?: any) => void;
};

// Extract numeric RM fee from category object (e.g. cat.fee = "RM 55" or "55" or inside cat.open_to)
function extractCategoryFee(cat: any): number {
    if (!cat) return 0;
    if (typeof cat.fee === 'number') return cat.fee;
    const raw = String(cat.fee || cat.price || cat.open_to || '');
    const match = raw.match(/(?:RM\s*)?(\d+(?:\.\d{1,2})?)/i);
    if (match && (cat.fee || /RM/i.test(raw))) {
        return parseFloat(match[1]);
    }
    return 0;
}

export function GeneralEventForm({ projectId, config, onSuccess }: FormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fieldsConfig = config.fields_config || {};
    const accent = config.theme_color || '#f59e0b';
    const categories: any[] = Array.isArray(config.categories) ? config.categories : [];

    // Primary Registrant State
    const [organizationName, setOrganizationName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(categories[0]?.name || '');
    const [registrant, setRegistrant] = useState<any>({
        name: '',
        bib_name: '',
        ic: '',
        role: '',
        phone: '',
        email: '',
        gender: '',
        blood_type: '',
        tshirt_size: '',
        dietary: 'Standard / Halal',
        remarks: '',
        icFile: null,
        receiptFile: null,
    });

    // Accompanying Family / Additional Runners
    const [companions, setCompanions] = useState<Companion[]>([]);

    const addCompanion = () => {
        setCompanions(prev => [
            ...prev,
            {
                id: `G${Date.now()}_${prev.length + 1}`,
                name: '',
                category: selectedCategory || categories[0]?.name || '',
                type: 'Adult',
                relationship: fieldsConfig.enable_run_module ? 'Runner / Teammate' : 'Family / Guest',
                ic: '',
                gender: '',
                tshirt_size: '',
                dietary: 'Standard / Halal',
                bib_name: '',
            }
        ]);
    };

    const updateCompanion = (id: string, field: keyof Companion, value: string) => {
        setCompanions(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const removeCompanion = (id: string) => {
        setCompanions(prev => prev.filter(c => c.id !== id));
    };

    // Fee calculation across primary registrant + companions
    const feeBreakdown = useMemo(() => {
        const primaryCatObj = categories.find(c => c.name === selectedCategory);
        const primaryFee = extractCategoryFee(primaryCatObj);
        const items: { label: string; category: string; amount: number }[] = [
            {
                label: registrant.name.trim() || 'Primary Participant',
                category: selectedCategory || 'General',
                amount: primaryFee,
            },
        ];

        companions.forEach((c, idx) => {
            const catName = c.category || selectedCategory;
            const catObj = categories.find(cat => cat.name === catName);
            const fee = extractCategoryFee(catObj);
            items.push({
                label: c.name.trim() || `Participant #${idx + 2}`,
                category: catName || c.type,
                amount: fee,
            });
        });

        const total = items.reduce((sum, i) => sum + i.amount, 0);
        return { items, total };
    }, [categories, selectedCategory, registrant.name, companions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!registrant.name.trim()) {
            return Swal.fire('Incomplete', 'Please enter your Full Name / 请填写姓名.', 'warning');
        }
        if (fieldsConfig.show_team_name && !organizationName.trim()) {
            return Swal.fire('Incomplete', 'Please enter Organization / Department / Running Club Name.', 'warning');
        }
        if (fieldsConfig.show_category_select && categories.length > 0 && !selectedCategory) {
            return Swal.fire('Incomplete', 'Please select a Category / Package.', 'warning');
        }
        if (fieldsConfig.show_phone && !registrant.phone.trim()) {
            return Swal.fire('Incomplete', 'Please enter your Phone / WhatsApp Number.', 'warning');
        }
        if (fieldsConfig.show_ic_passport && !registrant.ic.trim()) {
            return Swal.fire('Incomplete', 'Please enter your IC / Passport Number.', 'warning');
        }
        if (fieldsConfig.require_ic_upload && !registrant.icFile) {
            return Swal.fire('Incomplete', 'Please upload your IC / Passport photo.', 'warning');
        }
        if (fieldsConfig.show_payment_receipt && feeBreakdown.total > 0 && !registrant.receiptFile) {
            return Swal.fire('Incomplete', 'Please upload your payment receipt / slip.', 'warning');
        }
        if (fieldsConfig.show_tshirt_size && !registrant.tshirt_size) {
            return Swal.fire('Incomplete', 'Please select your Running Jersey / T-Shirt Size.', 'warning');
        }

        const incompleteCompanion = companions.some(c => !c.name.trim());
        if (incompleteCompanion) {
            return Swal.fire('Incomplete', 'Please enter the name for all accompanying participants, or remove empty rows.', 'warning');
        }

        setIsSubmitting(true);
        Swal.fire({ title: 'Submitting Registration...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            let icUrl: string | null = null;
            if (registrant.icFile) {
                const fd = new FormData();
                fd.append('file', registrant.icFile);
                fd.append('project_id', projectId);
                const res = await uploadICFile(fd);
                if (!res.success) throw new Error(res.error || 'IC photo upload failed');
                icUrl = res.url || null;
            }

            let receiptUrl: string | null = null;
            if (registrant.receiptFile) {
                const fd = new FormData();
                fd.append('file', registrant.receiptFile);
                fd.append('project_id', projectId);
                const res = await uploadICFile(fd);
                if (!res.success) throw new Error(res.error || 'Payment receipt upload failed');
                receiptUrl = res.url || null;
            }

            const defaultBib = (registrant.bib_name || registrant.name.trim().split(' ')[0] || 'RUNNER')
                .toUpperCase()
                .slice(0, 10);

            // Build players array: Primary Registrant + any companions
            const allParticipants = [
                {
                    player_id: 'PRIMARY',
                    name: registrant.name.trim(),
                    bib_name: fieldsConfig.show_bib_name ? defaultBib : null,
                    category: selectedCategory || 'Primary Registrant',
                    type: 'Primary',
                    ic: registrant.ic || null,
                    ic_url: icUrl,
                    phone: registrant.phone || null,
                    email: registrant.email || null,
                    gender: registrant.gender || null,
                    blood_type: fieldsConfig.show_blood_type ? (registrant.blood_type || null) : null,
                    tshirt_size: registrant.tshirt_size || null,
                    dietary: fieldsConfig.show_dietary ? registrant.dietary : null,
                    fee_rm: feeBreakdown.items[0]?.amount || 0,
                },
                ...companions.map((c, idx) => ({
                    player_id: `GUEST_${idx + 1}`,
                    name: c.name.trim(),
                    bib_name: c.bib_name ? c.bib_name.toUpperCase().slice(0, 10) : null,
                    category: c.category || `${c.type} (${c.relationship || 'Guest'})`,
                    type: c.type,
                    relationship: c.relationship,
                    ic: c.ic || null,
                    gender: c.gender || null,
                    tshirt_size: c.tshirt_size || null,
                    dietary: fieldsConfig.show_dietary ? c.dietary : null,
                    fee_rm: feeBreakdown.items[idx + 1]?.amount || 0,
                }))
            ];

            const orgDisplay = organizationName.trim()
                || selectedCategory
                || (companions.length > 0 ? `Group (${allParticipants.length} Pax)` : 'Individual Registration');

            const { error } = await supabase.from('tournament_registrations').insert({
                project_id: projectId,
                organization_name: orgDisplay,
                team_name: selectedCategory || null,
                captain_name: registrant.name.trim(),
                captain_ic: registrant.ic || null,
                captain_role: registrant.role || (fieldsConfig.show_bib_name ? `BIB: ${defaultBib}` : null),
                captain_ic_url: icUrl || receiptUrl,
                captain_gender: registrant.gender || null,
                captain_phone: registrant.phone || null,
                captain_email: registrant.email || null,
                captain_details: {
                    template: 'general_event',
                    category: selectedCategory || null,
                    bib_name: fieldsConfig.show_bib_name ? defaultBib : null,
                    blood_type: fieldsConfig.show_blood_type ? (registrant.blood_type || null) : null,
                    staff_id: registrant.role || null,
                    tshirt_size: registrant.tshirt_size || null,
                    dietary: fieldsConfig.show_dietary ? registrant.dietary : null,
                    remarks: registrant.remarks || null,
                    payment_receipt_url: receiptUrl,
                    total_pax: allParticipants.length,
                    total_fee_rm: feeBreakdown.total,
                    medical_conditions: registrant.medical_conditions || [],
                    work_school: registrant.work_school || null,
                    city: registrant.city || null,
                    state: registrant.state || null,
                    emergency_contact: {
                        name: registrant.emergency_contact_name || null,
                        phone: registrant.emergency_contact_phone || null,
                        relationship: registrant.emergency_contact_relationship || null,
                    }
                },
                players: allParticipants,
            });

            if (error) throw error;

            Swal.close();
            if (onSuccess) {
                onSuccess({
                    name: registrant.name.trim(),
                    bibName: fieldsConfig.show_bib_name ? defaultBib : null,
                    organization: orgDisplay,
                    category: selectedCategory,
                    tshirtSize: registrant.tshirt_size,
                    totalPax: allParticipants.length,
                    totalFee: feeBreakdown.total,
                });
            }
        } catch (err: any) {
            Swal.fire({ icon: 'error', title: 'Submission Failed', text: err.message, background: '#18181b', color: '#fff' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const secondaryFieldsConfig = {
        ...fieldsConfig,
        show_ic_passport: false,
        show_phone: false,
        show_email: false,
        requires_gender: false,
    };

    const hasSecondaryDynamicFields = Boolean(
        secondaryFieldsConfig.show_dupr ||
        secondaryFieldsConfig.show_work_school ||
        secondaryFieldsConfig.show_city_state ||
        secondaryFieldsConfig.show_medical ||
        secondaryFieldsConfig.show_emergency_contact
    );

    const previewBibText = (registrant.bib_name || registrant.name.trim().split(' ')[0] || 'RUNNER NAME')
        .toUpperCase()
        .slice(0, 12);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Card 1: Category / Distance Selection (if enabled) ── */}
            {(fieldsConfig.show_category_select || categories.length > 0) && (
                <div className="bg-zinc-900/95 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-800">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ backgroundColor: `${accent}20`, color: accent }}>
                            <i className={`fa-solid ${fieldsConfig.enable_run_module ? 'fa-person-running' : 'fa-layer-group'}`} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white uppercase tracking-wider">
                                {fieldsConfig.enable_run_module ? 'Select Race Distance & Category' : 'Select Category / Package'}
                            </h2>
                            <p className="text-xs text-zinc-500">选择参赛组别与距离</p>
                        </div>
                    </div>

                    {categories.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3.5">
                            {categories.map((cat: any, i: number) => {
                                const isSelected = selectedCategory === cat.name;
                                const feeVal = extractCategoryFee(cat);
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.name)}
                                        className={`p-5 rounded-2xl border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                                            isSelected
                                                ? 'bg-white/10 border-white shadow-lg'
                                                : 'bg-black/40 border-zinc-800 hover:border-zinc-700'
                                        }`}
                                        style={isSelected ? { borderColor: accent, backgroundColor: `${accent}14` } : undefined}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-black text-white text-base uppercase">{cat.name}</span>
                                                {cat.open_to && (
                                                    <span
                                                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border"
                                                        style={{ color: accent, borderColor: `${accent}40`, backgroundColor: `${accent}15` }}
                                                    >
                                                        {cat.open_to}
                                                    </span>
                                                )}
                                            </div>
                                            {cat.description && (
                                                <div className="text-xs text-zinc-400 leading-relaxed">{cat.description}</div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-zinc-800 pt-2 sm:pt-0">
                                            {(cat.fee || feeVal > 0) && (
                                                <div className="text-left sm:text-right">
                                                    <div className="text-[9px] font-bold uppercase text-zinc-500">Entry Fee</div>
                                                    <div className="text-lg font-black text-white" style={isSelected ? { color: accent } : undefined}>
                                                        {cat.fee || `RM ${feeVal}`}
                                                    </div>
                                                </div>
                                            )}
                                            <div
                                                className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                                                    isSelected ? 'border-transparent text-black' : 'border-zinc-700'
                                                }`}
                                                style={isSelected ? { backgroundColor: accent } : undefined}
                                            >
                                                {isSelected && <i className="fa-solid fa-check text-xs" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            placeholder="Enter Category / Ticket Type (Optional)"
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                        />
                    )}
                </div>
            )}

            {/* ── Card 2: Primary Participant / Runner Details ── */}
            <div className="bg-zinc-900/95 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ backgroundColor: `${accent}20`, color: accent }}>
                        <i className="fa-solid fa-user" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-wider">
                            {fieldsConfig.enable_run_module ? 'Runner Details & BIB Personalization' : 'Participant Information'}
                        </h2>
                        <p className="text-xs text-zinc-500">参赛者 / 报名人基本资料</p>
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Organization / Running Club & Staff ID */}
                    {(fieldsConfig.show_team_name || fieldsConfig.show_staff_id) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {fieldsConfig.show_team_name && (
                                <div className={fieldsConfig.show_staff_id ? '' : 'md:col-span-2'}>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                        {fieldsConfig.enable_run_module
                                            ? 'Running Club / Company / Team Name *'
                                            : 'Company / Department / Organization *'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={organizationName}
                                        onChange={e => setOrganizationName(e.target.value)}
                                        placeholder={
                                            fieldsConfig.enable_run_module
                                                ? 'e.g. Bintulu Runners Club / Individual / Petronas MLNG'
                                                : 'e.g. BIF Operations / Department / Club Name'
                                        }
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                    />
                                </div>
                            )}
                            {fieldsConfig.show_staff_id && (
                                <div className={fieldsConfig.show_team_name ? '' : 'md:col-span-2'}>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                        Staff ID / Designation (工号 / 职位)
                                    </label>
                                    <input
                                        type="text"
                                        value={registrant.role}
                                        onChange={e => setRegistrant({ ...registrant, role: e.target.value })}
                                        placeholder="e.g. EMP-1024 / Engineer"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Full Name & IC */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className={fieldsConfig.show_ic_passport ? '' : 'md:col-span-2'}>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                Full Name (as per IC / Passport) *
                            </label>
                            <input
                                type="text"
                                required
                                value={registrant.name}
                                onChange={e => setRegistrant({ ...registrant, name: e.target.value })}
                                placeholder="Enter Full Name / 姓名"
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                            />
                        </div>

                        {fieldsConfig.show_ic_passport && (
                            <div>
                                <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                    IC / Passport Number *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={registrant.ic}
                                    onChange={e => setRegistrant({ ...registrant, ic: e.target.value })}
                                    placeholder="e.g. 950101-13-5050"
                                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    {/* Custom Race BIB Name + Live Digital Race BIB Preview */}
                    {fieldsConfig.show_bib_name && (
                        <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                            <div>
                                <label className="block text-xs font-black tracking-widest uppercase text-zinc-300 mb-1.5">
                                    Custom Race BIB Name (号码布专属印名)
                                </label>
                                <p className="text-[11px] text-zinc-500 mb-3">
                                    Max 10 uppercase characters printed on your front Race BIB.
                                </p>
                                <input
                                    type="text"
                                    maxLength={10}
                                    value={registrant.bib_name}
                                    onChange={e => setRegistrant({ ...registrant, bib_name: e.target.value.toUpperCase() })}
                                    placeholder="e.g. JASON / AHMAD / LING"
                                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white font-black uppercase tracking-widest text-sm outline-none"
                                />
                            </div>

                            {/* Live Race BIB Visual Preview */}
                            <div className="bg-gradient-to-br from-zinc-900 to-black border-2 rounded-2xl p-4 text-center relative overflow-hidden shadow-lg" style={{ borderColor: accent }}>
                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest pb-1.5 mb-2 border-b border-zinc-800" style={{ color: accent }}>
                                    <span>BINTULU 2027 OFFICIAL BIB</span>
                                    <span>{selectedCategory ? selectedCategory.split(' ')[0] : 'RUN'}</span>
                                </div>
                                <div className="text-2xl md:text-3xl font-black tracking-widest text-white font-mono">
                                    {selectedCategory?.includes('21') ? 'A-2088' : selectedCategory?.includes('10') ? 'B-1042' : 'C-5019'}
                                </div>
                                <div
                                    className="mt-1.5 inline-block px-4 py-0.5 rounded text-xs font-black tracking-[0.2em] uppercase text-black"
                                    style={{ backgroundColor: accent }}
                                >
                                    {previewBibText}
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[9px] text-zinc-500 font-bold">
                                    <span>SIZE: {registrant.tshirt_size || 'M'}</span>
                                    <span>BLOOD: {registrant.blood_type || 'O+'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Optional IC File Upload */}
                    {fieldsConfig.require_ic_upload && (
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                Upload IC / Passport Photo *
                            </label>
                            <input
                                type="file"
                                required
                                accept="image/*"
                                onChange={e => setRegistrant({ ...registrant, icFile: e.target.files?.[0] || null })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-500"
                            />
                        </div>
                    )}

                    {/* Phone & Email */}
                    {(fieldsConfig.show_phone || fieldsConfig.show_email) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {fieldsConfig.show_phone && (
                                <div className={fieldsConfig.show_email ? '' : 'md:col-span-2'}>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                        Phone / WhatsApp Number *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={registrant.phone}
                                        onChange={e => setRegistrant({ ...registrant, phone: e.target.value })}
                                        placeholder="e.g. 012-3456789"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                    />
                                </div>
                            )}
                            {fieldsConfig.show_email && (
                                <div className={fieldsConfig.show_phone ? '' : 'md:col-span-2'}>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                        Email Address (for E-Cert & Confirmation) {fieldsConfig.require_email ? '*' : ''}
                                    </label>
                                    <input
                                        type="email"
                                        required={!!fieldsConfig.require_email}
                                        value={registrant.email}
                                        onChange={e => setRegistrant({ ...registrant, email: e.target.value })}
                                        placeholder="you@example.com"
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gender, Running Jersey Size, Blood Type, Dietary */}
                    {(fieldsConfig.requires_gender || fieldsConfig.show_tshirt_size || fieldsConfig.show_blood_type || fieldsConfig.show_dietary) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {fieldsConfig.requires_gender && (
                                <div>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                        Gender *
                                    </label>
                                    <select
                                        required
                                        value={registrant.gender}
                                        onChange={e => setRegistrant({ ...registrant, gender: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male / 男</option>
                                        <option value="Female">Female / 女</option>
                                    </select>
                                </div>
                            )}

                            {fieldsConfig.show_tshirt_size && (
                                <div>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                        Running Jersey / T-Shirt Size *
                                    </label>
                                    <select
                                        required
                                        value={registrant.tshirt_size}
                                        onChange={e => setRegistrant({ ...registrant, tshirt_size: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                    >
                                        <option value="">Select Jersey Size</option>
                                        {TSHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            )}

                            {fieldsConfig.show_blood_type && (
                                <div>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                        Blood Type (血型 - 印于号码布背面)
                                    </label>
                                    <select
                                        value={registrant.blood_type}
                                        onChange={e => setRegistrant({ ...registrant, blood_type: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                    >
                                        <option value="">Select Blood Type</option>
                                        {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            )}

                            {fieldsConfig.show_dietary && (
                                <div>
                                    <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                        Dietary (饮食偏好)
                                    </label>
                                    <select
                                        value={registrant.dietary}
                                        onChange={e => setRegistrant({ ...registrant, dietary: e.target.value })}
                                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none"
                                    >
                                        {DIETARY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Secondary Dynamic Fields (Medical, Emergency Contact, City/State) */}
                    {hasSecondaryDynamicFields && (
                        <DynamicPlayerFields
                            player={registrant}
                            onChange={(f, v) => setRegistrant({ ...registrant, [f]: v })}
                            config={secondaryFieldsConfig}
                            medicalOptions={config.medical_options}
                            isCaptain={true}
                        />
                    )}

                    {/* Remarks / Special Requests */}
                    {fieldsConfig.show_remarks && (
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                Remarks / Special Requests (备注)
                            </label>
                            <textarea
                                rows={2}
                                value={registrant.remarks}
                                onChange={e => setRegistrant({ ...registrant, remarks: e.target.value })}
                                placeholder="Any special requests, allergies, outstation REPC collection request, or notes..."
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:border-amber-500 outline-none resize-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ── Card 3: Accompanying Family / Group Runners (if allow_companions is enabled) ── */}
            {fieldsConfig.allow_companions && (
                <div className="bg-zinc-900/95 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ backgroundColor: `${accent}20`, color: accent }}>
                                <i className="fa-solid fa-people-group" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-wider">
                                    {fieldsConfig.enable_run_module
                                        ? `Additional Runners / Family Members (${companions.length})`
                                        : `Family Members / Accompanying Guests (${companions.length})`}
                                </h2>
                                <p className="text-xs text-zinc-500">可一次过帮同伴或家人报名（费用将自动累计）</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={addCompanion}
                            className="px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-black transition-all flex items-center gap-2 hover:opacity-90 cursor-pointer"
                            style={{ backgroundColor: accent }}
                        >
                            <i className="fa-solid fa-user-plus" /> + Add Runner / Member
                        </button>
                    </div>

                    {companions.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                            Registering solo (1 Pax). Click &ldquo;+ Add Runner / Member&rdquo; above to add friends or family.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {companions.map((comp, idx) => (
                                <div key={comp.id} className="bg-black/40 border border-zinc-800/80 p-5 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: accent }}>
                                            Participant #{idx + 2}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeCompanion(comp.id)}
                                            className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                                        >
                                            <i className="fa-solid fa-trash-can" /> Remove
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Full Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={comp.name}
                                                onChange={e => updateCompanion(comp.id, 'name', e.target.value)}
                                                placeholder="Full Name"
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                            />
                                        </div>

                                        {categories.length > 0 ? (
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Race Category / Package</label>
                                                <select
                                                    value={comp.category}
                                                    onChange={e => updateCompanion(comp.id, 'category', e.target.value)}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                                >
                                                    {categories.map((cat: any, ci: number) => (
                                                        <option key={ci} value={cat.name}>
                                                            {cat.name} {cat.fee ? `(${cat.fee})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Category</label>
                                                <select
                                                    value={comp.type}
                                                    onChange={e => updateCompanion(comp.id, 'type', e.target.value as 'Adult' | 'Child')}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                                >
                                                    <option value="Adult">Adult / 成人</option>
                                                    <option value="Child">Child / 儿童</option>
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                                                {fieldsConfig.show_bib_name ? 'BIB Nickname (Max 10 chars)' : 'Relationship'}
                                            </label>
                                            {fieldsConfig.show_bib_name ? (
                                                <input
                                                    type="text"
                                                    maxLength={10}
                                                    value={comp.bib_name || ''}
                                                    onChange={e => updateCompanion(comp.id, 'bib_name', e.target.value.toUpperCase())}
                                                    placeholder="BIB NAME"
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white uppercase font-bold outline-none"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={comp.relationship}
                                                    onChange={e => updateCompanion(comp.id, 'relationship', e.target.value)}
                                                    placeholder="Spouse / Child / Teammate"
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {(fieldsConfig.show_ic_passport || fieldsConfig.show_tshirt_size || fieldsConfig.show_dietary) && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {fieldsConfig.show_ic_passport && (
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">IC / Passport</label>
                                                    <input
                                                        type="text"
                                                        value={comp.ic}
                                                        onChange={e => updateCompanion(comp.id, 'ic', e.target.value)}
                                                        placeholder="IC or Passport"
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                                    />
                                                </div>
                                            )}
                                            {fieldsConfig.show_tshirt_size && (
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Jersey / T-Shirt Size</label>
                                                    <select
                                                        value={comp.tshirt_size}
                                                        onChange={e => updateCompanion(comp.id, 'tshirt_size', e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                                    >
                                                        <option value="">Select Size</option>
                                                        {TSHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            {fieldsConfig.show_dietary && (
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Dietary</label>
                                                    <select
                                                        value={comp.dietary}
                                                        onChange={e => updateCompanion(comp.id, 'dietary', e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                                    >
                                                        {DIETARY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Card 4: Auto-Calculated Fee Summary & Payment Receipt Upload ── */}
            {(fieldsConfig.show_payment_receipt || feeBreakdown.total > 0) && (
                <div className="bg-zinc-900/95 border border-zinc-800 p-6 md:p-8 rounded-3xl shadow-xl space-y-5">
                    <div className="flex items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ backgroundColor: `${accent}20`, color: accent }}>
                                <i className="fa-solid fa-receipt" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white uppercase tracking-wider">Fee Summary & Payment</h2>
                                <p className="text-xs text-zinc-500">费用结算与上传汇款收据</p>
                            </div>
                        </div>

                        {feeBreakdown.total > 0 && (
                            <div className="text-right">
                                <div className="text-[10px] font-bold uppercase text-zinc-500">Total Payable</div>
                                <div className="text-2xl font-black" style={{ color: accent }}>
                                    RM {feeBreakdown.total.toFixed(2)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Itemized Fee Breakdown */}
                    {feeBreakdown.total > 0 && (
                        <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs">
                            <div className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                                Fee Breakdown ({feeBreakdown.items.length} Pax)
                            </div>
                            {feeBreakdown.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-zinc-300">
                                    <span>
                                        <strong className="text-white">{idx + 1}. {item.label}</strong> — {item.category}
                                    </span>
                                    <span className="font-black text-white">RM {item.amount.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="pt-2.5 mt-2 border-t border-zinc-800 flex items-center justify-between text-sm font-black">
                                <span className="text-zinc-200 uppercase">Total Registration Fee</span>
                                <span style={{ color: accent }}>RM {feeBreakdown.total.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {fieldsConfig.payment_instructions && (
                        <div className="bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                            {fieldsConfig.payment_instructions}
                        </div>
                    )}

                    {fieldsConfig.show_payment_receipt && (
                        <div>
                            <label className="block text-xs font-black tracking-widest uppercase text-zinc-400 mb-2">
                                Upload Payment Slip / DuitNow Receipt (JPG / PNG / PDF) *
                            </label>
                            <input
                                type="file"
                                required={feeBreakdown.total > 0}
                                accept="image/*,application/pdf"
                                onChange={e => setRegistrant({ ...registrant, receiptFile: e.target.files?.[0] || null })}
                                className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-500"
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ── Submit Button ── */}
            <div className="pt-4 pb-12">
                <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full disabled:opacity-50 text-black font-black uppercase tracking-widest px-8 py-5 rounded-2xl transition-all shadow-xl hover:opacity-95 text-base md:text-lg flex items-center justify-center gap-3 cursor-pointer"
                    style={{ backgroundColor: accent, boxShadow: `0 10px 35px ${accent}40` }}
                >
                    <i className={`fa-solid ${isSubmitting ? 'fa-circle-notch fa-spin' : 'fa-paper-plane'}`} />
                    {isSubmitting
                        ? 'Submitting Registration...'
                        : `Complete Registration (${1 + companions.length} Pax${feeBreakdown.total > 0 ? ` • RM ${feeBreakdown.total.toFixed(2)}` : ''})`}
                </button>
            </div>
        </form>
    );
}
