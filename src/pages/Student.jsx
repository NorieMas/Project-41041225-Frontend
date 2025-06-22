/* src/pages/Student.jsx */

import React, { useState, useRef } from 'react';

/* 載入 Blockly 主要相關套件 */
import * as Blockly from 'blockly';
import 'blockly/blocks';
import 'blockly/python';
import * as zhHant from 'blockly/msg/zh-hant';

window.Blockly = Blockly; // 把 Blockly 掛到 window，讓其它 util 在 import 時就抓得到。

import { pythonGenerator } from 'blockly/python'; // 載入 pythonGenerator 生成器。
import defineRawBlock from '../blockly_blocks/custom_block/raw_block'; // 自訂 raw_block 積木。
import { registerFieldMultilineInput } from '@blockly/field-multilineinput'; // 註冊 @blockly/field-multilineinput 插件，支援多行輸入欄位。
registerFieldMultilineInput();
defineRawBlock(Blockly, pythonGenerator);

import { PythonToBlocks } from '../utils/test';
import toolboxConfig from '../config/Toolbox';
import Xml from '../blockly_blocks/xml';

import { BlocklyWorkspace } from 'react-blockly';
import AceEditor from 'react-ace';
import '../config/blockly.css';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

Blockly.setLocale(zhHant);

function Student() {
  const [editorCode, setEditorCode] = useState('');
  const [xml, setXml] = useState('');
  const workspaceRef = useRef(null);
  const [converter] = useState(() => new PythonToBlocks());

  
  /* 左側積木 → 右側程式碼 */
  const handleConvertPythonCode = () => {
    if (workspaceRef.current) {
      const newCode = pythonGenerator.workspaceToCode(workspaceRef.current);
      setEditorCode(newCode);
    }
  };

  /* 左側積木 ← 右側程式碼 */
  const handleConvertBlocklyBlocks = () => {
    const result = converter.convertSource(editorCode);
    
    /* 無論有無錯誤，都嘗試塞進 Workspace 中 */
    try {
      const dom = Xml.textToDom(result.xml);
      if (workspaceRef.current) {
        workspaceRef.current.clear();
        Xml.domToWorkspace(dom, workspaceRef.current);
        setXml(result.xml);
      }
    } catch (err) {
      console.error('XML 匯入 Workspace 失敗：', err);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card bg-dark text-white">
        <div className="card-header fs-4">積木程式編輯器</div>
        <div className="card-body" style={{ height: '75vh' }}>
          <div className="row h-100">
            <div className="col-md-6 h-100">
              <BlocklyWorkspace
                toolboxConfiguration={toolboxConfig}
                initialXml={xml}
                className="blockly-workspace"
                onWorkspaceChange={(workspace) => { workspaceRef.current = workspace; }}
              />
                <button className="btn btn-primary mt-4" onClick={handleConvertPythonCode}>
                  積木塊轉換程式碼
                </button>
            </div>
            <div className="col-md-6 h-100">
              <AceEditor
                mode="python"
                theme="monokai"
                name="ace-editor"
                value={editorCode}
                onChange={setEditorCode}
                editorProps={{ $blockScrolling: true }}
                style={{ width: '100%', height: '100%' }}
              />
                <button className="btn btn-primary mt-4" onClick={handleConvertBlocklyBlocks}>
                  程式碼轉換積木塊
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Student;