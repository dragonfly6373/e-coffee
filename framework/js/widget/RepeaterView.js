function RepeaterView(definitionNode) {
    BaseWidget.call(this, definitionNode);
}
__extend(BaseWidget, RepeaterView);

RepeaterView.prototype.buildDOMNode = function (definitionNode) {
    var nodeName = "hbox";
    if (definitionNode) {
        nodeName = definitionNode.getAttribute("tag") || nodeName;
    }

    return document.createElement(nodeName);
};
RepeaterView.prototype.setContentFragment = function (fragment) {
    for (var i = 0; i < fragment.childNodes.length; i ++) {
        var node = fragment.childNodes[i];
        if (!node.getAttribute) continue;

        var role = node.getAttribute("role");
        if (role == "header") {
            this.headerTemplate = node;
        } else if (role == "footer") {
            this.footerTemplate = node;
        } else if (role == "empty") {
            this.emptyTemplate = node;
        } else {
            this.itemTemplate = node;
        }
    }
};

RepeaterView.prototype.onAttached = function () {
    Dom.emitEvent("p:onAttached", this.node());
};

RepeaterView.prototype.createBinding = function (container) {
    container._binding = {};
    container._binding._node = container;
    widget.Util.performAutoBinding(container, container._binding, null, "forced");

    Dom.doOnChildRecursively(container, {
        eval: function(n) {
            return n.getAttribute && n.getAttribute("anon-id");
        }
    }, function(n) {
        var id = n.getAttribute("anon-id");

        if (container._binding) {
            container._binding[id] = n;
        }
        n.removeAttribute("anon-id");

        var newId = id + widget.random();
        n.setAttribute("id", newId);
        n.id = newId;
        Dom.addClass(n, "AnonId_" + id);
    });
}


RepeaterView.prototype.generate = function (container, templateNode, data, index) {
    var node = templateNode.cloneNode(true);
    this.createBinding(node);

    container.appendChild(node);

    if (this.populator && typeof(data) != "undefined") this.populator(data, node._binding, node, index);

    return node;
};
RepeaterView.prototype.getItems = function() {
    return this.items;
}
RepeaterView.prototype.setItems = function (items, doneCallback) {
    this.items = items;
    Dom.empty(this.node());
    if (!items || items.length <= 0) {
        if (this.emptyTemplate) {
            this.node().appendChild(this.generate(this.node(), this.emptyTemplate));
        }

        if (doneCallback) doneCallback.apply(this);
        return;
    }

    if (this.headerTemplate) {
        this.generate(this.node(), this.headerTemplate);
    }

    var container = this.node();
    if (this["content-wrapper-tag"]) {
        container = document.createElement(this["content-wrapper-tag"]);
        Dom.addClass(container, "ContentWrapper");

        this.node().appendChild(container);
    }
    if (this.itemTemplate) {
        for (var i = 0; i < items.length; i ++) {
            this.generate(container, this.itemTemplate, items[i], i);
        }
    }

    if (this.footerTemplate) {
        this.generate(this.node(), this.footerTemplate);
    }

    if (doneCallback) doneCallback.apply(this);
};
