"use client";

interface MyListingsAlertsProps {
  archiveError: string | null;
  bumpMessage: string | null;
}

export function MyListingsAlerts({ archiveError, bumpMessage }: MyListingsAlertsProps) {
  return (
    <>
      {archiveError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {archiveError}
        </div>
      )}
      {bumpMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-700 font-bold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          {bumpMessage}
        </div>
      )}
    </>
  );
}
