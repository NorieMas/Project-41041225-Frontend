import { useEffect } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";

import Home from "./pages/Home";
import Course from "./pages/Course";
import Support from "./pages/Support";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Student from "./pages/Student";
import Teacher from "./pages/Teacher";

import Navbar from "./components/Navbar";

function App() {

  const navigate = useNavigate();

  useEffect(() => {
    // 讀取 URL 中的 `redirect` 參數
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("redirect");
    
    if (redirectPath) {
        // 清除 `?redirect=` 並導向正確的頁面
        navigate("/" + redirectPath, { replace: true });
    }
}, [navigate]);

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/course" element={<Course />} />
        <Route path="/support" element={<Support />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/student" element={<Student />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;