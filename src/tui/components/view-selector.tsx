import { useRenderer } from "@opentui/solid"
import { createMemo, createSignal, onMount } from "solid-js"
import { t, fg, bold, italic, underline } from "@opentui/core";
import { CalendarViewType } from "../../models";

const ViewSelector = (props: { currentViewMode: CalendarViewType }) => {
  // const renderer = useRenderer()
  //
  // onMount(() => {
  //   // renderer.setBackgroundColor("#fff")
  // })
  //
  // const [nameValue, setNameValue] = createSignal("")
  const [viewMode, setViewMode] = createSignal<CalendarViewType>(props.currentViewMode);

  const r = () => {
    return `[${viewMode() === CalendarViewType.Month
        ? t`${underline("m")}`
        : "m"}]onth | [${viewMode() === CalendarViewType.Week
          ? underline("w")
          : "w"}]eek | [${viewMode() === CalendarViewType.Day
            ? underline("d")
            : "d"}]ay`;
  };

  return (
    <box>
      <text>
        {r()}
      </text>
    </box>

    // <box height={4} border>
    //   <text>Name: {nameValue()}</text>
    //   <input focused onInput={(value) => setNameValue(value)} />
    // </box>
  )
}

export default ViewSelector;
