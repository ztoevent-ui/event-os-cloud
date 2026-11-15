export type PortalLang = 'zh' | 'en' | 'bm';

export const LANG_META: Record<PortalLang, { code: PortalLang; short: string; label: string }> = {
    zh: { code: 'zh', short: '中文', label: '中文' },
    en: { code: 'en', short: 'EN', label: 'English' },
    bm: { code: 'bm', short: 'BM', label: 'Bahasa Melayu' },
};

export type CourseUiLabels = {
    roadMap: string;
    satellite: string;
    googleMaps: string;
    fitRoute: string;
    openGoogleMaps: string;
    inspectCheckpoint: string;
    startPoint: string;
    startFinish: string;
    finishPoint: string;
    start: string;
    finish: string;
    routeLabel: string;
    showingPin: string;
    tapPinHint: string;
    assemblyStart: string;
    checkpoints: string;
    outbound: string;
    returnLeg: string;
    uTurn: string;
    pointToPointSummary: string;
    outAndBackSummary: string;
    km: string;
    checkpointCol: string;
    detailCol: string;
    startBadge: string;
    assemblyLot: string;
    returnTag: string;
    courseRoutePrefix: string;
    flagOff: string;
    cutOff: string;
};

export const DEFAULT_COURSE_LABELS: CourseUiLabels = {
    roadMap: 'Road Map',
    satellite: 'Satellite',
    googleMaps: 'Google Maps',
    fitRoute: 'Fit full route',
    openGoogleMaps: 'Open in Google Maps',
    inspectCheckpoint: 'Inspect checkpoint:',
    startPoint: 'Start Point',
    startFinish: 'Start / Finish',
    finishPoint: 'Finish Point',
    start: 'Start',
    finish: 'Finish Point',
    routeLabel: 'Route',
    showingPin: 'Showing Google Maps pin:',
    tapPinHint: 'Tap any map pin or row to zoom to location',
    assemblyStart: 'Assembly & Start',
    checkpoints: 'Checkpoints',
    outbound: 'Outbound',
    returnLeg: 'Return leg',
    uTurn: 'U-turn',
    pointToPointSummary: 'point-to-point route',
    outAndBackSummary: 'Out-and-back distance split along course',
    km: 'KM',
    checkpointCol: 'Checkpoint',
    detailCol: 'Notes & facilities',
    startBadge: 'START',
    assemblyLot: 'Assembly & Parking Lot',
    returnTag: 'Return',
    courseRoutePrefix: 'Course Route:',
    flagOff: 'Flag-off',
    cutOff: 'Cut-off',
};

const COURSE_UI_BY_LANG: Record<PortalLang, CourseUiLabels> = {
    en: DEFAULT_COURSE_LABELS,
    zh: {
        roadMap: '街道地图',
        satellite: '卫星地图',
        googleMaps: 'Google 地图',
        fitRoute: '显示全程',
        openGoogleMaps: '在 Google 地图导航',
        inspectCheckpoint: '查看站点：',
        startPoint: '集合起点',
        startFinish: '起点 / 终点',
        finishPoint: '游行终点',
        start: '起点',
        finish: '终点',
        routeLabel: '路线',
        showingPin: '当前定位：',
        tapPinHint: '点击地图标记或下方列表可放大定位',
        assemblyStart: '集合与出发点',
        checkpoints: '沿途站点',
        outbound: '去程',
        returnLeg: '折返',
        uTurn: '折返点',
        pointToPointSummary: '单程游行路线',
        outAndBackSummary: '折返路段分段距离',
        km: '公里',
        checkpointCol: '途经站点',
        detailCol: '站点说明',
        startBadge: '起点',
        assemblyLot: '集合与共享停车场',
        returnTag: '返程',
        courseRoutePrefix: '游行路线：',
        flagOff: '出发时间',
        cutOff: '关门时间',
    },
    bm: {
        roadMap: 'Peta Jalan',
        satellite: 'Satelit',
        googleMaps: 'Google Maps',
        fitRoute: 'Papar Penuh',
        openGoogleMaps: 'Buka di Google Maps',
        inspectCheckpoint: 'Semak stesen:',
        startPoint: 'Titik Mula',
        startFinish: 'Mula / Tamat',
        finishPoint: 'Titik Tamat',
        start: 'Mula',
        finish: 'Tamat',
        routeLabel: 'Laluan',
        showingPin: 'Pin Google Maps:',
        tapPinHint: 'Tekan pin peta atau baris di bawah untuk zum lokasi',
        assemblyStart: 'Tempat Berkumpul',
        checkpoints: 'Stesen Laluan',
        outbound: 'Pergi',
        returnLeg: 'Balik',
        uTurn: 'Pusingan-U',
        pointToPointSummary: 'laluan perarakan sehala',
        outAndBackSummary: 'Pecahan jarak pergi dan balik',
        km: 'KM',
        checkpointCol: 'Perhentian',
        detailCol: 'Nota & Kemudahan',
        startBadge: 'MULA',
        assemblyLot: 'Tempat Berkumpul & Parkir',
        returnTag: 'Balik',
        courseRoutePrefix: 'Laluan:',
        flagOff: 'Mula',
        cutOff: 'Tamat',
    },
};

export type PortalUiText = {
    nav: {
        overview: string;
        spotlight: string;
        categories: string;
        routeVenue: string;
        route: string;
        schedule: string;
        prizes: string;
        info: string;
        venue: string;
        register: string;
    };
    enquiry: string;
    overviewFallback: string;
    atAGlance: string;
    viewRoute: string;
    viewSchedule: string;
    unitedWorship: string;
    whatsapp: string;
    copyLink: string;
    copied: string;
    tapToZoom: string;
    posterModeBtn: string;
    timelineModeBtn: string;
    afterParadeWorshipTag: string;
    googleMaps: string;
    waze: string;
    dateCol: string;
    assemblyCol: string;
    paradeStartCol: string;
    routeCol: string;
    afterWorshipCol: string;
    worshipTeamsCol: string;
    poweredBy: string;
    tipsTitle: string;
    course: CourseUiLabels;
};

export const PORTAL_UI: Record<PortalLang, PortalUiText> = {
    en: {
        nav: {
            overview: 'Overview',
            spotlight: 'United Worship',
            categories: 'Categories',
            routeVenue: 'Route & Venue',
            route: 'Parade Route',
            schedule: 'Schedule & Tips',
            prizes: 'Prizes',
            info: 'Quick Tips',
            venue: 'Venue',
            register: 'Register',
        },
        enquiry: 'Enquiry',
        overviewFallback: 'Event details will be announced soon.',
        atAGlance: 'At a glance',
        viewRoute: 'View parade route',
        viewSchedule: 'View schedule',
        unitedWorship: 'United Worship',
        whatsapp: 'WhatsApp',
        copyLink: 'Copy link',
        copied: 'Copied',
        tapToZoom: 'Tap poster to enlarge',
        posterModeBtn: 'Official Poster',
        timelineModeBtn: 'Text Timeline',
        afterParadeWorshipTag: 'After Parade (~8:00 PM+)',
        googleMaps: 'Google Maps',
        waze: 'Waze',
        dateCol: 'Date',
        assemblyCol: 'Assembly',
        paradeStartCol: 'Parade Starts',
        routeCol: 'Route',
        afterWorshipCol: 'After Worship',
        worshipTeamsCol: 'Worship Teams',
        poweredBy: 'Powered by ZTO Event OS',
        tipsTitle: 'Quick Tips',
        course: COURSE_UI_BY_LANG.en,
    },
    zh: {
        nav: {
            overview: '活动总览',
            spotlight: '联合敬拜',
            categories: '组别与报名',
            routeVenue: '路线与地点',
            route: '游行路线',
            schedule: '时间与贴士',
            prizes: '奖项',
            info: '实用贴士',
            venue: '地点导航',
            register: '立即报名',
        },
        enquiry: '联系咨询',
        overviewFallback: '活动详情即将公布。',
        atAGlance: '活动速览',
        viewRoute: '查看游行路线',
        viewSchedule: '查看流程表',
        unitedWorship: '联合敬拜详情',
        whatsapp: 'WhatsApp',
        copyLink: '复制短链接',
        copied: '已复制链接',
        tapToZoom: '点击海报放大 / 长按保存',
        posterModeBtn: '官方海报',
        timelineModeBtn: '文字时间表',
        afterParadeWorshipTag: '游行结束后 (~8:00 PM+)',
        googleMaps: 'Google 地图',
        waze: 'Waze 导航',
        dateCol: '日期',
        assemblyCol: '集合时间',
        paradeStartCol: '游行出发',
        routeCol: '游行路线',
        afterWorshipCol: '游行后敬拜',
        worshipTeamsCol: '联合带领教会',
        poweredBy: '由 ZTO Event OS 提供支持',
        tipsTitle: '出席贴士',
        course: COURSE_UI_BY_LANG.zh,
    },
    bm: {
        nav: {
            overview: 'Ringkasan',
            spotlight: 'Pujian Bersama',
            categories: 'Kategori',
            routeVenue: 'Laluan & Lokasi',
            route: 'Peta Laluan',
            schedule: 'Jadual & Tip',
            prizes: 'Hadiah',
            info: 'Panduan',
            venue: 'Lokasi',
            register: 'Daftar',
        },
        enquiry: 'Pertanyaan',
        overviewFallback: 'Maklumat acara akan diumumkan tidak lama lagi.',
        atAGlance: 'Maklumat Ringkas',
        viewRoute: 'Lihat peta laluan',
        viewSchedule: 'Lihat jadual',
        unitedWorship: 'Pujian Bersama',
        whatsapp: 'WhatsApp',
        copyLink: 'Salin pautan',
        copied: 'Disalin',
        tapToZoom: 'Tekan poster untuk besarkan',
        posterModeBtn: 'Poster Rasmi',
        timelineModeBtn: 'Jadual Teks',
        afterParadeWorshipTag: 'Selepas Perarakan (~8:00 PM+)',
        googleMaps: 'Google Maps',
        waze: 'Waze',
        dateCol: 'Tarikh',
        assemblyCol: 'Berkumpul',
        paradeStartCol: 'Mula Berarak',
        routeCol: 'Laluan',
        afterWorshipCol: 'Pujian Malam',
        worshipTeamsCol: 'Pasukan Gereja',
        poweredBy: 'Dikuasakan oleh ZTO Event OS',
        tipsTitle: 'Panduan Hadirin',
        course: COURSE_UI_BY_LANG.bm,
    },
};

export function normalizeLang(raw: string | null | undefined, supported?: string[], fallback: PortalLang = 'en'): PortalLang {
    const val = (raw || '').toLowerCase();
    const list = Array.isArray(supported) && supported.length ? supported : ['en'];
    if ((val === 'zh' || val === 'en' || val === 'bm') && list.includes(val)) return val;
    if (list.includes(fallback)) return fallback;
    return (list[0] as PortalLang) || 'en';
}

export function fmtDateByLang(d?: string | null, lang: PortalLang = 'en', withWeekday = true): string {
    if (!d) return '';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    if (lang === 'zh') {
        const y = dt.getFullYear();
        const m = dt.getMonth() + 1;
        const day = dt.getDate();
        const wk = ['日', '一', '二', '三', '四', '五', '六'][dt.getDay()];
        return withWeekday ? `${y}年${m}月${day}日 (周${wk})` : `${y}年${m}月${day}日`;
    }
    if (lang === 'bm') {
        const days = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
        const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
        const base = `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
        return withWeekday ? `${days[dt.getDay()]}, ${base}` : base;
    }
    return dt.toLocaleDateString('en-MY', {
        ...(withWeekday ? { weekday: 'short' as const } : {}),
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
