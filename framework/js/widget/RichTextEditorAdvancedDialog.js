function RichTextEditorAdvancedDialog() {
    this.grabHeight = true;
    Dialog.call(this);

    this.title = "Advance Content Edit";

    this.bind("e:TabChange", function () {
        if (this.mainTab.getActiveTabPane() == this.cssTab && !this.cssCodeEditor) {
            this.cssCodeEditor = CodeMirror.fromTextArea(this.cssInput, {
                lineNumbers: true,
                mode: { name: "css" },
                extraKeys: {"Ctrl-Space": "autocomplete"},
                indentUnit: 4
            });
        }
    }, this.mainTab.node());

    this.bind("click", this.handleTemplateItemClick, this.templateSuiteList);
}
__extend(Dialog, RichTextEditorAdvancedDialog);

RichTextEditorAdvancedDialog.prototype.setup = function (options) {
    if (options) {
        this.htmlInput.value = options.html || "";
        this.cssInput.value = options.css || "";
    }
};

RichTextEditorAdvancedDialog.prototype.onShown = function () {
    this.htmlCodeEditor = CodeMirror.fromTextArea(this.htmlInput, {
        lineNumbers: true,
        mode: "htmlmixed",
        extraKeys: {"Ctrl-Space": "autocomplete"},
        indentUnit: 4,
        lineWrapping: true,
    });
    // var charWidth = this.htmlCodeEditor.defaultCharWidth(), basePadding = 4;
    // this.htmlCodeEditor.on("renderLine", function(cm, line, elt) {
    //     var off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
    //     elt.style.textIndent = "-" + off + "px";
    //     elt.style.paddingLeft = (basePadding + off) + "px";
    // });
};


RichTextEditorAdvancedDialog.prototype.save = function () {
    if (this.htmlCodeEditor) this.htmlCodeEditor.save();
    if (this.cssCodeEditor) this.cssCodeEditor.save();
    
    this.close({
        html: this.htmlInput.value,
        css: this.cssInput.value
    });

};
RichTextEditorAdvancedDialog.prototype.getDialogActions = function () {
    return [
        {
            type: "cancel", title: "Cancel",
            isCloseHandler: true,
            run: function () { return true; }
        },
        {
            type: "accept", title: "Update",
            run: function () { this.save(); return false; }
        }
    ]
};