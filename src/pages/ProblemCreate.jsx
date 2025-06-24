/* src/pages/ProblemCreate.jsx */
import React, { useState } from "react";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-github";
import { useAuth } from "../utils/AuthContext";
import PyBlocksEditor from "../utils/PyBlocksEditor";

export default function ProblemCreate() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState("manual");
  const [standardCode, setStandardCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { token } = useAuth(); // 取得 token

  const handleSubmit = () => {
    setSuccessMessage("");
    setErrorMessage("");

    const payload = {
      title,
      description,
      mode,
      ...(mode === "manual" && { standardCode }),
    };

    fetch("http://localhost:5000/api/problems", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.details || data.error || "未知錯誤");
        }
        setSuccessMessage("題目新增成功！");
      })
      .catch((err) => setErrorMessage(err.message));
  };

  return (
    <div className="container mt-4">
      <h2>新增題目</h2>

      <div className="mb-3">
        <label className="form-label">題目標題</label>
        <input
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">題目敘述</label>
        <textarea
          className="form-control"
          rows="5"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">出題模式</label><br />
        <div className="form-check form-check-inline">
          <input
            type="radio"
            id="manual"
            className="form-check-input"
            name="mode"
            value="manual"
            checked={mode === "manual"}
            onChange={() => setMode("manual")}
          />
          <label className="form-check-label" htmlFor="manual">自訂標準答案</label>
        </div>
        <div className="form-check form-check-inline">
          <input
            type="radio"
            id="ai"
            className="form-check-input"
            name="mode"
            value="ai"
            checked={mode === "ai"}
            onChange={() => setMode("ai")}
          />
          <label className="form-check-label" htmlFor="ai">AI 自動產生</label>
        </div>
      </div>

      {mode === "manual" && (
        <div className="mb-3">
          <label className="form-label">使用 "積木程式編輯器" 設計標準答案。</label>
          <PyBlocksEditor value={standardCode} onChange={setStandardCode} />
        </div>
      )}

      <button className="btn btn-primary" onClick={handleSubmit}>送出題目</button>

      {successMessage && (
        <div className="alert alert-success mt-3">{successMessage}</div>
      )}

      {errorMessage && (
        <div className="alert alert-danger mt-3">{errorMessage}</div>
      )}
    </div>
  );
}