function TextEditor() {
    BaseEditor.call(this);

    this.bind("input", function() {
        this.fireChangeEvent();
    }, this.textInput);

    this.bind("input", function() {
        this.fireChangeEvent();
    }, this.multilineTextInput);
}
__extend(BaseEditor, TextEditor);

TextEditor.prototype.render = function() {
    this.textTitle.innerHTML = this._schema === null ? "Text: " : this._schema.displayName + ":";

    var v = this._value || this._schema.defaultValue || "";
    var maxLength = this._schema.maxLength || 0;
    if (this._schema.multiline) {
        Dom.removeClass(this.textInput, "Active");
        Dom.addClass(this.multilineTextInput, "Active");
        this.multilineTextInput.value = v;
        if (maxLength > 0) {
            this.multilineTextInput.maxLength = maxLength;
        }
        this.multilineTextInput.setAttribute("placeholder", this._schema.placeHolder || "");
    } else {
        Dom.addClass(this.textInput, "Active");
        Dom.removeClass(this.multilineTextInput, "Active");
        this.textInput.node().value = v;
        if (maxLength > 0) {
            this.textInput.node().maxLength = maxLength;
        }
        this.textInput.node().setAttribute("placeholder", this._schema.placeHolder || "");

        if (this._schema.items && this._schema.items.length > 0) {
            var thiz = this;
            var renderer = function (item) {
                return thiz._schema.itemDisplayProperty ? item[thiz._schema.itemDisplayProperty] : item.toString();
            };

            this.bind("p:ItemSelected", function () {
                var item = this.textInput.getSelectedData();
                if (!item) return;
                this.textInput.setSelectedData(null);
                this.textInput.node().value = renderer(item);
            }, this.textInput);

            this.bind("click", function(e) {
                if (e.target == thiz.textInput.node()) {
                    thiz.textInput.autoCompleteNow();
                }
            }, this.textInput);
            var searchProperty = thiz._schema.itemSearchProperty || "";
            var source = function (term, callback) {
                window.setTimeout(function () {
                    var matchedItems = thiz._schema.items.filter(function (obj) {
                        if (searchProperty.length == 0) return obj.toString().toLowerCase().indexOf(term.toLowerCase()) >= 0;
                        return obj[searchProperty] && obj[searchProperty].toString().toLowerCase().indexOf(term.toLowerCase()) >= 0;
                    });
                    callback(matchedItems);
                }, 100);
            };
            this.textInput.setup(source, renderer, renderer);
            this.textInput.timeout = 150;
            this.textInput.suggestOnBlank = true;
        }

    }

    this.__base().render.apply(this);
}

TextEditor.prototype.getValue = function() {
    var text = this._schema.multiline ? this.multilineTextInput.value : this.textInput.getText();
    return text.trim().length == 0 ? null : text.trim();
}
TextEditor.prototype._updateUIEnable = function(enable) {
    var text = this._schema.multiline ? this.multilineTextInput : this.textInput;
    Dom.setEnabled(enable, text);
}
