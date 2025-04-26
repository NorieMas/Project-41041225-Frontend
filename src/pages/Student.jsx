import React, { useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import AceEditor from 'react-ace';
import toolboxConfig from '../config/Toolbox';

import * as Blockly from 'blockly/core';
import * as libraryBlocks from 'blockly/blocks';
import * as zhHant from 'blockly/msg/zh-hant';

import { pythonGenerator } from 'blockly/python';
// 此處我們不在用工作區變更同步更新 code，以免覆蓋使用者輸入（可根據需要修改）
import { PythonToBlocks } from '../utils/test';

import '../config/blockly.css';
import 'blockly/blocks';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-monokai';

Blockly.setLocale(zhHant);

function Student() {
  // editorCode 保存 AceEditor 的輸入文字，xmlState 儲存轉換後的 XML 結果
  const [editorCode, setEditorCode] = useState("");
  const [xml, setXml] = useState("");
  const [workspace, setWorkspace] = useState(null);

  // 僅建立一次轉換器實例
  const [converter] = useState(() => new PythonToBlocks());

  // AceEditor 的 onChange 只更新輸入狀態，不進行轉換
  const handleCodeChange = (newCode) => {
    setEditorCode(newCode);
  };

  // 點選按鈕時才觸發轉換，避免每次輸入就更新轉換結果覆蓋使用者輸入
  const handleConvert = () => {
    try {
      const result = converter.convertSource(editorCode);
      if (!result.error) {
        setXml(result.xml);
      } else {
        console.error("轉換錯誤：", result.error);
      }
    } catch (e) {
      console.error("轉換過程中拋出錯誤：", e);
    }
  };

  // Blockly 工作區變更時（例如由積木生成 Python 程式碼）不同步更新 AceEditor，避免覆蓋使用者輸入
  const handleWorkspaceChange = (ws) => {
    // 可根據需要將產生的程式碼顯示在另一處；此處僅記錄日誌
    const newCode = pythonGenerator.workspaceToCode(ws);
    console.log("由積木生成的程式碼：", newCode);
  };

  return (
    <div className="container mt-4">
      <div className="card bg-dark text-white">
        <div className="card-header">Blockly Workspace</div>
        <div className="card-body" style={{ height: '500px', width: '100%' }}>
          <div className="row" style={{ height: '100%' }}>
            <div className="col-md-6" style={{ height: '100%' }}>
              <BlocklyWorkspace
                toolboxConfiguration={toolboxConfig}
                initialXml={xml} 
                onXmlChange={(newXml) => setXml(newXml)}
                onWorkspaceChange={handleWorkspaceChange}
                className="blockly-workspace"
                style={{ height: '100%' }}
                // 警告：ref 傳入給函式元件會有警告，此處若不需要直接操作工作區，也可忽略
                ref={(ws) => setWorkspace(ws)}
              />
            </div>
            <div className="col-md-6" style={{ height: '100%' }}>
              <AceEditor
                mode="python"
                theme="monokai"
                name="ace-editor"
                onChange={handleCodeChange}
                value={editorCode}
                editorProps={{ $blockScrolling: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
      <button onClick={handleConvert}>轉換程式碼為積木塊</button>
    </div>
  );
}

export default Student;
