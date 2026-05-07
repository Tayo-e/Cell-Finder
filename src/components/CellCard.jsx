// src/components/CellCard.jsx
import { formatDistance, googleMapsUrl } from "../utils/distance";

export default function CellCard({ cell, onSave, isSaved, rank }) {
  const { name, address, zone, leader, meetingDay, meetingTime, distanceKm, lat, lng } = cell;

  return (
    <div className="fade-up card-dark p-5 flex flex-col gap-3 hover:border-gold-dim transition-colors duration-200">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gold flex items-center justify-center text-xs font-bold text-black">
            {rank}
          </span>
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">{name}</h3>
            <span className="text-xs text-gold font-medium">{zone} Zone</span>
          </div>
        </div>

        {/* Distance badge */}
        {distanceKm !== undefined && (
          <span className="text-xs text-muted bg-border px-2 py-1 rounded-full whitespace-nowrap">
            {formatDistance(distanceKm)}
          </span>
        )}
      </div>

      {/* Info rows */}
      <div className="space-y-1.5 text-sm text-muted">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="truncate">{address}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
          <span>{leader}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-gold flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span>{meetingDay}s — {meetingTime}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <a
          href={googleMapsUrl(lat, lng, address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 btn-gold text-center text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Get Directions
        </a>

        {!isSaved ? (
          <button
            onClick={() => onSave(cell)}
            className="flex-1 text-sm py-2.5 px-4 rounded-lg border border-gold text-gold hover:bg-gold hover:text-black transition-all duration-200 font-medium"
          >
            This is my cell
          </button>
        ) : (
          <div className="flex-1 text-sm py-2.5 px-4 rounded-lg bg-green-900/30 border border-green-700 text-green-400 text-center font-medium">
            ✓ Saved
          </div>
        )}
      </div>
    </div>
  );
}
