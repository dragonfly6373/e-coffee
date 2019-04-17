function NumberEditor() {
    BaseEditor.call(this);

    this.bind("input", function() {
        this.fireChangeEvent();
    }, this.numberInput);

    this.bind("change", function() {
        this.fireChangeEvent();
    }, this.numberInput);
}
__extend(BaseEditor, NumberEditor);

NumberEditor.prototype.render = function() {
    this.numberTitle.innerHTML = this._schema === null ? "Number: " : this._schema.displayName + ":";
    this.numberInput.value = typeof(this._value) == "number" ? this._value : "";
    this.numberInput.min = this._schema.minValue || 0;
    this.numberInput.max = this._schema.maxValue || 10000;
    this.numberInput.step = this._schema.step || (this._schema.decimal ? 0.1 : 1);

    this.__base().render.apply(this);
}

NumberEditor.prototype.getValue = function() {
    var text = this.numberInput.value;
    
    if (text.trim().length == 0) {
        return typeof(this._schema.blankValue) == "undefined" ? 0 : this._schema.blankValue;
    }
    
    var v = text.trim().length == 0 ? 0 : text.trim()
    return this._schema.decimal ? parseFloat(v, 10) : parseInt(v, 10);
}
NumberEditor.prototype._updateUIEnable = function(enable) {
    Dom.setEnabled(enable, this.numberInput);
}
