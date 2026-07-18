/** Labeled password input, shared by password-change forms. */

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: PasswordFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-text-secondary">
      {label}
      <input
        type="password"
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-[color:var(--color-border-primary)] bg-white px-3 py-3 text-sm text-text-primary outline-none focus:border-raahi-500"
        placeholder="••••••••"
      />
    </label>
  );
}
