function Spinner(message) {
    this._message = message || "";
    this._dlg = new BuilderBasedDialog({
        actions: [],
        buildContent: function(){}
    });
    this._dlg.dialogHeaderPane.style = "display:none";
    this._dlg.dialogFooter.style = "display:none";
    this._dlg.dialogBody.style = "border-top:none";
    this._dlg.dialogFrame.style.boxShadow = "none";
}

Spinner.prototype.busy = function () {
    this._dlg.open();
    this._dlg.busy(this._message);
}

Spinner.prototype.done = function() {
    this._dlg.done();
    this._dlg.close();
    delete this._dlg;
}
