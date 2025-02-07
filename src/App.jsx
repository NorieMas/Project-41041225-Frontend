import { Route, Routes, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import Course from "./pages/Course";
import Support from "./pages/Support";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Student from "./pages/Student";
import Teacher from "./pages/Teacher";

import Navbar from "./components/Navbar";

function App() {

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