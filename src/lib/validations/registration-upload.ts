/** Max size per registration photo after client compression (server validation). */
export const MAX_REGISTRATION_UPLOAD_BYTES = Math.floor(1.5 * 1024 * 1024);

/** Block submit when combined compressed photos exceed Vercel body headroom (~4.5 MB). */
export const MAX_REGISTRATION_FORM_TOTAL_BYTES = 4 * 1024 * 1024;
