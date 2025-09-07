import { useRenderer } from "@opentui/solid"
import { createSignal, onMount } from "solid-js"
import { t, fg, bold, italic, underline } from "@opentui/core";

const ViewSelector = () => {
  // const renderer = useRenderer()
  //
  // onMount(() => {
  //   // renderer.setBackgroundColor("#fff")
  // })
  //
  // const [nameValue, setNameValue] = createSignal("")

  return (
    <box border>
      <text>{t`${italic(fg("#adff2f")("Styled"))} ${bold(fg("#ff8c00")("Text"))} also works! times`}</text>
    </box>

    // <box height={4} border>
    //   <text>Name: {nameValue()}</text>
    //   <input focused onInput={(value) => setNameValue(value)} />
    // </box>
  )
}

export default ViewSelector;
