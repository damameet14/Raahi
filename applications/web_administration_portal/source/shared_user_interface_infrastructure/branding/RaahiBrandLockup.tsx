interface RaahiBrandLockupProps {
  className?: string;
  compact?: boolean;
}

export function RaahiBrandLockup({ className = "", compact = false }: RaahiBrandLockupProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="Raahi">
      <span className={`relative shrink-0 overflow-hidden ${compact ? "h-8 w-8" : "h-10 w-10"}`} aria-hidden="true">
        <img
          src={`${import.meta.env.BASE_URL}assets/raahi-logo.png`}
          alt=""
          className={`absolute max-w-none object-cover contrast-125 ${compact ? "-left-[9px] -top-[7px] h-[50px] w-[50px]" : "-left-[11px] -top-[9px] h-[63px] w-[63px]"}`}
        />
      </span>
      <span className={`${compact ? "text-base" : "text-xl"} font-black uppercase leading-none tracking-[-0.06em] text-[#17251b]`}>
        RAA<span className="text-[#32b45c]">HI</span>
      </span>
    </span>
  );
}
