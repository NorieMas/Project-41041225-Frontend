// === src/pages/Signup.jsx ===

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const Signup = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');

  const handleSignup = async (e) => {
    e.preventDefault();  // 防止表單預設提交行為
    console.log("註冊送出資料:", { username, password, role });

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/signup`, { username, password, role });
      console.log('✅ 收到成功 response:', res);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
        let debugMsg = '';

        if (err.config) {
            debugMsg += `Request URL: ${err.config.url}\n`;
            debugMsg += `Method: ${err.config.method}\n`;
            debugMsg += `Headers: ${JSON.stringify(err.config.headers)}\n`;
            debugMsg += `Data: ${JSON.stringify(err.config.data)}\n\n`;
        }

        if (err.response) {
          debugMsg += `Status: ${err.response.status}\n`;
          debugMsg += `Response Data: ${JSON.stringify(err.response.data)}\n`;
          debugMsg += `Response Headers: ${JSON.stringify(err.response.headers)}\n`;
        } else if (err.request) {
          debugMsg += `Request made but no response received.\n${err.request}`;
        } else {
          debugMsg += `Error during request setup: ${err.message}`;
        }
        alert('註冊失敗\n' + debugMsg);
    }
  };

      

  return (
    <div className="container mt-5">
      <h2>註冊</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="帳號"
          className="form-control mb-2"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="密碼"
          className="form-control mb-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        <select
          className="form-control mb-3"
          value={role}
          onChange={e => setRole(e.target.value)}
          required
        >
          <option value="student">學生</option>
          <option value="teacher">教師</option>
        </select>
        <button type="submit" className="btn btn-primary">註冊</button>
      </form>
    </div>
  );
};

export default Signup;