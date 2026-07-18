/**
 * Recurring-ride toggle with weekday chips (screens 1A.1 / 2A.1). When enabled
 * the user selects the days; the time defaults to the trip's departure time.
 */

const WEEKDAYS: Array<{ code: string; label: string }> = [
  { code: "MON", label: "M" },
  { code: "TUE", label: "T" },
  { code: "WED", label: "W" },
  { code: "THU", label: "Th" },
  { code: "FRI", label: "F" },
  { code: "SAT", label: "S" },
  { code: "SUN", label: "Su" },
];

interface RecurringDaysSelectorProps {
  isRecurring: boolean;
  onToggle: (isRecurring: boolean) => void;
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
}

export function RecurringDaysSelector({
  isRecurring,
  onToggle,
  selectedDays,
  onDaysChange,
}: RecurringDaysSelectorProps) {
  function toggleDay(dayCode: string) {
    if (selectedDays.includes(dayCode)) {
      onDaysChange(selectedDays.filter((code) => code !== dayCode));
    } else {
      onDaysChange([...selectedDays, dayCode]);
    }
  }

  return (
    <div className="rounded-2xl border border-[color:var(--color-border-primary)] p-4">
      <label className="flex items-center justify-between">
        <span className="text-sm font-semibold">Recurring ride</span>
        <button
          type="button"
          role="switch"
          aria-checked={isRecurring}
          onClick={() => onToggle(!isRecurring)}
          className={`relative h-6 w-11 rounded-full transition ${
            isRecurring ? "bg-raahi-600" : "bg-border-secondary"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
              isRecurring ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </label>

      {isRecurring && (
        <div className="mt-3 flex flex-wrap gap-2">
          {WEEKDAYS.map((weekday) => (
            <button
              key={weekday.code}
              type="button"
              onClick={() => toggleDay(weekday.code)}
              className={`h-9 w-9 rounded-full text-xs font-semibold transition ${
                selectedDays.includes(weekday.code)
                  ? "bg-raahi-600 text-white"
                  : "bg-surface-secondary text-text-secondary"
              }`}
            >
              {weekday.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
