import Sk from 'skulpt';
Sk.configure({
  python3: false,
  output: (text) => { console.log("Skulpt output:", text); },
  read: (x) => {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
      throw "File not found: '" + x + "'";
    }
    return Sk.builtinFiles["files"][x];
  },
});

/**
 * PythonToBlocks 轉換器：將 Python 代碼轉換為 Blockly XML。
 * @constructor
 */
function PythonToBlocks() {
    // 內部屬性在轉換時會初始化
}

function xmlToString(xml) {
    return new XMLSerializer().serializeToString(xml);
}

PythonToBlocks.prototype.convertSourceToCodeBlock = function(python_source) {
    var xml = document.createElement("xml");
    xml.appendChild(raw_block(python_source));
    return xmlToString(xml);
};

PythonToBlocks.prototype.convertSource = function(python_source) {
    var xml = document.createElement("xml");
    if (python_source.trim() === "") {
        console.log("TEXTBOX VUOTA");
        return {"xml": xmlToString(xml), "error": null};
    }
    this.source = python_source.split("\n");
    var filename = 'user_code.py';
    var parse, ast, error;
    try {
        parse = Sk.parse(filename, python_source);
        ast = Sk.astFromParse(parse.cst, filename, parse.flags);
    } catch (e) {
        error = e;
        xml.appendChild(raw_block(python_source));
        return {"xml": xmlToString(xml), "error": error};
    }
    this.comments = {};
    for (var commentLocation in parse.comments) {
        var lineColumn = commentLocation.split(",");
        var yLocation = parseInt(lineColumn[0], 10);
        this.comments[yLocation] = parse.comments[commentLocation];
    }
    this.highestLineSeen = 0;
    this.levelIndex = 0;
    this.nextExpectedLine = 0;
    this.measureNode(ast);
    var converted = this.convert(ast);
    if (converted !== null) {
        for (var i = 0; i < converted.length; i++) {
            xml.appendChild(converted[i]);
        }
    }
    return {"xml": xmlToString(xml), "error": null, "lineMap": this.lineMap, "comment": this.comments};
};

PythonToBlocks.prototype.identifier = function(node) {
    return Sk.ffi.remapToJs(node);
};

PythonToBlocks.prototype.recursiveMeasure = function(node, nextBlockLine) {
    if (node === undefined)  {
        return;
    }
    var myNext = nextBlockLine;
    if ("orelse" in node && node.orelse.length > 0) {
        if (node.orelse.length == 1 && node.orelse[0]._astname == "If") {
            myNext = node.orelse[0].lineno - 1;
        } else {
            myNext = node.orelse[0].lineno - 2;
        }
    }
    this.heights.push(nextBlockLine);
    if ("body" in node) {
        for (var i = 0; i < node.body.length; i++) {
            var next;
            if (i + 1 === node.body.length) {
                next = myNext;
            } else {
                next = node.body[i + 1].lineno - 1;
            }
            this.recursiveMeasure(node.body[i], next);
        }
    }
    if ("orelse" in node) {
        for (var i = 0; i < node.orelse.length; i++) {
            var next;
            if (i === node.orelse.length) {
                next = nextBlockLine;
            } else {
                next = 1 + (node.orelse[i].lineno - 1);
            }
            this.recursiveMeasure(node.orelse[i], next);
        }
    }
};

PythonToBlocks.prototype.measureNode = function(node) {
    this.heights = [];
    this.recursiveMeasure(node, this.source.length - 1);
    this.heights.shift();
};

PythonToBlocks.prototype.getSourceCode = function(frm, to) {
    var lines = this.source.slice(frm - 1, to);
    if (lines.length > 0) {
        var indentation = lines[0].search(/\S/);
        for (var i = 0; i < lines.length; i++) {
            lines[i] = lines[i].substring(indentation);
        }
    }
    return lines.join("\n");
};

PythonToBlocks.prototype.convertBody = function(node, is_top_level) {
    this.levelIndex += 1;
    if (node.length === 0) {
        return null;
    }
    var children = [], root = null, current = null;
    function addPeer(peer) {
        if (root === null) {
            children.push(peer);
        } else {
            children.push(root);
        }
        root = peer;
        current = peer;
    }
    function finalizePeers() {
        if (root !== null) {
            children.push(root);
        }
    }
    function nestChild(child) {
        if (root === null) {
            root = child;
            current = child;
        } else if (current === null) {
            root = current;
        } else {
            var nextElement = document.createElement("next");
            nextElement.appendChild(child);
            current.appendChild(nextElement);
            current = child;
        }
    }
    var lineNumberInBody = 0, lineNumberInProgram, previousLineInProgram = null, distance, skipped_line, commentCount, previousHeight = null, previousWasStatement = false, visitedFirstLine = false, wasFirstLine = false;
    for (var i = 0; i < node.length; i++) {
        lineNumberInBody += 1;
        lineNumberInProgram = node[i].lineno;
        distance = 0, wasFirstLine = true;
        if (previousLineInProgram !== null) {
            distance = lineNumberInProgram - previousLineInProgram - 1;
            wasFirstLine = false;
        }
        lineNumberInBody += distance;
        commentCount = 0;
        for (var commentLineInProgram in this.comments) {
            if (commentLineInProgram < lineNumberInProgram) {
                var commentChild = this.Comment(this.comments[commentLineInProgram], commentLineInProgram);
                if (previousLineInProgram === null) {
                    nestChild(commentChild);
                } else {
                    var skipped_previous_line = Math.abs(previousLineInProgram - commentLineInProgram) > 1;
                    if (is_top_level && skipped_previous_line) {
                        addPeer(commentChild);
                    } else {
                        nestChild(commentChild);
                    }
                }
                previousLineInProgram = commentLineInProgram;
                this.highestLineSeen = Math.max(this.highestLineSeen, parseInt(commentLineInProgram, 10));
                distance = lineNumberInProgram - previousLineInProgram;
                delete this.comments[commentLineInProgram];
                commentCount += 1;
            }
        }
        distance = lineNumberInProgram - this.highestLineSeen;
        this.highestLineSeen = Math.max(lineNumberInProgram, this.highestLineSeen);
        var height = this.heights.shift();
        var originalSourceCode = this.getSourceCode(lineNumberInProgram, height);
        var newChild = this.convertStatement(node[i], originalSourceCode, is_top_level);
        if (newChild === null) {
            continue;
        }
        skipped_line = distance > 1;
        previousLineInProgram = lineNumberInProgram;
        previousHeight = height;
        if (is_top_level && newChild.constructor === Array) {
            addPeer(newChild[0]);
        } else if (is_top_level && skipped_line && visitedFirstLine) {
            addPeer(newChild);
        } else if (is_top_level && !previousWasStatement) {
            addPeer(newChild);
        } else {
            nestChild(newChild);
        }
        previousWasStatement = newChild.constructor !== Array;
        visitedFirstLine = true;
    }
    var lastLineNumber = lineNumberInProgram + 1;
    if (lastLineNumber in this.comments) {
        var commentChild = this.Comment(this.comments[lastLineNumber], lastLineNumber);
        nestChild(commentChild);
        delete this.comments[lastLineNumber];
    }
    if (is_top_level) {
        for (var commentLineInProgram in this.comments) {
            var commentChild = this.Comment(this.comments[commentLineInProgram], commentLineInProgram);
            distance = commentLineInProgram - previousLineInProgram;
            if (previousLineInProgram === null) {
                addPeer(commentChild);
            } else if (distance > 1) {
                addPeer(commentChild);
            } else {
                nestChild(commentChild);
            }
            previousLineInProgram = commentLineInProgram;
            delete this.comments[lastLineInProgram];
        }
    }
    finalizePeers();
    this.levelIndex -= 1;
    return children;
};

function block(type, lineNumber, fields, values, settings, mutations, statements) {
    var newBlock = document.createElement("block");
    newBlock.setAttribute("type", type);
    newBlock.setAttribute("line_number", lineNumber);
    for (var setting in settings) {
        var settingValue = settings[setting];
        newBlock.setAttribute(setting, settingValue);
    }
    if (mutations !== undefined && Object.keys(mutations).length > 0) {
        var newMutation = document.createElement("mutation");
        for (var mutation in mutations) {
            var mutationValue = mutations[mutation];
            if (mutation.charAt(0) === '@') {
                newMutation.setAttribute(mutation.substr(1), mutationValue);
            } else if (mutationValue !== null && mutationValue.constructor === Array) {
                for (var i = 0; i < mutationValue.length; i++) {
                    var mutationNode = document.createElement(mutation);
                    mutationNode.setAttribute("name", mutationValue[i]);
                    newMutation.appendChild(mutationNode);
                }
            } else {
                var mutationNode = document.createElement("arg");
                if (mutation.charAt(0) === '*') {
                    mutationNode.setAttribute("name", "");
                } else {
                    mutationNode.setAttribute("name", mutation);
                }
                if (mutationValue !== null) {
                    mutationNode.appendChild(mutationValue);
                }
                newMutation.appendChild(mutationNode);
            }
        }
        newBlock.appendChild(newMutation);
    }
    for (var field in fields) {
        var fieldValue = fields[field];
        var newField = document.createElement("field");
        newField.setAttribute("name", field);
        newField.appendChild(document.createTextNode(fieldValue));
        newBlock.appendChild(newField);
    }
    for (var value in values) {
        var valueValue = values[value];
        var newValue = document.createElement("value");
        if (valueValue !== null) {
            newValue.setAttribute("name", value);
            newValue.appendChild(valueValue);
            newBlock.appendChild(newValue);
        }
    }
    if (statements !== undefined && Object.keys(statements).length > 0) {
        for (var statement in statements) {
            var statementValue = statements[statement];
            if (statementValue === null) continue;
            for (var i = 0; i < statementValue.length; i++) {
                var newStatement = document.createElement("statement");
                newStatement.setAttribute("name", statement);
                newStatement.appendChild(statementValue[i]);
                newBlock.appendChild(newStatement);
            }
        }
    }
    return newBlock;
}

function raw_block(txt) {
    return block("raw_block", 0, { "TEXT": txt });
}

function raw_expression(txt, lineno) {
    return block("raw_expression", lineno, { "TEXT": txt });
}

// 修改 convert：若找不到對應轉換器，則嘗試 fallback；若遇到 "Call" 節點，直接使用 raw_expression 回傳原始表示
PythonToBlocks.prototype.convert = function(node, is_top_level) {
    var nodeType = node._astname;
    var converterFunc = this[nodeType];
    if (typeof converterFunc !== 'function') {
      var altName = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
      converterFunc = this[altName];
    }
    if (typeof converterFunc !== 'function') {
        if (nodeType === "Call") {
            var source = this.getSourceCode(node.lineno, node.col_endoffset || (node.lineno + 1));
            return raw_expression(source, node.lineno);
        }
        throw new Error("No converter implemented for node type: " + nodeType);
    }
    return converterFunc.call(this, node, is_top_level);
};

function arrayMax(array) {
  return array.reduce(function(a, b) {
    return Math.max(a, b);
  });
}

function arrayMin(array) {
  return array.reduce(function(a, b) {
    return Math.min(a, b);
  });
}

PythonToBlocks.prototype.convertStatement = function(node, full_source, is_top_level) {
    try {
        return this.convert(node, is_top_level);
    } catch (e) {
        var heights = this.getChunkHeights(node);
        var extractedSource = this.getSourceCode(arrayMin(heights), arrayMax(heights));
        console.error(e);
        return raw_block(extractedSource);
    }
};

PythonToBlocks.prototype.getChunkHeights = function(node) {
    var lineNumbers = [];
    if (node.hasOwnProperty("lineno")) {
        lineNumbers.push(node.lineno);
    }
    if (node.hasOwnProperty("body")) {
        for (var i = 0; i < node.body.length; i++) {
            var subnode = node.body[i];
            lineNumbers = lineNumbers.concat(this.getChunkHeights(subnode));
        }
    }
    if (node.hasOwnProperty("orelse")) {
        for (var i = 0; i < node.orelse.length; i++) {
            var subnode = node.orelse[i];
            lineNumbers = lineNumbers.concat(this.getChunkHeights(subnode));
        }
    }
    return lineNumbers;
};

/*
 * Comment 節點轉換：轉換註解（去除首字元）為 comment_single 區塊
 */
PythonToBlocks.prototype.Comment = function(txt, lineno) {
    return block("comment_single", lineno, { "BODY": txt.slice(1) }, {}, {}, {}, {});
};

/*
 * Module 節點轉換：將 Module 節點的 body 傳入 convertBody 轉換為頂層積木
 */
PythonToBlocks.prototype.Module = function(node) {
    return this.convertBody(node.body, true);
};

/*
 * Expr 節點轉換：將 Expr 節點轉換為其 value 的結果，若處於頂層則以陣列返回，否則包裝於 raw_empty 區塊中
 */
PythonToBlocks.prototype.Expr = function(node, is_top_level) {
    var value = node.value;
    var converted = this.convert(value, is_top_level);
    if (Array.isArray(converted)) {
      return converted[0];
    } else if (is_top_level === true) {
      return [converted];
    } else {
      return block("raw_empty", node.lineno, {}, { "VALUE": converted });
    }
};

/*
 * Name 節點轉換：處理變數名稱，特殊關鍵字則轉換為邏輯常數區塊，否則使用 variables_get 區塊。
 */
PythonToBlocks.prototype.Name = function(node, is_top_level) {
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
            return block("variables_get", node.lineno, { "VAR": this.identifier(id) });
    }
};

PythonToBlocks.prototype.Name_str = function(node) {
    var id = node.id;
    var ctx = node.ctx;
    return this.identifier(id);
};

PythonToBlocks.prototype.Call = function(node, is_top_level) {
    // 檢查是否為 print() 函數呼叫
    if (node.func && node.func._astname === "Name" && node.func.id === "print") {
        // 如果只有一個參數，產生 text_print 積木塊；多個參數可參考 text_print_multiple
        if (node.args.length === 1) {
            return block("text_print", node.lineno, {}, {
                "TEXT": this.convert(node.args[0])
            });
        } else {
            return block("text_print_multiple", node.lineno, {}, this.convertElements("PRINT", node.args), {
                "inline": "true"
            }, {
                "@items": node.args.length
            });
        }
    }
    // 如果不是 print() 呼叫，則使用預設的處理方式
    var source = this.getSourceCode(node.lineno, node.col_endoffset || (node.lineno + 1));
    return raw_expression(source, node.lineno);
};


/*
 * Print 節點轉換：若只有一項輸出，使用 text_print 區塊；否則使用 text_print_multiple 區塊。
 */
PythonToBlocks.prototype.Print = function(node) {
    var dest = node.dest;
    var values = node.values;
    var nl = node.nl;
    if (values.length === 1) {
        return block("text_print", node.lineno, {}, { "TEXT": this.convert(values[0]) });
    } else {
        return block("text_print_multiple", node.lineno, {}, 
            this.convertElements("PRINT", values), 
            { "inline": "true" },
            { "@items": values.length }
        );
    }
};

/*
 * If 節點轉換：將 if-elif-else 結構轉換成 controls_if_better 區塊
 */
PythonToBlocks.prototype.If = function(node) {
    var test = node.test;
    var body = node.body;
    var orelse = node.orelse;
    var IF_values = { "IF0": this.convert(test) };
    var DO_values = { "DO0": this.convertBody(body) };
    var elseifCount = 0;
    var elseCount = 0;
    if (orelse !== undefined) {
        if (orelse.length === 1 && orelse[0]._astname === "If") {
            while (orelse.length === 1 && orelse[0]._astname === "If") {
                this.heights.shift();
                elseifCount += 1;
                body = orelse[0].body;
                test = orelse[0].test;
                orelse = orelse[0].orelse;
                DO_values["DO" + elseifCount] = this.convertBody(body, false);
                if (test !== undefined) {
                    console.log("IF INNESTATO METODO IF");
                    IF_values["IF" + elseifCount] = this.convert(test);
                }
            }
        }
        if (orelse !== undefined && orelse.length > 0) {
            elseCount += 1;
            DO_values["ELSE"] = this.convertBody(orelse);
        }
    }
    return block("controls_if_better", node.lineno, {}, IF_values, { "inline": "false" }, { "@elseif": elseifCount, "@else": elseCount }, DO_values);
};

export { PythonToBlocks };
