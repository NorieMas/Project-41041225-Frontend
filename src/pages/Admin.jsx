/* src/pages/Admin.jsx */

import React, { useState, useEffect } from "react";
import axios from "axios";

const Admin = () => {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);



    setTeachers(res.data.teachers);
    setStudents(res.data.students);
  };

  const deleteUser = async (userToDelete) => {
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${userToDelete.username}`);
    loadUsers();
  };

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-center">帳號管理介面</h1>

      <div className="row">
        {/* 學生區塊 */}
        <div className="col-md-6">
          <div className="card border-success mb-4">
            <div className="card-header bg-success text-white">學生帳號</div>
            <div className="card-body">
              {students.length === 0 ? (
                <p className="text-muted">目前無學生帳號</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>帳號</th>
                      <th>密碼</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i}>
                        <td>{s.username}</td>
                        <td>{s.password}</td>
                        <td>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteUser(s)}>刪除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
        {/* 教師區塊 */}
        <div className="col-md-6">
          <div className="card border-primary mb-4">
            <div className="card-header bg-primary text-white">教師帳號</div>
            <div className="card-body">
              {teachers.length === 0 ? (
                <p className="text-muted">目前無教師帳號</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>帳號</th>
                      <th>密碼</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t, i) => (
                      <tr key={i}>
                        <td>{t.username}</td>
                        <td>{t.password}</td>
                        <td>
                          <button className="btn btn-sm btn-danger" onClick={() => deleteUser(t)}>刪除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;