import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "../firebase/config";
import { getCellById, subscribeToCells } from "../firebase/firestore";
import { getNearest, googleMapsUrl } from "../utils/distance";
import CellCard from "../components/CellCard";

const STATES = {
  INIT_LOADING: "init_loading",
  IDLE: "idle",
  GPS_LOADING: "gps_loading",
  RESULTS: "results",
  SELECTED: "selected",
  ERROR: "error",
};

function whatsappUrl(phone, cellName) {
  const digits = phone?.replace(/\D/g, "");
  if (!digits) return "";

  const international = digits.startsWith("234")
    ? digits
    : digits.startsWith("0")
      ? `234${digits.slice(1)}`
      : digits;

  const message = `Hello, I found ${cellName} on Harvesters CellFinder and would like to join.`;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}

export default function Dashboard() {
  const [state, setState] = useState(STATES.INIT_LOADING);
  const [cells, setCells] = useState([]);
  const [nearestCells, setNearest] = useState([]);
  const [selectedCellId, setSelectedCellId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorType, setErrorType] = useState("");
  const [address, setAddress] = useState("");

  const selectedCell = useMemo(
    () => cells.find((cell) => cell.id === selectedCellId) ?? null,
    [cells, selectedCellId]
  );

  useEffect(() => {
    trackEvent("site_visit");

    const unsubscribe = subscribeToCells(
      (allCells) => {
        setCells(allCells);
        setErrorMsg("");
        setErrorType("");
        setState((current) => (current === STATES.INIT_LOADING ? STATES.IDLE : current));
      },
      (err) => {
        if (err.code === "permission-denied") {
          setErrorType("rules");
          setErrorMsg("Firestore rules are blocking public cell access.");
        } else {
          setErrorType("config");
          setErrorMsg("Could not connect to the cell database. Check your Firebase config.");
        }
        setState(STATES.ERROR);
      }
    );

    return unsubscribe;
  }, []);

  function handleFindByGPS() {
    if (cells.length === 0) {
      setErrorMsg("Cell data is not loaded yet. Tap 'Load Cell Data' below first.");
      return;
    }
    if (!navigator.geolocation) {
      setErrorMsg("GPS is not supported on this browser. Try typing your area instead.");
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
        trackEvent("cell_search", { method: "gps", results: nearest.length });
        setState(STATES.RESULTS);
      },
      (err) => {
        let msg = "Could not get your GPS location.";
        if (err.code === 1) msg = "Location access denied. Please allow location, or type your area below.";
        if (err.code === 3) msg = "GPS timed out. Please try again or type your area.";
        setErrorMsg(msg);
        setState(STATES.IDLE);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }

  async function handleFindByAddress(e) {
    e.preventDefault();
    if (!address.trim()) return;
    if (cells.length === 0) {
      setErrorMsg("Cell data is not loaded yet. Tap 'Load Cell Data' below first.");
      return;
    }

    setErrorMsg("");
    setState(STATES.GPS_LOADING);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${address} Lagos Nigeria`)}&limit=1`
      );
      const data = await res.json();

      if (!data.length) {
        setErrorMsg("Location not found. Try e.g. 'Surulere' or 'Gbagada'.");
        setState(STATES.IDLE);
        return;
      }

      const nearest = getNearest(cells, parseFloat(data[0].lat), parseFloat(data[0].lon), 3);
      setNearest(nearest);
      trackEvent("cell_search", { method: "area", results: nearest.length });
      setState(STATES.RESULTS);
    } catch {
      setErrorMsg("Search failed. Check your connection and try again.");
      setState(STATES.IDLE);
    }
  }

  async function handleChooseCell(cell) {
    setSelectedCellId(cell.id);
    setState(STATES.SELECTED);
    trackEvent("cell_selected", { cell_id: cell.id, cell_name: cell.name });

    const latest = await getCellById(cell.id);
    if (latest) setCells((current) => current.map((item) => (item.id === latest.id ? latest : item)));
  }

  const cellsLoaded = cells.length > 0;
  const selectedWhatsappUrl = selectedCell ? whatsappUrl(selectedCell.phone, selectedCell.name) : "";

  return (
    <div className="min-h-screen flex flex-col w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Harvesters" className="w-9 h-9 object-contain rounded-xl" />
          <div>
            <p className="text-xs text-muted leading-none">Harvesters</p>
            <p className="text-sm font-semibold text-white leading-tight">CellFinder</p>
          </div>
        </div>

        {cellsLoaded && (
          <span className="text-xs text-green-400 border border-green-800 px-2 py-1 rounded-full">
            {cells.length} cells loaded
          </span>
        )}
      </header>

      {state === STATES.INIT_LOADING && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted">Loading cell data...</p>
        </div>
      )}

      {state === STATES.GPS_LOADING && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center pulse-gold">
            <svg className="w-8 h-8 text-gold" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-medium">Finding your location...</p>
            <p className="text-sm text-muted mt-1">Please allow location access if prompted</p>
          </div>
        </div>
      )}

      {state === STATES.IDLE && (
        <div className="fade-up space-y-5 md:max-w-md md:w-full md:mx-auto">
          <div>
            <h2 className="text-xl font-bold text-white">Find Your Cell</h2>
            <p className="text-sm text-muted mt-1">
              {cellsLoaded
                ? `Searching across ${cells.length} Harvesters cells near you.`
                : "Cell data is not available yet. Please check back soon."}
            </p>
          </div>

          <button
            onClick={handleFindByGPS}
            disabled={!cellsLoaded}
            className="btn-gold w-full py-4 rounded-xl flex items-center justify-center gap-3 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            Use My Current Location
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">or type your area</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleFindByAddress} className="space-y-3">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Surulere, Gbagada, Yaba, Lekki..."
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

          {errorMsg && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg">
              {errorMsg}
            </div>
          )}

          {!cellsLoaded && (
            <div className="card-dark p-4 text-center">
              <p className="text-sm font-medium text-white">No cells are available right now</p>
              <p className="text-xs text-muted mt-1">Once cell records are added in Firestore, they will appear here automatically.</p>
            </div>
          )}
        </div>
      )}

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
            <button
              onClick={() => {
                setState(STATES.IDLE);
                setNearest([]);
              }}
              className="text-xs text-muted hover:text-white border border-border px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              Back
            </button>
          </div>

          {nearestCells.length === 0 ? (
            <div className="card-dark p-6 text-center space-y-2">
              <p className="text-white font-medium">No cells found</p>
              <p className="text-sm text-muted">Try searching a different area or use the GPS button.</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
              {nearestCells.map((cell, i) => (
                <CellCard
                  key={cell.id}
                  cell={cell}
                  rank={i + 1}
                  onChoose={handleChooseCell}
                />
              ))}
            </div>
          )}

          <div className="bg-gold/10 border border-gold-dim rounded-xl px-4 py-3 text-sm text-gold">
            Tap <strong>Get Directions</strong> to open Google Maps, or <strong>Join this cell</strong> to view the cell leader contact details.
          </div>
        </div>
      )}

      {state === STATES.SELECTED && selectedCell && (
        <div className="fade-up space-y-4 md:max-w-2xl md:w-full md:mx-auto">
          <div>
            <h2 className="text-xl font-bold text-white">Join This Cell</h2>
            <p className="text-sm text-muted">Message the cell leader or get directions.</p>
          </div>

          <div className="card-dark p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white">{selectedCell.name}</h3>
                <p className="text-xs text-gold">{selectedCell.zone}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span className="text-muted leading-snug">{selectedCell.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-muted">Cell Leader: <span className="text-white font-medium">{selectedCell.leader}</span></span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <span className="text-muted">{selectedCell.meetingDay}s at <span className="text-white font-medium">{selectedCell.meetingTime}</span></span>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="grid gap-2 md:grid-cols-2">
              <a
                href={googleMapsUrl(selectedCell.lat, selectedCell.lng, selectedCell.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold"
              >
                Get Directions
              </a>

              {selectedCell.phone && (
                <a
                  href={selectedWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("whatsapp_click", { cell_id: selectedCell.id })}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl border border-green-700 text-sm text-green-400 hover:border-green-500 hover:text-green-300 transition-colors font-semibold"
                >
                  Message on WhatsApp
                </a>
              )}
            </div>

            {selectedCell.phone && (
              <a
                href={`tel:${selectedCell.phone}`}
                onClick={() => trackEvent("phone_click", { cell_id: selectedCell.id })}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border text-sm text-muted hover:border-gold hover:text-white transition-colors"
              >
                Call Cell Leader: {selectedCell.phone}
              </a>
            )}
          </div>

          <button
            onClick={() => {
              setState(STATES.IDLE);
              setNearest([]);
              setSelectedCellId(null);
            }}
            className="w-full text-sm text-muted hover:text-white border border-border py-2.5 rounded-xl transition-colors"
          >
            Find a different cell
          </button>
        </div>
      )}

      {state === STATES.ERROR && (
        <div className="fade-up space-y-4 md:max-w-2xl md:w-full md:mx-auto">
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-4 rounded-xl">
            <p className="font-semibold mb-1">Connection Error</p>
            <p>{errorMsg}</p>
          </div>
          {errorType === "rules" && (
            <div className="card-dark p-4 space-y-3 text-sm">
              <p className="font-semibold text-white">Fix: Update your Firestore Rules</p>
              <p className="text-muted">Firebase Console - Firestore Database - Rules - paste this - Publish:</p>
              <pre className="bg-black rounded-lg p-3 text-xs text-green-400 overflow-x-auto">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cells/{cellId} {
      allow read: if true;
      allow write: if false;
    }
  }
}`}</pre>
            </div>
          )}
          <button onClick={() => window.location.reload()} className="btn-gold w-full py-3 rounded-xl text-sm">
            Reload Page
          </button>
        </div>
      )}
    </div>
  );
}
