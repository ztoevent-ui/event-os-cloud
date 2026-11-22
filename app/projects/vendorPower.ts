import { supabase } from '@/lib/supabaseClient';

export const VENDOR_POWER_CONFIG_TOOL = 'vendor_power_config';
export const VENDOR_POWER_SUBMISSION_TOOL = 'vendor_power_submission';

export type PowerInputMode = 'W' | 'kW' | 'A';
export type PhaseCode = '' | 'R' | 'Y' | 'B';

export type VendorPowerConfig = {
    enabled: boolean;
    token: string;
    supply_voltage: number;     // Malaysia standard 230V
    circuit_amps_limit: number; // e.g. 13A MCB or 16A CEE
    safe_circuit_watts: number; // 80% continuous safe ceiling (2400W for 13A @ 230V)
    genset_kva: number;         // e.g. 30 kVA (0 = venue mains / no genset limit)
    instructions?: string;
    updated_at?: string;
};

export type ApplianceEntry = {
    id: string;
    name: string;
    qty: number;
    input_mode: PowerInputMode;
    input_value: number;
    voltage: number;
    is_three_phase?: boolean;
    watts_per_unit: number;
    verified_watts_per_unit?: number | null; // Staff override after reading nameplate photo
    simultaneous: boolean;
    photo_url: string;
    no_photo_reason?: string;
    notes?: string;
};

export type VendorPowerSubmission = {
    id?: string; // tool_states row id
    submission_id: string;
    vendor_name: string;
    booth_no?: string;
    zone?: string;
    contact_person: string;
    phone: string;
    email?: string;
    appliances: ApplianceEntry[];
    notes?: string;
    status: 'pending' | 'verified' | 'flagged';
    assigned_circuit?: string;
    assigned_phase?: PhaseCode;
    wireman_note?: string;
    submitted_at: string;
};

export type AppliancePreset = {
    key: string;
    name: string;
    zh: string;
    bm: string;
    defaultWatts: number;
    icon: string;
    highLoad?: boolean;
};

export const VENDOR_APPLIANCE_PRESETS: AppliancePreset[] = [
    { key: 'oven', name: 'Commercial Oven / Convection', zh: '商用烤箱 / 焗炉', bm: 'Ketuhar Komersial', defaultWatts: 3000, icon: 'fa-fire-burner', highLoad: true },
    { key: 'fryer', name: 'Electric Deep Fryer', zh: '电炸锅 / 油炸炉', bm: 'Penggoreng Elektrik', defaultWatts: 2500, icon: 'fa-temperature-high', highLoad: true },
    { key: 'espresso', name: 'Coffee Machine (Espresso)', zh: '商用咖啡机', bm: 'Mesin Kopi Espresso', defaultWatts: 2200, icon: 'fa-mug-hot', highLoad: true },
    { key: 'kettle', name: 'Electric Kettle / Water Boiler', zh: '热水壶 / 开水机', bm: 'Cerek / Pemanas Air', defaultWatts: 2000, icon: 'fa-droplet', highLoad: true },
    { key: 'induction', name: 'Induction Cooker / Stove', zh: '电磁炉', bm: 'Dapur Induksi', defaultWatts: 2000, icon: 'fa-circle-dot', highLoad: true },
    { key: 'griddle', name: 'Waffle / Takoyaki / Griddle', zh: '华夫饼 / 章鱼烧 / 铁板', bm: 'Mesin Wafel / Gril', defaultWatts: 1800, icon: 'fa-stroopwafel' },
    { key: 'blender', name: 'Heavy Duty Blender', zh: '商业搅拌机 / 冰沙机', bm: 'Pengisar Berat', defaultWatts: 1500, icon: 'fa-blender' },
    { key: 'rice_cooker', name: 'Commercial Rice Cooker / Warmer', zh: '大型电饭锅 / 保温锅', bm: 'Periuk Nasi Komersial', defaultWatts: 1500, icon: 'fa-bowl-rice' },
    { key: 'microwave', name: 'Microwave Oven', zh: '微波炉', bm: 'Ketuhar Mikro', defaultWatts: 1200, icon: 'fa-wave-square' },
    { key: 'ice_shaver', name: 'Ice Shaver / Slushy Machine', zh: '刨冰机 / 雪花冰机', bm: 'Mesin Ais Kisaran', defaultWatts: 800, icon: 'fa-snowflake' },
    { key: 'freezer', name: 'Chest Freezer / Chiller', zh: '冰柜 / 冷藏展示柜', bm: 'Peti Sejuk Beku / Chiller', defaultWatts: 350, icon: 'fa-icicles' },
    { key: 'pos_light', name: 'POS / Fan / Booth Lighting', zh: '收银机 / 风扇 / 摊位灯', bm: 'POS / Kipas / Lampu Gerai', defaultWatts: 150, icon: 'fa-lightbulb' },
];

export const DEFAULT_VENDOR_POWER_CONFIG = (token = ''): VendorPowerConfig => ({
    enabled: false,
    token: token || generateVendorPowerToken(),
    supply_voltage: 230,
    circuit_amps_limit: 13,
    safe_circuit_watts: 2400,
    genset_kva: 30,
    instructions: '',
});

export function generateVendorPowerToken(projectName?: string): string {
    const cleanSlug = (projectName || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 12);
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
        rand += chars[Math.floor(Math.random() * chars.length)];
    }
    return cleanSlug ? `${cleanSlug}-${rand}` : `vp-${rand}`;
}

export function roundNum(n: number, dp = 1): number {
    if (!Number.isFinite(n)) return 0;
    const f = Math.pow(10, dp);
    return Math.round((n + Number.EPSILON) * f) / f;
}

export function computeUnitWatts(
    mode: PowerInputMode,
    value: number,
    voltage = 230,
    isThreePhase = false
): number {
    if (!Number.isFinite(value) || value <= 0) return 0;
    const v = voltage > 0 ? voltage : 230;
    if (mode === 'kW') return Math.round(value * 1000);
    if (mode === 'A') {
        return isThreePhase
            ? Math.round(Math.sqrt(3) * v * value * 0.85)
            : Math.round(v * value);
    }
    return Math.round(value);
}

export function getEffectiveUnitWatts(app: ApplianceEntry): number {
    if (typeof app.verified_watts_per_unit === 'number' && app.verified_watts_per_unit >= 0) {
        return app.verified_watts_per_unit;
    }
    return Number(app.watts_per_unit) || 0;
}

export function computeApplianceStats(app: ApplianceEntry, defaultVoltage = 230) {
    const qty = Math.max(1, Number(app.qty) || 1);
    const unitWatts = getEffectiveUnitWatts(app);
    const totalWatts = Math.round(unitWatts * qty);
    const v = app.is_three_phase ? (app.voltage || 415) : (app.voltage || defaultVoltage || 230);
    const amps = app.is_three_phase
        ? totalWatts / (Math.sqrt(3) * v * 0.85)
        : totalWatts / v;
    const needsDedicated = unitWatts >= 2200 || totalWatts >= 2600 || !!app.is_three_phase;
    return {
        qty,
        unitWatts,
        totalWatts,
        totalKw: roundNum(totalWatts / 1000, 2),
        amps: roundNum(amps, 1),
        needsDedicated,
    };
}

export function computeSubmissionStats(sub: VendorPowerSubmission, cfg: VendorPowerConfig) {
    const supplyV = cfg.supply_voltage || 230;
    const circuitLimit = cfg.safe_circuit_watts || 2400;

    let totalWatts = 0;
    let peakWatts = 0;
    let dedicatedCircuits = 0;
    let remainingWatts = 0;
    let missingPhotoCount = 0;
    let photoCount = 0;

    for (const app of sub.appliances || []) {
        const s = computeApplianceStats(app, supplyV);
        totalWatts += s.totalWatts;
        if (app.simultaneous !== false) peakWatts += s.totalWatts;
        if (app.photo_url) photoCount += 1;
        else missingPhotoCount += 1;

        if (s.needsDedicated) {
            // Each heavy unit or dedicated appliance line gets its own MCB circuit(s)
            const units = s.unitWatts >= 2200 ? s.qty : Math.ceil(s.totalWatts / circuitLimit);
            dedicatedCircuits += units;
        } else {
            remainingWatts += s.totalWatts;
        }
    }

    const sharedCircuits = remainingWatts > 0 ? Math.ceil(remainingWatts / circuitLimit) : 0;
    const recommendedCircuits = Math.max(
        (sub.appliances || []).length > 0 ? 1 : 0,
        dedicatedCircuits + sharedCircuits
    );

    return {
        totalWatts,
        totalKw: roundNum(totalWatts / 1000, 2),
        peakWatts,
        peakKw: roundNum(peakWatts / 1000, 2),
        totalAmps: roundNum(totalWatts / supplyV, 1),
        recommendedCircuits,
        dedicatedCircuits,
        photoCount,
        missingPhotoCount,
    };
}

export function computeEventPowerSummary(subs: VendorPowerSubmission[], cfg: VendorPowerConfig) {
    const supplyV = cfg.supply_voltage || 230;
    let totalWatts = 0;
    let peakWatts = 0;
    let totalAppliances = 0;
    let totalCircuits = 0;
    let dedicatedCount = 0;
    let totalPhotos = 0;
    let missingPhotos = 0;

    const phaseWatts: Record<'R' | 'Y' | 'B' | 'unassigned', number> = {
        R: 0,
        Y: 0,
        B: 0,
        unassigned: 0,
    };

    for (const sub of subs) {
        const st = computeSubmissionStats(sub, cfg);
        totalWatts += st.totalWatts;
        peakWatts += st.peakWatts;
        totalCircuits += st.recommendedCircuits;
        dedicatedCount += st.dedicatedCircuits;
        totalPhotos += st.photoCount;
        missingPhotos += st.missingPhotoCount;
        totalAppliances += (sub.appliances || []).reduce((s, a) => s + (Number(a.qty) || 1), 0);

        const phase = sub.assigned_phase;
        if (phase === 'R' || phase === 'Y' || phase === 'B') {
            phaseWatts[phase] += st.totalWatts;
        } else {
            phaseWatts.unassigned += st.totalWatts;
        }
    }

    const totalKw = roundNum(totalWatts / 1000, 2);
    const peakKw = roundNum(peakWatts / 1000, 2);
    const gensetKva = Number(cfg.genset_kva) || 0;
    const gensetRealKw = roundNum(gensetKva * 0.8, 1);       // PF = 0.8
    const gensetSafeKw = roundNum(gensetRealKw * 0.8, 1);    // 80% continuous safe cap
    const gensetUsagePct = gensetRealKw > 0 ? Math.round((totalKw / gensetRealKw) * 100) : 0;

    return {
        vendorCount: subs.length,
        totalAppliances,
        totalWatts,
        totalKw,
        peakKw,
        totalAmpsEq230: roundNum(totalWatts / supplyV, 1),
        totalCircuits,
        dedicatedCount,
        totalPhotos,
        missingPhotos,
        gensetKva,
        gensetRealKw,
        gensetSafeKw,
        gensetUsagePct,
        phaseKw: {
            R: roundNum(phaseWatts.R / 1000, 2),
            Y: roundNum(phaseWatts.Y / 1000, 2),
            B: roundNum(phaseWatts.B / 1000, 2),
            unassigned: roundNum(phaseWatts.unassigned / 1000, 2),
        },
        phaseAmps: {
            R: roundNum(phaseWatts.R / supplyV, 1),
            Y: roundNum(phaseWatts.Y / supplyV, 1),
            B: roundNum(phaseWatts.B / supplyV, 1),
        },
    };
}

/**
 * Compresses an image client-side (max 1400px, JPEG 0.80) and uploads to `logo` storage bucket
 * so public vendor smartphone camera photos (often 5-12MB) upload quickly on event 4G connections.
 */
export async function compressAndUploadEquipmentPhoto(file: File, projectId: string): Promise<string> {
    let uploadBlob: Blob = file;
    let ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    let contentType = file.type || 'image/jpeg';

    if (typeof window !== 'undefined' && file.type.startsWith('image/')) {
        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = reject;
                image.src = dataUrl;
            });
            const maxDim = 1400;
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(img.width * scale));
            canvas.height = Math.max(1, Math.round(img.height * scale));
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const jpegBlob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.8));
                if (jpegBlob) {
                    uploadBlob = jpegBlob;
                    ext = 'jpg';
                    contentType = 'image/jpeg';
                }
            }
        } catch {
            // Fall back to original file if canvas decode fails (e.g. unsupported browser codec)
        }
    }

    const safePid = projectId.replace(/[^a-zA-Z0-9_-]/g, '');
    const path = `vendor-equipment/${safePid}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
        .from('logo')
        .upload(path, uploadBlob, { contentType, upsert: false });
    if (error) throw new Error(error.message);

    const { data: pub } = supabase.storage.from('logo').getPublicUrl(path);
    return pub.publicUrl;
}

export async function getVendorPowerConfig(projectId: string): Promise<VendorPowerConfig | null> {
    const { data, error } = await supabase
        .from('tool_states')
        .select('id, current_state')
        .eq('project_id', projectId)
        .eq('tool_name', VENDOR_POWER_CONFIG_TOOL)
        .maybeSingle();
    if (error || !data?.current_state) return null;
    return data.current_state as VendorPowerConfig;
}

export async function upsertVendorPowerConfig(
    projectId: string,
    patch: Partial<VendorPowerConfig>,
    projectName?: string
): Promise<VendorPowerConfig> {
    const { data: existing } = await supabase
        .from('tool_states')
        .select('id, current_state')
        .eq('project_id', projectId)
        .eq('tool_name', VENDOR_POWER_CONFIG_TOOL)
        .maybeSingle();

    const base = existing?.current_state
        ? (existing.current_state as VendorPowerConfig)
        : DEFAULT_VENDOR_POWER_CONFIG(generateVendorPowerToken(projectName));

    const nextState: VendorPowerConfig = {
        ...base,
        ...patch,
        token: patch.token || base.token || generateVendorPowerToken(projectName),
        updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
        const { error } = await supabase
            .from('tool_states')
            .update({ current_state: nextState, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from('tool_states')
            .insert({
                project_id: projectId,
                tool_name: VENDOR_POWER_CONFIG_TOOL,
                current_state: nextState,
            });
        if (error) throw new Error(error.message);
    }
    return nextState;
}

export async function resolveVendorPowerByToken(token: string) {
    const { data: cfgRow, error } = await supabase
        .from('tool_states')
        .select('id, project_id, current_state')
        .eq('tool_name', VENDOR_POWER_CONFIG_TOOL)
        .filter('current_state->>token', 'eq', token)
        .maybeSingle();

    if (error || !cfgRow) return null;

    const { data: project } = await supabase
        .from('projects')
        .select('id, name, venue, start_date, end_date, type')
        .eq('id', cfgRow.project_id)
        .maybeSingle();

    if (!project) return null;

    return {
        project,
        config: cfgRow.current_state as VendorPowerConfig,
    };
}

export async function fetchVendorPowerSubmissions(projectId: string): Promise<VendorPowerSubmission[]> {
    const { data, error } = await supabase
        .from('tool_states')
        .select('id, current_state, updated_at')
        .eq('project_id', projectId)
        .eq('tool_name', VENDOR_POWER_SUBMISSION_TOOL)
        .order('updated_at', { ascending: false });

    if (error || !data) return [];
    return data
        .filter(r => r.current_state && r.current_state.vendor_name)
        .map(r => ({
            ...(r.current_state as VendorPowerSubmission),
            id: r.id,
        }));
}

export async function createVendorPowerSubmission(
    projectId: string,
    payload: Omit<VendorPowerSubmission, 'id' | 'submission_id' | 'status' | 'submitted_at'>
): Promise<VendorPowerSubmission> {
    const state: VendorPowerSubmission = {
        ...payload,
        submission_id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub_${Date.now()}`,
        status: 'pending',
        submitted_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('tool_states')
        .insert({
            project_id: projectId,
            tool_name: VENDOR_POWER_SUBMISSION_TOOL,
            current_state: state,
        })
        .select('id, current_state')
        .single();

    if (error) throw new Error(error.message);

    // Also sync cleanly into project `vendors` directory if not already registered
    try {
        const { data: existingVendor } = await supabase
            .from('vendors')
            .select('id')
            .eq('project_id', projectId)
            .ilike('name', payload.vendor_name.trim())
            .maybeSingle();

        if (!existingVendor) {
            await supabase.from('vendors').insert({
                project_id: projectId,
                name: payload.vendor_name.trim(),
                category: payload.zone ? `F&B / ${payload.zone}` : 'F&B / Booth Vendor',
                contact_person: payload.contact_person.trim(),
                phone: payload.phone.trim(),
                email: (payload.email || '').trim(),
                status: 'confirmed',
            });
        }
    } catch {
        // Non-blocking vendor directory sync
    }

    return {
        ...(data.current_state as VendorPowerSubmission),
        id: data.id,
    };
}

export async function updateVendorPowerSubmission(
    rowId: string,
    nextState: VendorPowerSubmission
): Promise<VendorPowerSubmission> {
    const { id: _ignored, ...cleanState } = nextState;
    const { data, error } = await supabase
        .from('tool_states')
        .update({
            current_state: cleanState,
            updated_at: new Date().toISOString(),
        })
        .eq('id', rowId)
        .select('id, current_state')
        .single();
    if (error) throw new Error(error.message);
    return {
        ...(data.current_state as VendorPowerSubmission),
        id: data.id,
    };
}

export async function deleteVendorPowerSubmission(rowId: string): Promise<void> {
    const { error } = await supabase.from('tool_states').delete().eq('id', rowId);
    if (error) throw new Error(error.message);
}

export function buildVendorInviteMessage(projectName: string, shareUrl: string, venue?: string): string {
    const loc = venue ? ` (${venue})` : '';
    return [
        `[${projectName}${loc}] Vendor Electrical Load & Equipment Registration`,
        ``,
        `Dear Vendor,`,
        `To ensure safe and stable power distribution under the marquee tent without circuit tripping, please list all electrical appliances you are bringing (oven, coffee machine, microwave, blender, chiller, fryer, etc.) and upload clear photos of each appliance's power rating sticker (Watts / Amps):`,
        shareUrl,
        ``,
        `Thank you for your cooperation!`,
    ].join('\n');
}
