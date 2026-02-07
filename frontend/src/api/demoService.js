import { apiClient } from './apiClient';

/**
 * Get the current demo mode status
 * @returns {Promise<{isDemoEnvironment: boolean, writeAccessEnabled: boolean, message: string}>}
 */
export const getDemoStatus = async () => {
    const response = await apiClient.get('/demo/status');
    return response.data;
};

/**
 * Unlock write access with a TOTP code
 * @param {string} code - 6-digit TOTP code from authenticator app
 * @returns {Promise<{message: string, expiresInMinutes: number, expiresAt: string}>}
 */
export const unlockDemoWriteAccess = async (code) => {
    const response = await apiClient.get(`/demo/unlock?code=${code}`);
    return response.data;
};

/**
 * Lock (revoke) write access
 * @returns {Promise<{message: string}>}
 */
export const lockDemoWriteAccess = async () => {
    const response = await apiClient.post('/demo/lock');
    return response.data;
};
