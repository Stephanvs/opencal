import { CalendarView } from "./calendar/view";

export function Home() {
  return (
    <box flexGrow={1}>
      <CalendarView />
    </box>
  );
}
