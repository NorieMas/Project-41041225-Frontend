/* src/pages/ProblemList.jsx */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../utils/AuthContext";

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const userRole = user?.role;

  useEffect(() => {
      console.log("目前使用的 token:", token);
      console.log("目前使用的 userRole:", userRole);
      fetch(`${import.meta.env.VITE_API_URL}/api/problems`, {
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
      <div className="d-flex flex-row justify-content-between align-items-center flex-wrap mb-3">
      <h2 className="mb-0">題目列表</h2>
      {userRole === 'teacher' && (
        <button 
          className="btn btn-success mt-2 mt-md-0"
          onClick={() => navigate("/problem-create")}
        >
          新增題目
        </button>
      )}
    </div>

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
