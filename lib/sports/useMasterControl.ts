'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useMasterControl(eventId: string | null, role: 'admin' | 'referee' | 'display') {
    const [gameState, setGameState] = useState<any>({ score: [0, 0], lock: false, type: 'general' });
    const [conflictWarning, setConflictWarning] = useState<string | null>(null);
    const [masterCommands, setMasterCommands] = useState<any[]>([]);

    useEffect(() => {
        if (!eventId) return;

        // 1. 赛事沙盒化接入规则引擎 (Room-Based Isolation via Supabase Channels)
        const channel = supabase.channel(`event_${eventId}_sandbox`);

        channel
            .on('broadcast', { event: 'master_command' }, (payload) => {
                const { command, data, target } = payload.payload;

                // Target Routing: Exact target filtering
                if (target === 'all' || target === role) {
                    setMasterCommands(prev => [...prev, payload.payload]);

                    if (command === 'LOCK_UI') {
                        setGameState((prev: any) => ({ ...prev, lock: data.locked }));
                    } else if (command === 'PLAY_FX') {
                        // Display logic can react to this
                        console.log("Master requested FX trigger:", data.pattern);
                    }
                }
            })
            .on('broadcast', { event: 'state_sync' }, (payload) => {
                setGameState(payload.payload.newState);
                setConflictWarning(null); // Clear warnings on master override
            })
            .on('broadcast', { event: 'referee_conflict' }, (payload) => {
                if (role === 'admin') {
                    setConflictWarning(payload.payload.message);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Arena [${eventId}]: Client joined as [${role}]. Sandboxed.`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId, role]);

    const sendCommand = (command: string, data: any, target: 'all' | 'referee' | 'display') => {
        supabase.channel(`event_${eventId}_sandbox`).send({
            type: 'broadcast',
            event: 'master_command',
            payload: { command, data, target }
        });

        // Optimistic UI for Master
        if (command === 'LOCK_UI' && role === 'admin') {
            setGameState((prev: any) => ({ ...prev, lock: data.locked }));
        }
    };

    const emitConflict = (message: string) => {
        supabase.channel(`event_${eventId}_sandbox`).send({
            type: 'broadcast',
            event: 'referee_conflict',
            payload: { message }
        });
    }

    const forceArbitration = (newState: any) => {
        supabase.channel(`event_${eventId}_sandbox`).send({
            type: 'broadcast',
            event: 'state_sync',
            payload: { newState }
        });
        setGameState(newState);
        setConflictWarning(null);
    };

    const clearLatestCommand = () => {
        if (masterCommands.length > 0) {
            setMasterCommands(prev => prev.slice(1));
        }
    };

    return {
        gameState,
        conflictWarning,
        sendCommand,
        forceArbitration,
        masterCommands,
        clearLatestCommand,
        emitConflict
    };
}
