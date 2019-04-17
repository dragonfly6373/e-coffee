function BaseEditor() {
    BaseTemplatedWidget.call(this);
    this.dependenciesEditors = [];
    this.enable = true;
    this.dependencySatisfied = true;
}
__extend(BaseTemplatedWidget, BaseEditor);

BaseEditor.prototype.getValue = function () {
    return {};
};

BaseEditor.prototype.setEnable = function (enable) {
    this.enable = enable;
    this.invalidateEnableStatus();
};

BaseEditor.prototype._updateUIEnable = function (enable) {
};

BaseEditor.prototype.invalidateEnableStatus = function () {
    this._updateUIEnable(this.enable && this.dependencySatisfied);
};

BaseEditor.prototype.setValue = function(value) {
    this._value = value;
}
BaseEditor.prototype.setRefSchema = function(schema) {
    this._schema = schema;
    Dom.addClass(this.node(), "SchemaName_" + schema.name);
    if (this._schema.description) this.node().setAttribute("title", this._schema.description || "");
    Dom.addClass(this.node(), "EditorBox");
    Dom.toggleClass(this.node(), "DraggAble", this._schema.draggAble ? true : false);
    Dom.toggleClass(this.node(), "Hidden", this._schema.hidden ? true : false);
    if (this._schema && typeof(this._schema.displayName) == "string" && this._schema.displayName.length) this._schema.displayName = unescape(this._schema.displayName);
}

BaseEditor.prototype.onAttached = function () {
}
BaseEditor.prototype.onRenderFinished = function () {

}
BaseEditor.prototype.onDetached = function () {

}
BaseEditor.prototype.render = function() {
    this.installDependencyValidation();
    this.onRenderFinished();
}
BaseEditor.prototype.getEditor = function(name) {
    return this._schema && this._schema.name == name ? this : null;
}
BaseEditor.prototype.fireChangeEvent = function (fromUser) {
    this.modified = true;
    Dom.emitEvent("p:ValueChanged", this.node(), {fromUser: fromUser ? true : false, editor: this});
};

BaseEditor.prototype.setContext = function (context, path) {
    this.context = context;
    this.path = path;
};

BaseEditor.prototype.installDependencyValidation = function () {
    var depends = null;
    if (this._schema.depends) {
        depends = this._schema.depends.slice ? this._schema.depends : [this._schema.depends];
    }

    if (!depends || depends.length == 0) return;

    this.depends = [];
    for (var i = 0; i < depends.length; i ++) {
        var depend = this.normalizeDependency(depends[i]);
        this.depends.push(depend);
    }

    var thiz = this;
    Dom.registerEvent(this.context.getPropertyEditingEventNode(), "p:ValueChanged", function (event) {
        thiz._handleContextValueChanged(event);
    });

};
BaseEditor.prototype.normalizeDependency = function (depend) {
    var path = null;
    if (depend.path.substring(0, 1) == "/") {
        path = depend.path;
    } else {
        path = this.path;

        var parts = depend.path.split(/\//);
        for (var i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part == ".") continue;
            if (part == "..") {
                var index = path.lastIndexOf("/");
                if (index <= 0) throw "Invalid path reference: " + depend.path + " from " + this.path;
                path = path.substring(0, index);
            } else {
                path += "/" + part;
            }
        }
    }

    return {
        path: path,
        op: depend.op,
        values: depend.values
    };
};

BaseEditor.prototype.validateAllDependencies = function () {
    if (!this.depends || this.depends.length == 0) {
        this.dependencySatisfied = true;
        this.invalidateEnableStatus();
        return;
    }

    var ok = true;
    for (var i = 0; i < this.depends.length; i++) {
        var depend = this.depends[i];
        var target = this.context._editorsPathMap[depend.path];
        var args = [target.getValue()].concat(depend.values);
        var resolver = ConditionResolvers[depend.op];

        var result = resolver.apply(this, args);
        if (!result) {
            ok = false;
            break;
        }
    }

    this.dependencySatisfied = ok;
    this.invalidateEnableStatus();
};

BaseEditor.prototype._handleContextValueChanged = function (event) {
    if (!event.editor) return;

    var related = false;
    for (var i = 0; i < this.depends.length; i++) {
        var depend = this.depends[i];

        if (event.editor.path.indexOf(depend.path) != 0) continue;
        if (event.editor.path != depend.path && event.editor.path.substring(depend.path.length, depend.path.length + 1) != "/") continue;

        related = true;
        break;
    }

    if (!related) return;

    this.validateAllDependencies();
};
