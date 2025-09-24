import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { Awareness } from 'y-protocols/awareness';

export class CollaborationService extends EventTarget {
    constructor() {
        super();
        this.doc = new Y.Doc();
        this.provider = null;
        this.awareness = null;
        this.currentUser = null;
    }

    connect(room, userDetails) {
        if (this.provider) this.disconnect();

        this.awareness = new Awareness(this.doc);
        this.awareness.on('change', () => this.emitUsersChange());

        this.provider = new WebrtcProvider(room, this.doc, {
            signaling: ['wss://lib.itsario.ir/api/'],
            awareness: this.awareness,
        });

        this.provider.on('status', ({ status }) =>
            this.dispatchEvent(new CustomEvent('connection-status', { detail: status }))
        );

        this.currentUser = {
            ...userDetails,
            clientID: this.awareness.clientID,
        };

        this.awareness.setLocalStateField('user', this.currentUser);
    }

    disconnect() {
        if (this.provider) {
            this.provider.destroy();
            this.provider = null;
            this.awareness = null;
        }
    }

    updateUserLocation(locationData) {
        if (!this.awareness || !this.currentUser) return;

        this.awareness.setLocalState({
            user: this.currentUser,
            location: {
                ...locationData,
                timestamp: Date.now(),
            },
        });
    }

    removeCurrentUser() {
        if (this.awareness) {
            this.awareness.setLocalState(null);
        }
    }

    emitUsersChange() {
        if (!this.awareness) return;

        const states = Array.from(this.awareness.getStates().values());

        const usersArray = states
            .filter((state) => state.user && state.location)
            .map((state) => ({
                userDetails: state.user,
                ...state.location,
                current: this.awareness.clientID === state.user.clientID,
                lastUpdated: new Date(state.location.timestamp).toLocaleTimeString(),
            }));

        this.dispatchEvent(new CustomEvent('users-changed', { detail: usersArray }));
    }
}
