import type { FieldDef } from '../data/steps';

interface Props {
  def: FieldDef;
  value: string;
  error?: string;
  onChange: (name: string, value: string) => void;
}

const baseId = (name: string) => `field-${name}`;

export function Field({ def, value, error, onChange }: Props) {
  const id = baseId(def.name);
  const describedBy = error ? `${id}-error` : def.hint ? `${id}-hint` : undefined;
  const common = {
    id,
    name: def.name,
    required: def.required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    className: 'field',
  } as const;

  return (
    <div className={def.span === 2 ? 'sm:col-span-2' : ''}>
      {def.type !== 'checkbox' && (
        <label
          className="label"
          id={def.type === 'radio' ? id : undefined}
          htmlFor={def.type === 'radio' ? undefined : id}
        >
          {def.label}
          {def.required ? <span className="ml-1 text-brand-400">*</span> : null}
        </label>
      )}

      {def.type === 'textarea' ? (
        <textarea
          {...common}
          rows={def.rows ?? 3}
          minLength={def.minLength}
          maxLength={def.maxLength}
          placeholder={def.placeholder}
          value={value}
          onChange={(e) => onChange(def.name, e.target.value)}
        />
      ) : def.type === 'select' ? (
        <select {...common} value={value} onChange={(e) => onChange(def.name, e.target.value)}>
          {def.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : def.type === 'radio' ? (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={id}>
          {def.options?.map((option) => (
            <label
              key={option.value}
              className={`btn ${value === option.value ? 'btn-primary' : 'btn-ghost'} font-medium`}
            >
              <input
                type="radio"
                name={def.name}
                value={option.value}
                required={def.required}
                checked={value === option.value}
                onChange={(e) => onChange(def.name, e.target.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : def.type === 'checkbox' ? (
        <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-300">
          <input
            id={id}
            name={def.name}
            type="checkbox"
            required={def.required}
            checked={value === 'on'}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            onChange={(e) => onChange(def.name, e.target.checked ? 'on' : '')}
            className="mt-0.5 h-4 w-4 accent-brand-500"
          />
          <span>{def.label}</span>
        </label>
      ) : (
        <input
          {...common}
          type={def.type}
          placeholder={def.placeholder}
          pattern={def.pattern}
          minLength={def.minLength}
          maxLength={def.maxLength}
          min={def.min}
          max={def.max}
          autoComplete={def.autoComplete}
          value={value}
          onChange={(e) => onChange(def.name, e.target.value)}
        />
      )}

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-severe">
          {error}
        </p>
      ) : def.hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">
          {def.hint}
        </p>
      ) : null}
    </div>
  );
}
