"use client";

// Client-side view of the app's state. Bookings, sign-in, check-ins, messages
// and staff data live on the server and arrive through /api/state; only small
// per-device preferences (saved houses, which stay is open) stay in the browser.

import { useSyncExternalStore } from "react";
import { getProperty } from "./data";
import { todayISO } from "./dates";

export type Booking = {
  ref: string;
  slug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  total: number;
  name: string;
  email: string;
  createdAt: number;
};

export type CheckIn = {
  name: string;
  phone: string;
  country: string;
  idAdded: boolean;
  arrival: string;
  completedAt: number;
};

export type Message = { from: "guest" | "kokoro"; text: string; at: number };

export type Staff = { email: string; name: string; role: "Administrator" | "Property staff" };

type Local = {
  saved: string[];
  activeRef: string | null;
  lastEmailRef: string | null;
  previewArrival: boolean;
};

type Server = {
  sessionEmail: string | null;
  bookings: Booking[];
  cancelled: string[];
  checkins: Record<string, CheckIn>;
  messages: Record<string, Message[]>;
  /** Back office only: empty unless a staff member is signed in. */
  staff: Staff | null;
  team: Staff[];
  blocks: string[];
};

export type State = Local & Server & { ready: boolean };

const KEY = "kokoro.v2";

const local0: Local = { saved: [], activeRef: null, lastEmailRef: null, previewArrival: false };
const server0: Server = {
  sessionEmail: null,
  bookings: [],
  cancelled: [],
  checkins: {},
  messages: {},
  staff: null,
  team: [],
  blocks: [],
};
const initial: State = { ...local0, ...server0, ready: false };

let state = initial;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function setLocal(patch: Partial<Local>) {
  state = { ...state, ...patch };
  try {
    const { saved, activeRef, lastEmailRef, previewArrival } = state;
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ saved, activeRef, lastEmailRef, previewArrival }),
    );
  } catch {
    // Storage unavailable: the choice still holds for this visit.
  }
  emit();
}

/** Pull the latest server state. Safe to call any time. */
export async function refresh() {
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (res.ok) state = { ...state, ...((await res.json()) as Server) };
  } catch {
    // Offline: keep showing what we have.
  }
  state = { ...state, ready: true };
  emit();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...state, ...(JSON.parse(raw) as Partial<Local>) };
  } catch {
    // Private mode or corrupt data: start fresh.
  }
  void refresh();
  window.addEventListener("focus", () => void refresh());
}

function subscribe(cb: () => void) {
  start();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const noop = () => () => {};

export const useAppState = () =>
  useSyncExternalStore(subscribe, () => state, () => initial);

/** True once this browser's state has arrived from the server. */
export const useHydrated = () =>
  useSyncExternalStore(subscribe, () => state.ready, () => false);

/** Today's date, or null before hydration (the server has no "today"). */
export const useToday = () => useSyncExternalStore(noop, todayISO, () => null);

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function post<T = unknown>(path: string, body: unknown = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError("offline", "We couldn't reach Kokoro. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "error", data.message ?? "Something went wrong.");
  return data as T;
}

/* ---------- This device ---------- */

export const toggleSaved = (slug: string) =>
  setLocal({
    saved: state.saved.includes(slug)
      ? state.saved.filter((x) => x !== slug)
      : [...state.saved, slug],
  });

export const setActive = (ref: string) => setLocal({ activeRef: ref });
export const setPreviewArrival = (on: boolean) => setLocal({ previewArrival: on });

/* ---------- Guest ---------- */

/** Call after the server confirms a booking; it has already signed the guest in. */
export async function bookingConfirmed(ref: string) {
  setLocal({ activeRef: ref, lastEmailRef: ref });
  await refresh();
}

export const requestLink = (email: string) =>
  post<{ devLink: string | null }>("/api/auth/request-link", { email });

export async function signOut() {
  await post("/api/auth/logout");
  setLocal({ activeRef: null });
  await refresh();
}

export async function saveCheckIn(ref: string, c: Omit<CheckIn, "completedAt">) {
  await post("/api/checkin", { ref, ...c });
  await refresh();
}

export async function addMessage(ref: string, from: Message["from"], text: string) {
  await post(from === "guest" ? "/api/messages" : "/api/admin/messages", { ref, text });
  await refresh();
}

/* ---------- Back office ---------- */

export async function staffSignIn(email: string, password: string) {
  await post("/api/admin/login", { email, password });
  await refresh();
}

export async function staffSignOut() {
  await post("/api/admin/logout");
  await refresh();
}

/** Emails a password-reset link if this address is on the team. */
export const staffForgotPassword = (email: string) => post("/api/admin/forgot", { email });

/** Finish an invitation or reset: `token` comes from the emailed link. */
export async function staffSetPassword(token: string, password: string) {
  await post("/api/admin/set-password", { token, password });
  await refresh();
}

/** Administrators only: give someone back-office access and email them an invitation. */
export async function inviteStaff(email: string, name: string, role: Staff["role"]) {
  await post("/api/admin/team", { email, name, role });
  await refresh();
}

/** Administrators only: take away someone's back-office access. */
export async function removeStaff(email: string) {
  await post("/api/admin/team", { email, remove: true });
  await refresh();
}

export async function cancelBooking(ref: string) {
  await post("/api/admin/cancel", { ref });
  await refresh();
}

/** Toggle a staff block on one night of one house, keyed "slug:YYYY-MM-DD". */
export async function toggleBlock(key: string) {
  const [slug, date] = key.split(":");
  await post("/api/admin/blocks", { slug, date });
  await refresh();
}

/** Development only: wipe bookings on the server and preferences on this device. */
export async function resetAll() {
  await post("/api/dev/reset");
  setLocal(local0);
  await refresh();
}

/** The stay the signed-in guest is currently looking at. */
export function useActiveStay() {
  const s = useAppState();
  const hydrated = useHydrated();
  const mine = s.bookings.filter(
    (b) => b.email === s.sessionEmail && !s.cancelled.includes(b.ref),
  );
  // The stay they picked, else the one happening now or next, else the latest.
  const today = todayISO();
  const booking =
    mine.find((b) => b.ref === s.activeRef) ??
    mine.find((b) => b.checkOut > today) ??
    mine.at(-1) ??
    null;
  const property = booking ? (getProperty(booking.slug) ?? null) : null;
  return { hydrated, state: s, booking, property };
}
