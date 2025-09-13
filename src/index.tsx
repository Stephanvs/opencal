import { render } from "@opentui/solid";

render(
  () => <App />,
  {
    consoleOptions: {
      titleBarColor: "#cc33ff"
    }
  }
);

function App() {
    return (<text>Hello, World!</text>);
};
