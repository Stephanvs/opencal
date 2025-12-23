export type KeybindsConfig = {
  leader?: string
  app_help?: string
  theme_list?: string
  command_list?: string
}

export const DEFAULT_KEYBINDS: KeybindsConfig = {
  leader: "space",
  app_help: "<leader>h",
  theme_list: "<leader>t",
  command_list: "ctrl+p,<leader>p",
}
