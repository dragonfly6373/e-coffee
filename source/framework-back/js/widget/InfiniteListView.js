function InfiniteListView(node) {
    BaseTemplatedWidget.call(this);

    this.selectorId = node ? node.getAttribute("selector-id") : null;

    this.bind("scroll", this.handleScrolling, this.scrollPane);
    this.bind("click", this.handleClick);
    this.nodePool = [];

    this.chunkSize = 30;
}
__extend(BaseTemplatedWidget, InfiniteListView);

InfiniteListView.prototype.setSource = function (source) {
    if (document.body.contains(this.node())) {
        this._setSourceImpl(source);
    } else {
        this._pendingSource = source;
    }
};

InfiniteListView.prototype.onAttached = function () {
    if (this._pendingSource) {
        this._setSourceImpl(this._pendingSource);
        this._pendingSource = null;
    }
};
InfiniteListView.prototype._setSourceImpl = function (source) {
    this.source = source;
    this.reload();
};
InfiniteListView.prototype.reload = function () {
    this.items = [];
    this.averageItemHeight = -1;
    this.start = 0;
    this.end = -1;
    this.sourceDataCount = -1;
    this.initialized = false;

    this.initialize();
};
InfiniteListView.prototype.handleClick = function (event) {
    if (this.selectorId) {
        var selector = Dom.findUpwardForNodeWithData(event.target, "_isSelector");
        if (selector) {
            var itemView = Dom.findUpwardForNodeWithData(event.target, "_item");
            if (!itemView) return;
            var item = itemView._item;
            if (!item) return;
            var checked = event.target.checked;
            item.options.checked = checked;

            this.emitSelectionEvent();
        }
    }
};

InfiniteListView.prototype.handleScrolling = function () {
    // if (this.scrollHandlingTimeout) window.clearTimeout(this.scrollHandlingTimeout);
    //
    // this.scrollHandlingTimeout = window.setTimeout(this.handleScrollingImpl.bind(this), 30);
    this.handleScrollingImpl();
};
InfiniteListView.prototype.handleScrollingImpl = function () {
    this.scrollHandlingTimeout = null;
    if (!this.initialized) return;

    var H = this.scrollPane.scrollHeight;
    var h = this.scrollPane.clientHeight;
    var offset = this.scrollPane.scrollTop;

    var thiz = this;

    if (this.mayHaveMoreData()) {
        if (H - (offset + h) < h && !this.filling) {
            this.filling = true;
            this.fillNextDataChunk(function () {
                thiz.filling = false;
                thiz.handleScrollingImpl();
            });
        }
    }

    var y0 = offset - h;
    var y1 = y0 + 3 * h;

    var c = Math.max(Math.floor(y0 / this.averageItemHeight), 0);
    var d = Math.min(Math.ceil(y1 / this.averageItemHeight) + 1, this.items.length - 1);
    this._updateDisplaySegment(c, d);
};
InfiniteListView.prototype._updateDisplaySegment = function (c, d) {
    var a = this.start;
    var b = this.end;

    if (b > d) this._remove(Math.max(a, d + 1), false);
    if (c > a) this._remove(Math.min(c - 1, b), true);

    if (b < d) this._add(Math.max(c, b + 1), d, false);
    if (c < a) this._add(c, Math.min(a - 1, d), true);

    this.leadingPane.style.height = (Math.max(0, c) * this.averageItemHeight) + "px";
    this.trailingPane.style.height = (Math.max(0, this.items.length - d - 1) * this.averageItemHeight) + "px";

    this.start = c;
    this.end = d;
};
InfiniteListView.prototype._add = function (from, to, leading) {
    if (from > to) return;

    var fragment = this.contentPane.ownerDocument.createDocumentFragment();
    for (var i = from; i <= to; i ++) {
        var item = this.items[i];
        var itemNode = this.makeNewItemView(item);
        itemNode._data = item.data;
        itemNode._item = item;
        itemNode._index = i;
        fragment.appendChild(itemNode);

        if (this.selectorId) {
            var selector = itemNode._binding[this.selectorId];
            if (selector) selector.checked = item.options.checked ? true : false;
            selector._isSelector = true;
        }
    }

    if (leading && this.contentPane.firstChild) {
        this.contentPane.insertBefore(fragment, this.contentPane.firstChild);
    } else {
        this.contentPane.appendChild(fragment);
    }
};
InfiniteListView.prototype._remove = function (index, leading) {
    if (leading) {
        index = Math.min(index, this.end);

        if (index < this.start) return;
        for (var count = this.start; count <= index; count ++) {
            this.removeItemView(this.contentPane.firstChild);
        }
    } else {
        index = Math.max(index, this.start);

        if (index > this.end) return;
        for (var count = index; count <= this.end; count ++) {
            var i = count - this.start;
            this.removeItemView(this.contentPane.childNodes[index - this.start]);
        }
    }
};
InfiniteListView.prototype.fillNextDataChunk = function (callback) {
    Dom.addClass(this.node(), "FillingData");
    this.source.loadPage(this.items.length, this.chunkSize, function (result, count) {
        try {
            this.sourceDataCount = count;
            if (result) this.items = this.items.concat(result.map(function (item) { return {data: item, options: {}}; }));
            callback(result, count);
        } finally {
            Dom.removeClass(this.node(), "FillingData");
        }
    }.bind(this), function () {
        Dom.removeClass(this.node(), "FillingData");
    });
};
InfiniteListView.prototype.mayHaveMoreData = function () {
    return this.sourceDataCount < 0 || this.sourceDataCount > this.items.length;
};
InfiniteListView.prototype.initialize = function (callback) {
    var height = this.scrollPane.clientHeight;

    var thiz = this;
    this.contentPane.innerHTML = "";

    function postLoadingHandler() {
        thiz.start = 0;
        thiz.end = thiz.items.length;
        thiz.averageItemHeight = thiz.items.length ? Math.round(thiz.contentPane.clientHeight / thiz.items.length) : 0;
        thiz.scrollPane.scrollTop = 0;
        thiz.initialized = true;
        thiz.handleScrollingImpl();
        thiz.emitSelectionEvent();
        if (callback) callback();
    }

    var filledCount = 0;
    function next() {

        if (!thiz.mayHaveMoreData() || thiz.contentPane.offsetHeight >= 2 * height) {
            postLoadingHandler();
            return;
        }

        thiz.fillNextDataChunk(function (result, count) {
            for (var i = filledCount; i < thiz.items.length; i ++) {
                var item = thiz.items[i];
                var itemNode = thiz.makeNewItemView(item);
                itemNode._data = item.data;
                itemNode._item = item;
                itemNode._index = i;
                thiz.contentPane.appendChild(itemNode);
            }

            filledCount = thiz.items.length;

            next();
        });
    };

    next();
};
InfiniteListView.prototype.removeItemView = function (node) {
    if (!node) return;
    if (node.parentNode) node.parentNode.removeChild(node);
    this.nodePool.push(node);
};
InfiniteListView.prototype.makeNewItemView = function (item) {
    var node = this.generate(null, this.itemTemplate, item.data);
    if (this.selectorId) {
        var selector = node._binding[this.selectorId];
        selector._isSelector = true;
    }
    return node;
};
InfiniteListView.prototype.setContentFragment = function (fragment) {
    for (var i = 0; i < fragment.childNodes.length; i ++) {
        var node = fragment.childNodes[i];
        if (!node || node.nodeType != Node.ELEMENT_NODE) continue;
        var role = node.getAttribute("role");

        if (role == "item") {
            this.itemTemplate = node;
        }
    }
};

InfiniteListView.prototype.createBinding = function (container) {
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
};
InfiniteListView.prototype.generate = function (container, templateNode, data) {
    var node = null;
    if (this.nodePool.length > 0) {
        node = this.nodePool.shift();
    } else {
        node = templateNode.cloneNode(true);
        this.createBinding(node);
    }

    if (container) container.appendChild(node);

    if (this.populator && typeof(data) != "undefined") this.populator(data, node._binding, node);

    return node;
};
InfiniteListView.prototype.emitSelectionEvent = function () {
    Dom.emitEvent("p:SelectionChanged", this.node());
};
InfiniteListView.prototype.getSelectedItems = function () {
    var selectedItems = [];
    if (this.items) {
        this.items.forEach(function (item) {
            if (item.options.checked) selectedItems.push(item.data);
        });
    }

    return selectedItems;
};
