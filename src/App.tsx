import {BrowserRouter, Route, Routes} from "react-router-dom";
import {AppLayout} from "@/components/layout";
import {ThemeProvider} from "@/components/theme-provider";
import {OverviewPage} from "@/features/overview";
import TestPage from "@/TestPage.tsx";
import DetailsPage from "@/DetailsPage.tsx";
import TimelinePage from "@/TimelinePage.tsx";

function App() {
    return (
        <ThemeProvider>
            <BrowserRouter>
                <AppLayout>
                    <Routes>
                        <Route path="/" element={<OverviewPage/>}/>
                        <Route path="/details" element={<DetailsPage/>}/>
                        <Route path="/timeline" element={<TimelinePage/>}/>
                        <Route path="/test/:testName"
                               element={<TestPage/>}>

                        </Route>
                    </Routes>
                </AppLayout>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
