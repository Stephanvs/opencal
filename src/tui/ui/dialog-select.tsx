// import { InputRenderable, RGBA, ScrollBoxRenderable, TextAttributes } from "@opentui/core";
// import { Theme } from "@tui/context/theme"
// import { createStore } from "solid-js"
import { pipe, filter, entries, flatMap, groupBy, take, isDeepEqual } from "remeda"
import * as fuzzysort from "fuzzysort"
import { createStore } from "solid-js/store/types/server.js"
import { useDialog, type DialogContext } from "../components/dialog"
import type { InputRenderable } from "@opentui/core"
import { createMemo } from "solid-js/types/server/reactive.js"

export interface DialogSelectProps<T> {
  title: string
  options: DialogSelectOption<T>[]
  ref?: (ref: DialogSelectRef) => void
  onMove?: (option: DialogSelectOption<T>) => void
  onFilter?: (query: string) => void
  onSelect?: (option: DialogSelectOption<T>) => void
  keybind?: {
    keybind: Keybind.Info
    title: string
    onTrigger: (option: DialogSelectOption<T>) => void
  }[]
  limit?: number
  current?: T
}

export interface DialogSelectOption<T = any> {
  title: string
  value: T
  description?: string
  footer?: string
  category?: string
  disabled?: boolean
  bg?: string
  onSelect?: (ctx: DialogContext) => void
}

export type DialogSelectRef = {
  filter: string
}

export function DialogSelect<T>(props: DialogSelectProps<T>) {
  const dialog = useDialog()
  const [store, setStore] = createStore({
    selected: 0,
    filter: "",
  })

  let input: InputRenderable

  const filtered = createMemo(() => {
    const needle = store.filter.toLowerCase()
    const result = pipe(
      props.options,
      filter((x) => x.disabled !== true),
      take(props.limit ?? Infinity),
      (x) => (!needle ? x : fuzzysort.go(needle, x, { keys: [ "title", "category" ]}).map((x) => x.obj)),
    )
    return result
  })

  const grouped = createMemo(() => {
    const result = pipe(
      filtered(),
      groupBy((x) => x.category ?? ""),
      entries(),
    )
    return result
  })

  const flat = createMemo((x) => {
    return pipe(
      grouped(),
      flatMap(([_, options]) => options),
    )
  })
}
