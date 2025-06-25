//src\pages\ProblemDetail.jsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import PyBlocksEditor from "../utils/PyBlocksEditor";

export default function ProblemDetail() {
  const { token } = useAuth();
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/problems`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const p = data.find(item => item.id === id);
      setProblem(p);
      setCode(p?.code || "");  
    })
    .catch((err) => {
      console.error("取得題目失敗:", err);
    });
  }, [id, token]);

  const handleSubmit = () => {
    setError(null);
    setResult(null);
    fetch(`${import.meta.env.VITE_API_URL}/api/problems/${id}/submit`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ studentCode: code }),
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(`${data.error}：${data.details || "未知錯誤"}`);
      setResult(data);
    })
    .catch((err) => setError(err.message));
  };

  if (!problem) return <div className="container mt-4">Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-body">
          <h3 className="card-title">{problem.title}</h3>
          <p className="card-text">{problem.description}</p>

          <PyBlocksEditor value={code} onChange={setCode} />

          <button className="btn btn-primary mt-4" onClick={handleSubmit}>提交作答</button>

          {result && (
            <div className={`alert mt-4 ${result.result === '正確' ? 'alert-success' : 'alert-danger'}`}>
              <h4>作答結果</h4>
              <p><strong>狀態：</strong> {result.result}</p>
              <p><strong>分數：</strong> {result.score}%</p>
              <p><strong>評語：</strong></p>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{result.comment}</pre>
            </div>
          )}

          {error && (
            <div className="alert alert-warning mt-4">
              <h4>執行失敗，請聯繫開發者。</h4>
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
