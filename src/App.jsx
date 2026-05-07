// src/App.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import Login    from "./pages/Login";
import Signup   from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser]         = useState(undefined); // undefined = loading
  const [view, setView]         = useState("login");    // 'login' | 'signup'

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  // ── Splash while Firebase initialises ────────────────────────
  if (user === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <img src="/logo.png" alt="Harvesters" className="w-16 h-16 object-contain rounded-2xl" />
        <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Authenticated → Dashboard ─────────────────────────────────
  if (user) return <Dashboard user={user} />;

  // ── Unauthenticated → Auth screens ───────────────────────────
  return view === "login"
    ? <Login  onSwitch={() => setView("signup")} />
    : <Signup onSwitch={() => setView("login")}  />;
}
