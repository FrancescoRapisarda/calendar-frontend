import './App.css'
import CalendarWeek from './components/CalendarWeek'
import {  BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'


const getCurrentWeekOffset = () => {
  const today = new Date();
  const start = new Date(2025, 0, 6); // 6 Gennaio 2025
  const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(daysDiff / 7);
};

function App() {
 const initialOffset = getCurrentWeekOffset();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={`/settimana/${initialOffset}`} />} />
        <Route path="/settimana/:weekOffset" element={<CalendarWeek />} />
      </Routes>
    </Router>
  );
}

export default App
