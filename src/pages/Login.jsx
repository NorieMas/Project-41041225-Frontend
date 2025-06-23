/* src/pages/Login.jsx */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage("請輸入帳號與密碼！");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/login", { username, password });
      setMessage("登入成功！");
      localStorage.setItem("currentUser", JSON.stringify(res.data.user));

      // 強制刷新整個頁面，讓 Navbar 重新讀取狀態
      window.location.href = "/";
      
    } catch (err) {
      setMessage("登入失敗：" + (err.response?.data?.message || "伺服器錯誤"));
    }
  };

  return (
    <div className="container mt-5">
      <h1>登入</h1>
      <div className="mb-3">
        <input type="text" className="form-control" placeholder="帳號" value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className="mb-3">
        <input type="password" className="form-control" placeholder="密碼" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <button className="btn btn-success" onClick={handleLogin}>登入</button>
      <p className="mt-3">{message}</p>
    </div>
  );
};

export default Login;