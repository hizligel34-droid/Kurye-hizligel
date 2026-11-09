import { FieldError } from "@/components/kuryeler/UiStates";
import { fieldClass, selectClass } from "@/lib/kuryelerTheme";
import { DISTRICT_NAMES } from "@shared/kuryeler";
import type { FieldErrors } from "@shared/kuryelerValidation";
import { Input } from "@/components/ui/input";

export type AddressDraft = {
  district: string;
  neighborhood: string;
  street: string;
  note: string;
};

export function AddressFields({
  id,
  label,
  value,
  onChange,
  errors,
}: {
  id: "pickup" | "dropoff";
  label: string;
  value: AddressDraft;
  onChange: (next: AddressDraft) => void;
  errors?: FieldErrors;
}) {
  const set = (patch: Partial<AddressDraft>) => onChange({ ...value, ...patch });
  const districtErr = errors?.[`${id}District`];
  const hoodErr = errors?.[`${id}Neighborhood`];
  const streetErr = errors?.[`${id}Street`];
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-bold text-[#D4AF37]">{label}</legend>
      <label className="block text-xs font-semibold text-[#8a7c52]" htmlFor={`${id}-district`}>
        İlçe
      </label>
      <select
        id={`${id}-district`}
        className={selectClass}
        value={value.district}
        aria-invalid={Boolean(districtErr)}
        aria-describedby={districtErr ? `${id}-district-err` : undefined}
        onChange={e => set({ district: e.target.value })}
      >
        <option value="">İlçe seçin</option>
        {DISTRICT_NAMES.map(name => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <FieldError id={`${id}-district-err`} message={districtErr} />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-semibold text-[#8a7c52]" htmlFor={`${id}-hood`}>
            Mahalle
          </label>
          <Input
            id={`${id}-hood`}
            className={fieldClass}
            placeholder="Mahalle"
            value={value.neighborhood}
            aria-invalid={Boolean(hoodErr)}
            aria-describedby={hoodErr ? `${id}-hood-err` : undefined}
            onChange={e => set({ neighborhood: e.target.value })}
          />
          <FieldError id={`${id}-hood-err`} message={hoodErr} />
        </div>
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-semibold text-[#8a7c52]" htmlFor={`${id}-street`}>
            Sokak / cadde
          </label>
          <Input
            id={`${id}-street`}
            className={fieldClass}
            placeholder="Sokak / cadde ve no"
            value={value.street}
            aria-invalid={Boolean(streetErr)}
            aria-describedby={streetErr ? `${id}-street-err` : undefined}
            onChange={e => set({ street: e.target.value })}
          />
          <FieldError id={`${id}-street-err`} message={streetErr} />
        </div>
      </div>
      <label className="mb-1 block text-xs font-semibold text-[#8a7c52]" htmlFor={`${id}-note`}>
        Kurye notu (isteğe bağlı)
      </label>
      <Input
        id={`${id}-note`}
        className={fieldClass}
        placeholder="Kapı kodu, tarif"
        value={value.note}
        onChange={e => set({ note: e.target.value })}
      />
    </fieldset>
  );
}
