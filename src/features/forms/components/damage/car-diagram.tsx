import { cn } from "@/lib";

interface CarDiagramProps {
  getStatus: (part: string) => string;
  onPartClick: (part: string) => void;
  isDisabled?: boolean;
  statusColors: Record<string, { fill: string }>;
}

export function CarDiagram({ getStatus, onPartClick, isDisabled, statusColors }: CarDiagramProps) {
  const renderPart = (part: string, dPath: string) => {
    const status = getStatus(part);
    const colorClass =
      status !== "orijinal" ? statusColors[status].fill : "fill-white stroke-slate-300";

    return (
      <path
        d={dPath}
        className={cn("cursor-pointer transition-all duration-300 hover:opacity-80", colorClass)}
        strokeWidth="2"
        onClick={() => !isDisabled && onPartClick(part)}
      />
    );
  };

  return (
    <svg viewBox="0 0 240 460" className="h-auto w-full max-w-[220px] drop-shadow-sm">
      {/* Base Car Body Shadow */}
      <path
        d="M50,40 Q50,20 120,20 Q190,20 190,40 L195,100 L200,300 Q200,440 120,440 Q40,440 40,300 L45,100 Z"
        fill="rgba(0,0,0,0.05)"
      />

      {/* Part: Kaput */}
      {renderPart("kaput", "M60,65 Q60,40 120,40 Q180,40 180,65 L185,130 Q120,135 55,130 Z")}

      {/* Part: On Tampon */}
      {renderPart("on_tampon", "M60,30 Q120,25 180,30 L185,45 Q120,40 55,45 Z")}

      {/* Side Mirrors (Aesthetics) */}
      <path d="M40,140 Q30,140 30,150 L35,165" fill="none" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M200,140 Q210,140 210,150 L205,165" fill="none" stroke="#cbd5e1" strokeWidth="2" />

      {/* Part: Sol On Camurluk */}
      {renderPart("sol_on_camurluk", "M45,100 L55,100 L55,180 L45,180 Z")}

      {/* Part: Sag On Camurluk */}
      {renderPart("sag_on_camurluk", "M185,100 L195,100 L195,180 L185,180 Z")}

      {/* Part: Sol On Kapi */}
      {renderPart("sol_on_kapi", "M48,185 L58,185 L58,260 L48,260 Z")}

      {/* Part: Sag On Kapi */}
      {renderPart("sag_on_kapi", "M182,185 L192,185 L192,260 L182,260 Z")}

      {/* Part: Sol Arka Kapi */}
      {renderPart("sol_arka_kapi", "M48,265 L58,265 L58,340 L48,340 Z")}

      {/* Part: Sag Arka Kapi */}
      {renderPart("sag_arka_kapi", "M182,265 L192,265 L192,340 L182,340 Z")}

      {/* Part: Sol Arka Camurluk */}
      {renderPart("sol_arka_camurluk", "M46,345 L56,345 L56,410 Q46,410 46,345 Z")}

      {/* Part: Sag Arka Camurluk */}
      {renderPart("sag_arka_camurluk", "M184,345 L194,345 L194,410 Q184,410 184,345 Z")}

      {/* Part: Tavan */}
      {renderPart("tavan", "M65,150 L175,150 L175,330 Q120,330 65,330 Z")}

      {/* Interior Details (Aesthetics) */}
      <path d="M75,165 L165,165" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
      <path d="M75,315 L165,315" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />

      {/* Part: Bagaj */}
      {renderPart("bagaj", "M65,340 L175,340 L180,410 Q120,420 60,410 Z")}

      {/* Part: Arka Tampon */}
      {renderPart("arka_tampon", "M60,425 Q120,435 180,425 L185,440 Q120,450 55,440 Z")}
    </svg>
  );
}
