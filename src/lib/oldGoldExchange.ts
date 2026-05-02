/** sessionStorage key for "use credit on next order" from Old Gold Exchange. */
export const OLD_GOLD_EXCHANGE_STORAGE_KEY = "goldmind-old-gold-credit";

/** localStorage: list of past calculations (client-side history). */
export const OLD_GOLD_HISTORY_STORAGE_KEY = "goldmind-old-gold-history";
export const OLD_GOLD_HISTORY_MAX = 50;

/** Who recorded this row: Save only (exchange ref) vs Use credit on next order (purchase queue). */
export type OldGoldHistoryKind = "exchange" | "bought";

export type OldGoldHistoryEntry = {
  id: string;
  createdAt: string;
  kind: OldGoldHistoryKind;
  weightG: number;
  karat: number;
  testedPurityPercent: number | null;
  fineGoldG: number;
  netFineGoldG: number;
  rateRupeesPerGram: number;
  deductionPercent: number;
  exchangeValuePaise: number;
  summaryLine: string;
  /** JPEG data URL, resized client-side; omit if too large / skipped */
  imageDataUrl?: string | null;
};

export type OldGoldExchangeInput = {
  weightG: number;
  /** Nominal karat, e.g. 22 (used when no assay %). */
  karat: number;
  /**
   * Optional assay / tested fineness 0–100. When set and &gt; 0, overrides karat:
   * fine gold (g) = weight × (testedPurityPercent / 100).
   */
  testedPurityPercent: number | null;
  /** Gold rate in ₹ per gram (rupees, may be decimal). */
  rateRupeesPerGram: number;
  /** Melting / loss deduction, 0–100. */
  deductionPercent: number;
};

export type OldGoldExchangeResult = {
  fineGoldG: number;
  netFineGoldG: number;
  /** Rounded to integer paise. */
  exchangeValuePaise: number;
};

export type OldGoldExchangeSessionPayload = {
  creditPaise: number;
  savedAt: string;
  /** One-line description for order / receipt. */
  summaryLine: string;
  weightG: number;
  karat: number;
  testedPurityPercent: number | null;
  netFineGoldG: number;
  rateRupeesPerGram: number;
  deductionPercent: number;
  /** Set when credit was applied from a saved history row (exchange ID) on the sales screen. */
  historyEntryId?: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Fine gold in grams: karat path or assay override. */
export function computeFineGoldG(
  input: Pick<OldGoldExchangeInput, "weightG" | "karat" | "testedPurityPercent">,
): number {
  const w = Math.max(0, input.weightG);
  if (w <= 0) return 0;
  const tested = input.testedPurityPercent;
  if (tested != null && Number.isFinite(tested) && tested > 0) {
    return w * (clamp(tested, 0, 100) / 100);
  }
  const k = clamp(input.karat, 0, 24);
  return w * (k / 24);
}

export function applyDeduction(fineGoldG: number, deductionPercent: number): number {
  const d = clamp(deductionPercent, 0, 100);
  return Math.max(0, fineGoldG) * (1 - d / 100);
}

/** Net value in paise: netFineGoldG (grams) × ₹/g × 100. */
export function exchangeValuePaiseFromNetAndRate(netFineGoldG: number, rateRupeesPerGram: number): number {
  const g = Math.max(0, netFineGoldG);
  const r = Math.max(0, rateRupeesPerGram);
  return Math.round(g * r * 100);
}

export function computeOldGoldExchange(input: OldGoldExchangeInput): OldGoldExchangeResult {
  const fine = computeFineGoldG(input);
  const net = applyDeduction(fine, input.deductionPercent);
  const paise = exchangeValuePaiseFromNetAndRate(net, input.rateRupeesPerGram);
  return {
    fineGoldG: fine,
    netFineGoldG: net,
    exchangeValuePaise: paise,
  };
}

/** Payable in paise; never negative. */
export function amountDuePaise(subtotalPaise: number, creditPaise: number): number {
  const s = Math.max(0, Math.round(subtotalPaise));
  const c = Math.max(0, Math.round(creditPaise));
  return Math.max(0, s - c);
}

export function saveOldGoldExchangeToSession(payload: OldGoldExchangeSessionPayload): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(OLD_GOLD_EXCHANGE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function readOldGoldExchangeFromSession(): OldGoldExchangeSessionPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(OLD_GOLD_EXCHANGE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as OldGoldExchangeSessionPayload;
    if (typeof p.creditPaise === "number" && p.creditPaise > 0 && typeof p.summaryLine === "string") {
      return p;
    }
  } catch {
    /* invalid */
  }
  return null;
}

export function clearOldGoldExchangeSession(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(OLD_GOLD_EXCHANGE_STORAGE_KEY);
  } catch {
    /* */
  }
}

/** Build order-items suffix for old gold line. */
export function buildOldGoldOrderNote(payload: OldGoldExchangeSessionPayload): string {
  const parts = [
    `Old gold exchange credit ${(payload.creditPaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
    `wt ${payload.weightG}g`,
    payload.testedPurityPercent != null ? `assay ${payload.testedPurityPercent}%` : `${payload.karat}K`,
    `net fine ~${payload.netFineGoldG.toFixed(3)}g`,
  ];
  return parts.join(" · ");
}

/** Look up a saved exchange row by id (same browser). Trimmed; comparison is case-insensitive. */
export function findOldGoldHistoryById(raw: string): OldGoldHistoryEntry | null {
  const q = String(raw).trim().toLowerCase();
  if (!q) return null;
  const hit = readOldGoldHistory().find((e) => e.id.toLowerCase() === q);
  return hit ?? null;
}

/** Build session payload from a history entry so Create Order can apply the same credit. */
export function sessionPayloadFromHistoryEntry(entry: OldGoldHistoryEntry): OldGoldExchangeSessionPayload {
  const payload: OldGoldExchangeSessionPayload = {
    creditPaise: entry.exchangeValuePaise,
    savedAt: new Date().toISOString(),
    summaryLine: "",
    weightG: entry.weightG,
    karat: entry.karat,
    testedPurityPercent: entry.testedPurityPercent,
    netFineGoldG: entry.netFineGoldG,
    rateRupeesPerGram: entry.rateRupeesPerGram,
    deductionPercent: entry.deductionPercent,
    historyEntryId: entry.id,
  };
  const base = buildOldGoldOrderNote(payload);
  payload.summaryLine = `${base} · Exchange ID ${entry.id}`;
  return payload;
}

export function readOldGoldHistory(): OldGoldHistoryEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(OLD_GOLD_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is OldGoldHistoryEntry =>
          x &&
          typeof x === "object" &&
          typeof (x as OldGoldHistoryEntry).id === "string" &&
          typeof (x as OldGoldHistoryEntry).createdAt === "string" &&
          typeof (x as OldGoldHistoryEntry).exchangeValuePaise === "number",
      )
      .map((row) => {
        const kind: OldGoldHistoryKind =
          (row as OldGoldHistoryEntry).kind === "bought" ? "bought" : "exchange";
        return { ...(row as OldGoldHistoryEntry), kind };
      });
  } catch {
    return [];
  }
}

export function writeOldGoldHistory(entries: OldGoldHistoryEntry[]): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(OLD_GOLD_HISTORY_STORAGE_KEY, JSON.stringify(entries.slice(0, OLD_GOLD_HISTORY_MAX)));
    return true;
  } catch {
    return false;
  }
}

export function appendOldGoldHistory(entry: OldGoldHistoryEntry): boolean {
  const prev = readOldGoldHistory();
  const list = [entry, ...prev].slice(0, OLD_GOLD_HISTORY_MAX);
  if (writeOldGoldHistory(list)) return true;
  if (entry.imageDataUrl) {
    const withoutImage: OldGoldHistoryEntry = { ...entry, imageDataUrl: null };
    return writeOldGoldHistory([withoutImage, ...prev].slice(0, OLD_GOLD_HISTORY_MAX));
  }
  return false;
}

export function deleteOldGoldHistoryEntry(id: string): void {
  writeOldGoldHistory(readOldGoldHistory().filter((e) => e.id !== id));
}

export function clearOldGoldHistory(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(OLD_GOLD_HISTORY_STORAGE_KEY);
  } catch {
    /* */
  }
}

/** Resize image in-browser for localStorage-friendly data URLs (run only on client). */
export function fileToResizedJpegDataUrl(file: File, maxWidth = 520, quality = 0.75): Promise<string | null> {
  if (typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const w = img.width;
        const h = img.height;
        if (!w || !h) {
          resolve(null);
          return;
        }
        const scale = Math.min(1, maxWidth / w);
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
