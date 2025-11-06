export async function httpRequest(url, options = {}) {
    try {
        const res = await fetch(url, options);
        const contentType = res.headers.get("Content-Type") || "";

        let data = null;
        if (contentType.includes("application/json")) {
            try {
                data = await res.json();
            } catch {
                data = null;
            }
        }

        if (!res.ok) {
            const message =
                data?.message ||
                data?.error ||
                `Request failed with status ${res.status}`;
            return { ok: false, status: res.status, data, error: message };
        }

        return { ok: true, status: res.status, data, error: null };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            data: null,
            error: err.message || "Network error",
        };
    }
}
