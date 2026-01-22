import './App.css'
import Header from './components/Header'
import { LearnSection } from "@/components/LearnSection";

function App() {
  return (
    <>
      <Header />

      {/* Outer Container with your exact specs */}
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
    </>
  )
}

export default App;