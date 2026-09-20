import { useEffect, useState } from "react";
import { i18n } from "#i18n";

const CommandLabels = [
  ["sort-title", "sortByTitle"],
  ["sort-url", "sortByUrl"],
  ["toggle-last-active", "toggleLastActive"],
] as const;

export const KeyboardShortcuts = () => {
  const [commands, setCommands] = useState<chrome.commands.Command[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const refresh = () => {
      void chrome.commands
        .getAll()
        .then(value => {
          setCommands(value);
          setFailed(false);
        })
        .catch(() => setFailed(true));
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  return (
    <section className="mt-8 space-y-3 rounded-lg bg-white p-6 shadow-lg">
      <h2 className="text-xl font-semibold">{i18n.t("keyboardShortcuts")}</h2>
      <dl className="space-y-2">
        {CommandLabels.map(([name, label]) => (
          <div key={name} className="flex flex-wrap justify-between gap-2">
            <dt>{i18n.t(label)}</dt>
            <dd>
              {failed
                ? i18n.t("shortcutsUnavailable")
                : commands === null
                  ? "…"
                  : commands.find(command => command.name === name)?.shortcut ||
                    i18n.t("shortcutUnassigned")}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-sm text-gray-600">{i18n.t("shortcutSortingHelp")}</p>
      <button
        type="button"
        className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-100"
        onClick={() => {
          void chrome.tabs
            .create({ url: "chrome://extensions/shortcuts" })
            .catch(() => setFailed(true));
        }}
      >
        {i18n.t("configureShortcuts")}
      </button>
    </section>
  );
};
