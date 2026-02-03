import { useEffect, useCallback } from "react";

type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: ShortcutHandler;
  description: string;
}

const shortcuts: ShortcutConfig[] = [];

export function useKeyboardShortcuts(
  config: ShortcutConfig[],
  enabled: boolean = true
) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of config) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [config, enabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

// Helper hook for dashboard shortcuts
export function useDashboardShortcuts(onNavigate: (tab: string) => void) {
  const shortcuts: ShortcutConfig[] = [
    {
      key: "h",
      handler: () => onNavigate("overview"),
      description: "Go to Home/Overview",
    },
    {
      key: "b",
      handler: () => onNavigate("bots"),
      description: "Go to Bots",
    },
    {
      key: "c",
      handler: () => onNavigate("conversations"),
      description: "Go to Conversations",
    },
    {
      key: "k",
      handler: () => onNavigate("knowledge"),
      description: "Go to Knowledge Base",
    },
    {
      key: "a",
      handler: () => onNavigate("analytics"),
      description: "Go to Analytics",
    },
    {
      key: "s",
      handler: () => onNavigate("settings"),
      description: "Go to Settings",
    },
    {
      key: "/",
      handler: () => {
        // Focus search input if available
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: "Focus Search",
    },
    {
      key: "?",
      shift: true,
      handler: () => onNavigate("help"),
      description: "Show Help",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

// Component to show keyboard shortcuts
export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: ShortcutConfig[] }) {
  return (
    <div className="grid gap-2">
      {shortcuts.map((shortcut, index) => (
        <div key={index} className="flex items-center justify-between py-1">
          <span className="text-sm text-muted-foreground">{shortcut.description}</span>
          <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border">
            {shortcut.shift && "⇧ "}
            {shortcut.ctrl && "⌘ "}
            {shortcut.alt && "⌥ "}
            {shortcut.key.toUpperCase()}
          </kbd>
        </div>
      ))}
    </div>
  );
}
