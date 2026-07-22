"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { settingsService, AppSettings } from "@/services/settingsService";

const STACK_OPTIONS = [5, 10, 15, 20, 30, 40, 50];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settingsService.load().then(setSettings);
  }, []);

  async function handleSave(next: AppSettings) {
    setSettings(next);
    await settingsService.save(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleResetProgress() {
    const confirmed = window.confirm(
      "Fortschritt zurücksetzen\n\nAlle Lernfortschritte werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden."
    );
    if (!confirmed) return;
    window.localStorage.removeItem("word_progress");
    window.localStorage.removeItem("practice_stats");
    window.alert("Erledigt\n\nFortschritt wurde zurückgesetzt.");
  }

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader title="Einstellungen" />
      <div className="flex-1 overflow-y-auto px-6 pb-12">
        {!settings ? null : (
          <div className="mt-6 flex flex-col gap-6">
            {/* Stack size */}
            <div className="flex flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[0_3px_10px_rgba(0,0,0,0.05)]">
              <p className="text-xs font-bold tracking-wide text-muted-2">STAPELGRÖSSE</p>
              <p className="text-sm leading-5 text-[#666]">
                Wie viele Wörter gleichzeitig aktiv trainiert werden. Neue Wörter kommen hinzu wenn du
                ein Level aufsteigst.
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {STACK_OPTIONS.map((n) => {
                  const active = settings.maxStackSize === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleSave({ ...settings, maxStackSize: n })}
                      className={`rounded-xl border-[1.5px] px-[18px] py-2.5 text-base font-semibold ${
                        active ? "border-brand bg-brand text-white" : "border-border bg-white text-ink"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <p className="text-[13px] text-muted-2">Aktuell: {settings.maxStackSize} Wörter im Stapel</p>
            </div>

            {saved && (
              <div className="rounded-xl bg-correct-bg p-3.5 text-center">
                <p className="font-bold text-brand">Gespeichert ✓</p>
              </div>
            )}

            {/* Danger zone */}
            <div className="flex flex-col gap-3 rounded-[20px] bg-white p-5 shadow-[0_3px_10px_rgba(0,0,0,0.05)]">
              <p className="text-xs font-bold tracking-wide text-muted-2">GEFAHRENZONE</p>
              <button
                type="button"
                onClick={handleResetProgress}
                className="rounded-2xl border-[1.5px] border-wrong p-3.5 text-center text-[15px] font-semibold text-wrong"
              >
                Lernfortschritt zurücksetzen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
