/**
 * Network Information API is non-standard and partially supported, so we type
 * the slice we use and feature-detect everything at runtime.
 */
interface NetworkInformation {
  saveData?: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

function getConnection(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return (navigator as Navigator & { connection?: NetworkInformation })
    .connection;
}

/**
 * True when the user is on a metered (Save-Data) or slow (2G/3G) connection.
 * Returns false when the API is unavailable — we never degrade on uncertainty.
 */
export function isConstrainedConnection(): boolean {
  const c = getConnection();
  if (!c) return false;
  if (c.saveData) return true;
  return c.effectiveType === 'slow-2g' || c.effectiveType === '2g' || c.effectiveType === '3g';
}
