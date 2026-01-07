import {
  createContext,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
  type Accessor,
  type ParentProps,
} from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useDialog } from "./dialog";
import {
  DialogSelect,
  type DialogSelectOption,
  type DialogSelectRef,
} from "@tui/dialog/dialog-select";
import { useKeybind } from "../keyboard/keybind-context";
import type { KeybindsConfig } from "@tui/keyboard/keybinds-config";

type Context = ReturnType<typeof init>;
const ctx = createContext<Context>();

export type CommandOption = DialogSelectOption & {
  keybind?: keyof KeybindsConfig;
  suggested?: boolean;
};

function init() {
  const [registrations, setRegistrations] = createSignal<
    Accessor<CommandOption[]>[]
  >([]);
  const [suspendCount, setSuspendCount] = createSignal(0);
  const dialog = useDialog();
  const keybind = useKeybind();

  const options = createMemo(() => {
    const all = registrations().flatMap((x) => x());
    const suggested = all.filter((x) => x.suggested);
    return [
      ...suggested.map((x) => ({
        ...x,
        category: "Suggested",
        value: `suggested.${x.value}`,
      })),
      ...all,
    ].map((x) => ({
      ...x,
      footer: x.keybind ? keybind.print(x.keybind) : undefined,
    }));
  });

  const suspended = () => suspendCount() > 0;

  useKeyboard((evt) => {
    if (suspended()) return;
    for (const option of options()) {
      if (option.keybind && keybind.match(option.keybind, evt)) {
        evt.preventDefault();
        option.onSelect?.(dialog);
        return;
      }
    }
  });

  const result = {
    trigger(name: string) {
      for (const option of options()) {
        if (option.value === name) {
          option.onSelect?.(dialog);
          return;
        }
      }
    },
    keybinds(enabled: boolean) {
      setSuspendCount((count) => count + (enabled ? -1 : 1));
    },
    suspended,
    show() {
      dialog.replace(() => <DialogCommand options={options()} />);
    },
    register(cb: () => CommandOption[]) {
      const results = createMemo(cb);
      setRegistrations((arr) => [results, ...arr]);
      onCleanup(() => {
        setRegistrations((arr) => arr.filter((x) => x !== results));
      });
    },
    get options() {
      return options();
    },
  };
  return result;
}

export function useCommandDialog() {
  const value = useContext(ctx);
  if (!value) {
    throw new Error("useCommandDialog must be used within a CommandProvider");
  }
  return value;
}

export function CommandProvider(props: ParentProps) {
  const value = init();
  const dialog = useDialog();
  const keybind = useKeybind();

  useKeyboard((evt) => {
    if (value.suspended()) return;
    if (dialog.stack.length > 0) return;
    if (evt.defaultPrevented) return;
    if (keybind.match("command_list", evt)) {
      evt.preventDefault();
      dialog.replace(() => <DialogCommand options={value.options} />);
      return;
    }
  });

  return <ctx.Provider value={value}>{props.children}</ctx.Provider>;
}

function DialogCommand(props: { options: CommandOption[] }) {
  let ref: DialogSelectRef | undefined;
  return (
    <DialogSelect
      ref={(r) => {
        ref = r;
      }}
      title="Commands"
      options={props.options.filter(
        (x) => !ref?.filter || !x.value.startsWith("suggested."),
      )}
    />
  );
}
