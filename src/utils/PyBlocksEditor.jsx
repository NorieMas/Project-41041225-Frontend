/* src/utils/PyBlocksEditor.jsx */

import React, { useState, useRef, useEffect, useCallback } from 'react';

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

import { PythonToBlocks } from './AST';
import toolboxConfig from '../config/Toolbox';
import Xml from '../blockly_blocks/xml';

import { BlocklyWorkspace } from 'react-blockly';
import AceEditor from 'react-ace';
import '../config/blockly.css';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';

Blockly.setLocale(zhHant);

function PyBlocksEditor({ value = '', onChange = () => {} }) {
  const [editorCode, setEditorCode] = useState(value);
  const [xml, setXml] = useState('');
  const workspaceRef = useRef(null);
  const [converter] = useState(() => new PythonToBlocks());
  const changeListenerRef = useRef(null);
  const isEditingText = useRef(false);
  const debounceTimer = useRef(null);

  // 當外部 value 改變時更新 editorCode
  useEffect(() => {
    setEditorCode(value);
  }, [value]);

  // Blockly → Text 同步邏輯
  const handleWorkspaceChange = useCallback((event) => {
    if (!workspaceRef.current) return;
    if (workspaceRef.current.isDragging()) return;
    if (isEditingText.current) return; // 當文字正在編輯時，禁止反向同步
    const newCode = pythonGenerator.workspaceToCode(workspaceRef.current);
    setEditorCode(newCode);
    onChange(newCode);
  }, [onChange]);

  // 初始化時掛上監聽器
  const attachChangeListener = useCallback(() => {
    if (workspaceRef.current && !changeListenerRef.current) {
      changeListenerRef.current = workspaceRef.current.addChangeListener(handleWorkspaceChange);
    }
  }, [handleWorkspaceChange]);

  // 文字編輯 → Blockly 同步邏輯
  const handleTextChange = (newCode) => {
    setEditorCode(newCode);
    onChange(newCode);
    isEditingText.current = true;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      isEditingText.current = false;
    }, 500);

    if (!workspaceRef.current) return;

    try {
      const result = converter.convertSource(newCode);
      const dom = Xml.textToDom(result.xml);
      if (changeListenerRef.current) {
        workspaceRef.current.removeChangeListener(changeListenerRef.current);
        changeListenerRef.current = null;
      }
      workspaceRef.current.clear();
      Xml.domToWorkspace(dom, workspaceRef.current);
      setXml(result.xml);
      attachChangeListener();
    } catch (err) {
      console.error('XML 匯入 Workspace 失敗：', err);
    }
  };

  // 當 workspaceRef 更新時掛上監聽器
  const handleWorkspaceRef = (workspace) => {
    workspaceRef.current = workspace;
    attachChangeListener();
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
                onWorkspaceChange={handleWorkspaceRef}
              />
            </div>
            <div className="col-md-6 h-100">
              <AceEditor
                mode="python"
                theme="monokai"
                name="ace-editor"
                value={editorCode}
                onChange={handleTextChange}
                editorProps={{ $blockScrolling: true }}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PyBlocksEditor;
