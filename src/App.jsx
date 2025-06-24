import { Route, Routes, Navigate } from "react-router-dom";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Course from "./pages/Course";
import Support from "./pages/Support";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Student from "./pages/Student";
import Teacher from "./pages/Teacher";
import Navbar from "./components/Navbar";
import ProblemList from "./pages/ProblemList";
import ProblemDetail from "./pages/ProblemDetail";
import ProblemCreate from "./pages/ProblemCreate";

import { AuthProvider } from "./utils/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/course" element={<Course />} />
          <Route path="/support" element={<Support />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/student" element={<Student />} />
          <Route path="/teacher" element={<Teacher />} />
          {/* 新增題庫功能模組 */}
          <Route path="/problems" element={<ProblemList />} />
          <Route path="/problems/:id" element={<ProblemDetail />} />
          <Route path="/problem-create" element={<ProblemCreate />} />
          <Route path="/*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
