'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Project = any;

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [showPast, setShowPast] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: '',
        type: 'corporate',
        start_date: '',
        end_date: '',
        venue: '',
    });

    const deleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`确定要删除 "${projectName}" 吗？此操作无法撤销。`)) return;
        const { error } = await supabase.from('projects').delete().eq('id', projectId);
        if (error) alert('删除失败: ' + error.message);
        else setProjects(prev => prev.filter(p => p.id !== projectId));
    };

    const createProject = async () => {
        if (!formData.name.trim()) { alert('请输入活动名称'); return; }
        setCreating(true);
        const { data, error } = await supabase.from('projects').insert({
            name: formData.name.trim(),
            type: formData.type,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null,
            venue: formData.venue || null,
            status: 'planning',
        }).select().single();

        if (error) {
            alert('创建失败: ' + error.message);
            setCreating(false);
        } else {
            setShowModal(false);
            setFormData({ name: '', type: 'corporate', start_date: '', end_date: '', venue: '' });
            setCreating(false);
            router.push(`/projects/${data.id}`);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    const fetchProjects = async () => {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setProjects(data || []);
        setLoading(false);
    };

    const typeIcon = (type: string) => {
        if (type === 'wedding' || type === 'wedding_fair') return 'fa-regular fa-heart';
        if (type === 'corporate') return 'fa-regular fa-building';
        return 'fa-regular fa-calendar-check';
    };
    const typeColor = (type: string) => {
        if (type === 'wedding' || type === 'wedding_fair') return '#ec4899';
        if (type === 'corporate') return '#3b82f6';
        return '#10b981';
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredProjects = projects.filter(project => {
        if (showPast) return true;
        const refDateStr = project.end_date || project.start_date;
        if (!refDateStr) return true; // Keep projects without dates
        const refDate = new Date(refDateStr);
        return refDate >= today;
    });

    return (
        <div className="page-transition" style={{
            minHeight: '100vh',
            background: '#050505',
            fontFamily: 'Urbanist, sans-serif',
            color: '#E5E5E5',
        }}>
            {/* ── Header ── */}
            <header style={{
                maxWidth: 1400,
                margin: '0 auto',
                padding: '40px 40px 0',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 20,
                marginBottom: 40,
                paddingBottom: 32,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
                <div>
                    <div className="zto-label" style={{ marginBottom: 8 }}>Internal Network</div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                        Event Manager
                    </h1>
                    <p className="zto-desc" style={{ marginTop: 6 }}>Oversee and coordinate active deployments.</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginRight: 8 }}>
                        <input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} style={{ accentColor: '#0056B3' }} /> 
                        Include Past
                    </label>
                    <Link href="/dashboard" className="zto-btn zto-btn-ghost" style={{ textDecoration: 'none' }}>
                        <i className="fa-solid fa-arrow-left" /> Dashboard
                    </Link>
                    <button onClick={() => setShowModal(true)} className="zto-btn zto-btn-primary">
                        <i className="fa-solid fa-plus" /> Deploy Event
                    </button>
                </div>
            </header>

            {/* ── Content ── */}
            <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px 80px' }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, opacity: 0.5 }}>
                        <div style={{
                            width: 44, height: 44,
                            border: '2px solid rgba(0,86,179,0.2)',
                            borderTopColor: '#0056B3',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                        <p style={{ color: '#0056B3', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                            Synchronizing Nodes...
                        </p>
                        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>

                ) : projects.length === 0 ? (
                    <div className="zto-card" style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
                        <div style={{
                            width: 56, height: 56,
                            borderRadius: 16,
                            background: 'rgba(0,86,179,0.08)',
                            border: '1px solid rgba(0,86,179,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22, color: '#0056B3',
                            margin: '0 auto 20px',
                        }}>
                            <i className="fa-solid fa-layer-group" />
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No Active Deployments</h3>
                        <p className="zto-desc" style={{ marginBottom: 28 }}>
                            Initialize your first event project to orchestrate tasks, coordinate vendors, and deploy operations.
                        </p>
                        <button onClick={() => setShowModal(true)} className="zto-btn zto-btn-primary">
                            <i className="fa-solid fa-bolt" /> Initialize Project
                        </button>
                    </div>

                ) : filteredProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.4)' }}>
                        <i className="fa-solid fa-folder-open" style={{ fontSize: 32, marginBottom: 16, opacity: 0.5 }} />
                        <p>No active deployments found.</p>
                        <button onClick={() => setShowPast(true)} className="zto-btn zto-btn-ghost" style={{ marginTop: 12 }}>Show Past Events</button>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: 16,
                    }}>
                        {filteredProjects.map(project => {
                            const ic = typeIcon(project.type);
                            const col = typeColor(project.type);
                            const isActive = project.status !== 'completed';
                            return (
                                <Link key={project.id} href={`/projects/${project.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                                    <div
                                        className="zto-card"
                                        style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease', padding: 20 }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                                            (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,86,179,0.6)';
                                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px -10px rgba(0,86,179,0.3)';
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLDivElement).style.transform = '';
                                            (e.currentTarget as HTMLDivElement).style.borderColor = '';
                                            (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                                        }}
                                    >
                                        {/* Top */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: 10,
                                                background: `${col}12`,
                                                border: `1px solid ${col}30`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 15, color: col,
                                            }}>
                                                <i className={ic} />
                                            </div>
                                            <span className={`zto-badge ${isActive ? 'zto-badge-lime' : 'zto-badge-blue'}`}>
                                                {isActive && <span className="zto-pulse-dot lime" style={{ width: 5, height: 5 }} />}
                                                {project.status || 'PLANNING'}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 10, lineHeight: 1.3 }}>
                                            {project.name}
                                        </h3>

                                        {/* Meta */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#DEFF9A' }}>
                                                <i className="fa-regular fa-clock" style={{ width: 14, color: 'rgba(255,255,255,0.3)' }} />
                                                {project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB') : 'TBD'}
                                            </div>
                                            {project.venue && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                                    <i className="fa-solid fa-location-crosshairs" style={{ width: 14, color: 'rgba(255,255,255,0.3)' }} />
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.venue}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom bar */}
                                        <div style={{
                                            marginTop: 16,
                                            paddingTop: 12,
                                            borderTop: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}>
                                            <button
                                                onClick={e => deleteProject(e, project.id, project.name)}
                                                className="zto-btn zto-btn-danger"
                                                style={{ padding: '6px 10px', fontSize: 11 }}
                                                title="Delete Project"
                                            >
                                                <i className="fa-regular fa-trash-can" />
                                            </button>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span className="zto-label">Enter</span>
                                                <div style={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 10, color: 'rgba(255,255,255,0.4)',
                                                }}>
                                                    <i className="fa-solid fa-arrow-right" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 20,
                }}>
                    {/* Backdrop */}
                    <div
                        onClick={() => setShowModal(false)}
                        style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(5,5,5,0.85)',
                            backdropFilter: 'blur(8px)',
                        }}
                    />

                    {/* Modal Card */}
                    <div className="zto-card page-transition" style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: 520,
                        zIndex: 10,
                    }}>
                        {/* Close */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="zto-btn zto-btn-ghost"
                            style={{
                                position: 'absolute', top: 20, right: 20,
                                padding: '6px 10px', fontSize: 13,
                            }}
                        >
                            <i className="fa-solid fa-xmark" />
                        </button>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span className="zto-pulse-dot lime" />
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Initialize Project</h2>
                        </div>
                        <p className="zto-desc" style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                            Configure root parameters. Metadata can be altered post-deployment.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div>
                                <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>Project Classification *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. OPERATION NEBULA 2026"
                                    className="zto-input"
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && createProject()}
                                />
                            </div>

                            <div>
                                <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>Protocol Type</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="zto-select"
                                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '1em' }}
                                >
                                    <option value="corporate" style={{ background: '#0a0a0a' }}>Corporate Node</option>
                                    <option value="wedding" style={{ background: '#0a0a0a' }}>Wedding Protocol</option>
                                    <option value="wedding_fair" style={{ background: '#0a0a0a' }}>Wedding Fair</option>
                                    <option value="sports" style={{ background: '#0a0a0a' }}>Sports Matrix</option>
                                    <option value="dinner" style={{ background: '#0a0a0a' }}>Gala Banquet</option>
                                    <option value="other" style={{ background: '#0a0a0a' }}>Uncategorized</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>T=Zero (Start)</label>
                                    <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="zto-input" style={{ colorScheme: 'dark' }} />
                                </div>
                                <div>
                                    <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>T=End (Completion)</label>
                                    <input type="date" value={formData.end_date} onChange={e => setFormData({ ...formData, end_date: e.target.value })} className="zto-input" style={{ colorScheme: 'dark' }} />
                                </div>
                            </div>

                            <div>
                                <label className="zto-label" style={{ display: 'block', marginBottom: 8 }}>Sector / Venue</label>
                                <input
                                    type="text"
                                    value={formData.venue}
                                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                                    placeholder="e.g. Parkcity Sector-4"
                                    className="zto-input"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                            <button onClick={() => setShowModal(false)} className="zto-btn zto-btn-ghost" style={{ flex: 1 }}>
                                Abort
                            </button>
                            <button onClick={createProject} disabled={creating} className="zto-btn zto-btn-primary" style={{ flex: 2 }}>
                                {creating
                                    ? <><i className="fa-solid fa-circle-notch fa-spin" /> Initializing...</>
                                    : <><i className="fa-solid fa-bolt" /> Deploy Project</>
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
