import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import * as awarenessProtocol from 'y-protocols/awareness.js';

export class CollaborationService extends EventTarget {
    constructor() {
        super();
        this.doc = new Y.Doc();
        this.yUsers = this.doc.getMap('users');
        this.provider = null;

        this.yUsers.observe(() => this.emitUsersChange());
    }

    connect(userId, username) {
        if (this.provider) this.disconnect();

        this.provider = new WebrtcProvider('map-room', this.doc, {
            signaling: ['wss://lib.itsario.ir/api/'],
            awareness: new awarenessProtocol.Awareness(this.doc),
        });

        this.provider.on('status', ({ status }) =>
            this.dispatchEvent(new CustomEvent('connection-status', { detail: status }))
        );

        this.currentUser = { id: userId, username };
    }

    disconnect() {
        if (this.provider) {
            this.provider.destroy();
            this.provider = null;
        }
        this.yUsers.clear();
    }

    updateUserLocation(data) {
        if (!this.currentUser) return;
        this.yUsers.set(this.currentUser.id, {
            username: this.currentUser.username,
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
            timestamp: Date.now(),
        });
    }

    removeCurrentUser() {
        if (this.currentUser) {
            this.yUsers.delete(this.currentUser.id);
        }
    }

    emitUsersChange() {
        const usersArray = Array.from(this.yUsers.entries()).map(([userId, data]) => ({
            username: data.username || userId,
            lat: data.lat,
            lng: data.lng,
            accuracy: data.accuracy,
            current: userId === this.currentUser?.id,
            lastUpdated: data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Unknown',
        }));
        this.dispatchEvent(new CustomEvent('users-changed', { detail: usersArray }));
    }
}
