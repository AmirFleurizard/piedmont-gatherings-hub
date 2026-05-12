// Shared definitions for optional event registration fields.
// `registration_fields` on an event is a JSON object keyed by field key:
//   { [key]: { enabled: boolean; required: boolean } }

export type RegistrationFieldKey =
  | "address"
  | "city"
  | "state"
  | "zip"
  | "name_on_tag"
  | "church_info"
  | "church_address"
  | "emergency_contact";

export interface RegistrationFieldConfig {
  enabled: boolean;
  required: boolean;
}

export type RegistrationFieldsConfig = Partial<
  Record<RegistrationFieldKey, RegistrationFieldConfig>
>;

export interface RegistrationFieldDef {
  key: RegistrationFieldKey;
  label: string;
  placeholder?: string;
  inputType?: "text" | "textarea";
  maxLength?: number;
  /** Optional helper shown under the input on the public form. */
  helper?: string;
}

export const REGISTRATION_FIELDS: RegistrationFieldDef[] = [
  { key: "address", label: "Address", maxLength: 200 },
  { key: "city", label: "City", maxLength: 100 },
  { key: "state", label: "State", maxLength: 60 },
  { key: "zip", label: "Zip", maxLength: 20 },
  {
    key: "name_on_tag",
    label: "Name (as you want it printed on name tag)",
    maxLength: 100,
  },
  {
    key: "church_info",
    label: "Church information",
    inputType: "textarea",
    maxLength: 300,
    helper: "Church name and city",
  },
  {
    key: "church_address",
    label: "Church address (if not a PDC member)",
    inputType: "textarea",
    maxLength: 300,
  },
  {
    key: "emergency_contact",
    label: "Emergency contact",
    inputType: "textarea",
    maxLength: 200,
    helper: "Name, relationship, and phone number",
  },
];

export const getFieldConfig = (
  cfg: unknown,
  key: RegistrationFieldKey
): RegistrationFieldConfig => {
  const obj = (cfg && typeof cfg === "object" ? cfg : {}) as Record<
    string,
    Partial<RegistrationFieldConfig> | undefined
  >;
  const entry = obj[key];
  return {
    enabled: !!entry?.enabled,
    required: !!entry?.required,
  };
};
