/* src/pages/Login.jsx */
import React, { useState } from 'react';
import { useAuth } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, { username, password });
      login(res.data.token, res.data.user);
      alert("登入成功");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "登入失敗");
    }
  };

  return (
    <div className="container mt-5">
      <h2>登入</h2>
      <form onSubmit={handleLogin}>
        <input
          className="form-control mb-2"
          placeholder="帳號"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          autoComplete="username"
        />
        <input
          className="form-control mb-2"
          type="password"
          placeholder="密碼"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <button type="submit" className="btn btn-primary">登入</button>
      </form>
    </div>
  );
}
