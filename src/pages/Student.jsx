// src/pages/Student.jsx
import React, { useState, useRef } from 'react';

/* ── 1. Blockly 本體 + blocks + Python 產生器 ────────────────────── */
import * as Blockly from 'blockly';
import 'blockly/blocks';
import 'blockly/python';
import * as zhHant from 'blockly/msg/zh-hant';

/* 先把 Blockly 掛到 window，讓其它 util 檔在 import 時就抓得到 */
window.Blockly = Blockly;

/* ── 2. 取出 pythonGenerator ───────────────────────────────────── */
import { pythonGenerator } from 'blockly/python';

/* ── 3. 自訂積木 (raw_block) ──────────────────────────────────── */
import defineRawBlock from '../blockly_blocks/custom_block/raw_block';
/* 註冊 @blockly/field-multilineinput 插件，以支援多行輸入欄位 */
import { registerFieldMultilineInput } from '@blockly/field-multilineinput';
registerFieldMultilineInput();
defineRawBlock(Blockly, pythonGenerator);

// 讓 Blockly 內部（包含 react-blockly）都找得到這份 generator
/* 3-B. 把 generator 登錄進 registry；若已存在就忽略錯誤 */
try {
  Blockly.registry.register('generator', 'python', pythonGenerator);
} catch (e) {
  // 如果是「已經註冊」那就安靜略過；其餘錯誤才拋出
  if (!/already registered/i.test(e.message)) {
    throw e;
  }
}

/* ── 4. 其它工具 ──────────────────────────────────────────────── */
import { PythonToBlocks } from '../utils/test';
import toolboxConfig from '../config/Toolbox';
import Xml from '../blockly_blocks/xml';

/* ── 5. React-Blockly + AceEditor ─────────────────────────────── */
import { BlocklyWorkspace } from 'react-blockly';
import AceEditor from 'react-ace';
import '../config/blockly.css';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

/* ── 6. 語系設定 ──────────────────────────────────────────────── */
Blockly.setLocale(zhHant);

/* ================================================================= */
function Student() {
  const [editorCode, setEditorCode] = useState('');
  const [xml, setXml]         = useState('');
  const workspaceRef          = useRef(null);
  const [converter]           = useState(() => new PythonToBlocks());

  /* ---------- 左側文字 → 右側積木 -------------------------------- */
  const handleConvert = () => {
    const result = converter.convertSource(editorCode);
    
    // 無論有無錯誤，都照常嘗試塞進 Workspace
    try {
      const dom = Xml.textToDom(result.xml);
      console.log('raw XML:', result.xml);
      if (workspaceRef.current) {
        workspaceRef.current.clear();
        Xml.domToWorkspace(dom, workspaceRef.current);
        setXml(result.xml);
      }
    } catch (err) {
      console.error('XML 匯入 Workspace 失敗：', err);
    }
  };

  /* ---------- 右側積木 → 左側程式碼 -------------------------------- */
  const handleWorkspaceChange = (ws) => {
    if (!ws) return;
    workspaceRef.current = ws;
    const newCode = pythonGenerator.workspaceToCode(ws);
    // setEditorCode(newCode);       // 即時同步到左側文字
  };

  /* ================================================================= */
  return (
    <div className="container mt-4">
      <div className="card bg-dark text-white">
        <div className="card-header">Blockly Workspace</div>
        <div className="card-body" style={{ height: 500 }}>
          <div className="row h-100">
            <div className="col-md-6 h-100">
              <BlocklyWorkspace
                toolboxConfiguration={toolboxConfig}
                initialXml={xml}
                className="blockly-workspace"
                onWorkspaceChange={handleWorkspaceChange}
              />
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
            </div>
          </div>
        </div>
      </div>

      <button className="btn btn-primary mt-2" onClick={handleConvert}>
        轉換程式碼為積木塊
      </button>
    </div>
  );
}

export default Student;
