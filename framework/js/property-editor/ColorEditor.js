function ColorEditor() {
    BaseEditor.call(this);
}
__extend(BaseEditor, ColorEditor);

ColorEditor.prototype.onDetached = function () {
    //document.body.removeChild(this.colorPicker.popup.popupContainer);
}

ColorEditor.prototype.render = function() {
    this.colorTitle.innerHTML = this._schema === null ? "Colors: " : this._schema.displayName + ":";
    this.colorPicker.setRGBAHexColorString(this._value);
    this.__base().render.apply(this);
}
ColorEditor.prototype.getValue = function() {
    return this.colorPicker.getRGBAHexColorString();
}
ColorEditor.prototype._updateUIEnable = function(enable) {
    Dom.setEnabled(enable, this.colorPicker);
}
