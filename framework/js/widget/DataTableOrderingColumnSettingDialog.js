function DataTableOrderingColumnSettingDialog() {
    Dialog.call(this);
    this.title ="Column Setting";
    this.size = "large";

    this.bind("click", function (event) {
        var node = Dom.getTarget(event);
        var actionNode = Dom.findUpward(node, function (n) {
            return n.getAttribute && n.getAttribute("action-type");
        });

        if (!actionNode) return;

        var actionType = actionNode.getAttribute("action-type");
        if (actionType == "None") return;

        var row = Dom.findUpwardForNodeWithData(node, "_column");
        if (!row) return;

        if (actionType == "Add") {
            this.availableColumnContainer.removeChild(row);
            this.createSelectedColumnElement(row._column);
            return;
        }

        if (actionType == "Remove") {
            this.selectedColumnContainer.removeChild(row);
            this.createAvailableColumnElement(row._column);
            return;
        }

    }, this.columnSelectorContainer);
}

__extend(Dialog, DataTableOrderingColumnSettingDialog);

DataTableOrderingColumnSettingDialog.prototype.setup = function (options) {
    this.table = options.table;
    this.availableColumnContainer.innerHTML = "";
    this.selectedColumnContainer.innerHTML = "";
    for (var i = 0; i < this.table.columns.length; i ++) {
        var column = this.table.columns[i];
        var unremovable = column.unremovable;
        var visible = this.table.isColumnVisible(column);

        if (unremovable || visible) {
            this.createSelectedColumnElement(column);
        } else {
            this.createAvailableColumnElement(column);
        }
    }

};

DataTableOrderingColumnSettingDialog.prototype.onShown = function () {
    this.setupReordering();
};

DataTableOrderingColumnSettingDialog.prototype.createSelectedColumnElement = function (column) {
    var id = "s" + widget.random();
    var row = Dom.newDOMElement({
        _name: "hbox",
        "class": "SelectedColumn",
        _children: [{
            _name: "icon",
            "class": "menu DragButton",
            "_dragable": true
        },{
            _name: "label",
            "flex": "1",
            "for": id,
            _html: column.getTitleContentHtml()
        }, {
            _name: "span",
            "class": "Action",
            "action-type": column.unremovable ? "None" : "Remove",
            _html: column.unremovable ? "" : "<icon class='minus-circle'></icon><span>Remove</span>"
        }]
    }, document);
    this.selectedColumnContainer.appendChild(row);
    row._column = column;
};

DataTableOrderingColumnSettingDialog.prototype.createAvailableColumnElement = function (column) {
    var id = "c" + widget.random();
    var row = Dom.newDOMElement({
        _name: "hbox",
        "class": "AvailableColumn",
        _children: [{
            _name: "label",
            "flex": "1",
            "for": id,
            _html: column.getTitleContentHtml()
        }, {
            _name: "span",
            "class": "Action",
            "action-type": "Add",
            _html: "<icon class='plus-circle'></icon><span>Add</span>"
        }]
    }, document);
    this.availableColumnContainer.appendChild(row);
    row._column = column;
};

DataTableOrderingColumnSettingDialog.prototype.setupReordering = function () {
    var baseFunction = DragAndDropManager.DROP_AT_CONTAINER(false);
    var dropTargetFinderFunction = function (event, manager) {
        var target = baseFunction(event, manager);
        return target;
    }.bind(this);
    this.dnd = new DragAndDropManager()
    .source(this.selectedColumnContainer)
    .anchor(function (node) {
        return Dom.hasClass(node, "DragButton");
    })
    .itemInfo(function (anchor) {
        var item = Dom.findParentWithClass(anchor, "SelectedColumn");
        if (!item) return null;
        return {
            element: item,
            data: item._column
        };
    })
    .destination(this.selectedColumnContainer)
    .canDrop(function (data) {
        return true;
    }
    .bind(this))
    .dropAt(dropTargetFinderFunction)
    .setup();

    this.dnd.createDragImageNode = function () {
        var node = Dom.newDOMElement({
            _name: "div",
            "class": "ColumnDrag"
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
        Dom.addClass(draggable, "JustDropped");

        window.setTimeout(function () {
            Dom.removeClass(draggable, "JustDropped");
        }, 100);
        
        // this.emitChangeEvent();
    }.bind(this);
};

DataTableOrderingColumnSettingDialog.prototype.getDialogActions = function () {
    return [
        {
            type: "cancel", title: "Cancel",
            isCloseHandler: true,
            run: function () { return true; }
        },
        {
            type: "accept", title: "Apply",
            run: function () {
                var columnIds = [];
                for (var i = 0; i < this.selectedColumnContainer.childNodes.length; i++) {
                    var node = this.selectedColumnContainer.childNodes[i];
                    columnIds.push(node._column.id);
                }

                if (columnIds.length <= 0) {
                    Dialog.error("Please select at least one visible column.");
                    return false;
                }

                this.close(columnIds);

                return false;
            }
        }
    ]
};
