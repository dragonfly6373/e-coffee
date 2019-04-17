function ListEditor() {
    BaseEditor.call(this);
    this._editors = [];
    this.bind("click", function(){
        this.createNewEditor();
    }, this.addMoreButton);

    this.bind("click", function(event){
        var item = Dom.findUpwardForNodeWithData(event.target, "_attachedEditor");
        if (!item) return;

        if (Dom.hasClass(event.target, "Remove")) {
            this.removeEditor(item._attachedEditor);
        }
    }, this.listEditorsContainer);

}
__extend(BaseEditor, ListEditor);

ListEditor.prototype.render = function() {
    this.listTitle.innerHTML = this._schema === null ? "List: " : this._schema.displayName + ":";
    this._editors = [];
    this.listEditorsContainer.innerHTML = "";
    var editorMin = Math.max(this._schema.minItem, (this._value && this._value.length ? this._value.length : 1));
    for (var i = 0; i < editorMin; i++) {
        this.rendererNewItem(i);
    }
    this.__base().render.apply(this);
}

ListEditor.prototype.removeEditor = function(editor) {
    if (this._editors.length <= this._schema.minItem) {
        Dialog.alert("Info", "Minimum " + this._schema.minItem + " " + this._schema.displayName  + "s allowed!");
        return;
    }
    var thiz = this;
    Dom.doOnChildRecursively(this.listEditorsContainer, {
        eval : function(node) {
            return node._attachedEditor != null;
        }
    }, function(node) {
        if (node._attachedEditor == editor) {
            thiz.listEditorsContainer.removeChild(node);
            thiz._editors.splice(thiz._editors.indexOf(editor), 1);
            thiz.updateItems();
        }
    });
}
ListEditor.prototype.updateItems = function() {
    var index = 0;
    var thiz = this;
    Dom.doOnChildRecursively(this.listEditorsContainer, {
        eval : function(node) {
            return node._attachedEditor != null;
        }
    }, function(node) {
        var editor = node._attachedEditor;
        var ref = {displayName : thiz._schema.displayName + " " + (index +1), type: thiz._schema.type};
        editor.setRefSchema(ref);
        editor.render();
        index ++;
    });
}
ListEditor.prototype.rendererNewItem = function(index) {
    var f = PropertySchema.editorsMap[this._schema.elementType];
    if (f == null) {
        return;
    }
    var e = new f();
    var ref = {displayName : this._schema.displayName + " " + (index +1), type: this._schema.type};
    e.setRefSchema(ref);
    var values = this._value || [];
    var v = index >= 0 && index < values.length ? values[index] : null;
    e.setValue(v);
    var container = Dom.newDOMElement({_name: "hbox", class: "ListItemEditor"});
    e.into(container);
    e.node().setAttribute("flex", 1);
    e.render();

    var iconButton = Dom.newDOMElement({_name: "button", class: "ListItemAction Remove"});
    var removeIcon = Dom.newDOMElement({_name: "icon", class: "close RemoveAction"});
    iconButton.appendChild(removeIcon);

    container._attachedEditor = e;
    container.appendChild(iconButton);

    this.listEditorsContainer.appendChild(container);
    this._editors.push(e);
}
ListEditor.prototype.createNewEditor = function () {
    var created = this._editors.length;
    if (created >= this._schema.maxItem && this._schema.maxItem > 0) {
        Dialog.alert("Info", "Only " + this._schema.maxItem + " " + this._schema.displayName  + "s allowed!");
        return;
    }
    this.rendererNewItem(this._editors.length);
}
ListEditor.prototype.getValue = function() {
    var items = [];
    for (var i = 0; i < this._editors.length; i++) {
        var editor = this._editors[i];
        if (this.context.isIgnoreValueIfDependencyUnsatisfied && this.context.isIgnoreValueIfDependencyUnsatisfied() && !editor.dependencySatisfied) continue;
        var v = editor.getValue();
        if (v == null) continue;
        items.push(v)
    }
    return items;
}
ListEditor.prototype.validateAllDependencies = function(name) {
    this.__base().validateAllDependencies.apply(this);

    for (var i = 0; i < this._editors.length; i++) {
        var editor = this._editors[i];
        editor.validateAllDependencies();
    }
};
