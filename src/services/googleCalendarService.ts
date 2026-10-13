import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { GoogleCalendarEvent, EventData } from '../types';

// Google Workspace Scopes
export const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/spreadsheets'
];

// Initialize Firebase App safely without re-initializing
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
CALENDAR_SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory token caching (NOT in localStorage per security requirements)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const getCachedAccessToken = (): string | null => cachedAccessToken;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Initialize Google Calendar Auth listener.
 */
export const initCalendarAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      onAuthSuccess?.(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        onAuthFailure?.();
      }
    }
  });
};

/**
 * Sign in with Google with Calendar scopes.
 */
export const signInWithGoogleCalendar = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google Calendar.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro na autenticação do Google Calendar:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Sign out and clear in-memory token.
 */
export const signOutGoogleCalendar = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Fetch events from the user's primary Google Calendar.
 */
export const listCalendarEvents = async (
  token?: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> => {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    throw new Error('Nenhum token do Google Calendar disponível. Faça login primeiro.');
  }

  const nowIso = timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(nowIso)}&maxResults=100`;
  
  if (timeMax) {
    url += `&timeMax=${encodeURIComponent(timeMax)}`;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      throw new Error('Sessão do Google Calendar expirada. Por favor, conecte-se novamente.');
    }
    const errText = await res.text();
    throw new Error(`Erro ao buscar eventos do Google Calendar (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawItems = data.items || [];

  return rawItems.map((item: any): GoogleCalendarEvent => ({
    id: item.id,
    summary: item.summary || '(Sem Título)',
    description: item.description || '',
    location: item.location || '',
    start: {
      dateTime: item.start?.dateTime,
      date: item.start?.date
    },
    end: {
      dateTime: item.end?.dateTime,
      date: item.end?.date
    },
    htmlLink: item.htmlLink,
    status: item.status,
    syncedAt: new Date().toISOString()
  }));
};

/**
 * Create a new event on Google Calendar.
 */
export const createCalendarEvent = async (
  eventInput: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
  },
  token?: string
): Promise<GoogleCalendarEvent> => {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    throw new Error('Nenhum token do Google Calendar disponível.');
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${activeToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventInput)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro ao criar evento no Google Calendar: ${errText}`);
  }

  const item = await res.json();
  return {
    id: item.id,
    summary: item.summary,
    description: item.description,
    location: item.location,
    start: {
      dateTime: item.start?.dateTime,
      date: item.start?.date
    },
    end: {
      dateTime: item.end?.dateTime,
      date: item.end?.date
    },
    htmlLink: item.htmlLink,
    status: item.status,
    syncedAt: new Date().toISOString()
  };
};

/**
 * Delete an event on Google Calendar.
 */
export const deleteCalendarEvent = async (eventId: string, token?: string): Promise<boolean> => {
  const activeToken = token || cachedAccessToken;
  if (!activeToken) {
    throw new Error('Nenhum token do Google Calendar disponível.');
  }

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${activeToken}`
    }
  });

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const errText = await res.text();
    throw new Error(`Erro ao remover evento do Google Calendar: ${errText}`);
  }

  return true;
};

/**
 * Build clean plain-text context of Google Calendar events for the AI agent to consult.
 */
export const formatCalendarEventsForAI = (events: GoogleCalendarEvent[]): string => {
  if (!events || events.length === 0) {
    return 'Nenhum evento futuro registrado no Google Calendar do produtor no momento.';
  }

  return events
    .slice(0, 25)
    .map((ev, i) => {
      const dateStr = ev.start.dateTime 
        ? new Date(ev.start.dateTime).toLocaleString('pt-BR') 
        : ev.start.date || 'Data não definida';
      return `${i + 1}. [${dateStr}] "${ev.summary}"${ev.location ? ` em ${ev.location}` : ''}${ev.description ? ` (${ev.description.slice(0, 100)})` : ''}`;
    })
    .join('\n');
};
