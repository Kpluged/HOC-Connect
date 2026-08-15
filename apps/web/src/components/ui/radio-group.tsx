type ChoiceOption = {
  description?: string;
  label: string;
  value: string;
};

function ChoiceCard({
  checked,
  description,
  label,
  name,
  type,
  value,
}: {
  checked?: boolean;
  description?: string;
  label: string;
  name: string;
  type: "checkbox" | "radio";
  value: string;
}) {
  return (
    <label className="flex min-h-24 cursor-pointer items-start gap-4 border border-contrast-low bg-surface-raised p-5 hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-surface">
      <input
        className="mt-1 size-4 accent-[var(--signal)]"
        defaultChecked={checked}
        name={name}
        type={type}
        value={value}
      />
      <span>
        <span className="block font-semibold">{label}</span>
        {description ? (
          <span className="mt-2 block text-sm leading-6 text-contrast-medium">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** Single-select card list backed by radio inputs sharing `name`. */
export function RadioGroup({
  defaultValue,
  description,
  legend,
  name,
  options,
}: {
  defaultValue?: string;
  description?: string;
  legend: string;
  name: string;
  options: ChoiceOption[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-contrast-medium">{description}</p>
      ) : null}
      <div className="mt-6 grid gap-3">
        {options.map((option) => (
          <ChoiceCard
            checked={option.value === defaultValue}
            description={option.description}
            key={option.value}
            label={option.label}
            name={name}
            type="radio"
            value={option.value}
          />
        ))}
      </div>
    </fieldset>
  );
}

/** Multi-select card list backed by checkbox inputs sharing `name`. */
export function CheckboxGroup({
  defaultValues = [],
  description,
  legend,
  name,
  options,
}: {
  defaultValues?: string[];
  description?: string;
  legend: string;
  name: string;
  options: ChoiceOption[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{legend}</legend>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-contrast-medium">{description}</p>
      ) : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <ChoiceCard
            checked={defaultValues.includes(option.value)}
            description={option.description}
            key={option.value}
            label={option.label}
            name={name}
            type="checkbox"
            value={option.value}
          />
        ))}
      </div>
    </fieldset>
  );
}
