import { useEffect, useState } from "react";
import { i18n } from "#i18n";
import type { SettingsSyncError } from "@/src/settings/sync";

const ErrorLabels = {
  capacity: "settingsSyncCapacity",
  unavailable: "settingsSyncUnavailable",
  statusUnavailable: "settingsSyncStatusUnavailable",
} as const;

export const SettingsSyncStatus = () => {
  const [error, setError] = useState<SettingsSyncError | "statusUnavailable" | null>(null);
  useEffect(() => {
    let disposed = false;
    let changed = false;
    const apply = (value: unknown) => {
      setError(value === "capacity" || value === "unavailable" ? value : null);
    };
    const handleChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "local" && changes.settingsSyncError) {
        changed = true;
        apply(changes.settingsSyncError.newValue);
      }
    };
    chrome.storage.onChanged.addListener(handleChange);
    void chrome.storage.local
      .get("settingsSyncError")
      .then(value => {
        if (!disposed && !changed) {
          apply(value.settingsSyncError);
        }
      })
      .catch(() => {
        if (!disposed && !changed) {
          setError("statusUnavailable");
        }
      });
    return () => {
      disposed = true;
      chrome.storage.onChanged.removeListener(handleChange);
    };
  }, []);

  return error ? (
    <p
      role="alert"
      className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      {i18n.t(ErrorLabels[error])}
    </p>
  ) : null;
};
