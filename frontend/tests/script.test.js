import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fixture, html } from '@open-wc/testing';

vi.mock('leaflet', () => {
    const mockMarker = {
        addTo: vi.fn().mockReturnThis(),
        bindPopup: vi.fn().mockReturnThis(),
        setLatLng: vi.fn().mockReturnThis(),
        on: vi.fn().mockReturnThis(),
        openPopup: vi.fn().mockReturnThis(),
    };

    const mockMap = {
        setView: vi.fn().mockReturnThis(),
        removeLayer: vi.fn(),
        addLayer: vi.fn(),
        fitBounds: vi.fn(),
        getCenter: vi.fn(() => ({ lat: 35.7, lng: 51.4 })),
        getZoom: vi.fn(() => 13),
        on: vi.fn(),
        whenReady: vi.fn((callback) => setTimeout(callback, 0)),
        remove: vi.fn(),
    };

    const mockCircle = {
        addTo: vi.fn().mockReturnThis(),
        remove: vi.fn().mockReturnThis(),
        setLatLng: vi.fn().mockReturnThis(),
        setRadius: vi.fn().mockReturnThis(),
    };

    const mockTileLayer = {
        addTo: vi.fn().mockReturnThis(),
    };

    const mockFeatureGroup = vi.fn(() => ({
        getBounds: vi.fn(() => ({
            pad: vi.fn(() => ({})),
        })),
    }));

    const mockDivIcon = vi.fn(() => ({}));

    return {
        default: {
            map: vi.fn(() => mockMap),
            marker: vi.fn(() => mockMarker),
            tileLayer: vi.fn(() => mockTileLayer),
            icon: vi.fn(() => ({})),
            divIcon: mockDivIcon,
            featureGroup: mockFeatureGroup,
            circle: vi.fn(() => mockCircle),
            Marker: {
                prototype: {
                    options: { icon: {} },
                },
            },
        },
        map: vi.fn(() => mockMap),
        marker: vi.fn(() => mockMarker),
        tileLayer: vi.fn(() => mockTileLayer),
        icon: vi.fn(() => ({})),
        featureGroup: mockFeatureGroup,
        divIcon: mockDivIcon,
        circle: vi.fn(() => mockCircle),
        Marker: {
            prototype: {
                options: { icon: {} },
            },
        },
    };
});

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({
    default: 'marker-icon.png',
}));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({
    default: 'marker-shadow.png',
}));
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({
    default: 'marker-icon-2x.png',
}));

vi.mock('../src/styles/global-styles', () => ({
    globalStyles: {},
}));

import '../src/components/user-map.js';
import '../src/components/user-list.js';
import '../src/components/app-view.js';

describe('UserMap Component', () => {
    let element;

    beforeEach(async () => {
        element = await fixture(html`<user-map></user-map>`);
        await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should render map container', () => {
        const mapContainer = element.shadowRoot.querySelector('#map');
        expect(mapContainer).toBeTruthy();
    });

    it('should initialize with empty markers map', () => {
        expect(element.markers).toBeInstanceOf(Map);
        expect(element.markers.size).toBe(0);
    });

    it('should add a new user marker', () => {
        element.upsertMarker('user1', 35.7, 51.4, false);
        expect(element.markers.has('user1')).toBe(true);
        expect(element.markers.size).toBe(1);
    });

    it('should update existing marker position', () => {
        element.upsertMarker('user1', 35.7, 51.4, false);
        const initialMarkerData = element.markers.get('user1');

        element.upsertMarker('user1', 35.8, 51.5, false);

        expect(element.markers.size).toBe(1);
        expect(element.markers.get('user1')).toBe(initialMarkerData);

        expect(initialMarkerData.marker.setLatLng).toHaveBeenCalledWith([35.8, 51.5]);
    });

    it('should remove a user marker', () => {
        element.upsertMarker('user2', 35.7, 51.4, false);
        expect(element.markers.has('user2')).toBe(true);

        element.removeMarker('user2');
        expect(element.markers.has('user2')).toBe(false);
    });

    it('should clear all markers', () => {
        element.upsertMarker('user1', 35.7, 51.4, false);
        element.upsertMarker('user2', 35.8, 51.5, false);
        expect(element.markers.size).toBe(2);

        element.clearMarkers();
        expect(element.markers.size).toBe(0);
    });

    it('should set current user', () => {
        element.setCurrentUser('testuser');
        expect(element.currentUser).toBe('testuser');
    });

    it('should focus on location', () => {
        element.focusLocation(35.7, 51.4, 'user1', 16);
        expect(element.map.setView).toHaveBeenCalledWith([35.7, 51.4], 16, {
            animate: true,
            duration: 1,
        });
    });
});

describe('UserList Component', () => {
    let element;

    beforeEach(async () => {
        element = await fixture(html`<user-list></user-list>`);
    });

    it('should render with default properties', () => {
        expect(element.users).toEqual([]);
        expect(element.isTracking).toBe(false);
        expect(element.showLocation).toBe(true);
    });

    it('should display users count correctly', async () => {
        element.users = [
            { username: 'Alice', lastSeen: '10:00 AM', current: false },
            { username: 'Bob', lastSeen: '10:05 AM', current: true },
        ];
        await element.updateComplete;

        const usersCount = element.shadowRoot.querySelector('.users-count');
        expect(usersCount.textContent.trim()).toContain('2 users online');
    });

    it('should show singular form for one user', async () => {
        element.users = [{ username: 'Alice', lastSeen: '10:00 AM', current: true }];
        await element.updateComplete;

        const usersCount = element.shadowRoot.querySelector('.users-count');
        expect(usersCount.textContent.trim()).toContain('1 user online');
    });

    it('should display empty state when no users', async () => {
        element.users = [];
        await element.updateComplete;

        const emptyState = element.shadowRoot.querySelector('.empty-state');
        expect(emptyState).toBeTruthy();
        expect(emptyState.textContent).toContain('No users connected');
    });

    it('should emit toggle-tracking event when button clicked', async () => {
        let eventFired = false;
        let eventDetail = null;

        element.addEventListener('toggle-tracking', (e) => {
            eventFired = true;
            eventDetail = e.detail;
        });

        const button = element.shadowRoot.querySelector('.toggle-button');
        button.click();

        expect(eventFired).toBe(true);
        expect(eventDetail.isTracking).toBe(true);
    });

    it('should emit toggle-show-location event when checkbox changed', async () => {
        let eventFired = false;
        let eventDetail = null;

        element.addEventListener('toggle-show-location', (e) => {
            eventFired = true;
            eventDetail = e.detail;
        });

        const checkbox = element.shadowRoot.querySelector('input[type="checkbox"]');
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));

        expect(eventFired).toBe(true);
        expect(eventDetail.showLocation).toBe(false);
    });

    it('should emit focus-user event when user item clicked', async () => {
        element.users = [
            { username: 'Alice', lastSeen: '10:00 AM', current: false, lat: 35.7, lng: 51.4 },
        ];
        await element.updateComplete;

        let eventFired = false;
        let eventDetail = null;

        element.addEventListener('focus-user', (e) => {
            eventFired = true;
            eventDetail = e.detail;
        });

        const userItem = element.shadowRoot.querySelector('.user-item');
        userItem.click();

        expect(eventFired).toBe(true);
        expect(eventDetail.user.username).toBe('Alice');
    });

    it('should show coordinates when location is visible', async () => {
        element.showLocation = true;
        element.currentCoordinates = { lat: 35.123456, lng: 51.654321 };
        await element.updateComplete;

        const coords = element.shadowRoot.querySelector('.coordinates-display');
        expect(coords.textContent).toContain('35.123456, 51.654321');
    });

    it('should hide coordinates when location is hidden', async () => {
        element.showLocation = false;
        await element.updateComplete;

        const coords = element.shadowRoot.querySelector('.coordinates-display');
        expect(coords.textContent).toContain('Location hidden');
    });
});

describe('AppView Component', () => {
    let element;

    beforeEach(async () => {
        element = await fixture(html`<app-view></app-view>`);
    });

    it('should render login view when no current user', () => {
        expect(element.currentUser).toBe(null);
        const loginView = element.shadowRoot.querySelector('login-view');
        expect(loginView).toBeTruthy();
    });

    it('should render app container when user is logged in', async () => {
        element.currentUser = { username: 'testuser', id: '123' };
        await element.updateComplete;

        const appContainer = element.shadowRoot.querySelector('.app-container');
        expect(appContainer).toBeTruthy();

        const headerBar = element.shadowRoot.querySelector('header-bar');
        const userMap = element.shadowRoot.querySelector('user-map');
        const userList = element.shadowRoot.querySelector('user-list');

        expect(headerBar).toBeTruthy();
        expect(userMap).toBeTruthy();
        expect(userList).toBeTruthy();
    });

    it('should update users correctly', () => {
        const testUsers = [
            { username: 'Alice', lastSeen: '10:00 AM', current: false },
            { username: 'Bob', lastSeen: '10:05 AM', current: true },
        ];

        element.updateUsers(testUsers);
        expect(element.users).toEqual(testUsers);
    });

    it('should update tracking state', () => {
        element.updateTracking(true);
        expect(element.isTracking).toBe(true);
    });

    it('should update coordinates', () => {
        element.updateCoordinates(35.7, 51.4);
        expect(element.currentCoordinates).toEqual({ lat: 35.7, lng: 51.4 });
    });

    it('should emit login-success event on login', async () => {
        let eventFired = false;
        let eventDetail = null;

        element.addEventListener('login-success', (e) => {
            eventFired = true;
            eventDetail = e.detail;
        });

        const testUser = { username: 'testuser', id: '123' };
        element._onLogin({ detail: { user: testUser } });

        expect(eventFired).toBe(true);
        expect(eventDetail.user).toEqual(testUser);
        expect(element.currentUser).toEqual(testUser);
    });

    it('should emit logout event and reset state on logout', async () => {
        element.currentUser = { username: 'testuser', id: '123' };
        element.users = [{ username: 'testuser', current: true }];
        element.isTracking = true;

        let eventFired = false;
        element.addEventListener('logout', () => {
            eventFired = true;
        });

        element._onLogout();

        expect(eventFired).toBe(true);
        expect(element.currentUser).toBe(null);
        expect(element.users).toEqual([]);
        expect(element.isTracking).toBe(false);
    });
});

describe('Component Tests', () => {
    it('should properly integrate map and user list events', async () => {
        const appView = await fixture(html`<app-view></app-view>`);
        appView.currentUser = { username: 'testuser', id: '123' };
        await appView.updateComplete;

        let toggleTrackingFired = false;
        appView.addEventListener('toggle-tracking', () => {
            toggleTrackingFired = true;
        });

        const userList = appView.shadowRoot.querySelector('user-list');
        userList.dispatchEvent(
            new CustomEvent('toggle-tracking', {
                detail: { isTracking: true },
                bubbles: true,
                composed: true,
            })
        );

        expect(toggleTrackingFired).toBe(true);
    });

    it('should handle user focus events from list to map', async () => {
        const appView = await fixture(html`<app-view></app-view>`);
        appView.currentUser = { username: 'testuser', id: '123' };
        await appView.updateComplete;

        await new Promise((resolve) => setTimeout(resolve, 100));

        const userMap = appView.shadowRoot.querySelector('user-map');
        const focusLocationSpy = vi.spyOn(userMap, 'focusLocation');

        const testUser = { username: 'Alice', lat: 35.7, lng: 51.4 };
        appView._onFocusUser({ detail: { user: testUser } });

        expect(focusLocationSpy).toHaveBeenCalledWith(35.7, 51.4, 'Alice');
    });
});
