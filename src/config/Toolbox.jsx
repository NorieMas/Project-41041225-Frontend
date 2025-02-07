const Toolbox = {
    kind: "categoryToolbox",
    contents: [
        {
            kind: "category",
            name: "邏輯",
            categorystyle: "logic_category",
            contents: [
                { kind: "block", type: "controls_if" },
                { kind: "block", type: "logic_compare" },
                { kind: "block", type: "logic_operation" },
                { kind: "block", type: "logic_negate" },
                { kind: "block", type: "logic_boolean" },
//                { kind: "block", type: "logic_null", disabled: "true" },
                { kind: "block", type: "logic_ternary" }
            ]
        },
        {
            kind: "category",
            name: "迴圈",
            categorystyle: "loop_category",
            contents: [
                { kind: "block", type: "controls_repeat_ext" },
//                { kind: "block", type: "controls_repeat", disabled: "true" },
                { kind: "block", type: "controls_whileUntil" },
                { kind: "block", type: "controls_for" },
                { kind: "block", type: "controls_forEach" },
                { kind: "block", type: "controls_flow_statements" }
            ]
        },
        {
            kind: "category",
            name: "數學",
            categorystyle: "math_category",
            contents: [
                { kind: "block", type: "math_number", gap: "32" },
                { kind: "block", type: "math_arithmetic" },
                { kind: "block", type: "math_single" },
                { kind: "block", type: "math_trig" },
                { kind: "block", type: "math_atan2" },
                { kind: "block", type: "math_constant" },
                { kind: "block", type: "math_number_property" },
                { kind: "block", type: "math_round" },
                { kind: "block", type: "math_on_list" },
                { kind: "block", type: "math_modulo" },
                { kind: "block", type: "math_constrain" },
                { kind: "block", type: "math_random_int" },
                { kind: "block", type: "math_random_float" }
            ]
        },
        {
            kind: "category",
            name: "文字",
            categorystyle: "text_category",
            contents: [
                { kind: "block", type: "text" },
                //        { kind: "block", type: "text_multiline" },
                { kind: "block", type: "text_join" },
                { kind: "block", type: "text_append" },
                { kind: "block", type: "text_length" },
                { kind: "block", type: "text_isEmpty" },
                { kind: "block", type: "text_indexOf" },
                { kind: "block", type: "text_charAt" },
                { kind: "block", type: "text_getSubstring" },
                { kind: "block", type: "text_changeCase" },
                { kind: "block", type: "text_trim" },
                { kind: "block", type: "text_count" },
                { kind: "block", type: "text_replace" },
                { kind: "block", type: "text_reverse" },
                //        { kind: "label", text: "Input/Output:", "web-class": "ioLabel" },
                { kind: "block", type: "text_print" },
                { kind: "block", type: "text_prompt_ext" }
            ]
        },
        {
            kind: "category",
            name: "列表",
            categorystyle: "list_category",
            contents: [
                { kind: "block", type: "lists_create_empty" },
                { kind: "block", type: "lists_create_with" },
                { kind: "block", type: "lists_repeat" },
                { kind: "block", type: "lists_length" },
                { kind: "block", type: "lists_isEmpty" },
                { kind: "block", type: "lists_indexOf" },
                { kind: "block", type: "lists_getIndex" },
                { kind: "block", type: "lists_setIndex" },
                { kind: "block", type: "lists_getSublist" },
                { kind: "block", type: "lists_split" },
                { kind: "block", type: "lists_sort" },
                { kind: "block", type: "lists_reverse" }
            ]
        },
        //    {
        //      kind: "category",
        //      name: "顏色",
        //      categorystyle: "colour_category",
        //      contents: [
        //        { kind: "block", type: "colour_picker" },
        //        { kind: "block", type: "colour_random" },
        //        { kind: "block", type: "colour_rgb" },
        //        { kind: "block", type: "colour_blend" }
        //      ]
        //    },
        {
            kind: "category",
            name: "變數",
            categorystyle: "variable_category",
            custom: "VARIABLE"
        },
        {
            kind: "category",
            name: "函數",
            categorystyle: "procedure_category",
            custom: "PROCEDURE"
        }
    ]
};

export default Toolbox;