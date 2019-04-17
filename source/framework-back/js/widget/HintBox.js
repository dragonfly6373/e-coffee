function HintBox(node) {
    BaseTemplatedWidget.call(this);
    var doneHandler = function() {
        this._assertLocalStorage();
        window.localStorage.setItem(this.key, Date.now());
        this._removeMe();
        this.done();
    };
    this.bind("click", doneHandler, this.doneButton);
    this.key = node.getAttribute("hintKey") || "";
    if (this.key.length) this.key = "_-_#tu_@storage_cms_hint_-_" + this.key;
}
__extend(BaseTemplatedWidget, HintBox);

HintBox.prototype.setContentFragment = function(fragment) {
    if (this.hasAlreadyShown()) {
        this._removeMe();
        return;
    }

    var node = Dom.findChildTag(fragment, "label") || fragment;
    this.message.appendChild(node);

    node = Dom.findChildTag(fragment, "button");
    var text = (node && node.textContent) || "Got it!";
    this.doneLabel.textContent = text;
};
HintBox.prototype.getMessage = function() {
    return Dom.getInnerText(this.message);
}
HintBox.prototype.setMessage = function(text) {
    this.message.innerHTML = text;
}
HintBox.prototype._assertLocalStorage = function() {
    if (!window.localStorage) throw "Local Storage is not supported!";
};

HintBox.prototype._removeMe = function() {
    this.node().parentNode.removeChild(this.node());
};

HintBox.prototype.hasAlreadyShown = function() {
    this._assertLocalStorage();
    return !!window.localStorage.getItem(this.key);
};

HintBox.prototype.done = function() {
};
