import logger from '../utils/logger';

export interface ConversationSlots {
    customerName: string | null;
    guests: number | null;
    date: string | null; // YYYY-MM-DD
    time: string | null; // HH:MM
    cuisine: string | null;
    specialRequests: string | null;
    seatingPreference: string | null;
    bookingId: string | null; // set after booking is created
}

export interface SessionState {
    sessionId: string;
    slots: ConversationSlots;
    history: Array<{ role: 'user' | 'assistant'; content: string }>;
    createdAt: Date;
    updatedAt: Date;
}

const sessions = new Map<string, SessionState>();

function createEmptySlots(): ConversationSlots {
    return {
        customerName: null,
        guests: null,
        date: null,
        time: null,
        cuisine: null,
        specialRequests: null,
        seatingPreference: null,
        bookingId: null,
    };
}

export function getSession(sessionId: string): SessionState {
    if (!sessions.has(sessionId)) {
        const session: SessionState = {
            sessionId,
            slots: createEmptySlots(),
            history: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        sessions.set(sessionId, session);
        logger.debug(`Created new session: ${sessionId}`);
    }
    return sessions.get(sessionId)!;
}

export function updateSlots(sessionId: string, updates: Partial<ConversationSlots>): ConversationSlots {
    const session = getSession(sessionId);
    session.slots = { ...session.slots, ...updates };
    session.updatedAt = new Date();
    logger.debug(`Updated slots for session ${sessionId}`, { slots: session.slots });
    return session.slots;
}

export function addToHistory(sessionId: string, role: 'user' | 'assistant', content: string): void {
    const session = getSession(sessionId);
    session.history.push({ role, content });
    session.updatedAt = new Date();
    // Keep last 20 messages to prevent memory bloat
    if (session.history.length > 20) {
        session.history = session.history.slice(-20);
    }
}

export function getSlots(sessionId: string): ConversationSlots {
    return getSession(sessionId).slots;
}

export function clearSession(sessionId: string): void {
    sessions.delete(sessionId);
    logger.debug(`Cleared session: ${sessionId}`);
}

export function getActiveSessionCount(): number {
    return sessions.size;
}

// Cleanup stale sessions (older than 1 hour)
setInterval(() => {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    let cleaned = 0;
    for (const [id, session] of sessions) {
        if (now - session.updatedAt.getTime() > ONE_HOUR) {
            sessions.delete(id);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        logger.info(`Cleaned ${cleaned} stale sessions`);
    }
}, 5 * 60 * 1000); // check every 5 minutes
