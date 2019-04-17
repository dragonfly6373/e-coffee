function BooleanEditor() {
    BaseEditor.call(this);
    this.bind("change", this.fireChangeEvent, this.checkBox);
}
__extend(BaseEditor, BooleanEditor);
BooleanEditor.prototype.render = function() {
    this.booleanTitle.innerHTML = this._schema === null ? "Boolean: " : this._schema.displayName + ":";
    var checked = typeof(this._value) != "undefined" ? this._value : false;
    this.checkBox.checked = checked;
    this.__base().render.apply(this);
}
BooleanEditor.prototype.getValue = function() {
    return this.checkBox.checked;
}
BooleanEditor.prototype.isValid = function() {
    return this.getValue() && this.checkBox.disabled == false;
}
BooleanEditor.prototype._updateUIEnable = function(enable) {
    Dom.setEnabled(enable, this.checkBox);
}
