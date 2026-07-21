import { useState } from "react";
import MainMenu from "./components/MainMenu";
import LoginScreen from "./components/LoginScreen";
import DesktopScreen from "./components/DesktopScreen";

interface SelectedStory {
  storyId: string;
  storyPath: string;
  storyTitle: string;
}

type View =
  | { screen: "menu" }
  | ({ screen: "login" } & SelectedStory)
  | ({ screen: "playing" } & SelectedStory);

function App() {
  const [view, setView] = useState<View>({ screen: "menu" });

  if (view.screen === "login") {
    return (
      <LoginScreen
        storyTitle={view.storyTitle}
        onLogin={() => setView({ ...view, screen: "playing" })}
        onCancel={() => setView({ screen: "menu" })}
      />
    );
  }

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
      onSelectStory={(storyId, storyPath, storyTitle) =>
        setView({ screen: "login", storyId, storyPath, storyTitle })
      }
    />
  );
}

export default App;
