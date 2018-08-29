function PropertiesWidget() {
    BaseTemplatedWidget.call(this);
    this._editors = [];
    this._editorsMap = {};
    this._editorPreparer = null;
    this._ignoreValueIfDependencyUnsatisfied = false;
}
__extend(BaseTemplatedWidget, PropertiesWidget);

PropertiesWidget.prototype.ignoreValueIfDependencyUnsatisfied = function(ignore) {
    this._ignoreValueIfDependencyUnsatisfied = ignore;
}
PropertiesWidget.prototype.isIgnoreValueIfDependencyUnsatisfied = function() {
    return this._ignoreValueIfDependencyUnsatisfied;
}
PropertiesWidget.prototype.getValue = function() {
    var map = {};
    for (var i = 0; i < this._editors.length; i++) {
        var editor = this._editors[i];
        if (this._ignoreValueIfDependencyUnsatisfied && !editor.dependencySatisfied) continue;
        map[editor._schema.name] = editor.getValue();

    }
    return map;
};
PropertiesWidget.prototype.setSchemas = function(schemas) {
    this.schemas = schemas;
};
PropertiesWidget.prototype.setValue = function(valueMap) {
    this.valuesMap = valueMap;
};
PropertiesWidget.prototype.setEditorPreparer = function(modifier) {
    this._editorPreparer = modifier;
};
PropertiesWidget.prototype.setup = function(clearValue) {
    Dom.empty(this.editorsContainer);
    if (this.schemas.length == 0) {
         return;
    }
    this._editors = [];
    this._editorsMap = {};
    this._editorsPathMap = {};
    var c = 0;
    var thiz = this;

    for (var i = 0; i < this.schemas.length; i++) {
        var schema = this.schemas[i];
        var f = PropertySchema.editorsMap[schema.type];
        if (!f) {
            console.log("Impl of " + schema.type + " not found");
            continue;
        }
        var editor = new f();
        var v = this.valuesMap ? this.valuesMap[schema.name] : undefined;
        if (!clearValue && v === undefined) {
            v = schema.defaultValue;
        }

        editor.setRefSchema(schema);
        editor.setValue(v);
        var path = "/" + schema.name;
        editor.setContext(this, path);

        if (this._editorPreparer) this._editorPreparer.call(this, editor, schema);
        editor.into(this.editorsContainer);
        if (i < this.schemas.length -1) {
            this.editorsContainer.appendChild(Dom.newDOMElement({_name: "div", class: "Separator"}));
        }
        this._editors.push(editor);
        this._editorsMap[schema.name] = editor;
        this._editorsPathMap[path] = editor;

        editor.render();
        this.bind("p:ValueChanged", this.onValueChanged, editor.node());
    }

    for (var i = 0; i < this._editors.length; i++) {
        var editor = this._editors[i];
        editor.validateAllDependencies();
    }

    this.setupReordering();
    this.onRenderEditorFinished();
}
PropertiesWidget.prototype.onAttached = function() {
    if (!this.schemas) {
        return;
    }
    var thiz = this;
    if (this._setup) {
        return;
    }
    this._setup = true;
    this.setup();
};
PropertiesWidget.prototype.onRenderEditorFinished = function() {
    this._setup = true;
}
PropertiesWidget.prototype.onValueChanged = function(data) {
};
PropertiesWidget.prototype.getPropertyEditingEventNode = function() {
    return this.node();
};
PropertiesWidget.prototype.setupReordering = function () {
    var thiz = this;
    var baseFunction = DragAndDropManager.DROP_AT_CONTAINER(false);
    var dropTargetFinderFunction = function (event, manager) {
        var target = baseFunction(event, manager);
        if (!target || !(Dom.hasClass(target.element, "DraggAble") || target.mode == DragAndDropManager.DROP_APPEND)) return null;
        return target;
    }.bind(this);
    this.dnd = new DragAndDropManager()
    .source(this.editorsContainer)
    .anchor(function (node) {
        return Dom.hasClass(node, "DragButton");
    })
    .itemInfo(function (anchor) {
        var item = Dom.findParentWithClass(anchor, "DraggAble");
        if (!item) return null;
        return {
            element: item,
            data: item._schema
        };
    })
    .destination(this.editorsContainer)
    .canDrop(function (data) {
        return true;
    }
    .bind(this))
    .dropAt(dropTargetFinderFunction)
    .setup();

    this.dnd.createDragImageNode = function () {
        var node = Dom.newDOMElement({
            _name: "div",
            "class": "EditorDragImage"
        });
        node.style.width = Dom.getOffsetWidth(DragAndDropManager.draggable) + "px";
        node.style.height = Dom.getOffsetHeight(DragAndDropManager.draggable) + "px";
        node.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
        return node;
    };
    this.dnd.createDropHintNode = function () {
        return Dom.newDOMElement({
            _name: "div",
            "class": "DropHint"
        });
    };
    this.dnd.onDrop = function (draggable, draggedData, target) {
        if (!draggable || !target) return;
        if (target.mode == DragAndDropManager.DROP_APPEND) {
            if (draggable.parentNode) draggable.parentNode.removeChild(draggable);
            target.element.appendChild(draggable);
        } else if (target.mode == DragAndDropManager.DROP_PREV_SIBLING) {
            if (target.element != draggable) {
                var container = target.element.parentNode;
                if (draggable.parentNode) draggable.parentNode.removeChild(draggable);
                container.insertBefore(draggable, target.element);
            }
        }
        var orders = this.getSettingOrders();
        this.setSettingOrders(orders);
    }.bind(this);
};

PropertiesWidget.prototype.getSettingOrders = function () {
    var orders = [];
    Dom.doOnSelector(this.editorsContainer, ":scope > .EditorBox.DraggAble", function(node) {
        var schema = node.__widget ? node.__widget._schema : undefined;
        if (!schema) return;
        orders.push(schema.name);
    });
    return orders;
}

PropertiesWidget.prototype.setSettingOrders = function (orders) {
    var orderEditor = this._editorsMap["orders"] || undefined;
    if (!orderEditor) return;
    var originalValue = this.valuesMap["orders"] || undefined;
    orderEditor.setValue(orders);
    orderEditor.onRenderFinished = function() {
        orderEditor.setValue(originalValue);
        orderEditor.fireChangeEvent(true);
    };
    orderEditor.render();
}
