import { CalendarViewType } from "../../models";
import { t, underline } from "@opentui/core";

const ViewSelector = (props: { currentViewMode: CalendarViewType }) => {
  const views = [
    { type: CalendarViewType.Month, shortcut: 'm', label: 'onth' },
    { type: CalendarViewType.Week, shortcut: 'w', label: 'eek' },
    { type: CalendarViewType.Day, shortcut: 'd', label: 'ay' },
  ];

  return (
    <box flexDirection="row" gap={1}>
      {views.map(view => (
        <text>
          {props.currentViewMode === view.type 
            ? t`[${underline(view.shortcut)}]${view.label}`
            : `[${view.shortcut}]${view.label}`
          }
        </text>
      ))}
    </box>
  );
};

export default ViewSelector;
