import { createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { createSimpleContext } from "./create-simple-context"
import { useKeyboard, useRenderer } from "@opentui/solid"
import { Keybind } from "@tui/keyboard/keybind"
import type { ParsedKey, Renderable } from "@opentui/core"
import type { KeybindsConfig } from "@tui/keyboard/keybinds-config"
import { pipe } from "remeda"

export const { use: useKeybind, provider: KeybindProvider } = createSimpleContext({
  name: "Keybind",
  init: () => {
    const keybinds = createMemo(() => {
      return pipe(
        DEFAULT_KEYBINDS,
        // (val) => Object.assign(val, )
      )
    })

    const [store, setStore] = createStore({
      leader: false,
    })

    const renderer = useRenderer()

    let focus: Renderable | null
    let timeout: NodeJS.Timeout

    function leader(active: boolean) {
      if (active) {
        setStore("leader", true)
        focus = renderer.currentFocusedRenderable
        focus?.blur()
        if (timeout) clearTimeout(timeout)
        timeout = setTimeout(() => {
          if (!store.leader) return
          leader(false)
          if (focus) {
            focus.focus()
          }
        }, 2000)
        return
      }

      if (!active) {
        if (focus && !renderer.currentFocusedRenderable) {
          focus.focus()
        }
        setStore("leader", false)
      }
    }

    useKeyboard(async (evt: any) => {
      if (!store.leader && result.match("leader", evt)) {
        leader(true)
        return
      }

      if (store.leader && evt.name) {
        setImmediate(() => {
          if (focus && renderer.currentFocusedRenderable === focus) {
            focus.focus()
          }
          leader(false)
        })
      }
    })

    const result = {
      get all() {
        return keybinds()
      },
      get leader() {
        return store.leader
      },
      parse(evt: ParsedKey): Keybind.Info {
        return {
          meta: evt.meta,
          ctrl: evt.ctrl,
          shift: evt.shift,
          name: evt.name,
          leader: store.leader,
        }
      },
      match(key: keyof KeybindsConfig, evt: ParsedKey) {
        const keybind = keybinds()[key]
        if (!keybind) return false
        const parsed: Keybind.Info = result.parse(evt)
        for (const key of keybind) {
          if (Keybind.match(key, parsed)) {
            return true
          }
        }
      },
      print(key: keyof KeybindsConfig) {
        const first = keybinds()[key]?.at(0)
        if (!first) return ""
        const result = Keybind.toString(first)
        return result.replace("<leader>", Keybind.toString(keybinds().leader![0]!))
      },
    }
    return result
  },
})

const DEFAULT_KEYBINDS: KeybindsConfig = {
  leader: "space",
  app_help: "<leader>h",
  theme_list: "<leader>t",
  command_list: "<leader>p",
}
