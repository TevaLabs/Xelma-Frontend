import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from './components/ThemeProvider'
import "./App.css";
import Header from "./components/Header";
import Leaderboard from "./components/Leaderboard";
import RouteProgressBar from "./components/RouteProgressBar";
import { LearnSection } from "@/components/LearnSection";

function App() {
  return (
    <ThemeProvider>
      <RouteProgressBar />
      <Header />
      <main className="pt-24 lg:pt-32 px-4 lg:px-14 min-h-screen bg-[#FAFAFA]">
        <Routes>
          <Route
            path="/"
            element={
              <div className="text-center mt-20 text-2xl font-bold text-[#9B9B9B]">
                Home Page Placeholder
              </div>
            }
          />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route
            path="/learn"
            element={
              <div className="text-center mt-20 text-2xl font-bold text-[#9B9B9B]">
                Learn Page Placeholder
              </div>
            }
          />
          <Route
            path="/pools"
            element={
              <div className="text-center mt-20 text-2xl font-bold text-[#9B9B9B]">
                Pools Page Placeholder
              </div>
            }
          />
        </Routes>
      </main>

      <div
        className="fixed bottom-6 right-6 bg-white shadow-2xl z-50 flex flex-col items-center"
        style={{
          width: '430px',
          height: '310px',
          borderRadius: '24px',
          padding: '10px',
          opacity: 1,
          border: '1px solid #e5e7eb'
        }}
      >
        <LearnSection />
      </div>
    </ThemeProvider>
  );
}

export default App;
