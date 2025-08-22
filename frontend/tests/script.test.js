import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('leaflet', () => {
    const fakeLayer = {
        addTo: vi.fn().mockReturnThis(),
        bindPopup: vi.fn().mockReturnThis(),
        setLatLng: vi.fn().mockReturnThis(),
        setRadius: vi.fn().mockReturnThis(),
    };

    return {
        map: vi.fn(() => ({
            setView: vi.fn(),
            removeLayer: vi.fn(),
        })),
        marker: vi.fn(() => fakeLayer),
        circle: vi.fn(() => fakeLayer),
        divIcon: vi.fn(() => ({})),
        tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    };
});

// Import AFTER mocks
import {
    saveAuthToken,
    getAuthToken,
    removeAuthToken,
    updateUserMarker,
    removeUserMarker,
} from '../src/script.js';

describe('Auth helpers', () => {
    beforeEach(() => localStorage.clear());

    it('should save and retrieve a token', () => {
        saveAuthToken('abc123');
        expect(getAuthToken()).toBe('abc123');
    });

    it('should remove token', () => {
        saveAuthToken('abc123');
        removeAuthToken();
        expect(getAuthToken()).toBe(null);
    });
});

describe('Marker logic', () => {
    let map, userMarkers;

    beforeEach(() => {
        map = { setView: vi.fn(), removeLayer: vi.fn() };
        userMarkers = new Map();
    });

    it('should add a new user marker', () => {
        updateUserMarker(
            {
                userId: 'user1',
                lat: 10,
                lng: 20,
                accuracy: 30,
                username: 'Alice',
                visible: true,
            },
            map,
            userMarkers,
            'user1' // current user
        );

        expect(userMarkers.has('user1')).toBe(true);
    });

    it('should remove a user marker', () => {
        // Add first
        updateUserMarker(
            { userId: 'user2', lat: 15, lng: 25, accuracy: 40, username: 'Bob', visible: true },
            map,
            userMarkers,
            'user2'
        );

        expect(userMarkers.has('user2')).toBe(true);

        removeUserMarker('user2', map, userMarkers);
        expect(userMarkers.has('user2')).toBe(false);
    });

    it('should not add marker if lat/lng missing', () => {
        updateUserMarker({ userId: 'user3', username: 'Charlie' }, map, userMarkers, 'user3');
        expect(userMarkers.size).toBe(0);
    });

    it('should hide marker if not visible and not current user', () => {
        updateUserMarker(
            { userId: 'user4', lat: 1, lng: 2, accuracy: 5, username: 'Eve', visible: false },
            map,
            userMarkers,
            'user5' // different current user
        );
        expect(userMarkers.size).toBe(0);
    });
});
