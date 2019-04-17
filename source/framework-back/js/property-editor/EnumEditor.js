function EnumEditor() {
    BaseEditor.call(this);
    var thiz = this;
}
__extend(BaseEditor, EnumEditor);
EnumEditor.prototype.render = function() {
    var thiz = this;
    this.enumTitle.innerHTML = this._schema === null ? "Enum: " : this._schema.displayName + ":";
    Dom.empty(this.selectionInput);

    this.usedKey = this._schema.items && this._schema.items.length > 0 && typeof(this._schema.items[0].key) != "undefined";
    if (this._schema.exclusive) {
        Dom.addClass(this.node(), "Exclusive");
        this.comboManager = new ComboManager();
        this.comboManager.renderer = function(item) {
            return item && item.value ? item.value : item;
        };
        this.comboManager.comparer = function(selected, item) {
            return selected.key == item.key;
        };
        this.comboManager.setItems(this._schema.items || []);
        if (this._value) {
            this.comboManager.selectItem(this.usedKey ? Util.find(this._schema.items, function(item) {
                if (item.key == thiz._value) return item;
                return null;
            }) : this._value);
        }
        this.comboManager.options =  {
            onItemSelected: function(fromUserAction) {
                if (!fromUserAction) return;
                thiz.fireChangeEvent(true);
            },
        };
        this.comboManager.into(this.selectionInput);
    } else {
        //Dom.removeClass(this.selectionInput, "EditorInput");
        Dom.addClass(this.node(), "SelectBox");
        this.selectBox = new SelectBox();
        var allItemSelectedText = this._schema.allItemSelectedText && this._schema.allItemSelectedText.length > 0 ?
        this._schema.allItemSelectedText : "All";
        this.selectBox.getConfigs = function() {
            return {
                name: "selectBox",
                mode: SelectBox.MODE_DROPDOWN,
                direction: SelectBox.DIRECTION_COLUMN,
                multipleSelect: true,
                optionSelectAll: true,
                optionSelectAllText: allItemSelectedText
            }
        };
        this.selectBox.getData = function() {
            return thiz._schema.items || [];
        };
        var isAllOptionSelected = typeof(this._value) == "undefined" || this._value == null || this._value.length == 0 || (this._value.indexOf && this._value.indexOf(0) >= 0);
        this.selectBox.parseData = function(object) {
            return {
                    value: object.key,
                    text: object.value,
                    checked: isAllOptionSelected ? true : thiz._value && thiz._value.indexOf && thiz._value.indexOf(object.key) >= 0
                };
        }
        this.selectBox.into(this.selectionInput);
        this.selectBox.node().setAttribute("flex", 1);
        this.selectBox._options =  {
            onSelectionChanged: function(fromUserAction) {
                if (!fromUserAction) return;
                thiz.fireChangeEvent(true);
            },
        };
        this.selectBox.setup();
    }

    this.__base().render.apply(this);
}
EnumEditor.prototype._updateUIEnable = function(enable) {
    if (this._schema.exclusive) {
        this.comboManager.setEnable(enable);
    } else {
        Dom.setEnabled(enable, this.selectBox.statusBox);
    }
}
EnumEditor.prototype.getValue = function() {
    if (this._schema.exclusive) {
        var item = this.comboManager.getSelectedItem();
        if (item == null) return null;
        return typeof(item.key) != "undefined" ? item.key : item;
    } else {
        var items = this.selectBox.getSelectedData();
        if (!items || this.selectBox.isAllOptionSelected() || items.length == 0) return [];
        if (this.usedKey) {
            var keys = [];
            for (var i = 0; i < items.length; i++) {
                var v = items[i];
                if (v == null || !v.key) continue;
                keys.push(v.key);
            }
            return keys;
        }
        return items;
    }
}
EnumEditor.prototype.onDetached = function () {
    /*if (this.comboManager && this.comboManager.popup && this.comboManager.popup.popupContainer) {
        document.body.removeChild(this.comboManager.popup.popupContainer);
    }*/
}
