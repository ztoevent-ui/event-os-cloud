'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

import { GuildTeamItemForm } from './components/GuildTeamItemForm';
import { GuildTeamSemiFreeForm } from './components/GuildTeamSemiFreeForm';
import { BusinessProItemForm } from './components/BusinessProItemForm';
import { GeneralEventForm } from './components/GeneralEventForm';
import { EventPortal, RegState } from './components/portal/EventPortal';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function RegistrationPage() {
    const params = useParams();
    const rawId = params?.id as string;

    const [settings, setSettings] = useState<any>(null);
    const [project, setProject] = useState<any>(null);
    const [resolvedProjectId, setResolvedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuccess, setIsSuccess] = useState(false);
    const [successSummary, setSuccessSummary] = useState<any>(null);

    useEffect(() => {
        if (rawId) resolveAndLoad(rawId);
    }, [rawId]);

    const resolveAndLoad = async (idOrSlug: string) => {
        let projectId = idOrSlug;

        if (!UUID_REGEX.test(idOrSlug)) {
            const { data: slugData } = await supabase
                .from('tournament_settings')
                .select('project_id')
                .eq('page_slug', idOrSlug)
                .maybeSingle();
            if (!slugData) {
                setIsLoading(false);
                return;
            }
            projectId = slugData.project_id;
        }

        setResolvedProjectId(projectId);

        const [{ data: projData }, { data: tsData }] = await Promise.all([
            supabase.from('projects').select('*').eq('id', projectId).maybeSingle(),
            supabase.from('tournament_settings').select('*').eq('project_id', projectId).maybeSingle(),
        ]);

        if (projData) setProject(projData);

        if (tsData || projData) {
            const isTournamentProj = projData?.type === 'tournament' || projData?.type === 'sports';
            const defaultTemplate = isTournamentProj ? 'business_pro_item' : 'general_event';
            setSettings({
                ...(tsData || {}),
                slogan: tsData?.slogan || projData?.name || 'Event Registration',
                theme_color: tsData?.theme_color || '#f59e0b',
                template_type: tsData?.template_type || defaultTemplate,
                venue_name: tsData?.venue_name || projData?.venue || '',
                fields_config: {
                    show_team_name: true,
                    show_phone: true,
                    show_email: true,
                    show_ic_passport: true,
                    requires_gender: false,
                    show_tshirt_size: false,
                    show_dietary: false,
                    allow_companions: false,
                    ...(tsData?.fields_config || {}),
                },
            });
        }

        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#07080b] flex justify-center items-center text-zinc-400 font-bold text-sm">
                <i className="fa-solid fa-circle-notch fa-spin mr-3 text-amber-500 text-lg" />
                Loading event...
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="min-h-screen bg-[#07080b] flex flex-col justify-center items-center text-zinc-400 p-6 text-center">
                <i className="fa-solid fa-link-slash text-4xl text-zinc-700 mb-4" />
                <div className="text-xl font-black text-white uppercase tracking-wider mb-2">Event Not Found</div>
                <p className="text-xs text-zinc-500">Please check the link provided by the event organiser.</p>
            </div>
        );
    }

    const accent = settings.theme_color || '#f59e0b';
    const now = new Date();
    const closeDateMs = settings.reg_close_date
        ? new Date(String(settings.reg_close_date).includes('T') ? settings.reg_close_date : `${settings.reg_close_date}T23:59:59`).getTime()
        : null;
    const regState: RegState =
        settings.reg_open_date && now < new Date(settings.reg_open_date)
            ? 'not_open'
            : closeDateMs !== null && !Number.isNaN(closeDateMs) && now.getTime() > closeDateMs
              ? 'closed'
              : 'open';

    if (isSuccess) {
        const rows: [string, any][] = successSummary
            ? [
                  ['Participant', successSummary.name],
                  ['Race BIB name', successSummary.bibName],
                  ['Club / organisation', successSummary.organization],
                  ['Category', successSummary.category],
                  ['Jersey size', successSummary.tshirtSize],
                  ['Total pax', successSummary.totalPax ? `${successSummary.totalPax} pax` : null],
              ]
            : [];
        return (
            <div className="min-h-screen bg-[#07080b] flex justify-center items-center text-zinc-300 p-6">
                <div className="text-center bg-zinc-900 border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl max-w-lg w-full">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${accent}20`, color: accent }}>
                        <i className="fa-solid fa-check text-4xl" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-3">Registration received!</h2>
                    <p className="text-zinc-400 text-sm mb-6">
                        Thank you for registering for <span className="text-white font-bold">{settings.slogan}</span>.
                        {settings.fields_config?.show_payment_receipt ? ' We will verify your payment and confirm via WhatsApp / email.' : ''}
                    </p>

                    {successSummary && (
                        <div className="bg-black/50 border border-white/10 rounded-2xl p-5 mb-6 text-left space-y-2.5 text-xs">
                            {rows.filter(([, v]) => v).map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-4">
                                    <span className="text-zinc-500 uppercase font-bold">{k}</span>
                                    <span className="text-white font-bold text-right">{v}</span>
                                </div>
                            ))}
                            {typeof successSummary.totalFee === 'number' && successSummary.totalFee > 0 && (
                                <div className="flex justify-between pt-2.5 border-t border-white/10">
                                    <span className="text-zinc-400 uppercase font-black">Total fee</span>
                                    <span className="font-black text-sm" style={{ color: accent }}>RM {successSummary.totalFee.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-[11px] text-zinc-500 mb-6">Please screenshot this page for your reference.</p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setIsSuccess(false); setSuccessSummary(null); window.scrollTo({ top: 0 }); }}
                            className="px-4 py-3.5 rounded-xl text-xs font-bold text-white border border-white/15 hover:bg-white/5 cursor-pointer"
                        >
                            Back to event page
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-3.5 text-black font-black uppercase tracking-wider rounded-xl hover:opacity-90 text-xs cursor-pointer"
                            style={{ backgroundColor: accent }}
                        >
                            Register another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const done = (summary?: any) => {
        setSuccessSummary(summary || null);
        setIsSuccess(true);
        window.scrollTo({ top: 0 });
    };

    return (
        <EventPortal project={project} settings={settings} regState={regState}>
            {settings.template_type === 'general_event' && (
                <GeneralEventForm projectId={resolvedProjectId!} config={settings} onSuccess={done} />
            )}
            {settings.template_type === 'guild_team_item' && (
                <GuildTeamItemForm projectId={resolvedProjectId!} config={settings} onSuccess={() => done()} />
            )}
            {settings.template_type === 'guild_team_semi_free' && (
                <GuildTeamSemiFreeForm projectId={resolvedProjectId!} config={settings} onSuccess={() => done()} />
            )}
            {settings.template_type === 'business_pro_item' && (
                <BusinessProItemForm projectId={resolvedProjectId!} config={settings} onSuccess={() => done()} />
            )}
        </EventPortal>
    );
}
