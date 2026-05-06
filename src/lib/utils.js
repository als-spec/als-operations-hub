import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}


export const isIframe = window.self !== window.top;

// Whitelist of URL schemes safe to render into <a href>. Anything else
// (notably javascript:, data:, vbscript:, file:) is replaced with '#' so a
// stored hostile URL cannot execute on click. Relative paths and fragments
// are passed through unchanged.
const SAFE_HREF_SCHEME = /^(https?|mailto|tel):/i;

export function safeHref(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (!trimmed) return '#';
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return trimmed;
  return SAFE_HREF_SCHEME.test(trimmed) ? trimmed : '#';
}
