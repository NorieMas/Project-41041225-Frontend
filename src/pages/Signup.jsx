/* src/pages/Signup.jsx */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    if (!username || !password) {
      setMessage("帳號與密碼不得為空！");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/signup", {
        username,
        password,
        role,
      });
      setMessage("註冊成功！");
      setTimeout(() => navigate("/login"), 1000);
    } catch (err) {
      setMessage("註冊失敗：" + (err.response?.data?.message || "伺服器錯誤"));
    }
  };

  return (
    <div className="container mt-5">
      <h1>註冊</h1>
      <div className="mb-3">
        <input type="text" className="form-control" placeholder="帳號" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="mb-3">
        <input type="password" className="form-control" placeholder="密碼" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="form-label">身分：</label><br/>
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="radio" value="student" checked={role === "student"} onChange={() => setRole("student")} />
          <label className="form-check-label">學生</label>
        </div>
        <div className="form-check form-check-inline">
          <input className="form-check-input" type="radio" value="teacher" checked={role === "teacher"} onChange={() => setRole("teacher")} />
          <label className="form-check-label">教師</label>
        </div>
      </div>
      <button className="btn btn-primary" onClick={handleSignup}>註冊</button>
      <p className="mt-3">{message}</p>
    </div>
  );
};

export default Signup;