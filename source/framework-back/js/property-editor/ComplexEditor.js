function ComplexEditor() {
    BaseEditor.call(this);
    this._editors = [];
    this._editorsMap = [];
}
__extend(BaseEditor, ComplexEditor);
ComplexEditor.prototype.render = function() {
    this._editors = [];
    this._editorsMap = [];
    this.editorsContainer.innerHTML = "";
    var thiz = this;
    var subSchema = this._schema.schemas || [];
    if (subSchema.length > 0) {
        Dom.addClass(this.node(), "Active");
    }

    for (var i = 0; i < subSchema.length; i++) {
        var schema = subSchema[i];
        var f = PropertySchema.editorsMap[schema.type];
        if (!f) continue;
        var e = new f();
        var v = this._value ? this._value[schema.name] : void 0;
        if (v === void 0) {
            v = schema.defaultValue;
        }
        e.setRefSchema(schema);

        e.setValue(v);

        var path = this.path + "/" + schema.name;
        e.setContext(this.context, path);

        e.into(this.editorsContainer);
        this._editors.push(e);
        this._editorsMap[schema.name] = e;
        this.context._editorsPathMap[path] = e;

        e.render();
    }

    this.__base().render.apply(this);
};
ComplexEditor.prototype.validateAllDependencies = function(name) {
    this.__base().validateAllDependencies.apply(this);

    for (var i = 0; i < this._editors.length; i++) {
        var editor = this._editors[i];
        editor.validateAllDependencies();
    }
};
ComplexEditor.prototype.getEditor = function(name) {
    return this._editorsMap[name];
}
ComplexEditor.prototype.isValid = function() {
    var e = this._editorsMap[this._schema.name];
    return e && e.isValid();
}
ComplexEditor.prototype.getValue = function() {
    var value = {};
    for (var i = 0; i < this._editors.length; i++) {
        var editor = this._editors[i];
        if (this.context.isIgnoreValueIfDependencyUnsatisfied && this.context.isIgnoreValueIfDependencyUnsatisfied() && !editor.dependencySatisfied) continue;
        var v = editor.getValue();
        value[editor._schema.name] = v;
    }
    return value;
}
