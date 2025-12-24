import { For } from "solid-js";
import { CalendarViewType } from "../../models";
import { useTheme } from "../context/theme";

const views = [
  { type: CalendarViewType.Month, shortcut: 'm', label: 'onth' },
  { type: CalendarViewType.Week, shortcut: 'w', label: 'eek' },
  { type: CalendarViewType.Day, shortcut: 'd', label: 'ay' },
] as const;

const ViewSelector = (props: { currentViewMode: CalendarViewType }) => {
  const { theme } = useTheme();

  return (
    <box flexDirection="row" gap={1}>
      <For each={views}>
        {(view) => {
          const isActive = () => props.currentViewMode === view.type;
          return (
            <box flexDirection="row">
              <box backgroundColor={
                isActive()
                ? theme.primary
                : theme.backgroundPanel}>
                <text fg={isActive() ? theme.border : theme.primary }>{view.shortcut}</text>
              </box>
              <box backgroundColor={theme.background}>
                <text>{view.label}</text>
              </box>
            </box>
          );
        }}
      </For>
    </box>
  );
};

export default ViewSelector;
