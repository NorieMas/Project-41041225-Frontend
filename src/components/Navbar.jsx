/* src/components/Navbar.jsx */

import React from "react";
import { Link } from "react-router-dom";
import blocklyLogo from '../assets/blockly.svg';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src={blocklyLogo} style={{ width: '40px', marginRight: '10px' }} />
          <span className="navbar-title">PyBlocks 學習平台</span>
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav">
            <div className="nav-item-left">
              <Link className="nav-link" to="/">首頁</Link>
              </div>
              <div className="nav-item-left">
              <Link className="nav-link" to="/course">課程</Link>
              </div>
              <div className="nav-item-left">
                <Link className="nav-link" to="/support">申請</Link>
              </div>
            </div>
            <div className="navbar-nav">
              <div className="nav-item-right">
                <Link className="nav-link" to="/login">登入</Link>
                </div>
                <div className="nav-item-right">
                  <Link className="nav-link" to="/signup">註冊</Link>
              </div>
            </div>
          </div>
        </div>
    </nav>
  );
};

export default Navbar;