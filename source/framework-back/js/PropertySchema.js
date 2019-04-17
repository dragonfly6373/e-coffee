var PropertySchema = (function () {
    var thiz = {
        schemas: [],
        editorsMap: {}
    };
    function register(schema) {
        thiz.schemas.push(schema);
    }
    function registerEditor(type, editor) {
        var t = "" + type;
        thiz.editorsMap[t] = editor;
    }
    register({
        "name": "backgroundColor",
        "displayName": "Background Color",
        "type": "Color",
        "defaultValue": "#000000"
    });

    register({
        "name": "padding",
        "displayName": "Padding",
        "type": "Number",
        "defaultValue": 1.5,
        "minValue": 0,
        "maxValue": 30,
        "units": "em,px"
    });
    register({
        "name": "description",
        "displayName": "Description",
        "type": "String",
        "defaultValue": "",
        "maxLength": 255,
        "multiline": true
    });
    register({
        "name": "for",
        "displayName": "Enum",
        "type": "Enum",
        "defaultValue": "List",
        "items": [{key: "List", value: "List"}, {key: "Item", value: "Item"}, {key: "All", value: "All"}]
    });

    register({
        "name": "default",
        "displayName": "Boolean",
        "type": "Boolean",
        "defaultValue": false,
    });
    register({
        "name": "border",
        "displayName": "Border Style",
        "type": "Complex",
        "schemas": [
            {
                "name": "color",
                "displayName": "Border Color",
                "type": "Color",
                "defaultValue": "#FF0000"
            },
            {
                "name": "width",
                "displayName": "Border Width",
                "type": "Number",
                "defaultValue": 0.5,
                "units": "em,px"
            }
        ]
    });
    register({
        "name": "palette",
        "displayName": "Color Palette",
        "type": "Collection",
        "elementType": "Color",
        "minItem": 2,
        "maxItem": 5,
        "defaultValue": ["#223344", "#000011"]
    });

    register({
        "name": "file",
        "displayName": "Logo",
        "type": "FileUpload",
        "defaultValue": ""
    });

    registerEditor("Color", ColorEditor);

    registerEditor("String", TextEditor);

    registerEditor("Number", NumberEditor);

    registerEditor("Enum", EnumEditor);

    registerEditor("Collection", ListEditor);

    registerEditor("Boolean", BooleanEditor);

    registerEditor("Complex", ComplexEditor);

    registerEditor("FileUpload", FileUploadEditor);

    registerEditor("Date", DateEditor);
    
    return thiz;
})();
