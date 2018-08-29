function DateEditor() {
    BaseEditor.call(this);
    this.bind("p:ValueUpdated", function() {
        this.fireChangeEvent();
    }, this.dateInput);
    var thiz = this;
    this.dateInput.withTime = function() {
        return thiz._schema && thiz._schema.withTime;
    }
}
__extend(BaseEditor, DateEditor);

DateEditor.prototype.render = function() {
    this.dateInput.useEndOfDay = this._schema && this._schema.useEndOfDay;

    this.dateTitle.innerHTML = this._schema === null ? "Date: " : this._schema.displayName + ":";
    if (this._schema.minDate) {
        this.dateInput.setMinDate(this._schema.minDate);
    }
    if (this._schema.maxDate) {
        this.dateInput.setMaxDate(this._schema.maxDate);
    }
    
    this.dateInput.setDate(this._value || this._schema.defaultValue);
    this.__base().render.apply(this);
}

DateEditor.prototype.getValue = function() {
    return this.dateInput.getDate();
}
DateEditor.prototype._updateUIEnable = function(enable) {
    this.dateInput.setEnabled(enable);
}
