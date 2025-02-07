import React from "react";
import { auth } from "../config/Firebase";

const User = () => {
  console.log(auth);
  return (
    <div className="container mt-5">
      <h1>用戶頁面</h1>
      <h2>這是用戶的個人頁面。</h2>
      <h3>使用者資訊：</h3>
      <h4>{auth?.currentUser.displayName}</h4>
      <h4>{auth?.currentUser.email}</h4>
      <img src={auth?.currentUser.photoURL} alt="" />
    </div>
  );
};

export default User;