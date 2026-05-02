import type { KarigarColumnKey, KarigarJob } from "@/lib/api";

/** Purity of hallmark karat: K/24 (e.g. 18K → 0.75 fine). */
export function karatToFineFraction(karat: number): number {
  if (!Number.isFinite(karat) || karat <= 0 || karat > 24) return 0;
  return karat / 24;
}

/** Hallmark-style purity % (e.g. 22K → 91.67%). */
export function karatToPurityPercent(karat: number): number {
  return karatToFineFraction(karat) * 100;
}

export type ParsedGoldSegment = {
  grossGrams: number;
  karat: number;
  fineGrams: number;
};

const GOLD_SEGMENT =
  /(\d+(?:\.\d+)?)\s*g(?:rams?)?\s*(?:[Gg]old\s+)?(\d{1,2})\s*[Kk](?![0-9.])/g;

/**
 * Extract gold segments from free-text material lines (e.g. "100g 18K", "45g Gold 22K + stones").
 * Cross-karat: each segment carries its own karat; fine gold = gross × (karat/24).
 */
export function parseGoldSegmentsFromMaterial(material: string): ParsedGoldSegment[] {
  const text = String(material ?? "").trim();
  if (!text) return [];

  const out: ParsedGoldSegment[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(GOLD_SEGMENT.source, "gi");
  while ((m = re.exec(text)) !== null) {
    const gross = Number(m[1]);
    const karat = Number(m[2]);
    if (!Number.isFinite(gross) || gross <= 0) continue;
    if (!Number.isFinite(karat) || karat <= 0 || karat > 24) continue;
    const purity = karatToFineFraction(karat);
    out.push({
      grossGrams: gross,
      karat,
      fineGrams: gross * purity,
    });
  }
  return out;
}

export function sumFineGoldGrams(segments: ParsedGoldSegment[]): number {
  return segments.reduce((s, x) => s + x.fineGrams, 0);
}

export function sumGrossGoldGrams(segments: ParsedGoldSegment[]): number {
  return segments.reduce((s, x) => s + x.grossGrams, 0);
}

function columnOfJob(job: KarigarJob, boardLookup: Map<number, KarigarColumnKey>): KarigarColumnKey {
  const fromJob = job.columnKey;
  if (fromJob === "assigned" || fromJob === "inProgress" || fromJob === "completed") return fromJob;
  const id = job.id;
  return boardLookup.get(id) ?? "assigned";
}

/** Build job id → column from current board (authoritative when columnKey missing on job). */
export function karigarJobColumnMap(board: {
  assigned: KarigarJob[];
  inProgress: KarigarJob[];
  completed: KarigarJob[];
}): Map<number, KarigarColumnKey> {
  const m = new Map<number, KarigarColumnKey>();
  for (const j of board.assigned) m.set(j.id, "assigned");
  for (const j of board.inProgress) m.set(j.id, "inProgress");
  for (const j of board.completed) m.set(j.id, "completed");
  return m;
}

export type JobFineGoldSummary = {
  job: KarigarJob;
  column: KarigarColumnKey;
  segments: ParsedGoldSegment[];
  /** Total gross grams of gold metal issued (sum of parsed lines). */
  issuedGrossGoldGrams: number;
  /** Fine / “purity” gold issued: gross × (karat/24) per line. */
  issuedFineGoldGrams: number;
  /**
   * Fine gold assumed returned to the shop. Open jobs: 0 until you enter returns.
   * Completed jobs: treated as full return of issued fine (replace with measured return later).
   */
  returnedFineGoldGrams: number;
  /**
   * Fine gold still with the karigar = issued fine − returned fine (always in fine grams).
   */
  leftFineGoldGrams: number;
  parseOk: boolean;
};

export function summarizeJobFineGold(job: KarigarJob, column: KarigarColumnKey): JobFineGoldSummary {
  const segments = parseGoldSegmentsFromMaterial(job.material);
  const issuedGross = sumGrossGoldGrams(segments);
  const issuedFine = sumFineGoldGrams(segments);
  const open = column === "assigned" || column === "inProgress";
  const returnedFine = open ? 0 : issuedFine;
  const leftFine = Math.max(0, issuedFine - returnedFine);
  return {
    job,
    column,
    segments,
    issuedGrossGoldGrams: issuedGross,
    issuedFineGoldGrams: issuedFine,
    returnedFineGoldGrams: returnedFine,
    leftFineGoldGrams: leftFine,
    parseOk: segments.length > 0,
  };
}

export function summarizeAllJobsFineGold(
  board: {
    assigned: KarigarJob[];
    inProgress: KarigarJob[];
    completed: KarigarJob[];
  },
  flatJobs: KarigarJob[],
): JobFineGoldSummary[] {
  const colMap = karigarJobColumnMap(board);
  return flatJobs.map((j) => summarizeJobFineGold(j, columnOfJob(j, colMap)));
}

export type KarigarGoldRollup = {
  displayName: string;
  sortKey: string;
  totalOutstandingFineGoldGrams: number;
  jobs: JobFineGoldSummary[];
};

/** Group key: case-insensitive trimmed name. */
function rollupKey(name: string): string {
  return name.trim().toLowerCase();
}

export function buildKarigarGoldRollups(
  employeeKarigarNames: string[],
  summaries: JobFineGoldSummary[],
): KarigarGoldRollup[] {
  const map = new Map<string, { displayName: string; jobs: JobFineGoldSummary[] }>();

  for (const n of employeeKarigarNames) {
    const k = rollupKey(n);
    if (!k) continue;
    if (!map.has(k)) map.set(k, { displayName: n.trim(), jobs: [] });
  }

  for (const s of summaries) {
    const raw = s.job.karigar.trim();
    if (!raw) continue;
    const k = rollupKey(raw);
    let row = map.get(k);
    if (!row) {
      row = { displayName: raw, jobs: [] };
      map.set(k, row);
    }
    row.jobs.push(s);
  }

  const rollups: KarigarGoldRollup[] = [];
  for (const [, row] of map) {
    const totalOutstanding = row.jobs.reduce((acc, j) => acc + j.leftFineGoldGrams, 0);
    rollups.push({
      displayName: row.displayName,
      sortKey: rollupKey(row.displayName),
      totalOutstandingFineGoldGrams: totalOutstanding,
      jobs: row.jobs.sort((a, b) => (a.job.title || "").localeCompare(b.job.title || "")),
    });
  }

  rollups.sort((a, b) => {
    if (b.totalOutstandingFineGoldGrams !== a.totalOutstandingFineGoldGrams) {
      return b.totalOutstandingFineGoldGrams - a.totalOutstandingFineGoldGrams;
    }
    return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" });
  });

  return rollups;
}
