'use client';

import { useState } from 'react';

export default function TeamPage() {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Staff Access');
    const [isInviting, setIsInviting] = useState(false);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setIsInviting(true);
        // Simulate API call for inviting standard user (which would trigger email in production)
        setTimeout(() => {
            alert(`An invitation has been sent to ${inviteEmail} for ${inviteRole}.`);
            setIsInviting(false);
            setShowInviteModal(false);
            setInviteEmail('');
        }, 1000);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 relative">
            <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">Team Collaboration</h1>
                    <p className="text-zinc-400">Manage access and roles.</p>
                </div>
                <button 
                    onClick={() => setShowInviteModal(true)}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-full transition-all flex items-center gap-2 transform hover:scale-105 shadow-lg shadow-amber-500/20"
                >
                    <i className="fa-solid fa-user-plus"></i> Invite Member
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Mock Manager */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl font-bold text-black border-2 border-amber-300">
                        TW
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Tony Wong</h3>
                        <p className="text-amber-500 text-sm font-medium">Tournament Director</p>
                        <span className="text-xs text-zinc-500 mt-1 block">Full Access</span>
                    </div>
                </div>

                {/* Mock Staff */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex items-center gap-4 opacity-75">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-zinc-400 border border-zinc-700">
                        JS
                    </div>
                    <div>
                        <h3 className="font-bold text-zinc-300 text-lg">Jane Smith</h3>
                        <p className="text-zinc-500 text-sm font-medium">Coordinator</p>
                        <span className="text-xs text-zinc-600 mt-1 block">Staff Access</span>
                    </div>
                </div>
            </div>

            <div className="p-8 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-2xl mt-8">
                Team management integration with Auth users coming soon.
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                        <button 
                            onClick={() => setShowInviteModal(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
                        >
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                        
                        <h2 className="text-2xl font-bold text-white mb-2">Invite to Team</h2>
                        <p className="text-zinc-400 text-sm mb-6">Send an email invitation to collaborate on this event.</p>
                        
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Email Address</label>
                                <input 
                                    type="email" 
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 outline-none transition"
                                    placeholder="colleague@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Role</label>
                                <select 
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 outline-none transition appearance-none"
                                >
                                    <option value="Staff Access">Coordinator (Staff Access)</option>
                                    <option value="Manager Access">Manager (Manager Access)</option>
                                    <option value="View Only">Guest (View Only)</option>
                                </select>
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowInviteModal(false)}
                                    className="px-5 py-2.5 text-zinc-400 font-medium hover:text-white transition"
                                    disabled={isInviting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl disabled:opacity-50 transition drop-shadow-md flex items-center gap-2"
                                    disabled={isInviting}
                                >
                                    {isInviting ? (
                                        <>
                                            <i className="fa-solid fa-spinner animate-spin"></i> Sending...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fa-regular fa-paper-plane"></i> Send Invite
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
