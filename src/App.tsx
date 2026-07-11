import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { PracticePage } from "@/pages/PracticePage";
import { ResultPage } from "@/pages/ResultPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { BattlePage } from "@/pages/BattlePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}
