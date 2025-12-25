import { createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { useKeyboard, useRenderer } from "@opentui/solid"
import { pipe, mapValues } from "remeda"
import { createSimpleContext } from "./create-simple-context"
import { Keybind } from "@tui/keyboard/keybind"
import { DEFAULT_KEYBINDS, type KeybindsConfig } from "@tui/keyboard/keybinds-config"
import { InputRenderable, TextareaRenderable, type ParsedKey, type Renderable } from "@opentui/core"

export const { use: useKeybind, provider: KeybindProvider } = createSimpleContext({
  name: "Keybind",
  init: () => {
    const keybinds = createMemo(() => {
      return pipe(
        DEFAULT_KEYBINDS,
        mapValues((value) => (value ? Keybind.parse(value) : [])),
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

    function isTextInputFocused(): boolean {
      const focused = renderer.currentFocusedRenderable
      return focused instanceof InputRenderable || focused instanceof TextareaRenderable
    }

    useKeyboard(async (evt: ParsedKey) => {
      if (!store.leader && result.match("leader", evt)) {
        // Don't activate leader mode when typing in an input field
        if (isTextInputFocused()) return
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
        // Handle special case for Ctrl+Underscore (represented as \x1F)
        if (evt.name === "\x1F") {
          return Keybind.fromParsedKey({ ...evt, name: "_", ctrl: true }, store.leader)
        }
        return Keybind.fromParsedKey(evt, store.leader)
      },
      match(key: keyof KeybindsConfig, evt: ParsedKey) {
        const keybind = keybinds()[key]
        if (!keybind) return false
        const parsed: Keybind.Info = result.parse(evt)
        for (const k of keybind) {
          if (Keybind.match(k, parsed)) {
            return true
          }
        }
        return false
      },
      print(key: keyof KeybindsConfig) {
        const first = keybinds()[key]?.at(0)
        if (!first) return ""
        const formatted = Keybind.format(first)
        const leaderKey = keybinds().leader?.at(0)
        if (leaderKey) {
          return formatted.replace("<leader>", Keybind.format(leaderKey))
        }
        return formatted
      },
    }
    return result
  },
})
