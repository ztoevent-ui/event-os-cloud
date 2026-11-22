'use client';

import React, { useMemo, useState } from 'react';
import {
    VENDOR_APPLIANCE_PRESETS,
    compressAndUploadEquipmentPhoto,
    computeApplianceStats,
    computeSubmissionStats,
    createVendorPowerSubmission,
    type ApplianceEntry,
    type AppliancePreset,
    type PowerInputMode,
    type VendorPowerConfig,
    type VendorPowerSubmission,
} from '@/app/projects/vendorPower';

type FormLang = 'zh' | 'en' | 'bm';

const UI = {
    zh: {
        badge: '参展商电器与用电申报',
        subtitle: '请如实填写所有带入现场帐篷/摊位使用的电器，并拍照上传参数贴纸（W / kW / A），方便电力团队提前分配足够回路，防止活动现场跳电。',
        step1Title: '1. 摊位与联络资料',
        vendorLabel: '摊位 / 公司名称 *',
        vendorPlaceholder: '例：阿明咖啡档 / Kopi House',
        contactLabel: '负责人姓名 *',
        contactPlaceholder: '例：Alex Tan',
        phoneLabel: 'WhatsApp / 联络电话 *',
        phonePlaceholder: '例：012-3456789',
        zoneLabel: '所在区域 / 摊位号 (选填)',
        zonePlaceholder: '例：Marquee Tent · Lot 3',
        step2Title: '2. 携带电器清单 & 参数铭牌拍照',
        presetHint: '点击常见餐饮电器快速添加，或自定义新增：',
        addCustom: '自定义新增电器',
        emptyApps: '请点击上方电器按钮或「自定义新增电器」开始添加。',
        appNameLabel: '电器名称 *',
        qtyLabel: '数量',
        unitLabel: '功率单位',
        ratingLabel: '铭牌数值',
        threePhase: '三相 415V',
        peakMode: '同时/持续开启',
        intermittentMode: '偶尔/短时使用',
        photoTitle: '电器参数铭牌照片 (拍 W / kW / A 贴纸)',
        photoGuide: '请对准机身背面或底部的规格贴纸拍清楚 Watt (W) / Amp (A)',
        takePhoto: '拍照 / 上传参数照片',
        retakePhoto: '重新上传',
        uploading: '正在压缩并上传...',
        photoUploaded: '已上传铭牌',
        noStickerLabel: '无铭牌 / 贴纸已磨损（请在备注说明）',
        highLoadWarn: '高功率电器（将建议独立回路，不可与其它大电器共用拖线板）',
        notesLabel: '额外用电备注 (选填)',
        notesPlaceholder: '例如：需要几米外接电线、是否自带工业插头 (CEE)、冰箱是否需24小时通电等',
        summaryTitle: '预估总用电负荷',
        totalPower: '申报总功率',
        estCurrent: '估算电流',
        estCircuits: '建议电源回路',
        submitBtn: '提交电器与用电申报',
        submitting: '提交中...',
        errVendor: '请填写摊位名称、负责人及联系电话。',
        errApps: '请至少添加 1 项要带去现场的电器。',
        errPhoto: '请为每件电器拍照上传参数贴纸（如贴纸磨损可勾选「无铭牌」）。',
        successTitle: '申报已成功提交！',
        successDesc: '我们的工程电力团队已收到您的电器清单与参数照片，将为您预留相应的安全电力回路。',
        refLabel: '提交编号',
        submitAnother: '再提交另一个摊位',
        disabledTitle: '此用电申报链接暂未开放或已关闭',
        disabledDesc: '请联系活动主办方 / ZTO Event 工程团队重新开启链接。',
    },
    en: {
        badge: 'Vendor Electrical & Appliance Form',
        subtitle: 'Declare every electrical appliance you are bringing (oven, coffee machine, microwave, blender, chiller, etc.) and snap a photo of its power rating sticker (W / kW / A) so our electrical team can allocate safe circuits without tripping.',
        step1Title: '1. Stall / Vendor Details',
        vendorLabel: 'Stall / Business Name *',
        vendorPlaceholder: 'e.g. Kopi House Bintulu',
        contactLabel: 'Contact Person *',
        contactPlaceholder: 'e.g. Alex Tan',
        phoneLabel: 'WhatsApp / Phone *',
        phonePlaceholder: 'e.g. 012-3456789',
        zoneLabel: 'Tent Zone / Booth No. (Optional)',
        zonePlaceholder: 'e.g. Marquee Tent · Booth 3',
        step2Title: '2. Electrical Appliances & Nameplate Photos',
        presetHint: 'Tap common F&B appliances to quick-add, or add a custom item:',
        addCustom: 'Add Custom Appliance',
        emptyApps: 'Tap any appliance preset above or "Add Custom Appliance" to begin.',
        appNameLabel: 'Appliance Name *',
        qtyLabel: 'Qty',
        unitLabel: 'Rating Unit',
        ratingLabel: 'Nameplate Value',
        threePhase: '3-Phase 415V',
        peakMode: 'Continuous / Peak',
        intermittentMode: 'Occasional Use',
        photoTitle: 'Appliance Spec Sticker Photo (Show W / kW / A)',
        photoGuide: 'Snap the rating label on the back/bottom clearly showing Watts or Amps',
        takePhoto: 'Snap / Upload Label Photo',
        retakePhoto: 'Replace Photo',
        uploading: 'Compressing & uploading...',
        photoUploaded: 'Label Uploaded',
        noStickerLabel: 'Sticker missing / worn off (specify in notes)',
        highLoadWarn: 'High-power appliance — dedicated MCB circuit recommended (do not share extension strip)',
        notesLabel: 'Extra Electrical Notes (Optional)',
        notesPlaceholder: 'e.g. Need 16A CEE plug, overnight chiller power, cable distance',
        summaryTitle: 'Estimated Booth Power Load',
        totalPower: 'Total Declared Load',
        estCurrent: 'Est. Current Draw',
        estCircuits: 'Recommended Circuits',
        submitBtn: 'Submit Electrical Declaration',
        submitting: 'Submitting...',
        errVendor: 'Please fill in stall name, contact person, and phone number.',
        errApps: 'Please add at least one electrical appliance.',
        errPhoto: 'Please upload a nameplate photo for every appliance (or check "Sticker missing").',
        successTitle: 'Declaration Submitted!',
        successDesc: 'Our electrical & production team has received your appliances and nameplate photos to plan safe power distribution.',
        refLabel: 'Reference ID',
        submitAnother: 'Submit Another Booth',
        disabledTitle: 'Vendor Power Form Is Currently Closed',
        disabledDesc: 'Please contact the event organizer / ZTO Event team to re-enable this link.',
    },
    bm: {
        badge: 'Borang Pengisytiharan Peralatan Elektrik Peniaga',
        subtitle: 'Sila nyatakan semua peralatan elektrik yang dibawa (ketuhar, mesin kopi, microwave, pengisar, peti sejuk, dll.) beserta gambar pelekat spesifikasi kuasa (W / kW / A) supaya pasukan elektrik dapat menyediakan litar yang selamat.',
        step1Title: '1. Maklumat Gerai / Peniaga',
        vendorLabel: 'Nama Gerai / Syarikat *',
        vendorPlaceholder: 'cth: Kopi House Bintulu',
        contactLabel: 'Nama Penjaga *',
        contactPlaceholder: 'cth: Ahmad / Alex',
        phoneLabel: 'No. WhatsApp / Telefon *',
        phonePlaceholder: 'cth: 012-3456789',
        zoneLabel: 'Zon Khemah / No. Lot (Pilihan)',
        zonePlaceholder: 'cth: Marquee Tent · Lot 3',
        step2Title: '2. Senarai Peralatan Elektrik & Gambar Label Kuasa',
        presetHint: 'Tekan peralatan lazim di bawah untuk tambah pantas, atau tambah secara manual:',
        addCustom: 'Tambah Peralatan Lain',
        emptyApps: 'Sila pilih peralatan di atas atau tekan "Tambah Peralatan Lain".',
        appNameLabel: 'Nama Peralatan *',
        qtyLabel: 'Kuantiti',
        unitLabel: 'Unit Label',
        ratingLabel: 'Nilai Label',
        threePhase: '3-Fasa 415V',
        peakMode: 'Penggunaan Berterusan / Puncak',
        intermittentMode: 'Sekali-sekala',
        photoTitle: 'Gambar Pelekat Spesifikasi Kuasa (Tunjuk W / kW / A)',
        photoGuide: 'Tangkap gambar label spesifikasi di belakang/bawah mesin dengan jelas',
        takePhoto: 'Ambil / Muat Naik Gambar Label',
        retakePhoto: 'Tukar Gambar',
        uploading: 'Memampat & memuat naik...',
        photoUploaded: 'Gambar Dimuat Naik',
        noStickerLabel: 'Tiada label / label pudar (nyatakan di catatan)',
        highLoadWarn: 'Kuasa tinggi — memerlukan litar berasingan (jangan kongsi soket sambungan)',
        notesLabel: 'Catatan Tambahan Elektrik (Pilihan)',
        notesPlaceholder: 'cth: Perlukan plug industri 16A, bekalan peti sejuk semalaman, jarak kabel',
        summaryTitle: 'Anggaran Beban Elektrik Gerai',
        totalPower: 'Jumlah Kuasa',
        estCurrent: 'Anggaran Arus',
        estCircuits: 'Anggaran Litar',
        submitBtn: 'Hantar Pengisytiharan Elektrik',
        submitting: 'Menghantar...',
        errVendor: 'Sila lengkapkan nama gerai, nama penjaga dan nombor telefon.',
        errApps: 'Sila tambah sekurang-kurangnya satu peralatan elektrik.',
        errPhoto: 'Sila muat naik gambar pelekat spesifikasi untuk setiap peralatan.',
        successTitle: 'Pengisytiharan Berjaya Dihantar!',
        successDesc: 'Pasukan teknikal kami telah menerima senarai peralatan & gambar spesifikasi untuk pengagihan litar elektrik.',
        refLabel: 'No. Rujukan',
        submitAnother: 'Hantar Gerai Lain',
        disabledTitle: 'Borang Ini Ditutup Buat Masa Ini',
        disabledDesc: 'Sila hubungi penganjur acara / pasukan ZTO Event.',
    },
};

function makeEmptyAppliance(preset?: AppliancePreset): ApplianceEntry {
    const id = `app_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const watts = preset?.defaultWatts ?? 1000;
    return {
        id,
        name: preset ? `${preset.name}` : '',
        qty: 1,
        input_mode: 'W',
        input_value: watts,
        voltage: 230,
        is_three_phase: false,
        watts_per_unit: watts,
        simultaneous: true,
        photo_url: '',
        no_photo_reason: '',
        notes: '',
    };
}

export function VendorPowerForm({
    project,
    config,
}: {
    project: { id: string; name: string; venue?: string | null; start_date?: string | null };
    config: VendorPowerConfig;
}) {
    const [lang, setLang] = useState<FormLang>('zh');
    const L = UI[lang];

    const [vendorName, setVendorName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [zone, setZone] = useState('');
    const [notes, setNotes] = useState('');
    const [appliances, setAppliances] = useState<ApplianceEntry[]>([
        makeEmptyAppliance(VENDOR_APPLIANCE_PRESETS[2]),
    ]);
    const [uploadingMap, setUploadingMap] = useState<Record<string, boolean>>({});
    const [noStickerIds, setNoStickerIds] = useState<Record<string, boolean>>({});
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [submittedRecord, setSubmittedRecord] = useState<VendorPowerSubmission | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const previewStats = useMemo(() => {
        return computeSubmissionStats(
            {
                submission_id: 'preview',
                vendor_name: vendorName,
                contact_person: contactPerson,
                phone,
                appliances,
                status: 'pending',
                submitted_at: '',
            },
            config
        );
    }, [vendorName, contactPerson, phone, appliances, config]);

    if (!config.enabled) {
        return (
            <div className="min-h-screen bg-[#07080b] text-zinc-200 flex items-center justify-center p-6">
                <div className="max-w-md w-full rounded-3xl border border-white/10 bg-zinc-900/70 p-8 text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 text-xl">
                        <i className="fa-solid fa-plug-circle-xmark" />
                    </div>
                    <h1 className="text-xl font-black text-white">{L.disabledTitle}</h1>
                    <p className="text-xs text-zinc-400 leading-relaxed">{L.disabledDesc}</p>
                </div>
            </div>
        );
    }

    const updateAppliance = (id: string, patch: Partial<ApplianceEntry>) => {
        setAppliances(prev =>
            prev.map(app => {
                if (app.id !== id) return app;
                const next = { ...app, ...patch };
                const val = Number(next.input_value) || 0;
                const v = next.is_three_phase ? 415 : (next.voltage || config.supply_voltage || 230);
                if (next.input_mode === 'kW') next.watts_per_unit = Math.round(val * 1000);
                else if (next.input_mode === 'A') {
                    next.watts_per_unit = next.is_three_phase
                        ? Math.round(Math.sqrt(3) * v * val * 0.85)
                        : Math.round(v * val);
                } else {
                    next.watts_per_unit = Math.round(val);
                }
                return next;
            })
        );
    };

    const handlePhotoUpload = async (appId: string, file?: File | null) => {
        if (!file) return;
        setUploadingMap(prev => ({ ...prev, [appId]: true }));
        setErrorMsg('');
        try {
            const url = await compressAndUploadEquipmentPhoto(file, project.id);
            updateAppliance(appId, { photo_url: url, no_photo_reason: '' });
            setNoStickerIds(prev => ({ ...prev, [appId]: false }));
        } catch (err: any) {
            setErrorMsg(`Photo upload failed: ${err?.message || 'Unknown error'}`);
        } finally {
            setUploadingMap(prev => ({ ...prev, [appId]: false }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!vendorName.trim() || !contactPerson.trim() || !phone.trim()) {
            setErrorMsg(L.errVendor);
            return;
        }
        const cleanApps = appliances.filter(a => a.name.trim());
        if (cleanApps.length === 0) {
            setErrorMsg(L.errApps);
            return;
        }
        const missingPhotos = cleanApps.some(a => !a.photo_url && !noStickerIds[a.id]);
        if (missingPhotos) {
            setErrorMsg(L.errPhoto);
            return;
        }

        setSubmitting(true);
        try {
            const saved = await createVendorPowerSubmission(project.id, {
                vendor_name: vendorName.trim(),
                contact_person: contactPerson.trim(),
                phone: phone.trim(),
                zone: zone.trim(),
                notes: notes.trim(),
                appliances: cleanApps.map(a => ({
                    ...a,
                    no_photo_reason: !a.photo_url && noStickerIds[a.id] ? 'No visible nameplate' : '',
                })),
            });
            setSubmittedRecord(saved);
        } catch (err: any) {
            setErrorMsg(err?.message || 'Submission failed, please retry.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submittedRecord) {
        const st = computeSubmissionStats(submittedRecord, config);
        return (
            <div className="min-h-screen bg-[#07080b] text-zinc-200 px-4 py-10">
                <div className="max-w-xl mx-auto rounded-3xl border border-emerald-500/30 bg-zinc-900/80 p-6 md:p-8 space-y-6">
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl">
                            <i className="fa-solid fa-circle-check" />
                        </div>
                        <h1 className="text-2xl font-black text-white">{L.successTitle}</h1>
                        <p className="text-xs text-zinc-400 leading-relaxed">{L.successDesc}</p>
                        <div className="inline-block px-3 py-1 rounded-lg bg-black/50 border border-white/10 text-[11px] font-mono text-zinc-300">
                            {L.refLabel}: {submittedRecord.submission_id.slice(0, 8).toUpperCase()}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/40 border border-white/10 p-4 text-center">
                        <div>
                            <div className="text-[10px] font-bold uppercase text-zinc-500">{L.totalPower}</div>
                            <div className="text-lg font-black font-mono text-amber-400">{st.totalKw} kW</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase text-zinc-500">{L.estCurrent}</div>
                            <div className="text-lg font-black font-mono text-white">{st.totalAmps} A</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold uppercase text-zinc-500">{L.estCircuits}</div>
                            <div className="text-lg font-black font-mono text-emerald-400">{st.recommendedCircuits}</div>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        {submittedRecord.appliances.map((app, i) => {
                            const as = computeApplianceStats(app, config.supply_voltage);
                            return (
                                <div key={i} className="rounded-xl bg-black/30 border border-white/10 p-3 flex items-center gap-3">
                                    {app.photo_url ? (
                                        <img src={app.photo_url} alt={app.name} className="w-12 h-12 rounded-lg object-cover border border-white/15 shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 shrink-0">
                                            <i className="fa-solid fa-plug" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-bold text-white truncate">{app.name}</div>
                                        <div className="text-[11px] font-mono text-zinc-400">
                                            {as.qty} × {as.unitWatts}W = <span className="text-amber-300 font-bold">{as.totalWatts}W ({as.amps}A)</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSubmittedRecord(null);
                            setVendorName('');
                            setZone('');
                            setNotes('');
                            setAppliances([makeEmptyAppliance(VENDOR_APPLIANCE_PRESETS[2])]);
                        }}
                        className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-black uppercase tracking-wider text-white cursor-pointer"
                    >
                        {L.submitAnother}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#07080b] text-zinc-200 pb-20">
            {/* Top sticky header */}
            <header className="sticky top-0 z-40 bg-black/85 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <img
                            src="https://zihjzbweasaqqbwilshx.supabase.co/storage/v1/object/public/logo/icon.png.JPG"
                            alt="ZTO"
                            className="w-7 h-7 rounded object-cover shrink-0"
                        />
                        <div className="min-w-0">
                            <div className="text-xs font-black text-white truncate uppercase">{project.name}</div>
                            {project.venue && <div className="text-[10px] text-zinc-500 truncate">{project.venue}</div>}
                        </div>
                    </div>

                    <div className="inline-flex p-0.5 rounded-xl bg-zinc-900 border border-white/15 shrink-0">
                        {(['zh', 'en', 'bm'] as FormLang[]).map(code => (
                            <button
                                key={code}
                                type="button"
                                onClick={() => setLang(code)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-colors ${
                                    lang === code ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-white'
                                }`}
                            >
                                {code === 'zh' ? '中文' : code.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
                {/* Intro Hero Card */}
                <div className="rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-zinc-900/90 to-zinc-950 p-6 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                        <i className="fa-solid fa-bolt" /> {L.badge}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                        {project.name}
                    </h1>
                    <div className="flex flex-wrap gap-3 text-xs text-zinc-300">
                        {project.start_date && (
                            <span><i className="fa-regular fa-calendar text-amber-400 mr-1.5" />{new Date(project.start_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                        {project.venue && (
                            <span><i className="fa-solid fa-location-dot text-amber-400 mr-1.5" />{project.venue}</span>
                        )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed pt-1">{L.subtitle}</p>
                    {config.instructions && (
                        <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-xs text-amber-200">
                            <i className="fa-solid fa-circle-info mr-1.5" />{config.instructions}
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Step 1: Vendor Details */}
                    <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 md:p-6 space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                            <i className="fa-solid fa-store text-amber-400" /> {L.step1Title}
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-3.5">
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">{L.vendorLabel}</label>
                                <input
                                    required
                                    value={vendorName}
                                    onChange={e => setVendorName(e.target.value)}
                                    placeholder={L.vendorPlaceholder}
                                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">{L.contactLabel}</label>
                                <input
                                    required
                                    value={contactPerson}
                                    onChange={e => setContactPerson(e.target.value)}
                                    placeholder={L.contactPlaceholder}
                                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">{L.phoneLabel}</label>
                                <input
                                    required
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder={L.phonePlaceholder}
                                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">{L.zoneLabel}</label>
                                <input
                                    value={zone}
                                    onChange={e => setZone(e.target.value)}
                                    placeholder={L.zonePlaceholder}
                                    className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Step 2: Appliances + Nameplate Photos */}
                    <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 md:p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                                <i className="fa-solid fa-plug text-amber-400" /> {L.step2Title}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setAppliances(prev => [...prev, makeEmptyAppliance()])}
                                className="px-3 py-1.5 rounded-xl bg-amber-400 text-black text-[11px] font-black uppercase tracking-wider cursor-pointer hover:opacity-90 flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-plus" /> {L.addCustom}
                            </button>
                        </div>

                        <div>
                            <div className="text-[11px] text-zinc-400 mb-2">{L.presetHint}</div>
                            <div className="flex flex-wrap gap-1.5">
                                {VENDOR_APPLIANCE_PRESETS.map(p => (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => setAppliances(prev => [...prev, makeEmptyAppliance(p)])}
                                        className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-amber-400/15 border border-white/10 hover:border-amber-400/40 text-[11px] text-zinc-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                                    >
                                        <i className={`fa-solid ${p.icon} text-[10px] ${p.highLoad ? 'text-amber-400' : 'text-zinc-400'}`} />
                                        <span>{lang === 'zh' ? p.zh : lang === 'bm' ? p.bm : p.name}</span>
                                        <span className="font-mono text-[10px] text-zinc-500">{p.defaultWatts}W</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {appliances.length === 0 ? (
                            <div className="py-10 rounded-2xl border border-dashed border-white/10 text-center text-xs text-zinc-500">
                                {L.emptyApps}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {appliances.map((app, idx) => {
                                    const st = computeApplianceStats(app, config.supply_voltage);
                                    const isUp = !!uploadingMap[app.id];
                                    const noSticker = !!noStickerIds[app.id];
                                    return (
                                        <div key={app.id} className="rounded-2xl border border-white/10 bg-black/45 p-4 space-y-3.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-black font-mono text-amber-300">
                                                    #{idx + 1}
                                                </span>
                                                <div className="flex items-center gap-2 ml-auto">
                                                    <span className="text-xs font-mono font-black text-white">
                                                        {st.totalWatts} W ({st.amps} A)
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAppliances(prev => prev.filter(a => a.id !== app.id))}
                                                        className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-colors"
                                                        title="Remove"
                                                    >
                                                        <i className="fa-solid fa-trash" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">{L.appNameLabel}</label>
                                                <input
                                                    required
                                                    value={app.name}
                                                    onChange={e => updateAppliance(app.id, { name: e.target.value })}
                                                    placeholder="e.g. Espresso Coffee Machine / Oven"
                                                    className="w-full bg-zinc-900 border border-white/15 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                                                />
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">{L.qtyLabel}</label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={app.qty}
                                                        onChange={e => updateAppliance(app.id, { qty: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                                                        className="w-full bg-zinc-900 border border-white/15 rounded-xl px-2.5 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">{L.unitLabel}</label>
                                                    <select
                                                        value={app.input_mode}
                                                        onChange={e => updateAppliance(app.id, { input_mode: e.target.value as PowerInputMode })}
                                                        className="w-full bg-zinc-900 border border-white/15 rounded-xl px-2 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                                                    >
                                                        <option value="W">Watts (W)</option>
                                                        <option value="kW">kW</option>
                                                        <option value="A">Amps (A)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">{L.ratingLabel}</label>
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        min={0}
                                                        required
                                                        value={app.input_value || ''}
                                                        onChange={e => updateAppliance(app.id, { input_value: parseFloat(e.target.value) || 0 })}
                                                        placeholder="2200"
                                                        className="w-full bg-zinc-900 border border-white/15 rounded-xl px-2.5 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                                <div className="flex items-center gap-3">
                                                    <label className="inline-flex items-center gap-1.5 text-zinc-400 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!app.is_three_phase}
                                                            onChange={e => updateAppliance(app.id, {
                                                                is_three_phase: e.target.checked,
                                                                voltage: e.target.checked ? 415 : 230,
                                                            })}
                                                            className="accent-amber-400"
                                                        />
                                                        {L.threePhase}
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateAppliance(app.id, { simultaneous: !app.simultaneous })}
                                                        className={`px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer ${
                                                            app.simultaneous
                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                                                : 'bg-white/5 border-white/10 text-zinc-400'
                                                        }`}
                                                    >
                                                        {app.simultaneous ? L.peakMode : L.intermittentMode}
                                                    </button>
                                                </div>
                                                {st.needsDedicated && (
                                                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                                                        <i className="fa-solid fa-triangle-exclamation" />
                                                        {L.highLoadWarn}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Photo Upload Box */}
                                            <div className="rounded-xl border border-dashed border-white/15 bg-zinc-950/80 p-3 space-y-2.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                                            <i className="fa-solid fa-camera text-amber-400" /> {L.photoTitle}
                                                        </div>
                                                        <div className="text-[10px] text-zinc-500 mt-0.5">{L.photoGuide}</div>
                                                    </div>
                                                    {app.photo_url && (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-emerald-400 shrink-0">
                                                            <i className="fa-solid fa-check mr-1" />{L.photoUploaded}
                                                        </span>
                                                    )}
                                                </div>

                                                {app.photo_url ? (
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setLightboxUrl(app.photo_url)}
                                                            className="w-20 h-20 rounded-xl overflow-hidden border border-white/15 shrink-0 cursor-zoom-in"
                                                        >
                                                            <img src={app.photo_url} alt="Nameplate" className="w-full h-full object-cover" />
                                                        </button>
                                                        <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer inline-flex items-center gap-1.5">
                                                            <i className="fa-solid fa-camera-rotate" />
                                                            {isUp ? L.uploading : L.retakePhoto}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={e => handlePhotoUpload(app.id, e.target.files?.[0])}
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                                                        <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-black cursor-pointer transition-colors">
                                                            {isUp ? (
                                                                <><i className="fa-solid fa-circle-notch fa-spin" /> {L.uploading}</>
                                                            ) : (
                                                                <><i className="fa-solid fa-camera" /> {L.takePhoto}</>
                                                            )}
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={e => handlePhotoUpload(app.id, e.target.files?.[0])}
                                                            />
                                                        </label>
                                                        <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={noSticker}
                                                                onChange={e => setNoStickerIds(prev => ({ ...prev, [app.id]: e.target.checked }))}
                                                                className="accent-amber-400"
                                                            />
                                                            {L.noStickerLabel}
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Notes & Live Load Preview */}
                    <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 md:p-6 space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-zinc-400 mb-1.5">{L.notesLabel}</label>
                            <textarea
                                rows={2}
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder={L.notesPlaceholder}
                                className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <div className="rounded-2xl bg-black/60 border border-white/10 p-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2.5">{L.summaryTitle}</div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-xl bg-white/[0.03] p-2.5">
                                    <div className="text-[10px] text-zinc-500">{L.totalPower}</div>
                                    <div className="text-base font-black font-mono text-amber-400">{previewStats.totalKw} kW</div>
                                    <div className="text-[10px] font-mono text-zinc-500">{previewStats.totalWatts} W</div>
                                </div>
                                <div className="rounded-xl bg-white/[0.03] p-2.5">
                                    <div className="text-[10px] text-zinc-500">{L.estCurrent}</div>
                                    <div className="text-base font-black font-mono text-white">{previewStats.totalAmps} A</div>
                                    <div className="text-[10px] text-zinc-500">@{config.supply_voltage || 230}V</div>
                                </div>
                                <div className="rounded-xl bg-white/[0.03] p-2.5">
                                    <div className="text-[10px] text-zinc-500">{L.estCircuits}</div>
                                    <div className="text-base font-black font-mono text-emerald-400">{previewStats.recommendedCircuits}</div>
                                    <div className="text-[10px] text-zinc-500">{config.circuit_amps_limit || 13}A MCB</div>
                                </div>
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="rounded-xl bg-rose-500/15 border border-rose-500/40 px-4 py-3 text-xs font-bold text-rose-300 flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || Object.values(uploadingMap).some(Boolean)}
                            className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? (
                                <><i className="fa-solid fa-circle-notch fa-spin" /> {L.submitting}</>
                            ) : (
                                <><i className="fa-solid fa-paper-plane" /> {L.submitBtn}</>
                            )}
                        </button>
                    </section>
                </form>
            </main>

            {lightboxUrl && (
                <div
                    onClick={() => setLightboxUrl(null)}
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                >
                    <img src={lightboxUrl} alt="Nameplate Zoom" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
                </div>
            )}
        </div>
    );
}
