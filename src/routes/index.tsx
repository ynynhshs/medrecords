import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, CalendarDays, ClipboardList, FileText, LayoutDashboard, LogOut, Pill, Printer, Shield, Stethoscope, Users, UserCog, Pencil, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { useHIS, store, ACCESS, type DB, type Table } from "@/lib/his-store";
import { HISLogin } from "@/components/his-login";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedRecords HIS — Medical Records & Clinical Services" },
      { name: "description", content: "Hospital information system for patients, medical records, appointments, clinical services, prescriptions and reports." },
      { property: "og:title", content: "MedRecords HIS" },
      { property: "og:description", content: "Medical Records and Clinical Services Management System." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});

type F = { k: string; label: string; type?: string; opts?: string[] };
const P: F = { k: "patientId", label: "Patient", type: "patient" };
const D: F = { k: "date", label: "Date", type: "date" };
type Mod = { label: string; icon: any; table?: Table; fields?: F[] };
const MODS: Record<string, Mod> = {
  dashboard: { label: "Dashboard", icon: LayoutDashboard },
  patients: { label: "Patients", icon: Users, table: "patients", fields: [{ k: "name", label: "Full name" }, { k: "sex", label: "Sex", opts: ["Male", "Female"] }, { k: "birth", label: "Birthdate", type: "date" }, { k: "contact", label: "Contact" }, { k: "address", label: "Address" }, { k: "blood", label: "Blood type", opts: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] }] },
  records: { label: "Medical Records", icon: FileText, table: "records", fields: [P, D, { k: "diagnosis", label: "Diagnosis" }, { k: "treatment", label: "Treatment" }, { k: "notes", label: "Notes" }] },
  appointments: { label: "Appointments", icon: CalendarDays, table: "appointments", fields: [P, D, { k: "time", label: "Time", type: "time" }, { k: "doctor", label: "Doctor" }, { k: "reason", label: "Reason" }, { k: "status", label: "Status", opts: ["Scheduled", "Completed", "Cancelled"] }] },
  services: { label: "Clinical Services", icon: Stethoscope, table: "services", fields: [P, D, { k: "type", label: "Type", opts: ["Consultation", "Examination", "Treatment"] }, { k: "details", label: "Details" }, { k: "by", label: "Performed by" }] },
  prescriptions: { label: "Prescriptions", icon: Pill, table: "prescriptions", fields: [P, D, { k: "medicine", label: "Medicine" }, { k: "dosage", label: "Dosage" }, { k: "instructions", label: "Instructions" }] },
  reports: { label: "Reports", icon: Printer },
  users: { label: "User Management", icon: UserCog, table: "users", fields: [{ k: "name", label: "Name" }, { k: "username", label: "Username" }, { k: "password", label: "Password", type: "password" }, { k: "role", label: "Role", opts: ["Admin", "Doctor", "Nurse", "Staff"] }, { k: "active", label: "Active", opts: ["true", "false"] }] },
  audit: { label: "Audit Trail", icon: Shield },
};

const input = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const btn = "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90";

function App() {
  const { db, session } = useHIS();
  const [tab, setTab] = useState("dashboard");
  if (!session) return <HISLogin />;
  const allowed = ACCESS[session.role];
  const cur = allowed.includes(tab) ? tab : "dashboard";
  const m = MODS[cur]!;
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground print:hidden">
        <div className="flex items-center gap-2 p-5 text-lg font-bold"><Activity className="text-sidebar-primary" /> MedRecords</div>
        <nav className="space-y-1 px-3">
          {allowed.map((k) => { const I = MODS[k]!.icon; return (
            <button key={k} onClick={() => setTab(k)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${cur === k ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}><I size={16} />{MODS[k]!.label}</button>
          ); })}
        </nav>
        <div className="mt-6 border-t border-sidebar-border p-4 text-sm">
          <div className="font-medium">{session.name}</div><div className="opacity-70">{session.role}</div>
          <button onClick={store.logout} className="mt-3 flex items-center gap-1 opacity-80 hover:opacity-100"><LogOut size={14} /> Log out</button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold text-foreground">{m.label}</h1>
        {cur === "dashboard" ? <Dash db={db} /> : cur === "reports" ? <Reports db={db} /> : cur === "audit" ? <Audit db={db} /> : <Crud db={db} mod={cur} />}
      </main>
    </div>
  );
}

function Login() {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [show, setShow] = useState(false); const [busy, setBusy] = useState(false);
  const submit = (e: React.FormEvent) => { e.preventDefault(); setErr(""); if (!u || !p) return setErr("Please enter your username and password."); setBusy(true); setTimeout(() => { if (!store.login(u, p)) { setErr("Invalid username or password."); setBusy(false); } }, 400); };
  const demos = [["Admin", "admin", "admin123"], ["Doctor", "doctor", "doctor123"], ["Nurse", "nurse", "nurse123"]];
  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground md:flex">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-sidebar-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-sidebar-accent blur-3xl" />
        <div className="relative flex items-center gap-2 text-xl font-bold"><Activity className="text-sidebar-primary" /> MedRecords HIS</div>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Better care starts with<br /><span className="text-sidebar-primary">organized records.</span></h2>
          <ul className="space-y-3 text-sm opacity-90">
            {[[FileText, "Secure patient medical records"], [CalendarDays, "Appointment scheduling"], [Stethoscope, "Clinical services & prescriptions"], [Shield, "Role-based access & audit trail"]].map(([I, t]: any) => <li key={t} className="flex items-center gap-3"><span className="rounded-lg bg-sidebar-accent p-2"><I size={16} className="text-sidebar-primary" /></span>{t}</li>)}
          </ul>
        </div>
        <p className="relative text-xs opacity-60">Asian Development Foundation College · BS Information Technology</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div><div className="mb-6 flex items-center gap-2 font-bold text-foreground md:hidden"><Activity className="text-primary" /> MedRecords HIS</div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1><p className="text-sm text-muted-foreground">Sign in to access the hospital system.</p></div>
          <label className="block text-sm font-medium text-foreground">Username
            <div className="relative mt-1"><Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input autoFocus className={`${input} pl-9`} placeholder="Enter username" value={u} onChange={(e) => setU(e.target.value)} /></div></label>
          <label className="block text-sm font-medium text-foreground">Password
            <div className="relative mt-1"><Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input className={`${input} px-9`} type={show ? "text" : "password"} placeholder="Enter password" value={p} onChange={(e) => setP(e.target.value)} />
              <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
          {err && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}
          <button disabled={busy} className={`${btn} w-full justify-center py-2.5 disabled:opacity-60`}>{busy ? "Signing in…" : "Sign in"}</button>
          <div className="space-y-2 border-t pt-4"><p className="text-xs text-muted-foreground">Quick demo sign-in:</p>
            <div className="flex gap-2">{demos.map(([r, du, dp]) => <button type="button" key={r} onClick={() => { setU(du!); setP(dp!); setErr(""); }} className="flex-1 rounded-md border bg-card px-2 py-1.5 text-xs text-foreground hover:border-primary hover:text-primary">{r}</button>)}</div></div>
        </form>
      </div>
    </div>
  );
}

function Dash({ db }: { db: DB }) {
  const today = new Date().toISOString().slice(0, 10);
  const stats = [["Patients", db.patients.length, Users], ["Records", db.records.length, FileText], ["Today's appointments", db.appointments.filter((a) => a.date === today).length, CalendarDays], ["Prescriptions", db.prescriptions.length, Pill]] as const;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([l, v, I]) => <div key={l} className="rounded-xl border bg-card p-5"><I className="text-primary" /><div className="mt-3 text-3xl font-bold text-foreground">{v}</div><div className="text-sm text-muted-foreground">{l}</div></div>)}
      </div>
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 font-semibold text-foreground">Upcoming appointments</h2>
        <SimpleTable heads={["Patient", "Date", "Time", "Doctor", "Status"]} rows={db.appointments.filter((a) => a.status === "Scheduled").map((a) => [pname(db, a.patientId), a.date, a.time, a.doctor, a.status])} />
      </div>
    </div>
  );
}

const pname = (db: DB, id: string) => db.patients.find((p) => p.id === id)?.name ?? "—";

function Crud({ db, mod }: { db: DB; mod: string }) {
  const m = MODS[mod]!; const t = m.table!; const fields = m.fields!;
  const [edit, setEdit] = useState<any | null>(null); const [q, setQ] = useState("");
  const rows = (db[t] as any[]).filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()) || pname(db, r.patientId).toLowerCase().includes(q.toLowerCase()));
  const show = (f: F, r: any) => f.type === "patient" ? pname(db, r[f.k]) : f.type === "password" ? "••••" : String(r[f.k] ?? "");
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input className={`${input} max-w-xs`} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className={btn} onClick={() => setEdit(Object.fromEntries(fields.filter((f) => f.opts).map((f) => [f.k, f.opts![0]])))}><Plus size={16} /> Add</button>
      </div>
      {edit && (
        <form className="grid gap-3 rounded-xl border bg-card p-5 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); const r = { ...edit }; if (t === "users") r.active = String(r.active ?? "true") === "true"; store.save(t, r); setEdit(null); }}>
          {fields.map((f) => (
            <label key={f.k} className="text-sm text-muted-foreground">{f.label}
              {f.type === "patient" ? (
                <select required className={input} value={edit[f.k] ?? ""} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })}><option value="">Select…</option>{db.patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
              ) : f.opts ? (
                <select className={input} value={String(edit[f.k] ?? f.opts[0])} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })}>{f.opts.map((o) => <option key={o}>{o}</option>)}</select>
              ) : <input required className={input} type={f.type ?? "text"} value={edit[f.k] ?? ""} onChange={(e) => setEdit({ ...edit, [f.k]: e.target.value })} />}
            </label>
          ))}
          <div className="flex gap-2 sm:col-span-2"><button className={btn}>Save</button><button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={() => setEdit(null)}>Cancel</button></div>
        </form>
      )}
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-muted-foreground"><tr>{fields.map((f) => <th key={f.k} className="px-4 py-2">{f.label}</th>)}<th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                {fields.map((f) => <td key={f.k} className="px-4 py-2 text-foreground">{show(f, r)}</td>)}
                <td className="whitespace-nowrap px-4 py-2 text-right">
                  <button aria-label="Edit" className="p-1 text-muted-foreground hover:text-primary" onClick={() => setEdit(r)}><Pencil size={15} /></button>
                  <button aria-label="Delete" className="p-1 text-muted-foreground hover:text-destructive" onClick={() => confirm("Delete this entry?") && store.remove(t, r.id)}><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td className="px-4 py-6 text-center text-muted-foreground" colSpan={fields.length + 1}>No entries</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SimpleTable({ heads, rows }: { heads: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-muted-foreground"><tr>{heads.map((h) => <th key={h} className="border-b px-3 py-2">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="border-b">{r.map((c, j) => <td key={j} className="px-3 py-2 text-foreground">{c}</td>)}</tr>)}{!rows.length && <tr><td className="px-3 py-4 text-muted-foreground" colSpan={heads.length}>No entries</td></tr>}</tbody>
    </table>
  );
}

function Reports({ db }: { db: DB }) {
  const [kind, setKind] = useState("patient");
  const [pid, setPid] = useState(db.patients[0]?.id ?? "");
  const p = db.patients.find((x) => x.id === pid);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 print:hidden">
        <select className={`${input} max-w-xs`} value={kind} onChange={(e) => setKind(e.target.value)}><option value="patient">Patient medical summary</option><option value="appointments">All appointments</option><option value="services">All clinical services</option></select>
        {kind === "patient" && <select className={`${input} max-w-xs`} value={pid} onChange={(e) => setPid(e.target.value)}>{db.patients.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>}
        <button className={btn} onClick={() => window.print()}><Printer size={16} /> Print</button>
      </div>
      <div className="space-y-5 rounded-xl border bg-card p-6">
        <div><div className="text-lg font-bold text-foreground">Asian Development Foundation College — Hospital Information System</div><div className="text-sm text-muted-foreground">Generated {new Date().toLocaleString()}</div></div>
        {kind === "appointments" && <SimpleTable heads={["Patient", "Date", "Time", "Doctor", "Reason", "Status"]} rows={db.appointments.map((a) => [pname(db, a.patientId), a.date, a.time, a.doctor, a.reason, a.status])} />}
        {kind === "services" && <SimpleTable heads={["Patient", "Date", "Type", "Details", "By"]} rows={db.services.map((s) => [pname(db, s.patientId), s.date, s.type, s.details, s.by])} />}
        {kind === "patient" && p && (<>
          <div className="grid gap-1 text-sm text-foreground sm:grid-cols-2"><div><b>Name:</b> {p.name}</div><div><b>Sex:</b> {p.sex}</div><div><b>Birthdate:</b> {p.birth}</div><div><b>Blood:</b> {p.blood}</div><div><b>Contact:</b> {p.contact}</div><div><b>Address:</b> {p.address}</div></div>
          <h3 className="flex items-center gap-1 font-semibold text-foreground"><ClipboardList size={16} /> Medical records</h3>
          <SimpleTable heads={["Date", "Diagnosis", "Treatment", "Notes"]} rows={db.records.filter((r) => r.patientId === pid).map((r) => [r.date, r.diagnosis, r.treatment, r.notes])} />
          <h3 className="font-semibold text-foreground">Prescriptions</h3>
          <SimpleTable heads={["Date", "Medicine", "Dosage", "Instructions"]} rows={db.prescriptions.filter((r) => r.patientId === pid).map((r) => [r.date, r.medicine, r.dosage, r.instructions])} />
        </>)}
      </div>
    </div>
  );
}

function Audit({ db }: { db: DB }) {
  return <div className="rounded-xl border bg-card p-5"><SimpleTable heads={["When", "User", "Action"]} rows={db.logs.map((l) => [l.at, l.user, l.action])} /></div>;
}
