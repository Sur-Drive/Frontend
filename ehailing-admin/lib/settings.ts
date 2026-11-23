import type { PlatformSettingsDraft } from "@/types/platform-settings";

export interface PlatformSettingsSaveInput {
  settings: PlatformSettingsDraft;
  changedFields: number;
  note: string;
}

// The settings backend is not connected yet. This is a typed stub that
// resolves locally and sends nothing (the note goes nowhere). Replace the body
// with an apiFetch call once the endpoint contract is known.
export async function savePlatformSettings(
  input: PlatformSettingsSaveInput,
): Promise<void> {
  void input.settings;
  void input.note;
  return;
}
