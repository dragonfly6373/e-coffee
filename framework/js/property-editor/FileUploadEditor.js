function FileUploadEditor() {
    BaseEditor.call(this);
}
__extend(BaseEditor, FileUploadEditor);

FileUploadEditor.prototype.render = function() {
    this.fileTitle.innerHTML = this._schema === null ? "File: " : this._schema.displayName + ":";
    this.fileUploadView.dataType = "upload";
    var exts = this._schema.extensions || "jpg,jpeg,png,gif";
    this.fileUploadView.acceptedExtensions = exts.toLowerCase().split(",");
    this.fileUploadView.dataUUID = Util.newUUID();
    this.fileUploadView.setCommaSeparatedStoragePaths(this._value || "");
    this.__base().render.apply(this);
}
FileUploadEditor.prototype.getValue = function() {
    return this.fileUploadView.getCommaSeparatedStoragePaths();
}
FileUploadEditor.prototype._updateUIEnable = function(enable) {
    Dom.setEnabled(enable, this.fileUploadView);
}
