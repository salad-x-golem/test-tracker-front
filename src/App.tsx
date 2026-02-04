import { HashRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { ThemeProvider } from "@/components/theme-provider";
import { OverviewPage } from "@/features/overview";

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<OverviewPage />} />
          </Routes>
        </AppLayout>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
