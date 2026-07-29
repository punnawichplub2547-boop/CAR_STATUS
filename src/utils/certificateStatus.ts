import type { Certificate } from '../types';

const EXPIRING_SOON_WINDOW_DAYS = 30;

// Certificate status must always be derived from expiryDate vs. today —
// never trust a stored status value, since it goes stale the moment time
// passes without anyone re-saving the record.
export function computeCertificateStatus(expiryDate: string, today: Date = new Date()): Certificate['status'] {
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'EXPIRED';
  if (diffDays <= EXPIRING_SOON_WINDOW_DAYS) return 'EXPIRING_SOON';
  return 'ACTIVE';
}
