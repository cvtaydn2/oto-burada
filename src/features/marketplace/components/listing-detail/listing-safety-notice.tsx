export function ListingSafetyNotice() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-700">
        Güvenli Alışveriş
      </div>
      <ul className="space-y-1.5 text-xs text-amber-800">
        <li className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0">•</span>
          Aracı görmeden kapora göndermeyin
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0">•</span>
          Ödemeyi noter huzurunda yapın
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0">•</span>
          Ekspertiz raporu isteyin
        </li>
      </ul>
    </div>
  );
}
