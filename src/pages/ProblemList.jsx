/* src/pages/ProblemList.jsx */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../utils/AuthContext";

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
      fetch("http://localhost:5000/api/problems", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setProblems(data))
      .catch((err) => {
        console.error("取得題目失敗:", err);
      });
    }, [token]);

  return (
    <div className="container mt-4">
      <h2>題目列表</h2>
      <div className="row">
        {problems.map((problem) => (
          <div className="col-md-4 mb-3" key={problem.id}>
            <div className="card h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{problem.title}</h5>
                <p className="card-text" style={{ flexGrow: 1 }}>{problem.description}</p>
                <button 
                  className="btn btn-primary mt-auto"
                  onClick={() => navigate(`/problems/${problem.id}`)}
                >
                  進入作答
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
