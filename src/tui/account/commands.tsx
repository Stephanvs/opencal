import { useDialog } from "@tui/dialog/dialog";
import { useCommandDialog } from "@tui/dialog/dialog-command";
import { DialogSelect } from "@tui/dialog/dialog-select";
import { useProvider } from "@tui/provider";

export function AccountCommands() {
  const command = useCommandDialog();
  const dialog = useDialog();
  const provider = useProvider();

  // List Accounts command - only visible when providers exist
  command.register(() => {
    const providers = provider.providers();
    if (providers.length === 0) return [];

    return [
      {
        title: "List Accounts",
        value: "account_list",
        category: "Accounts",
        onSelect: () => {
          dialog.replace(() => (
            <DialogSelect
              title="Connected Accounts"
              options={providers.map((p) => ({
                title: `${p.name}: ${p.id}`,
                description: p.enabled ? "Enabled" : "Disabled",
                value: p.id,
              }))}
              onSelect={() => dialog.clear()}
            />
          ));
        },
      },
    ];
  });

  return null;
}
