import { createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { createSimpleContext } from "./create-simple-context"
import opencalTheme from "./theme/opencal.json"
import catppuccinTheme from "./theme/catppuccin.json"

type ThemeJson = {
  theme: Record<string, { dark: string; light: string }>
}

export type ThemeColors = {
  primary: string
  secondary: string
  accent: string
  error: string
  warning: string
  success: string
  info: string
  text: string
  textMuted: string
  background: string
  backgroundPanel: string
  backgroundElement: string
  border: string
  borderActive: string
  borderSubtle: string
  diffAdded: string
  diffRemoved: string
  diffContext: string
  diffHunkHeader: string
  diffHighlightAdded: string
  diffHighlightRemoved: string
  diffAddedBg: string
  diffRemovedBg: string
  diffContextBg: string
  diffLineNumber: string
  diffAddedLineNumberBg: string
  diffRemovedLineNumberBg: string
  markdownText: string
  markdownHeading: string
  markdownLink: string
  markdownLinkText: string
  markdownCode: string
  markdownBlockQuote: string
  markdownEmph: string
  markdownStrong: string
  markdownHorizontalRule: string
  markdownListItem: string
  markdownListEnumeration: string
  markdownImage: string
  markdownImageText: string
  markdownCodeBlock: string
  syntaxComment: string
  syntaxKeyword: string
  syntaxFunction: string
  syntaxVariable: string
  syntaxString: string
  syntaxNumber: string
  syntaxType: string
  syntaxOperator: string
  syntaxPunctuation: string
}

export type ColorMode = "dark" | "light"

const DEFAULT_THEMES: Record<string, ThemeJson> = {
  opencal: opencalTheme as ThemeJson,
  catppuccin: catppuccinTheme as ThemeJson,
}

function resolveTheme(theme: ThemeJson, mode: ColorMode): ThemeColors {
  return Object.fromEntries(
    Object.entries(theme.theme).map(([key, value]) => [key, value[mode]])
  ) as ThemeColors
}

export const { use: useTheme, provider: ThemeProvider } = createSimpleContext({
  name: "Theme",
  init: (props: { mode?: ColorMode }) => {
    const [store, setStore] = createStore({
      themes: DEFAULT_THEMES,
      mode: (props.mode ?? "dark") as ColorMode,
      active: "opencal" as string,
    })

    const theme = createMemo(() => {
      const themeConfig = store.themes[store.active]
      if (!themeConfig) return resolveTheme(DEFAULT_THEMES.opencal!, store.mode)
      return resolveTheme(themeConfig, store.mode)
    })

    return {
      theme: new Proxy({} as ThemeColors, {
        get(_target, prop) {
          return theme()[prop as keyof ThemeColors]
        },
      }),
      get selected() {
        return store.active
      },
      get mode() {
        return store.mode
      },
      all() {
        return Object.keys(store.themes)
      },
      set(themeName: string) {
        if (store.themes[themeName]) {
          setStore("active", themeName)
        }
      },
      setMode(mode: ColorMode) {
        setStore("mode", mode)
      },
      toggleMode() {
        setStore("mode", store.mode === "dark" ? "light" : "dark")
      },
    }
  },
})
