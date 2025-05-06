// src/blockly_blocks/custom_block/raw_block.jsx

/**
 * 自訂「raw_block」：
 * 允許直接輸入一段原始 Python 文字，做為 statement 使用。
 * @param {typeof import('blockly')} Blockly 由呼叫端傳入的 Blockly 物件
 */

import { FieldMultilineInput } from '@blockly/field-multilineinput';

export default function defineRawBlock(Blockly, pythonGenerator) {
  /* 若已經註冊過就跳過（避免 Hot Reload 時重複執行） */
  if (Blockly.Blocks['raw_block']) return;

  /* --------- 1. 定義積木外觀／行為 -------------------- */
  Blockly.Blocks['raw_block'] = {
    init() {

      this.appendDummyInput().appendField(new Blockly.FieldLabel('自定義積木塊：'));
      this.appendDummyInput().appendField(new Blockly.FieldLabel('如果無法辨識程式碼，則生成此積木。'));
      //this.appendDummyInput().appendField(new Blockly.FieldTextInput(''), 'TEXT');
      //this.appendDummyInput().appendField(new Blockly.FieldMultilineInput(''), 'TEXT');
      this.appendDummyInput().appendField(new FieldMultilineInput(''), 'TEXT'); 
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(0);
      this.setTooltip('Raw Python code');
    }
  };

  /* --------- 2. 定義 Python 產生器 -------------------- */
  // Blockly 9+：一定要掛到 forBlock
  pythonGenerator.forBlock = pythonGenerator.forBlock || {};
  pythonGenerator.forBlock['raw_block'] = (block, gen) => {
    const code = block.getFieldValue('TEXT') || '';
    return code + '\n';
  };

  /* --------- 3. （可選）定義 Js 產生器 ---------------- */
  // 若日後想要匯出 JavaScript，可這樣掛：
  // import { javascriptGenerator } from 'blockly/javascript';
  // javascriptGenerator['raw_block'] = (block) => block.getFieldValue('TEXT') + '\n';

  console.info('[raw_block] 已註冊');
}
