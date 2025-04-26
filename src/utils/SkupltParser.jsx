// 從 'skulpt' 套件中導入 Sk，這個套件用於在瀏覽器中解析與執行 Python 代碼
import Sk from 'skulpt';
// 從 'js-beautify' 套件導入 js_beautify，用於美化（格式化） JavaScript 代碼
import { js_beautify } from 'js-beautify';


// 定義一個 parsePythonCode 工具函式，接收 Python 程式碼與 callback 函式作為參數
export const parsePythonCode = (code, callback) => {
  // 配置 Skulpt 的行為
  Sk.configure({
    // 定義 output 方法：當 Skulpt 執行時會呼叫此方法輸出訊息
    output: (text) => {
      console.log("Skulpt output:", text);
    },
    // 定義 read 方法：用於讀取內建的 Python 檔案內容
    read: (x) => {
      // 檢查 Skulpt 是否有內建文件，若缺少指定檔案則拋出錯誤
      if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
        throw "File not found: '" + x + "'";
      }
      // 返回內建檔案中的內容
      return Sk.builtinFiles["files"][x];
    },
  });

  // 使用 Skulpt 的異步方法將傳入的 Python 代碼轉換成模組
  // Sk.importMainWithBody 會將代碼轉換成一個主模組，並以 Promise 方式返回
  Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true))
    // 當 Promise 成功後，回傳解析好的模組（包含 AST 及其他資訊）
    .then((module) => {
      console.log("Python code parsed successfully");
      console.log("Module:", module);
      console.log("Module keys:", Object.keys(module));
      console.log("Module details:", JSON.stringify(module, null, 2));
      // 調用 callback 並以 null 作為錯誤參數，module 作為結果參數
      callback(null, module);
    })
    // 如果解析過程中有錯誤則捕捉錯誤，並呼叫 callback 回傳錯誤資訊
    .catch((err) => {
      console.error(err.toString());
      callback(err, null);
    });
};


// 定義 isValidJson 工具函式，接收一個字串，若能正確解析為 JSON 則返回 true，否則返回 false
export const isValidJson = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};


// 定義 getFormattedJsCode 工具函式，接收一個解析結果（字串）
// 若該字串為有效 JSON 且包含 $js 屬性，則美化這段 JavaScript 代碼返回，否則返回空字串
export const getFormattedJsCode = (parsedResult) => {
  // 判斷 parsedResult 是否為有效 JSON
  if (isValidJson(parsedResult)) {
    const parsed = JSON.parse(parsedResult);
    // 若 parsed 物件中存在 $js 屬性，則對其進行格式化，否則返回空字串
    return parsed.$js ? js_beautify(parsed.$js, { indent_size: 2 }) : '';
  }
  return '';
};


// 定義 generateBlocklyXmlFromAst 工具函式，根據傳入的 AST 物件產生對應的 Blockly XML
export const generateBlocklyXmlFromAst = (ast) => {
  // 初始化 XML 字串，設定 XML 命名空間
  let xml = '<xml xmlns="http://www.w3.org/1999/xhtml">';
  
  // 遍歷 AST 中的每個頂層節點（這裡假設 ast.body 為 AST 的頂層結構）
  ast.body.forEach(node => {
    // 檢查節點是否為一個表達式（Expr），且其值為一個函式調用（Call）
    // 並且此函式調用的函式為一個名稱型節點（Name），且其值為 'print'
    if (node._astname === 'Expr' && 
        node.value._astname === 'Call' && 
        node.value.func._astname === 'Name' && 
        node.value.func.id.v === 'print') {
      // 若符合條件，則生成一個 text_print 類型的 Blockly 區塊
      xml += '<block type="text_print">';
      // 取得 print 語句中第一個參數的字串值（假設它是字串，這裡直接取 node.value.args[0].s.v）
      xml += `<field name="TEXT">${node.value.args[0].s.v}</field>`;
      // 關閉該區塊標籤
      xml += '</block>';
    }
  });

  // 結尾關閉 XML 標籤
  xml += '</xml>';
  // 返回生成好的 Blockly XML 字串
  return xml;
};
