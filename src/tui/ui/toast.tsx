import type { Accessor, ParentProps } from "solid-js"
import type { z } from "zod"

import { createContext, Show, useContext } from "solid-js"
import { createStore } from "solid-js/store"
import { useTerminalDimensions } from "@opentui/solid"
import { TextAttributes } from "@opentui/core"

import { Theme } from "@tui/context/theme"
import { TuiEvent } from "@tui/event"

const SplitBorder = {
  customBorderChars: {
    topLeft: "│",
    topRight: "│",
    bottomLeft: "│",
    bottomRight: "│",
    horizontal: "",
    vertical: "│",
    topT: "│",
    bottomT: "│",
    leftT: "│",
    rightT: "│",
    cross: "│",
  },
}

export type ToastOptions = z.infer<typeof TuiEvent.ToastShow.properties>

export function Toast() {
  const toast = useToast()
  const dimensions = useTerminalDimensions()

  const getVariantColor = (variant: ToastOptions["variant"]) => {
    switch (variant) {
      case "error":
        return Theme.error
      case "warning":
        return Theme.warning
      case "success":
        return Theme.success
      default:
        return Theme.info
    }
  }

  return (
    <Show when={toast.currentToast}>
      {(current: Accessor<ToastOptions>) => (
        <box
          position="absolute"
          justifyContent="center"
          alignItems="flex-start"
          top={2}
          right={2}
          maxWidth={Math.min(60, dimensions().width - 6)}
          paddingLeft={2}
          paddingRight={2}
          paddingTop={1}
          paddingBottom={1}
          backgroundColor={Theme.backgroundPanel}
          borderColor={getVariantColor(current().variant)}
          border={["left", "right"]}
          customBorderChars={SplitBorder.customBorderChars}
        >
          <Show when={current().title}>
            <text attributes={TextAttributes.BOLD} marginBottom={1} fg={Theme.text}>
              {current().title}
            </text>
          </Show>
          <text fg={Theme.text} wrapMode="word" width="100%">
            {current().message}
          </text>
        </box>
      )}
    </Show>
  )
}

function init() {
  const [store, setStore] = createStore({
    currentToast: null as ToastOptions | null,
  })

  let timeoutHandle: ReturnType<typeof setTimeout> | null = null

  const toast = {
    show(options: ToastOptions) {
      const parsedOptions = TuiEvent.ToastShow.properties.parse(options)
      const { duration, ...currentToast } = parsedOptions
      setStore("currentToast", currentToast)
      if (timeoutHandle) clearTimeout(timeoutHandle)
      timeoutHandle = setTimeout(() => {
        setStore("currentToast", null)
      }, duration ?? 5000)
    },
    error: (err: unknown) => {
      if (err instanceof Error)
        return toast.show({
          variant: "error",
          message: err.message,
        })
      toast.show({
        variant: "error",
        message: "An unknown error has occurred",
      })
    },
    success: (message: string) => {
      toast.show({
        variant: "success",
        message,
      })
    },
    info: (message: string) => {
      toast.show({
        variant: "info",
        message,
      })
    },
    warning: (message: string) => {
      toast.show({
        variant: "warning",
        message,
      })
    },
    get currentToast(): ToastOptions | null {
      return store.currentToast
    },
  }
  return toast
}

export type ToastContext = ReturnType<typeof init>

const ctx = createContext<ToastContext>()

export function ToastProvider(props: ParentProps) {
  const value = init()
  return <ctx.Provider value={value}>{props.children}</ctx.Provider>
}

export function useToast() {
  const value = useContext(ctx)
  if (!value) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return value
}
