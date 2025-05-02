// src/blockly_blocks/xml.js
// 直接用 ESM 匯入，避免在 import 時 window.Blockly 還沒掛好
import * as Blockly from 'blockly';

/* 封裝常用 XML ↔︎ Workspace 轉換工具 */
const Xml = {};

// <string ⭢ DOM>
Xml.textToDom = (text) => {
  const parser = new DOMParser();
  const dom    = parser.parseFromString(text, 'text/xml');
  if (!dom || !dom.firstChild || dom.firstChild.nodeName.toLowerCase() !== 'xml') {
    throw new Error('Xml.textToDom did not obtain a valid XML tree.');
  }
  return dom.firstChild;
};

// DOM ⭢ <string>
Xml.domToText = (dom) => new XMLSerializer().serializeToString(dom);

// Workspace ⭢ DOM
Xml.workspaceToDom = (workspace) => {
  const xml = document.createElement('xml');
  workspace.getTopBlocks(true).forEach(b => xml.appendChild(Blockly.Xml.blockToDomWithXY(b)));
  return xml;
};

// 把 DOM 匯入 Workspace
Xml.domToWorkspace = (dom, workspace) => {
  workspace.clear();
  Blockly.Xml.appendDomToWorkspace(dom, workspace);
};

export default Xml;
