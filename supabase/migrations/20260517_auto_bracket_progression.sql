-- =====================================================
-- AUTO BRACKET PROGRESSION
-- Resolves Semi-Final Ties and pushes to Finals & 3rd Place
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_tie_progression()
RETURNS TRIGGER AS $$
DECLARE
    v_wins_a INT;
    v_wins_b INT;
    v_winner_clan_id UUID;
    v_winner_name TEXT;
    v_loser_clan_id UUID;
    v_loser_name TEXT;
BEGIN
    -- Only act if a match just completed
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        
        -- Only act if this is a semi-final
        IF NEW.round_type = 'SEMIFINALS' AND NEW.group_id IN ('SF-1', 'SF-2') THEN
            
            -- Count wins for Clan A (sets_won_a > sets_won_b)
            SELECT COUNT(*) INTO v_wins_a
            FROM public.arena_matches
            WHERE tournament_id = NEW.tournament_id
              AND group_id = NEW.group_id
              AND status = 'COMPLETED'
              AND sets_won_a > sets_won_b;
              
            -- Count wins for Clan B (sets_won_b > sets_won_a)
            SELECT COUNT(*) INTO v_wins_b
            FROM public.arena_matches
            WHERE tournament_id = NEW.tournament_id
              AND group_id = NEW.group_id
              AND status = 'COMPLETED'
              AND sets_won_b > sets_won_a;

            -- Check if anyone reached 3 wins
            IF v_wins_a >= 3 THEN
                v_winner_clan_id := NEW.clan_a_id;
                v_winner_name := NEW.team_a_name;
                v_loser_clan_id := NEW.clan_b_id;
                v_loser_name := NEW.team_b_name;
            ELSIF v_wins_b >= 3 THEN
                v_winner_clan_id := NEW.clan_b_id;
                v_winner_name := NEW.team_b_name;
                v_loser_clan_id := NEW.clan_a_id;
                v_loser_name := NEW.team_a_name;
            END IF;

            -- If we have a winner, push to the next rounds
            IF v_winner_clan_id IS NOT NULL THEN
                
                -- If SF-1 resolved, put winner into team A slot of FINALS and loser into team A slot of 3RD-PLACE
                IF NEW.group_id = 'SF-1' THEN
                    -- Update FINALS (Team A)
                    UPDATE public.arena_matches
                    SET clan_a_id = v_winner_clan_id,
                        team_a_name = v_winner_name
                    WHERE tournament_id = NEW.tournament_id
                      AND group_id = 'FINALS';
                      
                    -- Update 3RD-PLACE (Team A)
                    UPDATE public.arena_matches
                    SET clan_a_id = v_loser_clan_id,
                        team_a_name = v_loser_name
                    WHERE tournament_id = NEW.tournament_id
                      AND group_id = '3RD-PLACE';
                      
                -- If SF-2 resolved, put winner into team B slot of FINALS and loser into team B slot of 3RD-PLACE
                ELSIF NEW.group_id = 'SF-2' THEN
                    -- Update FINALS (Team B)
                    UPDATE public.arena_matches
                    SET clan_b_id = v_winner_clan_id,
                        team_b_name = v_winner_name
                    WHERE tournament_id = NEW.tournament_id
                      AND group_id = 'FINALS';
                      
                    -- Update 3RD-PLACE (Team B)
                    UPDATE public.arena_matches
                    SET clan_b_id = v_loser_clan_id,
                        team_b_name = v_loser_name
                    WHERE tournament_id = NEW.tournament_id
                      AND group_id = '3RD-PLACE';
                END IF;
                
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_tie_progression ON public.arena_matches;
CREATE TRIGGER trigger_check_tie_progression
    AFTER UPDATE ON public.arena_matches
    FOR EACH ROW
    EXECUTE FUNCTION public.check_tie_progression();
