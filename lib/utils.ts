import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ID tampilan pengguna: 8 angka (bukan huruf), selalu sama untuk uid yang sama.
// Dihitung dari uid Firebase (FNV-1a), jadi tidak perlu disimpan di database.
export function numericId(uid: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < uid.length; i++) {
    h ^= uid.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return '#' + String(h % 100000000).padStart(8, '0');
}
