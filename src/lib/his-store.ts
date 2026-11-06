import { useSyncExternalStore } from "react";

export type Role = "Admin" | "Doctor" | "Nurse" | "Staff";
export type Patient = { id: string; name: string; sex: string; birth: string; contact: string; address: string; blood: string };
export type Record_ = { id: string; patientId: string; date: string; diagnosis: string; treatment: string; notes: string };
export type Appointment = { id: string; patientId: string; date: string; time: string; doctor: string; reason: string; status: "Scheduled" | "Completed" | "Cancelled" };
export type Service = { id: string; patientId: string; date: string; type: "Consultation" | "Examination" | "Treatment"; details: string; by: string };
export type Prescription = { id: string; patientId: string; date: string; medicine: string; dosage: string; instructions: string };
export type User = { id: string; username: string; password: string; name: string; role: Role; active: boolean };
export type Log = { id: string; at: string; user: string; action: string };

export type DB = { patients: Patient[]; records: Record_[]; appointments: Appointment[]; services: Service[]; prescriptions: Prescription[]; users: User[]; logs: Log[] };
export type Table = Exclude<keyof DB, "logs">;

const KEY = "his-db-v1";
const today = new Date().toISOString().slice(0, 10);
const seed: DB = {
  users: [
    { id: "u1", username: "admin", password: "admin123", name: "System Admin", role: "Admin", active: true },
    { id: "u2", username: "doctor", password: "doctor123", name: "Dr. Maria Santos", role: "Doctor", active: true },
    { id: "u3", username: "nurse", password: "nurse123", name: "Nurse Ana Cruz", role: "Nurse", active: true },
  ],
  patients: [
    { id: "p1", name: "Juan Dela Cruz", sex: "Male", birth: "1985-04-12", contact: "09171234567", address: "Cebu City", blood: "O+" },
    { id: "p2", name: "Liza Reyes", sex: "Female", birth: "1992-09-30", contact: "09987654321", address: "Mandaue City", blood: "A+" },
  ],
  records: [{ id: "r1", patientId: "p1", date: today, diagnosis: "Hypertension", treatment: "Lifestyle changes, medication", notes: "BP 150/95" }],
  appointments: [{ id: "a1", patientId: "p2", date: today, time: "10:00", doctor: "Dr. Maria Santos", reason: "Follow-up", status: "Scheduled" }],
  services: [{ id: "s1", patientId: "p1", date: today, type: "Consultation", details: "General check-up", by: "Dr. Maria Santos" }],
  prescriptions: [{ id: "rx1", patientId: "p1", date: today, medicine: "Amlodipine 5mg", dosage: "1 tablet", instructions: "Once daily after breakfast" }],
  logs: [],
};

let db: DB = seed;
let session: User | null = null;
const subs = new Set<() => void>();
let loaded = false;

async function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  
  // 1. Try to restore session
  try {
    const u = sessionStorage.getItem(KEY + "-u");
    if (u) session = JSON.parse(u);
  } catch {}

  // 2. Fetch all data from the backend
  try {
    const tables = ["patients", "records", "appointments", "services", "prescriptions", "users"];
    const newDb = { ...db };
    
    for (const t of tables) {
      const res = await fetch(`/api/${t}`);
      if (res.ok) {
        newDb[t as Table] = await res.json();
      }
    }
    db = newDb as DB;
    emit(); // Tell React to re-render
  } catch (err) {
    console.error("Failed to load data from backend:", err);
  }
}

function emit() { localStorage.setItem(KEY, JSON.stringify(db)); subs.forEach((f) => f()); }
const uid = () => Math.random().toString(36).slice(2, 9);

function log(action: string) { db = { ...db, logs: [{ id: uid(), at: new Date().toLocaleString(), user: session?.username ?? "system", action }, ...db.logs].slice(0, 500) }; }

export const store = {
  subscribe(f: () => void) { load(); subs.add(f); f(); return () => subs.delete(f); },
  
  async save<T extends Table>(t: T, row: any) {
    const method = row.id ? 'PUT' : 'POST';
    const url = row.id ? `/api/${t}/${row.id}` : `/api/${t}`;
    
    try {
      await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row)
      });
      // Refresh data from backend
      const res = await fetch(`/api/${t}`);
      const data = await res.json();
      db = { ...db, [t]: data };
      emit();
    } catch (err) {
      console.error(err);
    }
  },

  async remove(t: Table, id: string) { 
    try {
      await fetch(`/api/${t}/${id}`, { method: 'DELETE' });
      db = { ...db, [t]: (db[t] as any[]).filter((r) => r.id !== id) }; 
      emit(); 
    } catch (err) {
      console.error(err);
    }
  },

  async login(u: string, p: string) {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      
      if (!res.ok) return false;
      
      const user = await res.json();
      session = user;
      sessionStorage.setItem(KEY + "-u", JSON.stringify(user)); 
      log("Logged in"); emit(); 
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },

  logout() { log("Logged out"); session = null; sessionStorage.removeItem(KEY + "-u"); emit(); },
};

let snap: { db: DB; session: User | null } = { db, session };
const serverSnap: { db: DB; session: User | null } = { db: seed, session: null };
export function useHIS() {
  return useSyncExternalStore(store.subscribe, () => { if (snap.db !== db || snap.session !== session) snap = { db, session }; return snap; }, () => serverSnap);
}

// Which modules each role may open
export const ACCESS: Record<Role, string[]> = {
  Admin: ["dashboard", "patients", "records", "appointments", "services", "prescriptions", "reports", "users", "audit"],
  Doctor: ["dashboard", "patients", "records", "appointments", "services", "prescriptions", "reports"],
  Nurse: ["dashboard", "patients", "appointments", "services", "reports"],
  Staff: ["dashboard", "patients", "appointments"],
};