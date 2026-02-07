import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiClient before importing the service
vi.mock('../apiClient', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    }
}));

import { apiClient } from '../apiClient';
import { getDemoStatus, unlockDemoWriteAccess, lockDemoWriteAccess } from '../demoService';

describe('demoService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getDemoStatus', () => {
        it('should return status data on success', async () => {
            const mockData = {
                isDemoEnvironment: true,
                writeAccessEnabled: false,
                message: 'Write access is disabled'
            };
            apiClient.get.mockResolvedValue({ data: mockData });

            const result = await getDemoStatus();

            expect(apiClient.get).toHaveBeenCalledWith('/demo/status');
            expect(result).toEqual(mockData);
        });

        it('should throw on API error', async () => {
            const error = new Error('Network Error');
            apiClient.get.mockRejectedValue(error);

            await expect(getDemoStatus()).rejects.toThrow('Network Error');
            expect(apiClient.get).toHaveBeenCalledWith('/demo/status');
        });
    });

    describe('unlockDemoWriteAccess', () => {
        it('should send TOTP code as query parameter', async () => {
            const mockData = {
                message: 'Write access unlocked successfully!',
                expiresInMinutes: 20,
                expiresAt: '2025-01-01T00:20:00Z'
            };
            apiClient.get.mockResolvedValue({ data: mockData });

            await unlockDemoWriteAccess('123456');

            expect(apiClient.get).toHaveBeenCalledWith('/demo/unlock?code=123456');
        });

        it('should return unlock data on success', async () => {
            const mockData = {
                message: 'Write access unlocked successfully!',
                expiresInMinutes: 20,
                expiresAt: '2025-01-01T00:20:00Z'
            };
            apiClient.get.mockResolvedValue({ data: mockData });

            const result = await unlockDemoWriteAccess('123456');

            expect(result).toEqual(mockData);
        });

        it('should throw on invalid code error', async () => {
            const error = new Error('Unauthorized');
            error.response = { status: 401, data: { error: 'Invalid TOTP code' } };
            apiClient.get.mockRejectedValue(error);

            await expect(unlockDemoWriteAccess('000000')).rejects.toThrow('Unauthorized');
        });
    });

    describe('lockDemoWriteAccess', () => {
        it('should call lock endpoint and return data', async () => {
            const mockData = { message: 'Write access revoked' };
            apiClient.post.mockResolvedValue({ data: mockData });

            const result = await lockDemoWriteAccess();

            expect(apiClient.post).toHaveBeenCalledWith('/demo/lock');
            expect(result).toEqual(mockData);
        });

        it('should throw on error', async () => {
            const error = new Error('Server Error');
            apiClient.post.mockRejectedValue(error);

            await expect(lockDemoWriteAccess()).rejects.toThrow('Server Error');
        });
    });
});
