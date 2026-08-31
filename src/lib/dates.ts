/** Site-wide date display format is DD-MM-YYYY (see PROJECT_GUIDE "Dates"). */

export const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** yyyy-mm-dd → DD-MM-YYYY; non-ISO input passes through unchanged. */
export function formatDateDisplay(iso: string): string {
  const m = ISO_DATE_RE.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
}
