import { useState } from "react";
import MainMenu from "./components/MainMenu";
import DesktopScreen from "./components/DesktopScreen";

type View =
  | { screen: "menu" }
  | { screen: "playing"; storyId: string; storyPath: string };

function App() {
  const [view, setView] = useState<View>({ screen: "menu" });

  if (view.screen === "playing") {
    return (
      <DesktopScreen
        storyId={view.storyId}
        storyPath={view.storyPath}
        onExitToMenu={() => setView({ screen: "menu" })}
      />
    );
  }

  return (
    <MainMenu
      onSelectStory={(storyId, storyPath) =>
        setView({ screen: "playing", storyId, storyPath })
      }
    />
  );
}

export default App;
