import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { getAllCells, getUserProfile, saveUserCell, getCellById, seedCells } from "../firebase/firestore";
import { getNearest, googleMapsUrl } from "../utils/distance";
import CellCard from "../components/CellCard";

const STATES = { IDLE:"idle", GPS_LOADING:"gps_loading", INIT_LOADING:"init_loading", RESULTS:"results", SAVED:"saved", ERROR:"error" };

export default function Dashboard({ user }) {
  const [state, setState]             = useState(STATES.INIT_LOADING);
  const [cells, setCells]             = useState([]);
  const [nearestCells, setNearest]    = useState([]);
  const [savedCell, setSavedCell]     = useState(null);
  const [savedCellId, setSavedCellId] = useState(null);
  const [errorMsg, setErrorMsg]       = useState("");
  const [errorType, setErrorType]     = useState("");
  const [seeding, setSeeding]         = useState(false);
  const [address, setAddress]         = useState("");

  // ── Init: load cells + check saved cell ─────────────────────
  useEffect(() => {
    async function init() {
      try {
        const [allCells, profile] = await Promise.all([
          getAllCells(),
          getUserProfile(user.uid),
        ]);
        setCells(allCells);
        console.log("Fetched cells:", allCells);

        if (profile?.assignedCellId) {
          const saved = await getCellById(profile.assignedCellId);
          if (saved) { setSavedCell(saved); setSavedCellId(saved.id); setState(STATES.SAVED); return; }
        }
        setState(STATES.IDLE);
      } catch (err) {
        if (err.code === "permission-denied") {
          setErrorType("rules");
          setErrorMsg("Firestore rules are blocking access. Update your rules in Firebase Console.");
        } else {
          setErrorType("config");
          setErrorMsg("Could not connect to database. Check your .env Firebase config.");
        }
        setState(STATES.ERROR);
      }
    }
    init();
  }, [user.uid]);

  // ── GPS search ───────────────────────────────────────────────
  function handleFindByGPS() {
    // Guard: cells must be loaded first
    if (cells.length === 0) {
      setErrorMsg("Cell data not loaded yet. Tap 'Load Cell Data' below first.");
      return;
    }
    if (!navigator.geolocation) {
      setErrorMsg("GPS not supported on this browser. Try typing your area instead.");
      return;
    }
    setErrorMsg("");
    setState(STATES.GPS_LOADING);

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        const nearest = getNearest(cells, latitude, longitude, 3);
        if (nearest.length === 0) {
          setErrorMsg("No cells found near your location.");
          setState(STATES.IDLE);
          return;
        }
        setNearest(nearest);
        setState(STATES.RESULTS);
      },
      (err) => {
        let msg = "Couldn't get your GPS location.";
        if (err.code === 1) msg = "Location access denied. Please allow location in your browser, or type your area below.";
        if (err.code === 3) msg = "GPS timed out. Please try again or type your area.";
        setErrorMsg(msg);
        setState(STATES.IDLE);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  // ── Address search ───────────────────────────────────────────
  async function handleFindByAddress(e) {
    e.preventDefault();
    if (!address.trim()) return;
    if (cells.length === 0) { setErrorMsg("Cell data not loaded yet. Tap 'Load Cell Data' below first."); return; }

    setErrorMsg("");
    setState(STATES.GPS_LOADING);
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + " Lagos Nigeria")}&limit=1`);
      const data = await res.json();
      if (!data.length) { setErrorMsg("Location not found. Try e.g. 'Surulere' or 'Gbagada'."); setState(STATES.IDLE); return; }
      const nearest = getNearest(cells, parseFloat(data[0].lat), parseFloat(data[0].lon), 3);
      setNearest(nearest);
      setState(STATES.RESULTS);
    } catch { setErrorMsg("Search failed. Check your connection and try again."); setState(STATES.IDLE); }
  }

  // ── Save chosen cell ─────────────────────────────────────────
  async function handleSaveCell(cell) {
    await saveUserCell(user.uid, cell.id);
    setSavedCell(cell); setSavedCellId(cell.id); setState(STATES.SAVED);
  }

  // ── Seed database ────────────────────────────────────────────
  async function handleSeed() {
    setSeeding(true);
    try {
      await seedCells();
      const all = await getAllCells();
      setCells(all);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err.code === "permission-denied"
        ? "Firestore rules blocked the load. Fix your rules first (see above)."
        : "Load failed: " + err.message);
    }
    setSeeding(false);
  }

  const firstName = user.displayName?.split(" ")[0] || "friend";
  const cellsLoaded = cells.length > 0;

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto px-4 py-6">

      {/* Navbar */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Harvesters" className="w-9 h-9 object-contain rounded-xl" />
          <div>
            <p className="text-xs text-muted leading-none">Welcome back,</p>
            <p className="text-sm font-semibold text-white leading-tight">{firstName} 👋</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cellsLoaded && (
            <span className="text-xs text-green-400 border border-green-800 px-2 py-1 rounded-full">
              {cells.length} cells loaded
            </span>
          )}
          <button onClick={() => signOut(auth)} className="text-xs text-muted hover:text-white border border-border px-3 py-1.5 rounded-lg transition-colors">
            Sign out
          </button>
        </div>
      </header>

      {/* ── INIT LOADING ─────────────────────────────────────────── */}
      {state === STATES.INIT_LOADING && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"/>
          <p className="text-sm text-muted">Loading cell data…</p>
        </div>
      )}

      {/* ── GPS LOADING ───────────────────────────────────────────── */}
      {state === STATES.GPS_LOADING && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center pulse-gold">
            <svg className="w-8 h-8 text-gold" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Finding your location…</p>
            <p className="text-sm text-muted mt-1">Please allow location access if prompted</p>
          </div>
        </div>
      )}

      {/* ── IDLE STATE ────────────────────────────────────────────── */}
      {state === STATES.IDLE && (
        <div className="fade-up space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white">Find Your Cell</h2>
            <p className="text-sm text-muted mt-1">
              {cellsLoaded
                ? `Searching across ${cells.length} Harvesters cells near you.`
                : "Load cell data first, then search by GPS or area."}
            </p>
          </div>

          {/* GPS Button */}
          <button
            onClick={handleFindByGPS}
            disabled={!cellsLoaded}
            className="btn-gold w-full py-4 rounded-xl flex items-center justify-center gap-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
            Use My Current Location
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border"/>
            <span className="text-xs text-muted">or type your area</span>
            <div className="flex-1 h-px bg-border"/>
          </div>

          {/* Address search */}
          <form onSubmit={handleFindByAddress} className="space-y-3">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Surulere, Gbagada, Yaba, Lekki…"
              disabled={!cellsLoaded}
              className="input-dark w-full px-4 py-3 rounded-lg text-sm disabled:opacity-40"
            />
            <button
              type="submit"
              disabled={!cellsLoaded}
              className="w-full py-3 rounded-lg border border-gold text-gold hover:bg-gold hover:text-black transition-all duration-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Search by Area
            </button>
          </form>

          {/* Error message */}
          {errorMsg && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Load cell data — shown until cells are seeded */}
          {!cellsLoaded && (
            <div className="card-dark p-4 space-y-3 text-center">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto">
                <svg className="w-5 h-5 text-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"/>
                  <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"/>
                  <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Cell database not loaded</p>
                <p className="text-xs text-muted mt-1">Tap below to load all 49 Harvesters cells (one time only)</p>
              </div>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="btn-gold w-full py-2.5 rounded-lg text-sm disabled:opacity-50"
              >
                {seeding ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"/>
                    Loading cells…
                  </span>
                ) : "Load Harvesters Cell Data"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTS STATE ─────────────────────────────────────────── */}
      {state === STATES.RESULTS && (
        <div className="fade-up space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white">Nearest Cells</h2>
              <p className="text-sm text-muted">
                {nearestCells.length > 0
                  ? `${nearestCells.length} cells found closest to you`
                  : "No cells found near your location"}
              </p>
            </div>
            <button onClick={() => { setState(STATES.IDLE); setNearest([]); }} className="text-xs text-muted hover:text-white border border-border px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
              ← Back
            </button>
          </div>

          {nearestCells.length === 0 ? (
            <div className="card-dark p-6 text-center space-y-2">
              <p className="text-white font-medium">No cells found</p>
              <p className="text-sm text-muted">Try searching a different area or use the GPS button.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {nearestCells.map((cell, i) => (
                <CellCard
                  key={cell.id}
                  cell={cell}
                  rank={i + 1}
                  onSave={handleSaveCell}
                  isSaved={savedCellId === cell.id}
                />
              ))}
            </div>
          )}

          {/* How it works hint */}
          <div className="bg-gold/10 border border-gold-dim rounded-xl px-4 py-3 text-sm text-gold">
            💡 Tap <strong>Get Directions</strong> on any cell to open Google Maps with turn-by-turn navigation. Tap <strong>This is my cell</strong> to save it to your profile.
          </div>
        </div>
      )}

      {/* ── SAVED STATE ───────────────────────────────────────────── */}
      {state === STATES.SAVED && savedCell && (
        <div className="fade-up space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Your Cell</h2>
            <p className="text-sm text-muted">Your saved fellowship center</p>
          </div>

          {/* Saved cell card */}
          <div className="card-dark p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white">{savedCell.name}</h3>
                <p className="text-xs text-gold">{savedCell.zone}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                <span className="text-muted leading-snug">{savedCell.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                <span className="text-muted">Cell Leader: <span className="text-white font-medium">{savedCell.leader}</span></span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>
                <span className="text-muted">{savedCell.meetingDay}s at <span className="text-white font-medium">{savedCell.meetingTime}</span></span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border"/>

            {/* Get Directions — Primary CTA */}
            <a
              href={googleMapsUrl(savedCell.lat, savedCell.lng, savedCell.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              Get Directions → Google Maps
            </a>

            {/* Call leader */}
            {savedCell.phone && (
              <a
                href={`tel:${savedCell.phone}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-sm text-muted hover:border-gold hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                Call Cell Leader: {savedCell.phone}
              </a>
            )}
          </div>

          {/* Change cell */}
          <button
            onClick={() => { setState(STATES.IDLE); setNearest([]); }}
            className="w-full text-sm text-muted hover:text-white border border-border py-2.5 rounded-xl transition-colors"
          >
            Find a different cell
          </button>
        </div>
      )}

      {/* ── ERROR STATE ───────────────────────────────────────────── */}
      {state === STATES.ERROR && (
        <div className="fade-up space-y-4">
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-4 rounded-xl">
            <p className="font-semibold mb-1">⚠️ Connection Error</p>
            <p>{errorMsg}</p>
          </div>
          {errorType === "rules" && (
            <div className="card-dark p-4 space-y-3 text-sm">
              <p className="font-semibold text-white">Fix: Update your Firestore Rules</p>
              <p className="text-muted">Firebase Console → Firestore Database → Rules → paste this → Publish:</p>
              <pre className="bg-black rounded-lg p-3 text-xs text-green-400 overflow-x-auto">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cells/{cellId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
  }
}`}</pre>
            </div>
          )}
          <button onClick={() => window.location.reload()} className="btn-gold w-full py-3 rounded-xl text-sm">Reload Page</button>
        </div>
      )}
    </div>
  );
}
