import React, { useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import AceEditor from 'react-ace';

import * as Blockly from 'blockly/core';
import * as libraryBlocks from 'blockly/blocks';
import { pythonGenerator } from 'blockly/python';
import { javascriptGenerator } from 'blockly/javascript';
import * as zhHant from 'blockly/msg/zh-hant';

import toolboxConfig from '../config/Toolbox';
import '../config/blockly.css';
import 'blockly/blocks';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';

Blockly.setLocale(zhHant);

function Teacher() {
  const [xml, setXml] = useState("");
  const [code, setCode] = useState("");

  const handleWorkspaceChange = (workspace) => {
    const newCode = pythonGenerator.workspaceToCode(workspace);
    setCode(newCode);
  };
  
  return (
    <div className="container mt-4">
      <div className="card bg-dark text-white">
        <div className="card-header">
          Blockly Workspace
        </div>
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
              />
            </div>
            <div className="col-md-6" style={{ height: '100%' }}>
              <AceEditor
                mode="python"
                theme="monokai"
                name="ace-editor"
                onChange={(newCode) => setCode(newCode)}
                value={code}
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

export default Teacher;