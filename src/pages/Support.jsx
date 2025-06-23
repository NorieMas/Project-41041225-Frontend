/* src/pages/Support.jsx */

import React, { useState, useEffect } from "react";
import axios from "axios";

const Support = () => {
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    setUser(currentUser);
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert("請輸入信件內容！");
      return;
    }

    const sender = user ? user.username : "匿名用戶";

    await axios.post("http://localhost:5000/api/send-email", {
      sender,
      message,
    });

    alert("信件已送出！");
    setMessage("");
  };

  return (
    <div className="container mt-5">
      <h1>聯絡開發者</h1>
      <p>請填寫您的問題或建議，會寄送給開發者團隊。</p>
      <div className="mb-3">
        <label className="form-label">您的訊息：</label>
        <textarea
          className="form-control"
          rows="6"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>
      </div>
      <button className="btn btn-primary" onClick={handleSubmit}>送出</button>
    </div>
  );
};

export default Support;