import React, { useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';

import * as Blockly from 'blockly/core';
import * as libraryBlocks from 'blockly/blocks';
import { javascriptGenerator } from 'blockly/javascript';
import * as zhHant from 'blockly/msg/zh-hant';

import toolboxConfig from '../config/Toolbox';
import '../config/blockly.css';
import 'blockly/blocks';

Blockly.setLocale(zhHant);

function Student() {
  const [xml, setXml] = useState("");

  return (
    <div className="container mt-4">
      <div className="card bg-dark text-white">
        <div className="card-header">
          Blockly Workspace
        </div>
        <div className="card-body" style={{ height: '500px', width: '100%' }}>
          <BlocklyWorkspace
            toolboxConfiguration={toolboxConfig}
            initialXml={xml}
            onXmlChange={(newXml) => setXml(newXml)}
            className="blockly-workspace"
          />
        </div>
      </div>
    </div>
  );
}

export default Student;