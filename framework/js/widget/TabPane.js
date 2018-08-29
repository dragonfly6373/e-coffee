function TabPane(node) {
    BaseTemplatedWidget.call(this);
    this.headers = [];
    this.activeTabHeader = null;
    
    this.keepSamePaneSize = node ? (node.getAttribute("same-pane-size") != "false") : true;

    this.bind("click", this.handleHeaderClick, this.header);
    this.bind("e:SizeChange", this.ensureSizing, this.content);
    
    if (this.keepSamePaneSize) Dom.addClass(this.node(), "SamePaneSize");
}

__extend(BaseTemplatedWidget, TabPane);

TabPane.prototype.setContentFragment = function (fragment) {
    for (var i = 0; i < fragment.childNodes.length; i ++) {
        var node = fragment.childNodes[i];
        if (!node.nodeName || !node.getAttribute) continue;

        var title = node.getAttribute("tab-title");
        this.addTab(title, node);
    }

};
TabPane.prototype.getTabs = function () {
    var tabs = [];
    for (var i = 0; i < this.headers.length; i ++) {
        var header = this.headers[i];
        var contentNode = header._contentNode;
        if (contentNode) {
            tabs.push({
                title: header._title,
                contentNode: contentNode,
                header: header
            });
        }
    }
    
    return tabs;
};
TabPane.prototype.addTab = function (title, contentNode) {
    var children = [
        {_name: "span", _text: title}
    ];
    
    if (this.withCloseButton) {
        children.push({_name: "icon", "class": "close"});
    }
    
    var header = Dom.newDOMElement({
        _name: "hbox",
        "class": "TabHeader",
        _children: children
    });
    header._title = title;

    this.header.appendChild(header);
    this.content.appendChild(contentNode);

    header._contentNode = contentNode;
    Dom.addClass(contentNode, "TabBody");

    this.headers.push(header);

    if (!this.activeTabHeader || contentNode.getAttribute("active") == "true") this.activateTab(header);
};
TabPane.prototype.activateTab = function (header) {
    for (var i = 0; i < this.headers.length; i ++) {
        var h = this.headers[i];
        if (h == header) {
            Dom.addClass(h, "ActiveTab");
            Dom.addClass(h._contentNode, "ActiveTab");
            this.activeTabHeader = header;
        } else {
            Dom.removeClass(h, "ActiveTab");
            Dom.removeClass(h._contentNode, "ActiveTab");
        }
    }
    Dom.emitEvent("e:TabChange", this.node());

    BaseWidget.signalOnSizeChangedRecursively(this.node());
};
TabPane.prototype._removeTabByHeader = function (header) {
    var prev = header.previousElementSibling;
    var next = header.nextElementSibling;
    var focusSibling = (header == this.activeTabHeader);
    header.parentNode.removeChild(header);
    header._contentNode.parentNode.removeChild(header._contentNode);
    
    var i = this.headers.indexOf(header);
    if (i >= 0) {
        this.headers.splice(i, 1);
    }
    
    if (focusSibling && (prev || next)) {
        console.log("focusing", prev || next);
        this.activateTab(prev || next);
    }
};
TabPane.prototype.handleHeaderClick = function (event) {
    var header = Dom.findUpwardForNodeWithData(event.target, "_contentNode");
    if (!header) return;
    
    var thiz = this;
    if (this.withCloseButton) {
        var close = Dom.findParentWithClass(event.target, "close");
        if (close) {
            if (this.canCloseTab) {
                this.canCloseTab(header._contentNode, function (closable) {
                    if (closable) thiz._removeTabByHeader(header);
                })
            } else {
                this._removeTabByHeader(header);
            }
            return;
        }
    }
    
    this.activateTab(header);
};
TabPane.prototype.getActiveTabPane = function () {
    if (!this.activeTabHeader) return null;
    return this.activeTabHeader._contentNode;
};
TabPane.prototype.setActiveTabPane = function (pane) {
    for (var i = 0; i < this.headers.length; i ++) {
        var h = this.headers[i];
        if (h._contentNode == pane) {
            this.activateTab(h);
            return;
        }
    }
};
TabPane.prototype.onSizeChanged = function () {
	this.ensureSizing();
};
TabPane.prototype.ensureSizing = function () {
    if (!this.keepSamePaneSize) return;
    
    var resize = true;
    if (this.node().getAttribute("flex") && this.node().parentNode && this.node().parentNode.nodeName == "vbox") {
        resize = false;
    }

    var w = Dom.getOffsetWidth(this.node()) - 2;
    var h = 0;

    for (var i = 0; i < this.headers.length; i ++) {
        var contentNode = this.headers[i]._contentNode;
        Dom.removeClass(contentNode, "Measured");
        var cw = Dom.getOffsetWidth(contentNode);
        var ch = Dom.getOffsetHeight(contentNode);

        h = Math.max(h, ch);
    }

    this.content.style.width = w + "px";

    if (resize) {
        this.content.style.height = h + "px";
    }

    for (var i = 0; i < this.headers.length; i ++) {
        var contentNode = this.headers[i]._contentNode;
        Dom.addClass(contentNode, "Measured");
    }
};
TabPane.prototype.onAttached = function () {
    this.ensureSizing();
    var thiz = this;
    window.setTimeout(function () {
        thiz.ensureSizing();
    	BaseWidget.signalOnSizeChangedRecursively(thiz.node());
    }, 100);
};
TabPane.prototype._setupNavigationModule = function () {
    var thiz = this;
    this._navigationModule = {
        navigate: function (name, callback) {
            var tab = null;
            for (var i = 0; i < thiz.headers.length; i ++) {
                var h = thiz.headers[i];
                if (h._contentNode && thiz._getTabName(h._contentNode) == name) {
                    tab = h._contentNode;
                    break;
                }
            }
            
            if (!tab) {
                callback(null);
                return;
            }
            
            thiz.setActiveTabPane(tab);
            callback(thiz._getTabNavigationModule(tab));
        },
        close: function () {}
    };
    
    this.addEventListener("e:TabChange", function (e) {
        if (e.target != thiz.node()) return;
        var tab = thiz.getActiveTabPane();
        if (!tab) return;
        var name = thiz._getTabName(tab);
        if (!name) return;
        CommonNavigation.onNavigateToChildModule(thiz._navigationModule, name, thiz._getTabNavigationModule(tab));
    }, false);
};
TabPane.prototype._getTabName = function (tab) {
    return tab.getAttribute("tab-name");
};

TabPane.KEY_NAVIGATION_MODULE = "_tabPane:navigationModule";

TabPane.prototype._getTabNavigationModule = function (tab) {
    if (!tab[TabPane.KEY_NAVIGATION_MODULE]) {
        var module = (tab.__widget && tab.__widget.getNavigationModule) ? tab.__widget.getNavigationModule() : CommonNavigation.newUnnavigatableModule();
        tab[TabPane.KEY_NAVIGATION_MODULE] = module;
    }
    
    return tab[TabPane.KEY_NAVIGATION_MODULE];
};

TabPane.prototype.getNavigationModule = function () {
    if (!this._navigationModule) this._setupNavigationModule();
    return this._navigationModule;
};
