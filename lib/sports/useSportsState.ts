'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Match, Player, Tournament } from './types';

export function useSportsState() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [players, setPlayers] = useState<Record<string, Player>>({});
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);

    const [ads, setAds] = useState<any[]>([]);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('public:matches')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
                console.log('Match update:', payload);
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch active tournament
        const { data: tourneyData } = await supabase
            .from('tournaments')
            .select('*')
            .eq('status', 'active')
            .single();

        if (tourneyData) {
            setTournament(tourneyData);

            // Fetch Matches
            const { data: matchesData } = await supabase
                .from('matches')
                .select('*')
                .eq('tournament_id', tourneyData.id)
                .order('created_at', { ascending: true });

            if (matchesData) setMatches(matchesData);

            // Fetch Players
            const { data: playersData } = await supabase
                .from('players')
                .select('*')
                .eq('tournament_id', tourneyData.id);

            if (playersData) {
                const pMap: Record<string, Player> = {};
                playersData.forEach((p: Player) => pMap[p.id] = p);
                setPlayers(pMap);
            }

            // Fetch Ads
            const { data: adsData } = await supabase
                .from('sponsor_ads')
                .select('*')
                .eq('tournament_id', tourneyData.id)
                .eq('is_active', true);

            if (adsData) setAds(adsData);
        }
        setLoading(false);
    };

    const updateScore = async (matchId: string, updates: Partial<Match>) => {
        const { error } = await supabase
            .from('matches')
            .update(updates)
            .eq('id', matchId);

        if (error) console.error("Error updating score:", error);
    };

    return { matches, players, tournament, ads, loading, updateScore, refresh: fetchData };
}
