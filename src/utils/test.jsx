/* src/utils/test.jsx */

Sk.configure({
    __future__: Sk.python3
});

window.Sk = Sk;
//console.log(Sk);

/**
 * An object for converting Python source code to the Blockly XML representation.
 * @constructor
 * @this {PythonToBlocks}
 */

// 定義一個建構子函式，用於建立 PythonToBlocks 物件，目的是將 Python 程式碼轉換成 Blockly 的 XML 表示
function PythonToBlocks() {
    // 此處目前沒有初始化內部屬性，將在其他方法中動態設定
}

// 定義一個輔助函式，用來將 XML DOM 物件轉換成字串表示
function xmlToString(xml) {
    // 使用瀏覽器內建的 XMLSerializer 將 xml 物件序列化成字串
    return new XMLSerializer().serializeToString(xml);
}

// 方法：將原始 Python 程式碼包裝成一個 raw_block 區塊，並置於 <xml> 根元素中，再轉換成字串返回
PythonToBlocks.prototype.convertSourceToCodeBlock = function(python_source) {
    var xml = document.createElement("xml");            // 建立 <xml> 根元素
    xml.appendChild(raw_block(python_source));            // 以 raw_block 型別建立一個區塊，其內容為原始 python_source，並加入到 xml 中
    return xmlToString(xml);                              // 將組合好的 XML 文件轉換為字串後返回
}

/**
 * The main function for converting a string representation of Python code to the Blockly XML representation.
 * @param {string} python_source - The string representation of Python code (e.g., "a = 0").
 * @returns {Object} An object which will either have the converted source code or an error message and the code as a code-block.
 */

// 主轉換函式：將 Python 程式碼（字串）轉換為 Blockly 的 XML 表示，回傳物件包含 XML、錯誤狀態、行對應資訊等
PythonToBlocks.prototype.convertSource = function(python_source) {
    var xml = document.createElement("xml");            // 建立一個 <xml> 根元素
    if (python_source.trim() === "") {                    // 如果輸入的程式碼去除空白後為空
        console.log("TEXTBOX EMPTY");                     // 輸出日誌提示文字框為空
        return {"xml": xmlToString(xml), "error": null};   // 回傳空的 XML 及 null 錯誤
    }
    // 將原始程式碼按行拆分，保存到屬性 this.source，以便後續根據行號提取對應的程式碼
    this.source = python_source.split("\n");
    //console.log("this.source: ", this.source);         // 測試用：輸出拆分後的程式碼陣列（此行為注釋掉的除錯語句）
    var filename = 'user_code.py';                        // 定義一個虛擬檔案名稱，作為解析時參考用
    // Attempt parsing - might fail!
    var parse, ast, symbol_table, error;                 // 宣告將用於儲存解析結果、抽象語法樹、符號表（未使用）與錯誤訊息的變數
    try {
        // 使用 Skulpt 的解析器將 python_source 解析成 Concrete Syntax Tree（CST）
        parse = Sk.parse(filename, python_source);
        // 從 CST 轉換成 Abstract Syntax Tree（AST），這是後續轉換邏輯的依據
        ast = Sk.astFromParse(parse.cst, filename, parse.flags);
        //ast = Sk.astFromParse(python_source, filename);
        //console.log("=== CST ===");
        //console.log(JSON.stringify(parse.cst, null, 2));
        
        //console.log("=== AST ===");
        //console.log(JSON.stringify(ast, null, 2));
    } catch (e) {                                       // 如果解析過程中發生錯誤
        error = e;                                      // 將錯誤儲存到變數 error
        xml.appendChild(raw_block(python_source));      // 將原始程式碼以 raw_block 形式加入 XML，以便用戶檢查
        return {"xml": xmlToString(xml), "error": error}; // 返回包含錯誤訊息的結果物件
    }
    // 初始化儲存註解的物件，此處用以存放來自 Skulpt 解析時提取到的註解資訊
    this.comments = {};
    // 遍歷解析結果中的 comments，將每個註解依據其所在的行號進行儲存
    for (var commentLocation in parse.comments) {
        //console.log("COMMENTIIIIII");               // 除錯用：輸出提示（目前為注釋）
        var lineColumn = commentLocation.split(",");    // 以逗號分割註解行列資訊，取得行號部分
        var yLocation = parseInt(lineColumn[0], 10);      // 將行號字串轉換為整數
        this.comments[yLocation] = parse.comments[commentLocation];  // 將該行的註解存入 this.comments
    }
    // 初始化與行號測量相關的屬性，用於在後續轉換時計算每個區塊的範圍
    this.highestLineSeen = 0;
    this.levelIndex = 0;
    this.nextExpectedLine = 0;
    // 呼叫 measureNode 方法，測量 AST 節點在原始程式碼中所對應的行數區間
    this.measureNode(ast);
    // 呼叫 convert 方法，開始將 AST 轉換成 Blockly 區塊的 XML 物件
    var converted = this.convert(ast);
    //console.log("converted: ", converted);            // 除錯用：輸出轉換結果（注釋掉）
    if (converted !== null) {                            // 如果轉換結果不為 null
        // 遍歷所有轉換得到的區塊並將它們附加到 XML 根元素中
        for (var block = 0; block < converted.length; block += 1) {
            xml.appendChild(converted[block]);
        }
    }
    //console.log(xmlToString(xml));                      // 除錯用：輸出最終 XML（注釋掉）
    // 返回一個包含最終 XML 字串、錯誤狀態、行對應映射（lineMap，可能在其他部分設置）以及註解的結果物件
    return {"xml": xmlToString(xml), "error": null, "lineMap": this.lineMap, "comment": this.comments};
}

// 將 Python 的內部表示轉換為 JavaScript 原生值（例如標識符、字串等）
PythonToBlocks.prototype.identifier = function(node) {
    // 利用 Skulpt 的 ffi 工具，將傳入的 node 轉換成 JS 物件，方便後續處理
    return Sk.ffi.remapToJs(node);
}

// 以遞迴方式計算 AST 節點在原始程式碼中的對應「結束行號」
// 參數 node 為目前處理的 AST 節點，nextBlockLine 為下一區塊預期開始的行號
PythonToBlocks.prototype.recursiveMeasure = function(node, nextBlockLine) {
    // 除錯用輸出（目前為注釋）：檢查目前節點、預期下一區塊的行號與當前高度陣列
    // console.log("node recursive: ", node);
    // console.log("nextBlockLine recursive: ", nextBlockLine);
    // console.log("this.heights recursive: ", this.heights);
    
    // 若節點為 undefined，則無法繼續測量，直接返回
    if (node === undefined)  {
        return;
    }
    // 初始化 myNext 為預設的下一區塊行號
    var myNext = nextBlockLine;
    
    // 檢查該節點是否有 orelse 區塊（例如 if 陳述中的 else 或 elif）
    if ("orelse" in node && node.orelse.length > 0) {
        // 如果 orelse 陣列只有一個元素且該元素為 if 節點（即 elif），
        // 則將 myNext 更新為這個 elif 節點的行號減 1
        if (node.orelse.length == 1 && node.orelse[0]._astname == "If") {
            // console.log("primo orelse if");
            myNext = node.orelse[0].lineno - 1;
        } else {
            // 否則（通常是 else 分支），將 myNext 更新為第一個 orelse 節點的行號減 2
            // （先減 1 表示上一行，再減 1 調整間隔）
            // console.log("primo orelse else");
            myNext = node.orelse[0].lineno - 1 - 1;
        }
    }
    // 將當前區塊預期的結束行號 nextBlockLine 推入 heights 陣列
    this.heights.push(nextBlockLine);
    
    // 若節點中有 body 區塊（即包含內部陳述式的部分）
    if ("body" in node) {
        // 遍歷該 body 中的每個子節點
        for (var i = 0; i < node.body.length; i++) {
            var next;
            // 如果這是 body 中的最後一個節點，則使用 myNext 作為下一區塊起始行號
            if (i + 1 == node.body.length) {
                // console.log("body if");
                next = myNext;
            } else {
                // 否則，下一節點的行號減 1 作為當前區塊結束
                // console.log("body else");
                next = node.body[i + 1].lineno - 1;
            }
            // 遞迴呼叫 recursiveMeasure 以測量當前子節點的結束行號
            this.recursiveMeasure(node.body[i], next);
        }
    }
    // 同樣地，若節點中有 orelse 區塊（代表 else 或 elif）
    if ("orelse" in node) {
        for (var i = 0; i < node.orelse.length; i++) {
            var next;
            // 若 i 等於 orelse 陣列長度（理論上不常發生），就設定 next 為初始的 nextBlockLine
            if (i == node.orelse.length) {
                // console.log("secondo orelse if");
                next = nextBlockLine;
            } else {
                // 否則將 next 設定為該 orelse 節點的行號（先將行號減 1，再加 1 恢復原數值）
                // console.log("secondo orelse else");
                next = 1 + (node.orelse[i].lineno - 1);
            }
            // 以 orelse 的每個子節點進行遞迴測量
            this.recursiveMeasure(node.orelse[i], next);
        }
    }
}


// 以 measureNode 為入口，初始化 heights 陣列並呼叫 recursiveMeasure 進行整個 AST 的測量
PythonToBlocks.prototype.measureNode = function(node) {
    // 初始化 heights 為空陣列，用來儲存每個區塊的「結束行號」
    this.heights = [];
    // 從 AST 根節點開始遞迴測量，將程式碼總行數（this.source.length - 1）作為最終行號
    this.recursiveMeasure(node, this.source.length - 1);
    // console.log("this.heights: ", this.heights);  // 除錯輸出 heights 結果
    // 移除 heights 陣列的第一個元素（通常是多餘的）
    this.heights.shift();
}


// 根據開始行號(frm)和結束行號(to)從原始程式碼中擷取對應的區塊內容
PythonToBlocks.prototype.getSourceCode = function(frm, to) {
    // 利用 slice 從 this.source（整個程式碼的行數陣列）中擷取 frm 到 to 之間的所有行
    var lines = this.source.slice(frm - 1, to);
    // console.log("lines: ", lines);  // 除錯用：輸出擷取後的行陣列
    // 移除每一行開頭的縮排，使其對齊無多餘空白
    if (lines.length > 0) {
        // 先找到第一行中第一個非空白字元的位置，該位置即為縮排長度
        var indentation = lines[0].search(/\S/);
        // 針對每一行，從該位置開始擷取字串，去除前導空格
        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].substring(indentation);
        }
    }
    // 最後將所有行以換行字元連接，組成完整的程式碼字串返回
    return lines.join("\n");
}


// 將傳入的 AST 節點（通常代表一段程式碼區塊）轉換成 Blockly 區塊，並處理各區塊之間的嵌套與平級連接
PythonToBlocks.prototype.convertBody = function(node, is_top_level) {
    // 進入一個新的轉換層級，層級指標增加
    this.levelIndex += 1;
    // 若傳入的節點陣列為空，則返回 null
    if (node.length == 0) {
        return null;
    }
    
    // 初始化用以儲存轉換結果的陣列和控制變數
    var children = [], // 儲存所有平級（peer）的區塊
        root = null,   // 表示當前同一組中第一個或最上層的區塊
        current = null, // 表示目前連接鏈中的最後一個區塊
        levelIndex = this.levelIndex; // 當前層級指標
        
    // 定義輔助函式 addPeer，用以將一個獨立區塊作為平級區塊加入結果陣列
    function addPeer(peer) {
        if (root == null) {
            children.push(peer);
        } else {
            children.push(root);
        }
        // 將 peer 設定為當前同一組區塊的 root 與 current
        root = peer;
        current = peer;
    }
    
    // 定義輔助函式 finalizePeers，用以在結束處理時確保最後的 root 區塊被加入結果中
    function finalizePeers() {
        if (root != null) {
            children.push(root);
        }
    }
    
    // 定義輔助函式 nestChild，將一個區塊嵌套為目前區塊(current)的下一個區塊
    function nestChild(child) {
        if (root == null) {
            // 若還未有任何區塊，則 child 成為 root 與 current
            root = child;
            current = child;
        } else if (current == null) {
            // 若 current 為空（理論上很少發生），則將 root 指向 current
            root = current;
        } else {
            // 建立一個 <next> 標籤，將 child 放入其中，並附加到 current 區塊下
            var nextElement = document.createElement("next");
            nextElement.appendChild(child);
            current.appendChild(nextElement);
            // 更新 current 為剛加入的 child
            current = child;
        }
    }
    
    // 初始化用以處理行號與註解的變數
    var lineNumberInBody = 0,
        lineNumberInProgram,
        previousLineInProgram = null,
        distance,
        skipped_line,
        commentCount,
        previousHeight = null,
        previousWasStatement = false,
        visitedFirstLine = false,
        wasFirstLine;
        
    // 遍歷傳入的每個 AST 節點，進行逐一轉換
    for (var i = 0; i < node.length; i++) {
        // 每處理一個節點，內部行號計數加 1
        lineNumberInBody += 1;
        
        // 獲取當前節點在原始程式碼中的行號
        lineNumberInProgram = node[i].lineno;
        // 計算與前一行的空隙行數（distance）
        distance = 0, wasFirstLine = true;
        if (previousLineInProgram != null) {
            distance = lineNumberInProgram - previousLineInProgram - 1;
            wasFirstLine = false;
        }
        // 將行號間隔加入內部計數
        lineNumberInBody += distance;
        
        // 處理位於當前節點前的註解
        commentCount = 0;
        for (var commentLineInProgram in this.comments) {
            // 若註解行數小於當前行號，則需要處理該註解
            if (commentLineInProgram < lineNumberInProgram) {
                // 透過 Comment 函式建立一個註解區塊
                commentChild = this.Comment(this.comments[commentLineInProgram], commentLineInProgram);
                if (previousLineInProgram == null) {
                    // 若之前沒有行號紀錄，則直接嵌套該註解區塊
                    nestChild(commentChild);
                } else {
                    // 判斷是否因為行距過大而需要平級加入
                    skipped_previous_line = Math.abs(previousLineInProgram - commentLineInProgram) > 1;
                    if (is_top_level && skipped_previous_line) {
                        addPeer(commentChild);
                    } else {
                        nestChild(commentChild);
                    }
                }
                // 更新上一行行號，並更新 highestLineSeen 為較大者
                previousLineInProgram = commentLineInProgram;
                this.highestLineSeen = Math.max(this.highestLineSeen, parseInt(commentLineInProgram, 10));
                // 重新計算當前距離
                distance = lineNumberInProgram - previousLineInProgram;
                // 移除已處理過的註解
                delete this.comments[commentLineInProgram];
                commentCount += 1;
            }
        }
        
        // 更新與 highestLineSeen 的距離，並更新 highestLineSeen
        distance = lineNumberInProgram - this.highestLineSeen;
        this.highestLineSeen = Math.max(lineNumberInProgram, this.highestLineSeen);
        
        // 從 heights 陣列中取出此區塊的結束行號（高度值）
        var height = this.heights.shift();
        // 根據當前行號與高度值從原始程式碼中提取出對應程式碼字串
        var originalSourceCode = this.getSourceCode(lineNumberInProgram, height);
        // 呼叫 convertStatement 將 AST 節點轉換為對應的 Blockly 區塊，並傳入原始程式碼備用（例如供錯誤回覆）
        var newChild = this.convertStatement(node[i], originalSourceCode, is_top_level);
        
        // 如果轉換結果為 null（例如遇到不需要處理的節點如 import），則略過
        if (newChild == null) {
            continue;
        }
        
        // 判斷是否因行距大於 1 而產生跳行情形
        skipped_line = distance > 1;
        previousLineInProgram = lineNumberInProgram;
        previousHeight = height;
        
        // 根據目前是否為頂層與前一區塊型態，決定添加方式：
        // 若頂層且 newChild 為陣列，則將陣列中的第一個區塊作平級添加
        if (is_top_level && newChild.constructor == Array) {
            addPeer(newChild[0]);
        // 若頂層且有跳行且已處理過至少一行，則平級添加
        } else if (is_top_level && skipped_line && visitedFirstLine) {
            addPeer(newChild);
        // 若頂層且前一個區塊不是一個完整的 peer，則平級添加
        } else if (is_top_level && !previousWasStatement) {
            addPeer(newChild);
        // 否則，將 newChild 嵌套添加為當前區塊的下一連接區塊
        } else {
            nestChild(newChild);
        }
        // 更新標誌，記錄目前區塊是否為單一區塊（非陣列）
        previousWasStatement = newChild.constructor !== Array;
        
        // 標記已至少處理過第一行
        visitedFirstLine = true;
    }
    
    // 若最後一行後仍存在註解，則處理該註解：取得最後行號後一行
    var lastLineNumber = lineNumberInProgram + 1;
    if (lastLineNumber in this.comments) {
        commentChild = this.Comment(this.comments[lastLineNumber], lastLineNumber);
        nestChild(commentChild);
        delete this.comments[lastLineNumber];
    }
    
    // 處理仍殘留在 this.comments 中的註解（頂層情形下），依據與上一行的距離決定平級或嵌套加入
    if (is_top_level) {
        for (var commentLineInProgram in this.comments) {
            commentChild = this.Comment(this.comments[commentLineInProgram], commentLineInProgram);
            distance = commentLineInProgram - previousLineInProgram;
            if (previousLineInProgram == null) {
                addPeer(commentChild);
            } else if (distance > 1) {
                addPeer(commentChild);
            } else {
                nestChild(commentChild);
            }
            previousLineInProgram = commentLineInProgram;
            delete this.comments[lastLineNumber];
        }
    }
    
    // 呼叫 finalizePeers 以確保最後一個區塊也被加入結果
    finalizePeers();
    
    // 結束目前層級的轉換，層級指標減 1
    this.levelIndex -= 1;
    
    // 返回組合完成的區塊列表，這些區塊後續將被嵌入到 XML 中
    return children;
}

// 定義一個函式 block，根據傳入的各項參數建立一個 Blockly 區塊（即 <block> DOM 元素）
function block(type, lineNumber, fields, values, settings, mutations, statements) {
    var newBlock = document.createElement("block");  
    // 建立 <block> 元素，用來包裝後續區塊資訊

    // ---------------------- Settings ----------------------
    newBlock.setAttribute("type", type);      
    // 設定區塊的 "type" 屬性，用以識別該區塊的種類
    newBlock.setAttribute("line_number", lineNumber); 
    // 設定區塊所對應的原始程式碼行號，方便追蹤錯誤或除錯

    for (var setting in settings) {
        // 遍歷 settings 物件中所有的設定項目
        var settingValue = settings[setting];   
        // 取得對應設定項目的值
        newBlock.setAttribute(setting, settingValue);  
        // 將該設定以屬性方式加入區塊中
    }

    // ---------------------- Mutations ----------------------
    // 若傳入 mutations 物件存在且不為空，則需要建立 <mutation> 標籤
    if (mutations !== undefined && Object.keys(mutations).length > 0) {
        var newMutation = document.createElement("mutation");
        // 建立 <mutation> 元素，用來儲存變更資訊
        for (var mutation in mutations) {
            // 遍歷 mutations 物件中所有的鍵
            var mutationValue = mutations[mutation];
            if (mutation.charAt(0) == '@') {
                // 如果 mutation 鍵以 "@" 開頭，表示這是一個直接作為屬性加入
                newMutation.setAttribute(mutation.substr(1), mutationValue);
                // 將 "@" 後面的字串作為屬性名稱，值為 mutationValue
            } else if (mutationValue != null && mutationValue.constructor === Array) {
                // 如果 mutationValue 為陣列，則要為陣列中每個元素建立一個節點
                for (var i = 0; i < mutationValue.length; i++) {
                    var mutationNode = document.createElement(mutation);
                    // 建立一個以 mutation 鍵名稱命名的節點
                    mutationNode.setAttribute("name", mutationValue[i]);
                    // 將陣列中的每一個值設定為該節點的 name 屬性
                    newMutation.appendChild(mutationNode);
                    // 將此 mutation 節點加入 <mutation> 中
                }
            } else {
                // 一般情況下，建立一個 <arg> 節點儲存此 mutation 資訊
                var mutationNode = document.createElement("arg");
                if (mutation.charAt(0) == '*') {
                    // 若 mutation 鍵以 "*" 開頭，則 name 屬性設定為空字串
                    mutationNode.setAttribute("name", "");
                } else {
                    // 否則，直接使用 mutation 鍵作為 name
                    mutationNode.setAttribute("name", mutation);
                }
                if (mutationValue !== null) {
                    // 若 mutationValue 不為 null，則將其作為子節點加入
                    mutationNode.appendChild(mutationValue);
                }
                // 將建立好的 <arg> 節點加入 <mutation> 區塊內
                newMutation.appendChild(mutationNode);
            }
        }
        // 將整個 <mutation> 區塊加入主區塊中
        newBlock.appendChild(newMutation);
    }

    // ---------------------- Fields ----------------------
    // fields 用來記錄區塊內固定的文字值（如變數名稱、操作符號等）
    for (var field in fields) {
        var fieldValue = fields[field];
        var newField = document.createElement("field");
        // 建立 <field> 元素
        newField.setAttribute("name", field);
        // 設定該 field 的名稱為 field 鍵值
        newField.appendChild(document.createTextNode(fieldValue));
        // 以文字節點形式加入 fieldValue
        newBlock.appendChild(newField);
        // 將這個 field 加入區塊中
    }

    // ---------------------- Values ----------------------
    // values 用來儲存子區塊或其他值，如運算元、子表達式等
    for (var value in values) {
        var valueValue = values[value];
        var newValue = document.createElement("value");
        // 建立 <value> 元素
        if (valueValue !== null) {
            newValue.setAttribute("name", value);
            // 設定 <value> 的名稱
            newValue.appendChild(valueValue);
            // 將已轉換的子區塊（或其他 XML 片段）加入
            newBlock.appendChild(newValue);
            // 將該值元素加入區塊
        }
    }

    // ---------------------- Statements ----------------------
    // statements 用來處理具有多個語句的區塊，例如 if、while 內的多行程式碼
    if (statements !== undefined && Object.keys(statements).length > 0) {
        for (var statement in statements) {
            var statementValue = statements[statement];
            if (statementValue == null) {
                // 如果該語句為 null，則跳過
                continue;
            } else {
                // 否則遍歷該語句可能包含的多個部分
                for (var i = 0; i < statementValue.length; i += 1) {
                    // 建立 <statement> 標籤
                    var newStatement = document.createElement("statement");
                    newStatement.setAttribute("name", statement);
                    // 將語句名稱設為 statement 鍵
                    newStatement.appendChild(statementValue[i]);
                    // 將語句內容（已轉換成 XML 區塊）加入 <statement> 中
                    newBlock.appendChild(newStatement);
                    // 將此語句區塊加入主區塊
                }
            }
        }
    }
    // 返回建立好的完整區塊 (即 DOM 元素)
    return newBlock;
}

// raw_block 用以產生一個原始區塊，主要用於無法轉換的程式碼或除錯用途；此處行號預設為 0
const raw_block = function(txt) {
    const blockElem = document.createElement('block');
    blockElem.setAttribute('type', 'raw_block');

    const field = document.createElement('field');
    field.setAttribute('name', 'TEXT');
    field.textContent = txt;

    blockElem.appendChild(field);

    return blockElem;
}

// raw_expression 同上，但可以傳入行號，主要用於表達式部分
const raw_expression = function(txt, lineno) {
    return block("raw_expression", lineno, {"TEXT": txt});
}


// 轉換入口函式：根據 AST 節點的 _astname 屬性，動態調用對應的轉換方法
PythonToBlocks.prototype.convert = function(node, is_top_level) {
    // 透過動態屬性存取，呼叫例如 this["If"](node, is_top_level) 的方式進行轉換
    return this[node._astname](node, is_top_level);
}


// 輔助函式 arrayMax：取得陣列中最大的值
function arrayMax(array) {
  return array.reduce(function(a, b) {
    return Math.max(a, b);
  });
  // 使用 reduce 函式，逐步比較並返回最大值
}

// 輔助函式 arrayMin：取得陣列中最小的值
function arrayMin(array) {
  return array.reduce(function(a, b) {
    return Math.min(a, b);
  });
  // 與 arrayMax 類似，但返回最小值
}


// 將單一 AST 節點轉換成對應的 Blockly 區塊，若過程中出現錯誤，則提取原始程式碼並以 raw_block 方式返回
PythonToBlocks.prototype.convertStatement = function(node, full_source, is_top_level) {
    try {
        // 嘗試調用 convert 方法將節點轉換
        return this.convert(node, is_top_level);
    } catch (e) {
        // 捕捉任何轉換錯誤
        const heights = this.getChunkHeights(node);
        // 根據該節點所有相關的行號計算出對應程式碼區間
        const extractedSource = this.getSourceCode(arrayMin(heights), arrayMax(heights));
        console.error(e);
        // 發生錯誤則以 raw_block 的形式返回原始程式碼，方便使用者檢查
        return raw_block(extractedSource);
    }
}


// 遞迴取得 AST 節點中所有相關的行號，主要用於計算程式碼區塊範圍
PythonToBlocks.prototype.getChunkHeights = function(node) {
    var lineNumbers = [];
    // 若節點本身有行號，加入該行號到陣列
    if (node.hasOwnProperty("lineno")) {
        lineNumbers.push(node.lineno);
    }
    // 如果節點含有 body 屬性（例如函式、if 之類的複合語句），遞迴取得每個子節點的行號
    if (node.hasOwnProperty("body")) {
        for (var i = 0; i < node.body.length; i += 1) {
            var subnode = node.body[i];
            lineNumbers = lineNumbers.concat(this.getChunkHeights(subnode));
        }
    }
    // 同理，若節點含有 orelse 屬性，也遞迴取得
    if (node.hasOwnProperty("orelse")) {
        for (var i = 0; i < node.orelse.length; i += 1) {
            var subnode = node.orelse[i];
            lineNumbers = lineNumbers.concat(this.getChunkHeights(subnode));
        }
    }
    return lineNumbers;  // 返回該節點及所有子節點相關的行號集合
}

/* ----- Nodes ---- */
/*
 * NO LINE OR COLUMN NUMBERS
 * Module
 * body: asdl_seq
 */
 
/*
 * Module 節點轉換：
 * 將 Module 節點中的 body 陣列傳入 convertBody 處理，並設定頂層標識 true。
 */
PythonToBlocks.prototype.Module = function(node)
{
    return this.convertBody(node.body, true);
}

/*
 * Comment 節點轉換：
 * 將註解文字（通常以 "#" 開頭）轉換為 comment_single 區塊，
 * 並移除註解符號（slice(1) 去除第一個字元）。
 */
PythonToBlocks.prototype.Comment = function(txt, lineno) {
    return block("comment_single", lineno, {
        "BODY": txt.slice(1)
    }, {}, {}, {}, {});
}

/*
 * NO LINE OR COLUMN NUMBERS
 * Interactive
 * body: asdl_seq
 */
 //verificare quando viene usato
/*
 * Interactive 節點轉換：
 * 用以處理交互式模式的程式碼，目前僅呼叫 convertBody 處理 body 部分。
 * 注意：此處使用 node.body，但參數名稱為 body，可能需進一步調整。
 */
PythonToBlocks.prototype.Interactive = function(body)
{
    return this.convertBody(node.body);
}

/*
 * NO LINE OR COLUMN NUMBERS
 * TODO
 * body: expr_ty
 */
 //verificare quando viene usato
/*
 * Expression 節點轉換：
 * 用以處理單一表達式，將其內容儲存到物件中，目前僅把傳入值存下。
 */
PythonToBlocks.prototype.Expression = function(body)
{
    this.body = body;
}

/*
 * NO LINE OR COLUMN NUMBERS
 *
 * body: asdl_seq
 */
 //verificare quando viene usato
/*
 * Suite 節點轉換：
 * 處理包含多個語句的區塊，目前僅呼叫 asdl_seq 處理 node.body（實作待確認）。
 */
PythonToBlocks.prototype.Suite = function(body)
{
    this.asdl_seq(node.body);
}

/*
 *
 * name: identifier
 * args: arguments__ty
 * body: asdl_seq
 * decorator_list: asdl_seq
 */
 //non so se serve definire le funzioni a noi (es. def ciao() : print("b"))
/*
 * FunctionDef 節點轉換：
 * 處理函式定義，包括函式名稱、參數、主體與 decorator（若有 decorator 則拋錯）。
 * 產生 procedures_defnoreturn 區塊，其中 NAME 欄位存放函式名稱，
 * arg mutation 儲存函式參數，STACK 欄位儲存函式主體的區塊。
 */
PythonToBlocks.prototype.FunctionDef = function(node)
{
    var name = node.name;
    var args = node.args;
    var body = node.body;
    var decorator_list = node.decorator_list;
    if (decorator_list.length > 0) {
        throw new Error("Decorators are not implemented.");
    }
    return block("procedures_defnoreturn", node.lineno, {
        "NAME": this.identifier(name)
    }, {
    }, {
        "inline": "false"
    }, {
        "arg": this.arguments_(args)
    }, {
        "STACK": this.convertBody(body)
    });
}
/*
 * name: identifier
 * args: arguments__ty
 * bases: asdl_seq
 * body: asdl_seq
 * decorator_list: asdl_seq
 */
//non so se serve creare le classi a noi (es. class ciao: x=5)
/*
 * ClassDef 節點轉換：
 * 處理類別定義，包括類別名稱、基底類別（未處理）與類別體，
 * 若有 decorator 則不支援，產生 class_creation 區塊，
 * 將類別名稱放入 CLASS 欄位，類別體轉換結果放入 BODY 欄位。
 */
PythonToBlocks.prototype.ClassDef = function(node)
{
    var name = node.name;
    var bases = node.bases;
    var body = node.body;
    var decorator_list = node.decorator_list;
    if (decorator_list.length > 0) {
        throw new Error("Decorators are not implemented.");
    }
    return block("class_creation", node.lineno, {
        "CLASS": this.identifier(name)
    }, {
    }, {
        "inline": "false"
    }, {
        //"arg": this.arguments_(args)
    }, {
        "BODY": this.convertBody(body)
    });
}

/*
 * value: expr_ty
 *
 */
 //non so se serve a noi (es. def ciao(): x=0 return x) , inserire a capo
/*
 * Return 節點轉換：
 * 處理 return 語句，將 return 的表達式轉換後放入 procedures_return 區塊的 VALUE 欄位。
 */
PythonToBlocks.prototype.Return = function(node)
{
    var value = node.value;
    return block("procedures_return", node.lineno, {}, {
        "VALUE": this.convert(value)
    }, {
        "inline": "false"
    });
}


/*
 * targets: asdl_seq
 *
 */
 //non va ma non credo che ci serva (es del list[5])
/*
 * Delete 節點轉換：
 * 處理刪除語句，當前尚未實作，僅拋出錯誤提示。
 */
PythonToBlocks.prototype.Delete = function(/* {asdl_seq *} */ targets)
{
    this.targets = targets;
    throw new Error("Delete is not implemented");
}

/*
 * targets: asdl_seq
 * value: expr_ty
 */
 //assegnamneto alle varibili (no assegnamneti multipli es. a = y = 0)
/*
 * Assign 節點轉換：
 * 處理賦值語句，若目標數量為 1 則建立 variables_set 區塊，
 * 將目標以 Name_str 轉換並放入 VAR 欄位，將右側值轉換後放入 VALUE 欄位；
 * 多重目標則不支援，拋出錯誤。
 */
PythonToBlocks.prototype.Assign = function(node)
{
    var targets = node.targets;
    var value = node.value;
    if (targets.length == 0) {
        throw new Error("Nothing to assign to!");
    } else if (targets.length == 1) {
        return block("variables_set", node.lineno, {
            "VAR": this.Name_str(targets[0])
        }, {
            "VALUE": this.convert(value)
        });
    } else {
        throw new Error("Multiple Assigment Targets Not implemented");
    }
}

/*
 * target: expr_ty
 * op: operator_ty
 * value: expr_ty
 */
 //verificare quando viene usato
/*
 * AugAssign 節點轉換：
 * 處理增量賦值（如 +=）語句，僅支援加法運算，
 * 若運算子不是加法，則拋錯；若為加法則建立 math_change 區塊，
 * 其中 VAR 欄位存放目標，DELTA 欄位存放數值變更部分。
 */
PythonToBlocks.prototype.AugAssign = function(node)
{
    var target = node.target;
    var op = node.op;
    var value = node.value;
    if (op.name != "Add") {
        throw new Error("Only addition is currently supported for augmented assignment!");
    } else {
        return block("math_change", node.lineno, {
            "VAR": this.Name_str(target)
        }, {
            "DELTA": this.convert(value)
        });
    }
}

/*
 * dest: expr_ty
 * values: asdl_seq
 * nl: bool
 *
 */
/*
 * Print 節點轉換：
 * 處理 print 語句，若僅有一個輸出則使用 text_print 區塊，
 * 否則使用 text_print_multiple 區塊，並根據輸出項目數設定 inline 屬性與 mutation 標記。
 */
PythonToBlocks.prototype.Print = function(node)
{
    var dest = node.dest;
    var values = node.values;
    var nl = node.nl;
    
    if (values.length == 1) {
        return block("text_print", node.lineno, {}, {
            "TEXT": this.convert(values[0])
        });
    } else {
        return block("text_print_multiple", node.lineno, {}, 
            this.convertElements("PRINT", values), 
        {
            "inline": "true"
        }, {
            "@items": values.length
        });
    }
}

/*
 * target: expr_ty
 * iter: expr_ty
 * body: asdl_seq
 * orelse: asdl_seq
 *
 */
 //gestisce ciclo while del coderbot e anche il forEach che non so se serve
/*
 * For 節點轉換：
 * 處理 for 迴圈，若 orelse 部分存在則不支援，
 * 針對 range() 形式建立 coderbot_repeat 區塊，
 * 否則建立 controls_forEach 區塊，將列表與迴圈變數分別放入 LIST 與 VAR 欄位，
 * 並將迴圈主體放入 DO 欄位。
 */
PythonToBlocks.prototype.For = function(node) {
    const target = node.target;
    const iter = node.iter;
    const body = node.body;
    const orelse = node.orelse;

    if (orelse.length > 0) {
        throw new Error("Or-else block of For is not implemented.");
    }

    // 處理 range(...) 形式的 for 迴圈
    if (
        iter._astname === "Call" &&
        iter.func?.id?.v === "range"
    ) {
        const args = iter.args;

        if (args.length === 1) {
            // range(n) → controls_repeat_ext
            return block("controls_repeat_ext", node.lineno, {}, {
                "TIMES": this.convert(args[0])
            }, {
                "inline": "true"
            }, {}, {
                "DO": this.convertBody(body)
            });
        } else if (args.length === 2 || args.length === 3) {
            // range(start, stop[, step]) → controls_for
            const start = this.convert(args[0]);
            const stop = this.convert(args[1]);
            const step = args.length === 3
                ? this.convert(args[2])
                : block("math_number", node.lineno, { "NUM": 1 });

            return block("controls_for", node.lineno, {
                "VAR": this.Name_str(target)
            }, {
                "FROM": start,
                "TO": stop,
                "BY": step
            }, {
                "inline": "true"
            }, {}, {
                "DO": this.convertBody(body)
            });
        } else {
            throw new Error("Unsupported number of arguments to range()");
        }
    }

    // 其他可迭代對象 → controls_forEach
    return block("controls_forEach", node.lineno, {}, {
        "LIST": this.convert(iter),
        "VAR": this.convert(target)
    }, {
        "inline": "true"
    }, {}, {
        "DO": this.convertBody(body)
    });
};


/*
 * test: expr_ty
 * body: asdl_seq
 * orelse: asdl_seq
 */
 //funziona ma non so se serve o è sufficiente il ciclo while per il coderbot
/*
 * While 節點轉換：
 * 處理 while 迴圈，若存在 orelse 部分則不支援，
 * 建立 controls_while 區塊，將條件轉換結果放入 BOOL 欄位，
 * 迴圈主體放入 DO 欄位。
 */
PythonToBlocks.prototype.While = function(node) {
    var test = node.test;
    var body = node.body;
    var orelse = node.orelse;
    if (orelse.length > 0) {
        throw new Error("Or-else block of While is not implemented.");
    }
    return block("controls_whileUntil", node.lineno, {}, {
        "BOOL": this.convert(test)
    }, {}, {}, {
        "DO": this.convertBody(body)
    });
}

/*
 * test: expr_ty
 * body: asdl_seq
 * orelse: asdl_seq
 *
 */
/*
 * If 節點轉換：
 * 處理 if 語句，支援 if-elif-else 結構。
 * 初始將 if 條件與主體分別轉換並存入 IF_values 與 DO_values，
 * 若 orelse 為 elif 結構，則循環處理每個 elif，
 * 若剩餘內容則認定為 else 區塊，最後建立 controls_if_better 區塊，
 * 並利用 mutation 記錄 elif 與 else 的個數。
 */
PythonToBlocks.prototype.If = function(node)
{
    var test = node.test;
    var body = node.body;
    var orelse = node.orelse;
    
    var IF_values = {"IF0": this.convert(test)};
    var DO_values = {"DO0": this.convertBody(body)};
    
    var elseifCount = 0;
    var elseCount = 0;
    var potentialElseBody = null;
    
    if (orelse !== undefined) {
        if (orelse.length == 1 && orelse[0]._astname == "If") {
            // 處理 elif 結構：當 orelse 只有一個 if 節點時，認定為 elif
            while (orelse.length == 1  && orelse[0]._astname == "If") {
                this.heights.shift();  // 移除對應高度資訊
                elseifCount += 1;
                body = orelse[0].body;
                test = orelse[0].test;
                orelse = orelse[0].orelse;
                DO_values["DO" + elseifCount] = this.convertBody(body, false);
                if (test !== undefined) {
                    console.log("IF INNESTATO METODO IF");  // 除錯輸出
                    IF_values["IF" + elseifCount] = this.convert(test);
                }
            }
        }
        if (orelse !== undefined && orelse.length > 0) {
            // 若仍有內容，則認定為 else 區塊
            elseCount += 1;
            DO_values["ELSE"] = this.convertBody(orelse);
        }
    }
    
    return block("controls_if", node.lineno, {}, IF_values, {
        "inline": "false"
    }, {
        "@elseif": elseifCount,
        "@else": elseCount
    }, DO_values);
}

/*
 * context_expr: expr_ty
 * optional_vars: expr_ty
 * body: asdl_seq
 */
 //non è implementato
/*
 * With 節點轉換：
 * 處理 with 語句，目前未實作，拋出錯誤。
 */
PythonToBlocks.prototype.With = function(node)
{
    var context_expr = node.context_expr;
    var optional_vars = node.optional_vars;
    var body = node.body;
    throw new Error("With_ not implemented");
}

/*
 * type: expr_ty
 * inst: expr_ty
 * tback: expr_ty
 */
 //non è implementato
/*
 * Raise 節點轉換：
 * 處理 raise 語句，目前未實作，拋出錯誤。
 */
PythonToBlocks.prototype.Raise = function(node)
{
    var type = node.type;
    var inst = node.inst;
    var tback = node.tback;
    throw new Error("Raise not implemented");
}

/*
 * body: asdl_seq
 * handlers: asdl_seq
 * orelse: asdl_seq
 *
 */
 //non è implementato
/*
 * TryExcept 節點轉換：
 * 處理 try-except 結構，目前未實作，拋出錯誤。
 */
PythonToBlocks.prototype.TryExcept = function(node)
{
    var body = node.body;
    var handlers = node.handlers;
    var orelse = node.orelse;
    throw new Error("TryExcept not implemented");
}

/*
 * body: asdl_seq
 * finalbody: asdl_seq
 *
 */
  //non è implementato
/*
 * TryFinally 節點轉換：
 * 處理 try-finally 結構，目前未實作，拋出錯誤。
 */
PythonToBlocks.prototype.TryFinally = function(node)
{
    var body = node.body;
    var finalbody = node.finalbody;
    throw new Error("TryExcept not implemented");
}

/*
 * test: expr_ty
 * msg: expr_ty
 */
  //non è implementato
/*
 * Assert 節點轉換：
 * 處理 assert 語句，目前未實作，拋出錯誤。
 */
PythonToBlocks.prototype.Assert = function(node)
{
    var test = node.test;
    var msg = node.msg;
    throw new Error("Assert not implemented");
}

/*
 * names: asdl_seq
 *
 */
  //funziona ma non crea nessun blocco giustamente
/*
 * Import 節點轉換：
 * 處理 import 語句，在 Blockly 中 import 是隱式處理，故直接返回 null。
 */
PythonToBlocks.prototype.Import = function(node)
{
    var names = node.names;
    // The import statement isn't used in blockly because it happens implicitly
    return null;
}

/*
 * module: identifier
 * names: asdl_seq
 * level: int
 *
 */
  //funziona ma non crea nessun blocco giustamente
/*
 * ImportFrom 節點轉換：
 * 處理從模組中 import 的語句，與 Import 類似，不需要轉換成區塊，因此返回 null。
 */
PythonToBlocks.prototype.ImportFrom = function(node)
{
    var module = node.module;
    var names = node.names;
    var level = node.level;
    // The import statement isn't used in blockly because it happens implicitly
    return null;
}

/*
 * body: expr_ty
 * globals: expr_ty
 * locals: expr_ty
 *
 */
/*
 * Exec 節點轉換：
 * 處理 exec 語句，目前未實作，拋出錯誤。
 */
PythonToBlocks.prototype.Exec = function(node) {
    var body = node.body;
    var globals = node.globals;
    var locals = node.locals;
    throw new Error("Exec not implemented");
}

/*
 * names: asdl_seq
 *
 */
/*
 * Global 節點轉換：
 * 處理 global 宣告，目前未實作，拋出錯誤。
 */
PythonToBlocks.prototype.Global = function(node)
{
    var names = node.names;
    throw new Error("Globals not implemented");
}

/*
 * value: expr_ty
 *
 */
/*
 * Expr 節點轉換：
 * 處理表達式語句，將其 value 轉換成區塊，若結果為陣列則返回第一項，
 * 若處於頂層則以陣列返回，否則建立 raw_empty 區塊來包裝結果。
 */
PythonToBlocks.prototype.Expr = function(node, is_top_level) {
    var value = node.value;
    var converted = this.convert(value);
    if (converted.constructor == Array) {
        return converted[0];
    } else if (is_top_level === true) {
        return [this.convert(value)];
    } else {
        return block("raw_empty", node.lineno, {}, {
            "VALUE": this.convert(value)
        });
    }
}

/*
 * Pass 節點轉換：
 * 處理 pass 語句，本質上無操作，返回 null 表示無輸出區塊。
 */
PythonToBlocks.prototype.Pass = function() {
    return null;
}

/*
 * Break 節點轉換：
 * 處理 break 語句，建立 controls_flow_statements 區塊，FLOW 欄位設定為 "BREAK"。
 */
 //funziona ma non so se serve
PythonToBlocks.prototype.Break = function(node) {
    return block("controls_flow_statements", node.lineno, {
        "FLOW": "BREAK"
    });
}

/*
 * Continue 節點轉換：
 * 處理 continue 語句，建立 controls_flow_statements 區塊，FLOW 欄位設定為 "CONTINUE"。
 */
 //funziona ma non so se serve
PythonToBlocks.prototype.Continue = function(node) {
    return block("controls_flow_statements", node.lineno, {
        "FLOW": "CONTINUE"
    });
}

/*
 * TODO: what does this do?
 * Debugger 節點轉換：
 * 處理 debugger 語句，目前未實作，因此返回 null。
 */
PythonToBlocks.prototype.Debugger = function() {
    return null;
}

// 將布林運算子轉換為對應的 Blockly 運算符字串
PythonToBlocks.prototype.booleanOperator = function(op) {
    switch (op.name) {
        case "And": return "AND";
        case "Or": return "OR";
        default: throw new Error("Operator not supported:"+op.name);
    }
}

/*
 * op: boolop_ty
 * values: asdl_seq
 */
/*
 * BoolOp 節點轉換：
 * 處理布林運算（如 a and b），從第一個運算元開始，依序結合其他運算元，
 * 每次建立一個 logic_operation 區塊，包含運算子和左右運算元，並設定 inline 為 true。
 */
PythonToBlocks.prototype.BoolOp = function(node) {
    var op = node.op;
    var values = node.values;
    // TODO: is there ever a case where it's < 1 values?
    var result_block = this.convert(values[0]);
    for (var i = 1; i < values.length; i+= 1) {
        result_block = block("logic_operation", node.lineno, {
            "OP": this.booleanOperator(op)
        }, {
            "A": result_block,
            "B": this.convert(values[i])
        }, {
            "inline": "true"
        });
    }
    return result_block;
}

// 將數學運算子的名稱轉換為對應 Blockly 運算子字串
PythonToBlocks.prototype.binaryOperator = function(op) {
    switch (op.name) {
        case "Add": return "ADD";
        case "Sub": return "MINUS";
        case "Div": case "FloorDiv": return "DIVIDE";
        case "Mult": return "MULTIPLY";
        case "Pow": return "POWER";
        case "Mod": return "MODULO";
        default: throw new Error("Operator not supported:"+op.name);
    }
}

/*
 * left: expr_ty
 * op: operator_ty
 * right: expr_ty
 */
/*
 * BinOp 節點轉換：
 * 處理二元運算（如 a + b），建立 math_arithmetic 區塊，
 * 使用 binaryOperator 將運算子名稱轉換，並將左右運算元分別轉換後放入 A 與 B 欄位。
 */
PythonToBlocks.prototype.BinOp = function(node)
{
    var left = node.left;
    var op = node.op;
    var right = node.right;
    return block("math_arithmetic", node.lineno, {
        "OP": this.binaryOperator(op) // TODO
    }, {
        "A": this.convert(left),
        "B": this.convert(right)
    }, {
        "inline": true
    });
}

/*
 * op: unaryop_ty
 * operand: expr_ty
 */
 /*
 * UnaryOp 節點轉換：
 * 處理一元運算（如 not a），目前僅支援邏輯否定，若遇其他運算子則拋出錯誤。
 */
PythonToBlocks.prototype.UnaryOp = function(node)
{
    var op = node.op;
    var operand = node.operand;
    if (op.name == "Not") {
        return block("logic_negate", node.lineno, {}, {
            "BOOL": this.convert(operand) 
        }, {
            "inline": "false"
        });
    } else {
        throw new Error("Other unary operators are not implemented yet.");
    }
}

/*
 * args: arguments__ty
 * body: expr_ty
 */
 //non è implementato
/*
 * Lambda 節點轉換：
 * 處理 lambda 表達式，目前尚未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.Lambda = function(node) {
    var args = node.args;
    var body = node.body;
    throw new Error("Lambda functions are not implemented yet.");
}

/*
 * test: expr_ty
 * body: expr_ty
 * orelse: expr_ty
 */
 //non è implementato
/*
 * IfExp 節點轉換：
 * 處理行內 if 表達式（如 a if cond else b），目前尚未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.IfExp = function(node)
{
    var test = node.test;
    var body = node.body;
    var orelse = node.orelse;
    throw new Error("Inline IF expressions are not implemented yet.");
}

/*
 * keys: asdl_seq
 * values: asdl_seq
 */
 //non so se serve a noi
/*
 * Dict 節點轉換：
 * 處理字典表示法，確保所有鍵皆為字串，並將鍵和值分別轉換後儲存，
 * 最後建立 dicts_create_with 區塊，並通過 mutation 標記項目數。
 */
PythonToBlocks.prototype.Dict = function(node) {
    var keys = node.keys;
    var values = node.values;
    
    var keyList = [];
    var valueList = [];
    for (var i = 0; i < keys.length; i+= 1) {
        if (keys[i]._astname != "Str") {
            throw new Error("Dictionary Keys should be Strings.");
        }
        keyList["KEY"+i] = this.Str_value(keys[i]);
        valueList["VALUE"+i] = this.convert(values[i]);
    }
    
    return block("dicts_create_with", node.lineno, keyList, valueList, {
        "inline": "false"
    }, {
        "@items": keys.length
    });
}

/*
 * elts: asdl_seq
 *
 */
/*
 * Set 節點轉換：
 * 處理集合表示法，將所有元素以 convertElements 轉換後建立 set_create 區塊，
 * 並根據元素數量決定 inline 屬性，同時設置 mutation 標記項目數。
 */
PythonToBlocks.prototype.Set = function(node)
{
    var elts = node.elts;
    var ctx = node.ctx;
    
    return block("set_create", node.lineno, {}, 
        this.convertElements("ADD", elts)
    , {
        "inline": elts.length > 3 ? "false" : "true", 
    }, {
        "@items": elts.length
    });
}

/*
 * elt: expr_ty
 * generators: asdl_seq
 */
/*
 * ListComp 節點轉換：
 * 處理列表推導式，目前尚未實作，僅留 TODO 提示。
 */
PythonToBlocks.prototype.ListComp = function(node)
{
    var elt = node.elt;
    var generators = node.generators;
    
    // TODO
}

/*
 * elt: expr_ty
 * generators: asdl_seq
 */
/*
 * SetComp 節點轉換：
 * 處理集合推導式，目前未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.SetComp = function(node)
{
    var elt = node.elt;
    var generators = node.generators;
    throw new Error("Set Comprehensions are not implemented"); 
}

/*
 * key: expr_ty
 * value: expr_ty
 * generators: asdl_seq
 */
/*
 * DictComp 節點轉換：
 * 處理字典推導式，目前未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.DictComp = function(node)
{
    var key = node.key;
    var value = node.value;
    var generators = node.generators;
    throw new Error("Dictionary Comprehensions are not implemented"); 
}

/*
 * elt: expr_ty
 * generators: asdl_seq
 */
/*
 * GeneratorExp 節點轉換：
 * 處理生成器表達式，目前未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.GeneratorExp = function(node) {
    var elt = node.elt;
    var generators = node.generators;
    throw new Error("Generator Expresions are not implemented"); 
}

/*
 * value: expr_ty
 *
 */
/*
 * Yield 節點轉換：
 * 處理 yield 表達式，目前未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.Yield = function(node)
{
    var value = value;
    throw new Error("Yield expression is not implemented");
}


/*
 * 將比較運算符轉換為對應 Blockly 的字串表示
 */
PythonToBlocks.prototype.compareOperator = function(op) {
    
    switch (op.name) {
        case "Eq": return "EQ";
        case "NotEq": return "NEQ";
        case "Lt": return "LT";
        case "Gt": return "GT";
        case "LtE": return "LTE";
        case "GtE": return "GTE";
        case "In_": return "IN";
        case "NotIn": return "NOTIN";
        // Is, IsNot, In, NotIn
        default: throw new Error("Operator not supported:"+op.name);
    }
}

/*
 * left: expr_ty
 * ops: asdl_int_seq
 * asdl_seq: comparators
 */
/*
 * Compare 節點轉換：
 * 處理比較運算（如 a < b），僅支援單一運算子，
 * 若運算子為 In 或 NotIn，建立 logic_isIn 區塊，
 * 否則建立 logic_compare 區塊，並設 inline 為 true。
 */
PythonToBlocks.prototype.Compare = function(node)
{
    //console.log("Compare node:", JSON.stringify(node, null, 2));

    var left = node.left;
    var ops = node.ops;
    var comparators = node.comparators;
    
    if (ops.length != 1) {
        throw new Error("Only one comparison operator is supported");
    } else if (ops[0].name == "In_" || ops[0].name == "NotIn") {
        return block("logic_isIn", node.lineno, {
            "OP": this.compareOperator(ops[0])
        }, {
            "ITEM": this.convert(left),
            "LIST": this.convert(comparators[0])
        }, {
            "inline": "true"
        });
    } else {
        return block("logic_compare", node.lineno, {
            "OP": this.compareOperator(ops[0])
        }, {
            "A": this.convert(left),
            "B": this.convert(comparators[0])
        }, {
            "inline": "true"
        });
    }
    
}

/*
 * 將傳入的股票符號轉換為標準股票名稱，若符號無對應則拋出錯誤。
 */
const convertStockSymbols = function(symbol) {
    switch (symbol) {
        case 'FB': case "Facebook":
            return "Facebook";
        case "AAPL": case "Apple":
            return "Apple";
        case "MSFT": case "Microsoft":
            return "Microsoft";
        case "GOOG": case "Google":
            return "Google";
        default:
            throw new Error("Unknown Stock Symbol.");
    }
}


/*
 * 將字串轉換為標題大小寫，每個單詞首字母大寫，其餘轉為小寫。
 */
const toTitleCase = function(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// 定義已知模組與各模組內函式的對照規則，用於後續模組函式呼叫的轉換
PythonToBlocks.KNOWN_MODULES = {
    "weather": {
        "get_temperature": ["weather_temperature", "CITY"],
        "get_report": ["weather_report", "CITY"],
        "get_forecasts": ["weather_forecasts", "CITY"],
        "get_highs_lows": ["weather_highs_lows", "CITY"],
        "get_all_forecasted_temperatures": ["weather_all_forecasts"],
        "get_forecasted_reports": ["weather_report_forecasts", "CITY"]
    }, 
    "earthquakes": {
        "get": ["earthquake_get", "PROPERTY"],
        "get_both": ["earthquake_both"],
        "get_all": ["earthquake_all"]
    },
    "stocks": {
        "get_current": ["stocks_current", ["TICKER", convertStockSymbols]],
        "get_past": ["stocks_past", ["TICKER", convertStockSymbols]]
    },
    "crime": {
        // STATE = toTitleCase
        "get_property_crimes": ["crime_state", ["STATE", toTitleCase],
                                              ["TYPE", "property"]],
        "get_violent_crimes": ["crime_state",  ["STATE", toTitleCase],
                                              ["TYPE", "violent"]],
        "get_by_year": ["crime_year", "YEAR"],
        "get_all": ["crime_all"]
    },
    "books": {
        "get_all": ["books_get"]
    },
    "plt": {
        "title": ["*plot_title", "TEXT"],
        "xlabel": ["*plot_xlabel", "TEXT"],
        "ylabel": ["*plot_ylabel", "TEXT"],
        "hist": ["*plot_hist", {"type": "variable", "mode": "value", "name": "values"}],
        "scatter": ["*plot_scatter", {"type": "variable", "mode": "value", "name": "x_values"},
                                      {"type": "variable", "mode": "value", "name": "y_values"}],
        "show": ["*plot_show"],
        "legend": ["*plot_legend"]
    }
};

// 定義一些已知的基本函式，將在 Call 節點轉換中做特殊處理
PythonToBlocks.prototype.KNOWN_FUNCTIONS = ["append", "strip", "rstrip", "lstrip"];
// 定義針對 coderbot 平台已知的特定函式
PythonToBlocks.prototype.KNOWN_FUNCTIONS_CODERBOT = ["get_audio", "sleep", "say", "forward", "backward", "left", "right", "move", "turn", "motor_control", "stop", "photo_take", "video_rec", "video_stop", "path_ahead", "find_line", "find_signal", "find_face", "find_color", "get_average", "find_text", "find_qr_code", "find_ar_code", "find_logo", "find_class", "cnn_classify", "get_action", "play", "hear", "speech_recog_google", "get_sonar_distance"];
// 目前未定義的屬性函式集合
PythonToBlocks.KNOWN_ATTR_FUNCTIONS = {};

/*
 * CallAttribute 節點轉換：
 * 處理屬性函式呼叫（例如模組函式調用、物件方法調用）。
 * 根據 func.value 的型別分為：
 *   - 若為 Name 節點：處理模組函式呼叫，利用 KNOWN_MODULES 對照規則或 KNOWN_FUNCTIONS 處理；
 *   - 否則嘗試委派給後續處理。
 */
PythonToBlocks.prototype.CallAttribute = function(func, args, keywords, starargs, kwargs, node) {
    var name = this.identifier(func.attr);
    //console.log("VVVVVVVVVVVVVV"); //COMMENTOPROVA
    //console.log('name: ', name); //COMMENTOPROVA
    //console.log('func.value._astname: ', func.value._astname); //COMMENTOPROVA
    if (func.value._astname == "Name") {
        var module = this.identifier(func.value.id);
        //console.log('module: ', module); //COMMENTOPROVA
        if (module == "plt" && name == "plot") {
            if (args.length == 1) {
                return [block("plot_line", func.lineno, {}, {
                    "y_values": this.convert(args[0])
                }, {"inline": "false"})];
            } else if (args.length == 2) {
                return [block("plot_lineXY", func.lineno, {}, {
                    "x_values": this.convert(args[0]),
                    "y_values": this.convert(args[1])
                }, {"inline": "false"})];
            } else {
                throw new Error("Incorrect number of arguments to plt.plot");
            }
        } else if (module in PythonToBlocks.KNOWN_MODULES && name in PythonToBlocks.KNOWN_MODULES[module]) {
            var definition = PythonToBlocks.KNOWN_MODULES[module][name];
            var blockName = definition[0];
            var isExpression = true;
            if (blockName.charAt(0) == "*") {
                blockName = blockName.slice(1);
                isExpression = false;
            }
            var fields = {};
            var mutations = {};
            var values = {};
            for (var i = 0; i < args.length; i++) {
                var argument = definition[1+i];
                var destination = fields;
                if (typeof argument ==  "string") {
                    fields[argument] = this.Str_value(args[i]);
                } else if (typeof argument == "object") {
                    if (argument.mode == "value") {
                        destination = values;
                    }
                    if (argument.add_mutation !== undefined) {
                        mutations[argument.add_mutation.name] = argument.add_mutation.value;
                    }
                    if (argument.type == 'mutation') {
                        if (argument.index == undefined) {
                            mutations[argument.name] = this.Str_value(args[i]);
                        } else {
                            mutations[argument.name] = this.Str_value(args[argument.index+1]);
                        }
                    } else if (argument.type == "integer") {
                        destination[argument.name] = this.Num_value(args[i]);
                    } else if (argument.type == 'variable') {
                        destination[argument.name] = this.convert(args[i]);
                    } else if (argument.type == "integer_mapper") {
                        // Okay we jumped the shark here
                        var argumentName = argument.name;
                        var argumentMapper = argument.method;
                        destination[argumentName] = argumentMapper(this.Num_value(args[i]));
                    } else if (argument.type == 'mapper') {
                        var argumentName = argument.name;
                        var argumentMapper = argument.method;
                        destination[argumentName] = argumentMapper(this.Str_value(args[i]));
                    }
                } else {
                    var argumentName = argument[0];
                    var argumentMapper = argument[1];
                    fields[argumentName] = argumentMapper(this.Str_value(args[i]));
                }
            }
            for (var i = 1+args.length; i < definition.length; i++) {
                var first = definition[i][0];
                var second = definition[i][1];
                fields[first] = second;
            }
            if (isExpression) {
                var k = block(blockName, func.lineno, fields, values, [], mutations);
                return k;
            } else {
                return [block(blockName, func.lineno, fields, values, [], mutations)];
            }
        }
    } 
    if (this.KNOWN_FUNCTIONS.indexOf(name) > -1) {
        switch (name) {
            case "append":
                if (args.length !== 1) {
                    throw new Error("Incorrect number of arguments to .append");
                }
                // Return as statement
                return [block("lists_append", func.lineno, {}, {
                    "ITEM": this.convert(args[0]),
                    "LIST": this.convert(func.value)
                }, {
                    "inline": "true"
                })];
            case "strip":
                return block("text_trim", func.lineno, { "MODE": "BOTH" }, 
                    { "TEXT": this.convert(func.value) });
            case "lstrip":
                return block("text_trim", func.lineno, { "MODE": "LEFT" }, 
                    { "TEXT": this.convert(func.value) });
            case "rstrip":
                return block("text_trim", func.lineno, { "MODE": "RIGHT" }, 
                    { "TEXT": this.convert(func.value) });
            default: throw new Error("Unknown function call!");
        }

    //SE NON COMMENTO QUESTO IL BLOCCO move.forward() ENTRA QUA E NON SO PERCHE'
    /*} else if (name in PythonToBlocks.KNOWN_ATTR_FUNCTIONS) {
        return PythonToBlocks.KNOWN_ATTR_FUNCTIONS[name].bind(this)(func, args, keywords, starargs, kwargs, node)
    */
    ///AGGIUNTO IO///
    }else if(this.KNOWN_FUNCTIONS_CODERBOT.indexOf(name) > -1) {
        var name = this.identifier(func.attr);
        //console.log("CCCCCCCCCCC"); //COMMENTOPROVA
        //console.log('name: ', name); //COMMENTOPROVA
        //console.log('func.value._astname: ', func.value._astname); //COMMENTOPROVA
        if (func.value._astname == "Call") {
            //var module = this.identifier(func.value.id);
            //console.log('func.value.id: ', func.value.id);
            //VERIFICARE CHE MODULE E' UGUALE A Commands
            //if (module == "plt" && name == "plot") {
            if(name == "say") {
                if (args.length == 1 && keywords.length == 1) {
                    if(keywords[0].value.s.v === "en" || keywords[0].value.s.v === "it" || keywords[0].value.s.v === "fr" || keywords[0].value.s.v === "es") {
                        return [block("coderbot_audio_say", func.lineno, {"LOCALE": keywords[0].value.s.v}, {"TEXT": this.convert(args[0])}, {})]; //in teoria le keyword sono giuste ma non funzionano, la parte text sembra funzionare bene                   
                    } else {
                        throw new Error("Incorrect value of variable locale");                    
                    }
                } else {
                    throw new Error("Incorrect number of arguments to say()");
                }

            }else if (name == "sleep") {
                if (args.length == 1) {
                    if(args[0]._astname === "Num"){
                        return [block("coderbot_sleep", func.lineno, {}, {"ELAPSE": this.convert(args[0])})]; //non so se NUM va bene o devo assegnarlo a delle variabili. ATTENZIONE: SECONDO ME '' MESSI DI DEFAULT NON VANNO BENE. ALTRIMENTI DA ERRORE SE NON VIENE INSERITO UN VALORE
                    } else {
                        throw new Error("The type of variable elapse is not a number");
                    }
                } else {
                    throw new Error("Incorrect number of arguments to sleep()");
                }

            }else if(name == "forward" || name == "backward" || name == "left" || name == "right") {
                if (args.lenght == 0 && keywords.length == 2) {
                    if(keywords[0].value._astname === "Num" && keywords[1].value._astname === "Num"){
                        return [block("coderbot_adv_move", func.lineno, {"ACTION": name}, {"SPEED": this.convert(keywords[0].value), "ELAPSE": this.convert(keywords[1].value)})];
                    } else {
                        throw new Error("The variable speed or elapse is not a number");
                    }
                } else {
                    throw new Error("Incorrect number of arguments to forward()");
                }

            }else if(name == "move") {
                if (args.lenght == 0 && keywords.length ==1) {
                    if(keywords[0].value._astname === "Num") {
                        return [block("coderbot_motion_move", func.lineno, {}, {"DIST": this.convert(keywords[0].value)})];
                    } else {
                        throw new Error("The variable move is not a number");
                    }        
                } else {
                    throw new Error("Incorrect number of arguments to move()");
                }

            }else if(name == "turn") {
                if (args.lenght == 0 && keywords.length ==1) {
                    if(keywords[0].value._astname === "Num") {
                        return [block("coderbot_motion_turn", func.lineno, {}, {"ANGLE": this.convert(keywords[0].value)})];
                    } else {
                        throw new Error("The variable angle is not a number");
                    }
                } else {
                    throw new Error("Incorrect number of arguments to turn()");
                }

            }else if(name == "motor_control") {
                if (args.lenght == 0 && keywords.length ==5) {
                    if(keywords[0].value._astname === "Num" && keywords[1].value._astname === "Num" && keywords[2].value._astname === "Num" && keywords[3].value._astname === "Num" && keywords[4].value._astname === "Num") {
                        return [block("coderbot_adv_motor", func.lineno, {}, {"SPEED_LEFT": this.convert(keywords[0].value), "SPEED_RIGHT": this.convert(keywords[1].value), "ELAPSE": this.convert(keywords[2].value), "STEPS_LEFT": this.convert(keywords[3].value), "STEPS_RIGHT": this.convert(keywords[4].value)})];
                    } else {
                        throw new Error("The variable speed_left or speed_right or elapse or steps_left or steps_right is not a number");
                    }
                } else {
                    throw new Error("Incorrect number of arguments to motor_control()");
                }

            }else if(name == "stop") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_adv_stop", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to stop()");
                }
                
            }else if(name == "photo_take") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_camera_photoTake", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to photo_take()");
                }

            }else if(name == "video_rec") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_camera_videoRec", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to video_rec()");
                }

            }else if(name == "video_stop") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_camera_videoStop", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to video_stop()");
                }

            }else if(name == "path_ahead") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_adv_pathAhead", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to path_ahead()");
                }

            }else if(name == "find_line") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_adv_findLine", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to find_line()");
                }

            }else if(name == "find_signal") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_adv_findSignal", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to find_signal()");
                }

            //SOLO NEL CASO CHE NON SI METTE IL VALORE [] ALTRIMENTI VEDI Subscript
            }else if(name == "find_face") {
                if (args.length == 0 && keywords.length ==0) {
                    //if(keywords[1].value._astname === "Str" && keywords[0].value.s.v === "alpha" || keywords[0].value.s.v === "num" || keywords[0].value.s.v === "alphanum" || keywords[0].value.s.v === "unspec") {
                        return [block("coderbot_adv_findFace", func.lineno, {"RETVAL" : "ALL"})];
                    /*} else {
                        throw new Error("The variable accept have an incorrect value");
                    }*/
                } else {
                    throw new Error("Incorrect number of arguments to find_face()");
                }

            //SOLO NEL CASO CHE NON SI METTE IL VALORE [] ALTRIMENTI VEDI Subscript
            }else if(name == "find_color") {
                if (args.length == 1 && keywords.length ==0) {
                    //if(keywords[1].value._astname === "Str" && keywords[0].value.s.v === "alpha" || keywords[0].value.s.v === "num" || keywords[0].value.s.v === "alphanum" || keywords[0].value.s.v === "unspec") {
                        return [block("coderbot_adv_findColor", func.lineno, {"RETVAL" : "BOTH"}, {"COLOR" : this.convert(args[0])})];
                    /*} else {
                        throw new Error("The variable accept have an incorrect value");
                    }*/
                } else {
                    throw new Error("Incorrect number of arguments to find_color()");
                }

            }else if(name == "get_average") {
                if (args.length == 0 && keywords.length ==0) {
                    //if(keywords[1].value._astname === "Str" && keywords[0].value.s.v === "alpha" || keywords[0].value.s.v === "num" || keywords[0].value.s.v === "alphanum" || keywords[0].value.s.v === "unspec") {
                        return [block("coderbot_cam_average", func.lineno, {"RETVAL" : "ALL"})];
                    /*} else {
                        throw new Error("The variable accept have an incorrect value");
                    }*/
                } else {
                    throw new Error("Incorrect number of arguments to get_average()");
                }

            }else if(name == "find_text") {
                //console.log("keywords[1]: " ,keywords[1])
                if (args.length == 0 && keywords.length ==2) {
                    if(keywords[1].value._astname === "Str" && keywords[0].value.s.v === "alpha" || keywords[0].value.s.v === "num" || keywords[0].value.s.v === "alphanum" || keywords[0].value.s.v === "unspec") {
                        return [block("coderbot_adv_findText", func.lineno, {"ACCEPT": keywords[0].value.s.v}, {"COLOR": this.convert(keywords[1].value)})];
                    } else {
                        throw new Error("The variable accept have an incorrect value");
                    }
                } else {
                    throw new Error("Incorrect number of arguments to find_text()");
                }

            }else if(name == "find_qr_code") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_adv_findQRCode", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to find_qr_code()");
                }

            }else if(name == "find_ar_code") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_adv_findARCode", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to find_ar_code()");
                }

            }else if(name == "find_logo") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_adv_findLogo", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to find_logo()");
                }

            }else if(name == "find_class") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_adv_find_class", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to find_class()");
                }

            }else if(name == "cnn_classify") {
                if(args.length == 0 && keywords.length == 0) {
                    return [block("coderbot_adv_cnn_classify", func.lineno, {})];
                } else {
                    throw new Error("Incorrect number of arguments to cnn_classify()");
                }

            }else if(name == "get_action") {
                if(args.length == 0 && keywords.length == 2) {
                    if(keywords[1].value.s.v === "en" || keywords[1].value.s.v === "it" || keywords[1].value.s.v === "fr" || keywords[1].value.s.v === "es") {
                        return [block("coderbot_conv_get_action", func.lineno, {"locale" : keywords[1].value.s.v}, {"query" : this.convert(keywords[0].value)})];
                    } else {
                        throw new Error("Incorrect value of variable locale");                    
                    }
                } else {
                    throw new Error("Incorrect number of arguments to get_action()");
                }

            }else if(name == "play") {
                if(args.length == 1 && keywords.length == 0) {
                    return [block("coderbot_audio_play", func.lineno, {}, {"FILENAME": this.convert(args[0])})];
                } else {
                    throw new Error("Incorrect number of arguments to play()");
                }

            }else if(name == "hear") {
                if (args.length == 0 && keywords.length == 2) {
                    if(keywords[0].value._astname === "Num" && keywords[1].value._astname === "Num") {
                        return [block("coderbot_audio_hear", func.lineno, {}, {"LEVEL": this.convert(keywords[0].value), "ELAPSE": this.convert(keywords[1].value)})];
                    } else {
                        throw new Error("The variable level or elapse is not a number");
                    }
                } else {
                    throw new Error("Incorrect number of arguments to motor_control()");
                }

            }else if(name == "speech_recog_google") {
                if (args.length == 0 && keywords.length == 1) {
                    if(keywords[0].value.s.v === "en-US" || keywords[0].value.s.v === "it-IT" || keywords[0].value.s.v === "fr-FR" || keywords[0].value.s.v === "es-ES") {
                        return [block("coderbot_audio_listen", func.lineno, {"MODEL": keywords[0].value.s.v})];
                    } else {
                        throw new Error("The variable model have incorrect value");
                    }
                } else {
                    throw new Error("Incorrect number of arguments to speech_recog_google()");
                }

            }else if(name == "get_sonar_distance") {
                if (args.length == 1 && keywords.length == 0) {
                    if (args[0].n.v === "0" || args[0].n.v === "1" || args[0].n.v === "2") {
                        return [block("coderbot_sonar_get_distance", func.lineno, {"SONAR": args[0].n.v})];
                    } else {
                        throw new Error("The variable model have incorrect value");
                    }
                } else {
                    throw new Error("Incorrect number of arguments to get_sonar_distance()");
                }
            }/*NON FUNZIONA (RICORDA DI METTERE IL NAME NELLA LISTA SE VUOI PROVARE)
            else if(name == "register_event_generator") {
                return [block("coderbot_event_generator", func.lineno, {}, {}, {}, {}, {"generator_statements": args[0]})];

            }*/ 

        }

    ///FINE AGGIUNTO IO////
    }else {
		// 預設處理：若無法歸類的函式呼叫，嘗試從原始程式碼擷取函式調用表示
        //console.log('name func: ', name);
        //console.log("ENTRA NELL'ELSE");
        heights = this.getChunkHeights(node);
        extractedSource = this.getSourceCode(arrayMin(heights), arrayMax(heights));
        var col_endoffset = node.col_endoffset;
        if (args.length > 0) {
            for (var i = 0; i < args.length; i+= 1) {
                col_endoffset = args[i].col_endoffset;
            }
        } else {
            col_endoffset += 2;
            expressionCall += "()";
        }
        var expressionCall = extractedSource.slice(node.col_offset, 1+col_endoffset);
        //console.log(node, extractedSource, node.col_offset, node.col_endoffset);
        var lineno = node.lineno;
        //console.error(e);
        //return raw_expression(expressionCall, lineno);
        
        var argumentsNormal = {};
        var argumentsMutation = {"@name": name};
        for (var i = 0; i < args.length; i+= 1) {
            argumentsNormal["ARG"+i] = this.convert(args[i]);
            argumentsMutation["*"+i] = this.convert(args[i]);
        }
        var methodCall = block("procedures_callreturn", node.lineno, {
        }, argumentsNormal, {
            "inline": "true"
        }, argumentsMutation);
        
        return block("attribute_access", node.lineno, {}, {
            "MODULE": this.convert(func.value),
            "NAME": methodCall
        }, { "inline": "true"}, {});
    }
}

/*
 * func: expr_ty
 * args: asdl_seq
 * keywords: asdl_seq
 * starargs: expr_ty
 * kwargs: expr_ty
 *
 */
/*
 * Call 節點轉換：
 * 處理一般函式呼叫節點，根據呼叫的型態（Name 或 Attribute）分別處理。
 * 若為 Name，則依據函式名稱（例如 print、input、abs 等）進行特殊轉換；若未對應，
 * 則處理位置參數與關鍵字參數後建立 procedures_callreturn 區塊。
 * 若為 Attribute，則委派給 CallAttribute 處理。
 */
PythonToBlocks.prototype.Call = function(node) {
    var func = node.func;
    var args = node.args;
    var keywords = node.keywords;
    var starargs = node.starargs;
    var kwargs = node.kwargs;

    //console.log("nodeCall:", node); //COMMENTOPROVA
    //console.log("Keywords: ", keywords);
    //console.log("Keywords[0]: ", keywords[0]);
    //console.log("Keywords[0].value: ", keywords[0].value);
    //console.log("Keywords[0].value.s: ", keywords[0].value.s);
    //console.log("Keywords[0].value.s.v: ", keywords[0].value.s.v);


    
    switch (func._astname) {
        case "Name":
            switch (this.identifier(func.id)) {
                case "print":
                    if (args.length == 1) {
                        return [block("text_print", node.lineno, {}, {
                            "TEXT": this.convert(args[0])})];
                    } else {
                        return [block("text_print_multiple", node.lineno, {}, 
                            this.convertElements("PRINT", args), 
                            {"inline": "true"
                            }, { "@items": args.length})];
                    }
                case "input":
                    return block("text_input", node.lineno, {"MESSAGE": args.length ? this.Str_value(args[0]) :""});
                case "abs":
                    return block("math_single", node.lineno, {"OP": "ABS"}, {"NUM": this.convert(args[0])})
                case "round":
                    return block("math_round", node.lineno, {"OP": "ROUND"}, {"NUM": this.convert(args[0])})
                case "ceil":
                    return block("math_round", node.lineno, {"OP": "ROUNDUP"}, {"NUM": this.convert(args[0])})
                case "floor":
                    return block("math_round", node.lineno, {"OP": "ROUNDDOWN"}, {"NUM": this.convert(args[0])})
                case "sum":
                    return block("math_on_list", node.lineno, {"OP": "SUM"}, {"LIST": this.convert(args[0])})
                case "min":
                    return block("math_on_list", node.lineno, {"OP": "MIN"}, {"LIST": this.convert(args[0])})
                case "max":
                    return block("math_on_list", node.lineno, {"OP": "MAX"}, {"LIST": this.convert(args[0])})
                case "len":
                    return block("lists_length", node.lineno, {}, {"VALUE": this.convert(args[0])})
                case "xrange":
                    return block("procedures_callreturn", node.lineno, {}, 
                        {"ARG0": this.convert(args[0])},
                        {"inline": "true"}, 
                        {"@name": "xrange",
                         "": this.convert(args[0])})
                default:
                    //console.log("PRIMOOOO");
                    if (starargs !== null && starargs.length > 0) {
                        throw new Error("*args (variable arguments) are not implemented yet.");
                    } else if (kwargs !== null && kwargs.length > 0) {
                        throw new Error("**args (keyword arguments) are not implemented yet.");
                    }
                    var argumentsNormal = {};
                    var argumentsMutation = {"@name": this.identifier(func.id)};
                    for (var i = 0; i < args.length; i+= 1) {
                        argumentsNormal["ARG"+i] = this.convert(args[i]);
                        argumentsMutation["*"+i] = this.convert(args[i]);
                    }
                    return block("procedures_callreturn", node.lineno, {}, argumentsNormal, {
                        "inline": "true"
                    }, argumentsMutation);
            }
        // Direct function call
        case "Attribute":
        // Module function call
        // 若呼叫為屬性形式，則呼叫 CallAttribute 處理
            return this.CallAttribute(func, args, keywords, starargs, kwargs, node);
    }
}

/*
 * value: expr_ty
 *
 */
/*
 * Repr 節點轉換：
 * 處理 repr() 函式，目前未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.Repr = function(node)
{
    var value = node.value;
    throw new Error("Repr is not yet implemented");
}

/*
 * n: object
 *
 */
/*
 * Num 節點轉換：
 * 處理數字常數，建立 math_number 區塊，NUM 欄位為轉換後的數值。
 */
PythonToBlocks.prototype.Num = function(node)
{
    var n = node.n;
    return block("math_number", node.lineno, {"NUM": Sk.ffi.remapToJs(n)});
}
PythonToBlocks.prototype.Num_value = function(node)
{
    var n = node.n;
    return Sk.ffi.remapToJs(n);
}

/*
 * s: string
 *
 */
 /*
 * Str 節點轉換：
 * 處理字串常數，如果字串包含換行則建立 string_multiline 區塊，
 * 否則建立普通 text 區塊。
 */
PythonToBlocks.prototype.Str = function(node)
{
    var s = node.s;
    var strValue = Sk.ffi.remapToJs(s);
    //console.log("strValue: ", strValue); //COMMENTOPROVA
    if (strValue.split("\n").length > 1) {
        return block("string_multiline", node.lineno, {"TEXT": strValue});
    } else {
        return block("text", node.lineno, {"TEXT": strValue});
    }
}
PythonToBlocks.prototype.Str_value = function(node) {
    var s = node.s;
    return Sk.ffi.remapToJs(s);
}

/*
 * value: expr_ty
 * attr: identifier
 * ctx: expr_context_ty
 *
 */
/*
 * Attribute 節點轉換：
 * 處理屬性存取（例如 a.b），將 a 的轉換結果放入 MODULE 欄位，
 * b 的轉換結果放入 NAME 欄位，組合成 attribute_access 區塊。
 */
PythonToBlocks.prototype.Attribute = function(node)
{
    var value = node.value;
    var attr = node.attr;
    var ctx = node.ctx;
    
    //console.log(node); //COMMENTOPROVA
    
    return block("attribute_access", node.lineno, {
        "MODULE": this.convert(value),
        "NAME": this.convert(attr)
    });
    
    //throw new Error("Attribute access not implemented");
}

//MY FUNCTION FOR CONVERT NUMBER IN X, Y, SIZE
/*
 * convertRetvalFindFace：
 * 將數字 0、1、2 分別轉換為 "X", "Y", "SIZE"，
 * 用於 find_face 函式的返回值映射。
 */
function convertRetvalFindFace(num) {
    //console.log("NUMEROOOOOOOOO: ", num); //COMMENTOPROVA
    switch (num) {
        case 0:
            return "X";
        case 1:
            return "Y";
        case 2:
            return "SIZE";
        default:
            throw new Error("Unknown Number.");
    }
}

//MY FUNCTION FOR CONVERT NUMBER IN DIST, ANGLE
/*
 * convertRetvalFindColor：
 * 將數字 0 與 1 分別轉換為 "DIST" 與 "ANGLE"，
 * 用於 find_color 函式的返回值映射。
 */
function convertRetvalFindColor(num) {
    //console.log("NUMEROOOOOOOOO: ", num); //COMMENTOPROVA
    switch (num) {
        case 0:
            return "DIST";
        case 1:
            return "ANGLE";
        default:
            throw new Error("Unknown Number.");
    }
}

//MY FUNCTION FOR CONVERT NUMBER IN DIST, ANGLE
/*
 * convertRetvalGetAverage：
 * 將數字 0、1、2 分別對應到 "H", "S", "V"，
 * 用於 get_average 函式返回值的映射。
 */
function convertRetvalGetAverage(num) {
    //console.log("NUMEROOOOOOOOO: ", num); //COMMENTOPROVA
    switch (num) {
        case 0:
            return "H";
        case 1:
            return "S";
        case 2:
            return "V";
        default:
            throw new Error("Unknown Number.");
    }
}

/*
 * value: expr_ty
 * slice: slice_ty
 * ctx: expr_context_ty
 *
 */
/*
 * Subscript 節點轉換：
 * 處理索引或切片語句，例如取列表或字典中的特定元素。
 * 若 slice 為 Index 且為字串，建立 dict_get_literal 區塊；
 * 若為數字，根據具體情形（如 find_face, find_color, get_average）返回對應區塊，
 * 否則預設為列表索引處理。
 * 若 slice 為 Slice（切片形式），建立 lists_getSublist 區塊。
 */
PythonToBlocks.prototype.Subscript = function(node)
{
    var value = node.value;
    var slice = node.slice;
    var ctx = node.ctx;
    
    if (slice._astname == "Index") {
        if (slice.value._astname == "Str") {
            return block("dict_get_literal", node.lineno, {
                "ITEM": this.Str_value(slice.value)
            }, {
                "DICT": this.convert(value)
            });
        } else if (slice.value._astname == "Num") {
            if(value.func.attr.v == "find_face") {
                return block("coderbot_adv_findFace", node.lineno, {"RETVAL" : convertRetvalFindFace(slice.value.n.v)});

            } else if(value.func.attr.v == "find_color") {
                return block("coderbot_adv_findColor", node.lineno, {"RETVAL" : convertRetvalFindColor(slice.value.n.v)}, {"COLOR" : this.convert(value.args[0])});

            } else if(value.func.attr.v == "get_average") {
                return block("coderbot_cam_average", node.lineno, {"RETVAL" : convertRetvalGetAverage(slice.value.n.v)});

            }else { //FORSE QUESTO E' UN ELSE IF E ELSE E' RAW_BLOCK

                return block("lists_index", node.lineno, {}, {
                    "ITEM": this.convert(slice.value),
                    "LIST": this.convert(value),
                });
            }
        }
    } else if (slice._astname == "Slice") {
        return block("lists_getSublist", node.lineno, {
            "WHERE1": "FROM_START",
            "WHERE2": "FROM_START"
        }, {
            "LIST": this.convert(value),
            "AT1": (slice.lower == null) ? 
                    null : this.convert(slice.lower),
            "AT2": (slice.upper == null) ?
                    null : this.convert(slice.upper),
        }, {}, {
            "@at1": "true", 
            "@at2": "true", 
        });
    }
    
    throw new Error("This kind of subscript is not supported.");
}

/*
 * id: identifier
 * ctx: expr_context_ty
 */
/*
 * Name 節點轉換：
 * 處理變數或標識符，例如變數名稱，
 * 若名稱為 "True", "False" 或 "None"，則建立對應的邏輯常數區塊，
 * 若為 "___" 則返回 null，否則建立 variables_get 區塊，VAR 欄位放轉換後的名稱值。
 */
PythonToBlocks.prototype.Name = function(node)
{
    var id = node.id;
    var ctx = node.ctx;
    switch (this.Name_str(node)) {
        case "True":
            return block("logic_boolean", node.lineno, {"BOOL": "TRUE"});
        case "False":
            return block("logic_boolean", node.lineno, {"BOOL": "FALSE"});
        case "None":
            return block("logic_null", node.lineno);
        case "___":
            return null;
        default:
            return block('variables_get', node.lineno, {
                "VAR": this.identifier(id)
            });
    }
}

/*
 * id: identifier
 * ctx: expr_context_ty
 */
/*
 * Name_str 輔助函式：
 * 將 Name 節點的 id 轉換成字串，利用 identifier 方法完成轉換。
 */
PythonToBlocks.prototype.Name_str = function(node)
{
    var id = node.id;
    var ctx = node.ctx;
    return this.identifier(id);
}

/*
 * convertElements 輔助函式：
 * 將傳入的陣列每個元素轉換後，以 key+index 作為鍵放入一個物件中，
 * 用於列表或元組內的多個子區塊生成。
 */
PythonToBlocks.prototype.convertElements = function(key, values, plusser) {
    if (plusser === undefined) {
        plusser = 0;
    }
    var output = {};
    for (var i = 0; i < values.length; i++) {
        output[key+(plusser+i)] = this.convert(values[i]);
    }
    return output;
}

/*
 * elts: asdl_seq
 * ctx: expr_context_ty
 *
 */
/*
 * List 節點轉換：
 * 處理列表定義，將列表內所有元素轉換後建立 lists_create_with 區塊，
 * inline 屬性根據元素數量決定，並用 mutation 標記項目總數。
 */
PythonToBlocks.prototype.List = function(node) {
    var elts = node.elts;
    var ctx = node.ctx;
    
    return block("lists_create_with", node.lineno, {}, 
        this.convertElements("ADD", elts)
    , {
        "inline": elts.length > 3 ? "false" : "true", 
    }, {
        "@items": elts.length
    });
}

/*
 * elts: asdl_seq
 * ctx: expr_context_ty
 */
/*
 * Tuple 節點轉換：
 * 處理元組定義，類似 List 的處理，但建立的是 tuple_create 區塊，
 * 同樣利用 convertElements 處理所有子元素。
 */
PythonToBlocks.prototype.Tuple = function(node)
{
    var elts = node.elts;
    var ctx = node.ctx;
    
    return block("tuple_create", node.lineno, {}, 
        this.convertElements("ADD", elts)
    , {
        "inline": elts.length > 3 ? "false" : "true", 
    }, {
        "@items": elts.length
    });
}

/*
 * Ellipsis 節點轉換：
 * 處理 ... 省略符，尚未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.Ellipsis = function() {
    throw new Error("Ellipsis not implemented");
}

/*
 * lower: expr_ty
 * upper: expr_ty
 * step: expr_ty
 *
 */
/*
 * Slice 節點轉換：
 * 處理切片表達式，尚未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.Slice = function(node)
{
    var lower = node.lower;
    var upper = node.upper;
    var step = node.step;
    
    throw new Error("Slices not implemented");
}

/*
 * dims: asdl_seq
 *
 */
/*
 * ExtSlice 節點轉換：
 * 處理擴展切片（多重維度），目前未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.ExtSlice = function(node)
{
    var dims = node.dims;
    
    throw new Error("ExtSlice is not implemented.");
}

/*
 * value: expr_ty
 *
 */
/*
 * Index 節點轉換：
 * 處理索引表達式，尚未實作，故拋出錯誤。
 */
PythonToBlocks.prototype.Index = function(value)
{
    var value = node.value;
    
    throw new Error("Index is not implemented");
}

/*
 * target: expr_ty
 * iter: expr_ty
 * ifs: asdl_seq
 *
 */
/*
 * comprehension 節點轉換：
 * 處理生成式中的部分（如 for 表達式），目前未實作，拋出錯誤提示。
 */
PythonToBlocks.prototype.comprehension = function(node)
{
    var target = node.target;
    var iter = node.iter;
    var ifs = node.ifs;
    
    throw new Error("Comprehensions not implemented.");
}

/*
 * type: expr_ty
 * name: expr_ty
 * body: asdl_seq
 *
 */
/*
 * ExceptHandler 節點轉換：
 * 處理 try-except 結構中的 except 區塊，
 * 注意：此區塊目前尚未實作，完整實作需要參考原始檔案內容。
 */
PythonToBlocks.prototype.ExceptHandler = function(node)
{
    // 從 node 中取出 type 屬性，代表 except 中所捕獲的例外型別
    var type = node.type;
    // 從 node 中取出 name 屬性，代表例外綁定的變數名稱（例如: except Exception as e 中的 e）
    var name = node.name;
    // 注意：以下應該取 node.body（except 區塊中的程式碼），但原始程式碼被截斷，這裡使用 node.boy 作為示意
    var body = node.boy; // 這裡可能應為 node.body，但內容被截斷
    
    // 目前未實作 except 處理，故直接拋出錯誤提示
    throw new Error("Except handlers are not implemented"); 
}

/*
 * argument_ 節點轉換：
 * 處理單一函式參數，從參數節點中取得 identifier
 */
PythonToBlocks.prototype.argument_ = function(node) {
    // 從參數節點中取出 id（參數名稱）
    var id = node.id;
    // 呼叫 identifier 方法將 id 轉換為原生 JS 值（如字串）
    return this.identifier(id);
}

/*
 * args: asdl_seq
 * vararg: identifier
 * kwarg: identifier
 * defaults: asdl_seq
 *
 */
/*
 * arguments_ 節點轉換：
 * 處理函式的參數列表，包括位置參數、vararg、kwarg 與預設參數（defaults）
 * 目前僅處理 args (位置參數)，並將每個參數轉換後存入陣列返回
 */
PythonToBlocks.prototype.arguments_ = function(node)
{
    // 從 node 中取得所有位置參數
    var args = node.args;
    // 從 node 中取得 *args 參數（若存在）
    var vararg = node.vararg;
    // 從 node 中取得 **kwargs 參數（若存在）
    var kwarg = node.kwarg;
    // 取得預設參數陣列
    var defaults = node.defaults;
    
    // 建立一個陣列來儲存所有已處理的參數名稱
    var allArgs = [];
    // 遍歷所有位置參數，並用 argument_ 方法轉換
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];                    // 取出第 i 個參數節點
        allArgs.push(this.argument_(arg));      // 將轉換後的參數名稱加入陣列
    }
    // 返回處理完成的參數名稱陣列
    return allArgs;
}

/*
 * arg: identifier
 * value: expr_ty
 *
 */
/*
 * keyword 節點轉換：
 * 處理函式關鍵字參數，參數包括 arg (參數名稱) 與 value (參數值)
 * 目前尚未支援關鍵字參數，故拋出錯誤提示
 */
PythonToBlocks.prototype.keyword = function(node)
{
    // 取得關鍵字參數的名稱
    var arg = node.arg;
    // 取得關鍵字參數的值（作為 AST 節點）
    var value = node.value;
    
    // 由於關鍵字參數尚未支援，因此拋出錯誤
    throw new Error("Keywords are not implemented");
}

/*
 * name: identifier
 * asname: identifier
 *
 */
/*
 * alias 節點轉換：
 * 處理 import 語句中的別名設定，參數包括 name（原名）與 asname（別名）
 * 目前尚未支援別名處理，故拋出錯誤提示
 */
PythonToBlocks.prototype.alias = function(node)
{
    // 取得原始模組/標識符名稱
    var name = node.name;
    // 取得指定的別名（如果有的話）
    var asname = node.asname;
    
    // 目前未支援別名轉換，故拋出錯誤提示
    throw new Error("Aliases are not implemented");
}


/* ----- expr_context ----- */
/*
Load
Store
Del
AugLoad
AugStore
Param
*/


/* ----- operator ----- */
/*
Add
Sub
Mult
Div
Mod
Pow
LShift
RShift
BitOr
BitXor
BitAnd
FloorDiv
*/

/* ----- unaryop ----- */
/*
Invert
Not
UAdd
USub
*/

export { PythonToBlocks, block, raw_block };