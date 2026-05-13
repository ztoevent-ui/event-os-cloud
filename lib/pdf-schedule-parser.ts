/**
 * PDF Schedule Parser - ZTO Arena
 * Designed for 民都鲁省姓氏匹克球锦标赛 style tournament PDFs
 * Matrix structure: Y-axis = Time Slots, X-axis = Courts
 */

export interface ParsedMatch {
  id: string;
  time_slot: string;        // e.g. "1500-1815"
  start_time: string;       // e.g. "15:00" (HH:MM)
  court_no: number;         // 1-7
  team_a: string;           // Clan name e.g. "陈氏"
  team_b: string;           // Clan name e.g. "林氏"
  match_type: 'MD1' | 'MD2' | 'WD' | 'XD' | 'V' | 'SINGLES' | 'DOUBLES' | 'MIXED' | 'VETERANS';
  match_type_label: string; // Human-readable e.g. "Men's Doubles 1"
  raw_cell: string;         // Original text
  sequence: number;         // Within-slot ordering
}

// Map category codes to DB event_type and labels
export const MATCH_TYPE_MAP: Record<string, { db: ParsedMatch['match_type']; label: string; color: string }> = {
  'MD1':  { db: 'MD1',      label: "男双 1 (MD1)",       color: '#3b82f6' },
  'MD2':  { db: 'MD2',      label: "男双 2 (MD2)",       color: '#6366f1' },
  'WD':   { db: 'WD',       label: "女双 (WD)",          color: '#ec4899' },
  'XD':   { db: 'XD',       label: "混双 (XD)",          color: '#f59e0b' },
  'MXD':  { db: 'XD',       label: "混双 (XD)",          color: '#f59e0b' },
  'V':    { db: 'V',        label: "常青组 (Veterans)",   color: '#10b981' },
  'VET':  { db: 'V',        label: "常青组 (Veterans)",   color: '#10b981' },
};

// Common clan names in Chinese
const CLAN_PATTERNS = [
  '陈氏', '林氏', '黄氏', '李氏', '刘氏', '王氏', '张氏', '吴氏', '郑氏', '杨氏',
  '许氏', '曾氏', '谢氏', '蔡氏', '洪氏', '江氏', '彭氏', '何氏', '萧氏', '钟氏',
  '邱氏', '罗氏', '高氏', '叶氏', '赖氏', '周氏', '廖氏', '温氏', '庄氏', '苏氏',
  // Fallback: also match single-char surnames with 氏 if not in list
];

function parseTimeSlot(raw: string): string {
  // Normalize "1500-1815", "15:00", "3:00PM" etc -> "HH:MM"
  const normalized = raw.replace(/\s/g, '');
  const rangeMatch = normalized.match(/^(\d{4})-\d{4}$/);
  if (rangeMatch) {
    const hhmm = rangeMatch[1];
    return `${hhmm.slice(0, 2)}:${hhmm.slice(2, 4)}`;
  }
  const timeMatch = normalized.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  return '00:00';
}

function detectMatchType(text: string): { db: ParsedMatch['match_type']; label: string } | null {
  const upper = text.toUpperCase();
  for (const [code, meta] of Object.entries(MATCH_TYPE_MAP)) {
    // Match code surrounded by non-alphanumeric chars or at boundaries
    const rx = new RegExp(`(?:^|[^A-Z])${code}(?:$|[^A-Z0-9])`, 'i');
    if (rx.test(upper)) return { db: meta.db, label: meta.label };
  }
  return null;
}

function extractClans(text: string): string[] {
  const clans: string[] = [];
  // 1. Try known patterns
  for (const clan of CLAN_PATTERNS) {
    if (text.includes(clan)) clans.push(clan);
  }
  if (clans.length >= 2) return clans.slice(0, 2);

  // 2. Regex: any N-char Chinese chars followed by 氏
  const clanRx = /[\u4e00-\u9fa5]{1,3}氏/g;
  let m;
  while ((m = clanRx.exec(text)) !== null) {
    if (!clans.includes(m[0])) clans.push(m[0]);
  }
  if (clans.length >= 2) return clans.slice(0, 2);

  // 3. Split by VS/vs/対 and take first "word" from each side
  const vsParts = text.split(/\bvs\.?\b|\bVS\.?\b|対|－|\|/i);
  if (vsParts.length >= 2) {
    const a = vsParts[0].trim().split(/\s+/).filter(Boolean)[0] || '';
    const b = vsParts[1].trim().split(/\s+/).filter(Boolean)[0] || '';
    if (a && b) return [a, b];
  }

  return clans;
}

/**
 * Parse raw text extracted from PDF into structured matches.
 * The text is expected to be extracted page by page with position info.
 */
export function parseScheduleText(rawText: string): ParsedMatch[] {
  const matches: ParsedMatch[] = [];
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // --- Strategy 1: Detect court headers then group cells below ---
  // Look for header row: "Court 1", "Court 2", ...
  let courtHeaders: { courtNo: number; lineIndex: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const courtMatch = line.match(/Court\s*(\d+)/gi);
    if (courtMatch && courtMatch.length >= 2) {
      // This is the header row
      courtHeaders = courtMatch.map((c, idx) => ({
        courtNo: parseInt(c.replace(/[^0-9]/g, ''), 10),
        lineIndex: i
      }));
      break;
    }
  }

  // --- Strategy 2: Line-by-line VS parsing (most reliable for text PDFs) ---
  let currentTimeSlot = '';
  let sequenceInSlot = 0;
  let seqOverall = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect time slot header lines: "1500-1815", "15:00 - 18:15"
    const slotMatch = line.match(/\b(\d{4})\s*[-–]\s*(\d{4})\b/);
    if (slotMatch) {
      currentTimeSlot = `${slotMatch[1]}-${slotMatch[2]}`;
      sequenceInSlot = 0;
      continue;
    }

    // Detect VS matches in the line
    // Pattern: 姓氏 (category) VS 姓氏 (category)  OR  姓氏 VS 姓氏 (category)
    const vsPattern = /([\u4e00-\u9fa5]{1,4}(?:氏)?)\s*(?:\(([A-Z0-9]+)\))?\s*(?:VS|vs)\s*([\u4e00-\u9fa5]{1,4}(?:氏)?)\s*(?:\(([A-Z0-9]+)\))?/gi;
    let vsMatch;
    while ((vsMatch = vsPattern.exec(line)) !== null) {
      const teamA = vsMatch[1];
      const catA = vsMatch[2] || '';
      const teamB = vsMatch[3];
      const catB = vsMatch[4] || catA;
      const category = catA || catB;

      const typeMeta = detectMatchType(category || line) || { db: 'SINGLES' as const, label: 'Singles' };

      // Try to detect court number from surrounding context
      let courtNo = 1;
      const courtInLine = line.match(/[Cc]ourt\s*(\d+)/);
      const courtBefore = lines[Math.max(0, i - 1)].match(/[Cc]ourt\s*(\d+)/);
      if (courtInLine) courtNo = parseInt(courtInLine[1]);
      else if (courtBefore) courtNo = parseInt(courtBefore[1]);

      sequenceInSlot++;
      seqOverall++;

      matches.push({
        id: `parsed-${seqOverall}`,
        time_slot: currentTimeSlot || 'TBD',
        start_time: parseTimeSlot(currentTimeSlot || '0000'),
        court_no: courtNo,
        team_a: teamA || 'TBD',
        team_b: teamB || 'TBD',
        match_type: typeMeta.db as ParsedMatch['match_type'],
        match_type_label: typeMeta.label,
        raw_cell: line,
        sequence: sequenceInSlot,
      });
    }

    // Also check for lines that mention "Court X" then have clan info (multi-line cells)
    const courtNum = line.match(/^(?:Court|court)\s*(\d+)\s*$/);
    if (courtNum) {
      // Look ahead for match info in next few lines
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j];
        const clans = extractClans(nextLine);
        const typeMeta = detectMatchType(nextLine);
        if (clans.length >= 2 && typeMeta) {
          sequenceInSlot++;
          seqOverall++;
          matches.push({
            id: `parsed-${seqOverall}`,
            time_slot: currentTimeSlot || 'TBD',
            start_time: parseTimeSlot(currentTimeSlot || '0000'),
            court_no: parseInt(courtNum[1]),
            team_a: clans[0],
            team_b: clans[1],
            match_type: typeMeta.db as ParsedMatch['match_type'],
            match_type_label: typeMeta.label,
            raw_cell: nextLine,
            sequence: sequenceInSlot,
          });
          i = j; // Skip processed lines
          break;
        }
      }
    }
  }

  // Deduplicate by (time_slot, team_a, team_b, match_type)
  const seen = new Set<string>();
  return matches.filter(m => {
    const key = `${m.time_slot}|${m.team_a}|${m.team_b}|${m.match_type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function matchesToDbRows(
  parsedMatches: ParsedMatch[],
  tournamentId: string
): Record<string, unknown>[] {
  return parsedMatches.map(m => ({
    tournament_id: tournamentId,
    event_type: m.match_type,
    round_type: 'GROUP',
    court_number: m.court_no,
    team_a_name: m.team_a,
    team_b_name: m.team_b,
    status: 'PENDING',
    bracket_match_id: `${m.time_slot}-C${m.court_no}-${m.match_type}-${m.sequence}`,
    // Store time slot in bracket_match_id for sorting; referees can see it
    sets_scores: [],
    score_a: 0,
    score_b: 0,
    current_set: 1,
  }));
}
