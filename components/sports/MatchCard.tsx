import React from 'react';
import { Player, Match, SponsorAd } from '@/lib/sports/types';
import { BadmintonCard } from './BadmintonCard';
import { PickleballCard } from './PickleballCard';
import { BasketballCard } from './BasketballCard';
import { FootballCard } from './FootballCard';
import { TennisCard } from './TennisCard';

interface MatchCardProps {
    match: Match;
    p1: Player | undefined;
    p2: Player | undefined;
    activeAd?: SponsorAd;
    sportType?: string; // Made optional to support legacy calls, defaults to badminton
    logoUrl?: string; // NEW
    bgUrl?: string; // NEW
    now: Date;
}

export function MatchCard(props: MatchCardProps) {
    const { sportType = 'badminton' } = props;

    // Factory Pattern: Choose the right card based on sport type
    switch (sportType) {
        case 'pickleball':
            return <PickleballCard {...props} />;

        case 'basketball':
            // Render the new basketball card
            return <BasketballCard {...props} />;

        case 'football':
            return <FootballCard {...props} />;

        case 'tennis':
            return <TennisCard {...props} />;

        case 'badminton':
        default:
            return <BadmintonCard {...props} />;
    }
}
