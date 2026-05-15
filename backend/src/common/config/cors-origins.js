/**
 * Allowed browser origins for CORS (REST + Socket.IO).
 * Set CORS_ORIGINS in env as a comma-separated list.
 */
export function getCorsOrigins() {
    const raw = process.env.CORS_ORIGINS;
    if (raw && raw.trim()) {
        return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return ["http://localhost:5173", "http://127.0.0.1:5173"];
}

/** @param {string | undefined} origin */
export function isOriginAllowed(origin) {
    if (!origin) return true;
    const allowed = getCorsOrigins();
    if (allowed.includes(origin)) return true;
    if (process.env.ALLOW_VERCEL_PREVIEWS === "true") {
        try {
            const host = new URL(origin).hostname;
            if (host.endsWith(".vercel.app")) return true;
        } catch {
            /* ignore */
        }
    }
    return false;
}
