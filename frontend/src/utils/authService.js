

/**
 * Validate JWT by making a request to the validation endpoint.
 * @param {string} token - JWT.
 * @returns {Promise<boolean>}
 */
export async function validateToken(token) {
    try {
        const response = await fetch('/api/validate-token', {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token,
            },
        });
        return response.status === 200;
    } catch {
        return false;
    }
}

/**
 * Request a new JWT using the refresh token.
 * @param {string} refreshToken
 * @returns {Promise<string|null>} - New JWT if everything goes well, null if it fails.
 */
export async function refreshTokenRequest(refreshToken) {
    try {
        const response = await fetch('/api/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (response.status === 200) {
            const data = await response.json();
            return data.token;
        }
        return null;
    } catch {
        return null;
    }
}
