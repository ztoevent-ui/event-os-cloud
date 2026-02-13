'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Match, Player, Tournament } from './types';

export function useSportsState(targetTournamentId?: string | null) {
    const [matches, setMatches] = useState<Match[]>([]);
    const [players, setPlayers] = useState<Record<string, Player>>({});
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [allTournaments, setAllTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    const [ads, setAds] = useState<any[]>([]);

    // Changes: Use a Ref to store the current tournament ID so subscriptions access the LATEST value
    const activeTournamentIdRef = useState<{ id: string | null }>({ id: null })[0];

    useEffect(() => {
        // Sync ref with state/props
        if (tournament) activeTournamentIdRef.id = tournament.id;
        else if (targetTournamentId) activeTournamentIdRef.id = targetTournamentId;
    }, [tournament, targetTournamentId]);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('public:matches')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, (payload) => {
                console.log('Match update:', payload);
                // Invalidate/Refetch using the REF to ensure we get data for the CURRENT tournament
                fetchData(true);
            })
            .subscribe();

        const adChannel = supabase
            .channel('public:sponsor_ads')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsor_ads' }, (payload) => {
                console.log('Ad update:', payload);
                fetchData(true);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(adChannel);
        };
    }, []);

    const fetchData = async (isUpdate = false) => {
        if (!isUpdate) loading && setLoading(true); // Don't show full loading spinner on background updates

        // Fetch ALL active tournaments
        const { data: tourneyData } = await supabase
            .from('tournaments')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (tourneyData) {
            setAllTournaments(tourneyData);

            // Determine Target
            let targetTourney = tourneyData[0];

            // Critical: Use Ref if available (for updates), otherwise Props, otherwise State
            const currentId = activeTournamentIdRef.id || targetTournamentId || (tournament ? tournament.id : null);

            if (currentId) {
                targetTourney = tourneyData.find(t => t.id === currentId) || tourneyData[0];
            }

            if (targetTourney) {
                // Update Ref
                activeTournamentIdRef.id = targetTourney.id;

                if (!isUpdate && (!tournament || tournament.id !== targetTourney.id)) {
                    setTournament(targetTourney);
                }

                // Fetch Matches
                const { data: matchesData } = await supabase
                    .from('matches')
                    .select('*')
                    .eq('tournament_id', targetTourney.id)
                    .order('created_at', { ascending: true });

                if (matchesData) setMatches(matchesData);

                // Fetch Players
                const { data: playersData } = await supabase
                    .from('players')
                    .select('*')
                    .eq('tournament_id', targetTourney.id);

                if (playersData) {
                    const pMap: Record<string, Player> = {};
                    playersData.forEach((p: Player) => pMap[p.id] = p);
                    setPlayers(pMap);
                }

                // Fetch Ads
                const { data: adsData } = await supabase
                    .from('sponsor_ads')
                    .select('*')
                    .eq('tournament_id', targetTourney.id)
                    .eq('is_active', true);

                if (adsData) setAds(adsData);
            } else {
                setTournament(null);
            }
        }
        if (!isUpdate) setLoading(false);
    };

    const switchTournament = (tourneyId: string) => {
        const target = allTournaments.find(t => t.id === tourneyId);
        if (target) {
            setTournament(target);
            activeTournamentIdRef.id = target.id; // Update ref immediately
            reloadForTournament(target);
        }
    };

    const reloadForTournament = async (targetTourney: Tournament) => {
        setLoading(true);
        // ... (rest of logic same, just explicitly fetching for the target)
        activeTournamentIdRef.id = targetTourney.id;

        const { data: matchesData } = await supabase.from('matches').select('*').eq('tournament_id', targetTourney.id).order('created_at', { ascending: true });
        if (matchesData) setMatches(matchesData);

        const { data: playersData } = await supabase.from('players').select('*').eq('tournament_id', targetTourney.id);
        if (playersData) {
            const pMap: Record<string, Player> = {};
            playersData.forEach((p: Player) => pMap[p.id] = p);
            setPlayers(pMap);
        }

        const { data: adsData } = await supabase.from('sponsor_ads').select('*').eq('tournament_id', targetTourney.id).eq('is_active', true);
        if (adsData) setAds(adsData);

        setLoading(false);
    };

    const updateScore = async (matchId: string, updates: Partial<Match>) => {
        const { error } = await supabase
            .from('matches')
            .update(updates)
            .eq('id', matchId);

        if (error) console.error("Error updating score:", error);
    };

    const endCurrentTournament = async () => {
        if (!tournament) return;
        await supabase.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
        setTournament(null);
        activeTournamentIdRef.id = null;
        setMatches([]);
        setPlayers({});
        setAds([]);
        fetchData();
    };

    const createTournament = async (payload: {
        name: string,
        type: string,
        config?: any,
        players?: { name: string, avatar_url: string }[]
    }) => {
        setLoading(true);
        const { name, type, config, players: customPlayers } = payload;

        // 1. Create new
        const { data: newTourney, error } = await supabase
            .from('tournaments')
            .insert({
                name,
                type,
                status: 'active',
                config: config || {}
            })
            .select()
            .single();

        if (error || !newTourney) {
            console.error('Failed to create tournament', error);
            setLoading(false);
            return;
        }

        // 2. Roster Insertion (New Logic)
        let roster: any[] = [];
        if (config?.teams && config.teams.length > 0) {
            // "Team" entity becomes a "Player" record for the system
            roster = config.teams.map((t: any) => ({
                tournament_id: newTourney.id,
                name: t.name, // "Player A" or "A / B"
                avatar_url: t.avatar_url || null
            }));
        } else if (customPlayers && customPlayers.length > 0) {
            // Legacy/Simple support
            roster = customPlayers.map(p => ({ ...p, tournament_id: newTourney.id }));
        }

        // If no roster provided, FALLBACK to Demo Data (Legacy Mode)
        if (roster.length === 0) {
            if (type === 'badminton') {
                roster.push(
                    { tournament_id: newTourney.id, name: 'Lee Zii Jia', avatar_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Lee_Zii_Jia_at_French_Open_2024.jpg/800px-Lee_Zii_Jia_at_French_Open_2024.jpg' },
                    { tournament_id: newTourney.id, name: 'Shi Yu Qi', avatar_url: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Shi_Yuqi_-_2022_French_Open_Badminton.jpg' }
                );
            } else if (type === 'pickleball') {
                roster.push(
                    { tournament_id: newTourney.id, name: 'Ben Johns', avatar_url: 'https://placehold.co/400x600/1e40af/ffffff?text=Ben+Johns' },
                    { tournament_id: newTourney.id, name: 'Tyson McGuffin', avatar_url: 'https://placehold.co/400x600/166534/ffffff?text=Tyson+Mc' }
                );
            } else if (type === 'basketball') {
                roster.push(
                    { tournament_id: newTourney.id, name: 'Lakers', avatar_url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg' },
                    { tournament_id: newTourney.id, name: 'Celtics', avatar_url: 'https://upload.wikimedia.org/wikipedia/en/8/8f/Boston_Celtics.svg' }
                );
            } else if (type === 'football') {
                roster.push(
                    { tournament_id: newTourney.id, name: 'Man United', avatar_url: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg' },
                    { tournament_id: newTourney.id, name: 'Liverpool', avatar_url: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg' }
                );
            } else if (type === 'tennis') {
                roster.push(
                    { tournament_id: newTourney.id, name: 'Novak Djokovic', avatar_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Novak_Djokovic_US_Open_2023.jpg/800px-Novak_Djokovic_US_Open_2023.jpg' },
                    { tournament_id: newTourney.id, name: 'Carlos Alcaraz', avatar_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Carlos_Alcaraz_Wimbledon_2023.jpg/800px-Carlos_Alcaraz_Wimbledon_2023.jpg' }
                );
            }
        }

        // Insert Players
        let p1: any, p2: any;
        if (roster.length > 0) {
            const { data: p } = await supabase.from('players').insert(roster).select();
            // If it was a demo setup (2 players), capture them for the default match
            if (p && roster.length === 2 && !config?.teams) {
                p1 = p[0]; p2 = p[1];
            }
        }

        // 3. Create Default Match ONLY if it was a Demo/Quick setup (p1 & p2 exist)
        if (p1 && p2) {
            const matchData: any = {
                tournament_id: newTourney.id,
                player1_id: p1.id,
                player2_id: p2.id,
                round_name: 'Final',
                court_id: 'Center Court',
                status: 'ongoing',
                current_score_p1: 0,
                current_score_p2: 0,
                sets_p1: 0,
                sets_p2: 0,
                serving_player_id: p1.id
            };

            // Defaults based on type
            if (type === 'football') {
                matchData.timer_seconds = 0;
                matchData.current_period = 1;
                matchData.is_paused = true;
            } else if (type === 'basketball') {
                matchData.timer_seconds = 720;
                matchData.current_period = 1;
                matchData.is_paused = true;
            }

            await supabase.from('matches').insert(matchData);
        }

        // Add Default Ad
        await supabase.from('sponsor_ads').insert({
            tournament_id: newTourney.id,
            type: 'image',
            url: 'https://via.placeholder.com/600x200?text=SPONSOR',
            duration: 10,
            is_active: true,
            display_location: 'banner'
        });

        // Trigger refetch
        if (!tournament) {
            setTournament(newTourney); // Immediate switch if none selected
        }
        fetchData();
    };

    const addAd = async (ad: any) => {
        if (!tournament) return;
        const { error } = await supabase.from('sponsor_ads').insert({
            ...ad,
            tournament_id: tournament.id,
            is_active: true
        });
        if (error) console.error("Error adding ad", error);
        fetchData();
    };

    const deleteAd = async (adId: string) => {
        const { error } = await supabase.from('sponsor_ads').delete().eq('id', adId);
        if (error) console.error("Error deleting ad", error);
        fetchData();
    };

    const toggleAd = async (adId: string, currentState: boolean) => {
        const { error } = await supabase.from('sponsor_ads').update({ is_active: !currentState }).eq('id', adId);
        if (error) console.error("Error toggling ad", error);
        fetchData();
    };

    return { matches, players, tournament, allTournaments, switchTournament, ads, loading, updateScore, refresh: fetchData, createTournament, endCurrentTournament, addAd, deleteAd, toggleAd };
}
