import { onMount } from "solid-js";
import { Auth } from "@core/account";
import { useDialog } from "@tui/dialog/dialog";
import { useCommandDialog } from "@tui/dialog/dialog-command";
import { DialogSelect } from "@tui/dialog/dialog-select";

export async function AccountCommands() {
  const command = useCommandDialog();
  const dialog = useDialog();

  // const accounts = await createMemo(() => Auth.all());
  onMount(async () => {
    const all = await Auth.all();
  });
  
  

  // List Accounts command - only visible when accounts exist
  command.register(() => {
    const current = await accounts();
    if (current.length === 0) return [];

    return [
      {
        title: "List Accounts",
        value: "account_list",
        category: "Accounts",
        onSelect: () => {
          dialog.replace(() => (
            <DialogSelect
              title="Signed In Accounts"
              options={current.map((account) => ({
                title: account.email,
                description: account.provider,
                value: account.email,
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
