import { useEffect, useRef, useState, type FormEvent } from "react";
import { Activity, ArrowRight, BookOpen, CalendarDays, ChartNoAxesCombined, ChevronDown, Cross, Eye, EyeOff, FileText, HeartPulse, Home, LockKeyhole, LogIn, ShieldCheck, Stethoscope, UserRound, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { store } from "@/lib/his-store";
import hospital from "@/assets/hospital-exterior.jpg";

const features = [
  { icon: Users, label: "Patient Management" },
  { icon: CalendarDays, label: "Appointment Scheduling" },
  { icon: FileText, label: "Medical Records" },
  { icon: ChartNoAxesCombined, label: "Reports Generation" },
];

export function HISLogin() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<"about" | "contact" | null>(null);
  const usernameInput = useRef<HTMLInputElement>(null);
  const focusSignIn = () => { usernameInput.current?.scrollIntoView({ block: "center", behavior: "smooth" }); usernameInput.current?.focus({ preventScroll: true }); };
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!username || !password) { setError("Please enter your username and password."); return; }
    if (!store.login(username, password)) setError("Invalid username or password.");
  }
  return (
    <div className="his-login" data-ready={ready}>
      <img className="his-hospital" src={hospital} alt="Illustration of a modern hospital exterior" width={1920} height={1088} />
      <div className="his-photo-tint" />
      <header className="his-header">
        <a href="/" className="his-brand"><span className="his-brand-symbol"><Cross /><Activity /></span><span><strong>MedRecords HIS</strong><small>Hospital Information System</small></span></a>
        <nav aria-label="Main navigation" className="his-navigation">
          <Button variant="ghost" className="his-home" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Home />Home</Button>
          <Button variant="ghost" onClick={() => setDialog("about")}>About</Button>
          <Button variant="ghost" onClick={() => document.getElementById("clinical-features")?.scrollIntoView({ block: "center", behavior: "smooth" })}>Features<ChevronDown /></Button>
          <Button variant="ghost" onClick={() => setDialog("contact")}>Contact</Button>
        </nav>
        <Button className="his-gradient his-header-signin" onClick={focusSignIn}><UserRound />Sign In</Button>
      </header>
      <main className="his-main">
        <section className="his-intro">
          <p className="his-college">Asian Development Foundation College</p>
          <h1>MedRecords <span>HIS</span></h1>
          <h2>Medical Records and Clinical<br className="hidden xl:block" /> Services Management System</h2>
          <p className="his-tagline">Better healthcare. Smarter management.</p>
          <p className="his-description">Efficiently manage patient records, appointments,<br className="hidden xl:block" /> and clinical services all in one place.</p>
          <div className="his-features" id="clinical-features">{features.map(({ icon: Icon, label }) => <div className="his-feature" key={label}><Icon aria-hidden="true" /><span>{label}</span></div>)}</div>
          <div className="his-intro-actions"><Button className="his-system-button" onClick={focusSignIn}><Stethoscope />Sign in to System<ArrowRight /></Button><Button variant="outline" className="his-learn-button" onClick={() => setDialog("about")}><BookOpen />Learn More</Button></div>
        </section>
        <section className="his-signin" aria-labelledby="signin-title">
          <HeartPulse className="his-heart" aria-hidden="true" />
          <h2 id="signin-title">MedRecords HIS</h2>
          <p className="his-signin-subtitle">Access for Better Healthcare</p>
          <div className="his-divider"><span /><Activity /><span /></div>
          <form onSubmit={submit} className="his-form">
            <div className="his-field"><UserRound /><input ref={usernameInput} aria-label="Username" autoComplete="username" placeholder="Username" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} /></div>
            <div className="his-field"><LockKeyhole /><input aria-label="Password" autoComplete="current-password" type={show ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} /><Button variant="ghost" size="icon" type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</Button></div>
            {error && <p role="alert" className="his-error">{error}</p>}
            <Button type="submit" className="his-gradient his-submit"><LogIn />Sign In</Button>
          </form>
          <div className="his-or"><span />or<span /></div>
          <Button variant="outline" className="his-contact" onClick={() => setDialog("contact")}><ShieldCheck />Contact Administrator</Button>
          <div className="his-demo"><span>Demo sign-in</span><div>{["Admin", "Doctor", "Nurse"].map((role) => <Button key={role} variant="ghost" size="sm" onClick={() => { const name = role.toLowerCase(); setUsername(name); setPassword(name + "123"); setError(""); }}>{role}</Button>)}</div></div>
          <p className="his-demo-notice"><ShieldCheck />Demo system · Use sample data only</p>
        </section>
      </main>
      <footer className="his-footer"><span>© 2026 MedRecords HIS. All rights reserved.</span><span>“Healthier Community, A Brighter Tomorrow”</span></footer>
      <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null); }}><DialogContent><DialogHeader><DialogTitle>{dialog === "contact" ? "Contact Administrator" : "MedRecords HIS"}</DialogTitle><DialogDescription>{dialog === "contact" ? "Administrator contact details have not been provided. Ask your institution’s system administrator for account assistance. Demo accounts are available on the sign-in page." : "Medical Records and Clinical Services Management System for Asian Development Foundation College. This demonstration stores information in your browser; it is not connected to a shared online system and must not be used for real patient data."}</DialogDescription></DialogHeader></DialogContent></Dialog>
    </div>
  );
}