function Popup() {
    BaseTemplatedWidget.call(this);

    this.forceInside = true;
    this.useZIndex = true;
    this.visible = false;
    this.minWidth = null;
}
__extend(BaseTemplatedWidget, Popup);
Popup.Z_INDEX = 9001;

Popup.prototype.onAttached = function () {
    if (this.popupContainer) {
        this.reparent();
        this.popupContainer.style.position = "absolute";
        this.popupContainer.style.left = "0px";
        this.popupContainer.style.top = "0px";
        this.hide();
    }
};
Popup.prototype.kill = function() {
    if (this.popupContainer && this.popupContainer.parentNode == this.node().ownerDocument.body) {
        this.popupContainer.parentNode.removeChild(this.popupContainer);
    }
}
Popup.prototype.setPopupClass = function (clazz) {
    Dom.addClass(this.popupContainer, clazz);
};
Popup.prototype.setMinWidth = function (minWidth) {
    //console.log("setMinWidth", minWidth);
    this.minWidth = minWidth;
};
Popup.prototype.closeUpward = function (event) {
    var thiz = this;
    var node = !event ? null : Dom.findUpward(event.target, function (n) {
        return n == thiz.popupContainer;
    });

    if (node) return;
    if (this.dontCloseUpward && this.dontCloseUpward(event)) return;
    this.hide();
    if (event) Dom.cancelEvent(event);

    if (this._parent) this._parent.closeUpward(event);
};
Popup.prototype.shouldCloseOnBlur = function () {
    return true;
};
Popup.prototype.checkToCloseParent = function (element) {
    var thiz = this;
    var handler = function (popup) {
        if (!popup._parent) return;

        var node = Dom.findUpward(element, function (n) {
            return n == popup._parent.popupContainer;
        });

        if (node) {
            popup._parent._keepShowing = true;
        } else {
            popup._parent._keepShowing = false;
        }

        handler(popup._parent);
    };

    handler(this);
};
Popup.prototype.setContentFragment = function (fragment) {
    this.popupContainer.appendChild(fragment);
};
Popup.prototype.reparent = function () {
    if (this.popupContainer.parentNode && this.popupContainer.parentNode != this.node().ownerDocument.body) {
        this.popupContainer.parentNode.removeChild(this.popupContainer);
        this.node().ownerDocument.body.appendChild(this.popupContainer);
    }
};
Popup.prototype.toggle = function (anchor, hAlign, vAlign, hPadding, vPadding, autoFlip) {
    if (this.isVisible()) {
        this.hide();
    } else {
        this.show(anchor, hAlign, vAlign, hPadding, vPadding, autoFlip);
    }
};
Popup.prototype.show = function (anchor, hAlign, vAlign, hPadding, vPadding, autoFlip) {
    this.reparent();

    if (this.mode) {
        this.popupContainer.setAttribute("mode", this.mode);
    }

    this.popupContainer.style.position = "absolute";
    this.popupContainer.style.left = "0px";
    this.popupContainer.style.top = "0px";
    this.popupContainer.style.width = "auto";
    this.popupContainer.style.height = "auto";

    this.popupContainer.style.visibility = "hidden";
    this.popupContainer.style.display = "block";
    this.popupContainer.style.height = "auto";
    this.popupContainer.style.overflow = "visible";

    var thiz = this;
    window.setTimeout(function () {
        thiz._showImpl(anchor, hAlign, vAlign, hPadding, vPadding, autoFlip);
    }, 10);
};
Popup.prototype.isVisible = function () {
    return this.visible;
};
Popup.prototype.showAt = function (x, y, skipEvent) {
    this.reparent();

    if (this.mode) {
        this.popupContainer.setAttribute("mode", this.mode);
    }

    this.popupContainer.style.position = "absolute";
    this.popupContainer.style.visibility = "hidden";
    this.popupContainer.style.display = "block";

    var w = this.popupContainer.offsetWidth;
    var h = this.popupContainer.offsetHeight;

    var screenW = document.body.offsetWidth - 10;
    var screenH = window.innerHeight - 10;

    if (y + h > screenH) {
        y = screenH - h;
    }

    if (x + w > screenW) {
        x = x - w;
    }

    this.popupContainer.style.position = "absolute";
    this.popupContainer.style.left = x + "px";
    this.popupContainer.style.top = y + "px";
    //if (this.useZIndex) this.popupContainer.style.zIndex = Popup.Z_INDEX;
    this.popupContainer.style.visibility = "inherit";
    this.popupContainer.style.opacity = this.popupOpacity || 1;
    this.visible = true;
    if (!skipEvent) Dom.emitEvent("p:PopupShown", this.node());
    if (!this.skipStack) {
        BaseWidget.registerClosable(this);
    }
};
Popup.prototype._calculatePosition = function (anchor, hAlign, vAlign, hPadding, vPadding) {
    var w = this.popupContainer.offsetWidth;
    var h = this.popupContainer.offsetHeight;

    var rect = anchor.getBoundingClientRect();
    var viewportRect = this.popupContainer.parentNode ? this.popupContainer.parentNode.getBoundingClientRect() : document.body.getBoundingClientRect();

    // var verticalScroll = "true" == Dom.getAttributeAsString(this.node(), "verticalScroll", "false");
    // if (verticalScroll && h > viewportRect.height * 0.5) {
    //     var nH = (h < (viewportRect.height * 0.75)) ? (h * 0.65) : (viewportRect.height * 0.45);
    //     h = nH;
    //     viewportRect.top = viewportRect.bottom - h;
    //     viewportRect.height = h;
    // }
    var aw = rect.width;
    var ah = rect.height;
    var ax = rect.left - viewportRect.left;
    var ay = rect.top - viewportRect.top;
    var p = hPadding || 0;

    var x = 0;
    if (hAlign == "left") x = ax - w - p;
    if (hAlign == "left-inside") x = ax + p;
    if (hAlign == "middle" || hAlign == "center") x = ax + aw / 2 - w / 2;
    if (hAlign == "right") x = ax + aw + p;
    if (hAlign == "right-inside") x = ax + aw - w - p;

    p = vPadding || p;

    var y = 0;

    if (vAlign == "top") y = ay - h - p;
    if (vAlign == "top-inside") y = ay + p;
    if (vAlign == "middle" || vAlign == "center") y = ay + ah / 2 - h / 2;
    if (vAlign == "bottom") y = ay + ah + p;
    if (vAlign == "bottom-inside") y = ay + ah - h - p;

    return {
        x: x, y: y,
        viewportWidth: viewportRect.width,
        viewportHeight: viewportRect.height,
        heightBelow: window.innerHeight - (rect.top + rect.height),
        heightAbove: rect.top,
        viewportTop: viewportRect.top
    };
};
Popup.prototype.invalidatePosition = function () {
    if (!this.lastShowOptions) return;
    this._showImpl(this.lastShowOptions.anchor,
        this.lastShowOptions.hAlign,
        this.lastShowOptions.vAlign,
        this.lastShowOptions.hPadding,
        this.lastShowOptions.vPadding,
        this.lastShowOptions.autoFlip,
        "skipEvent");
};
Popup.prototype._showImpl = function (anchor, hAlign, vAlign, hPadding, vPadding, autoFlip, skipEvent) {
    this.lastShowOptions = {
        anchor: anchor,
        hAlign: hAlign,
        vAlign: vAlign,
        hPadding: hPadding,
        vPadding: vPadding,
        autoFlip: autoFlip,
        skipEvent: skipEvent
    };
    var w = this.popupContainer.offsetWidth;
    var h = this.popupContainer.offsetHeight;

    if (this.minWidth && w < this.minWidth) {
        w = this.minWidth;
        this.popupContainer.style.width = this.minWidth + "px";
    }

    var p = this._calculatePosition(anchor, hAlign, vAlign, hPadding, vPadding);
    //h = Math.min(h, p.viewportHeight);

    var x = p.x;
    var y = p.y;

    //invalidate into view
    var screenW = p.viewportWidth - 10;
    if (x + w > screenW) {
        if (autoFlip && (hAlign == "right" || hAlign == "left-inside")) {
            hAlign = hAlign == "right" ? "left" : "right-inside";
            p = this._calculatePosition(anchor, hAlign, vAlign, hPadding, vPadding);
            x = p.x;
        } else {
            if (this.forceInside) x = screenW - w;
        }
    }
    var screenH = window.innerHeight - 10;

    if (y + p.viewportTop + h > screenH) {
        var fixedY = false;
        if (autoFlip && (vAlign == "bottom" || vAlign == "top-inside") && p.heightAbove > p.heightBelow) {
            vAlign = vAlign == "bottom" ? "top" : "bottom-inside";
            p = this._calculatePosition(anchor, hAlign, vAlign, hPadding, vPadding);
            y = p.y;
        } else {
            if (this.forceInside)  {
                this.popupContainer.style.height = (screenH - y) + "px";
                this.popupContainer.style.overflow = "auto";
            }
        }
    } else if (y + p.viewportTop < 0) {
        if (autoFlip && (vAlign == "top" || vAlign == "bottom-inside") && p.heightBelow > p.heightAbove) {
            vAlign = vAlign == "top" ? "bottom" : "top-inside";
            p = this._calculatePosition(anchor, hAlign, vAlign, hPadding, vPadding);
            y = p.y;
        }
    }

    var above = vAlign == "top" || vAlign == "bottom-inside";

    var displayHeight = h;
    if (above) {
        if (y + p.viewportTop < 0) {
            displayHeight -= (20 - p.viewportTop - y);
            y = 20 - p.viewportTop;
        }
    } else {
        if (y + p.viewportTop + h > screenH) {
            displayHeight = p.heightBelow - 20;
        }
    };

    if (this.onBeforeVisible) this.onBeforeVisible(x, y, hAlign, vAlign);
    this.popupContainer.style.position = "absolute";
    this.popupContainer.style.left = Math.max(0, x) + "px";
    this.popupContainer.style.top = Math.max(0, y) + "px";
    //this.popupContainer.style.width = w + "px";
    var verticalScroll = "true" == Dom.getAttributeAsString(this.node(), "verticalScroll", "false");
    if (verticalScroll && displayHeight < h) {
        //console.log("p.viewportHeight: " + p.viewportHeight + ", h: " + h);
        this.popupContainer.style.height = displayHeight + "px";
        var skipControllingOverflowStyle = "true" == Dom.getAttributeAsString(this.node(), "skipControllingOverflowStyle", "false");
        if (!skipControllingOverflowStyle) this.popupContainer.style.overflow = "auto";
    }
    //if (this.useZIndex) this.popupContainer.style.zIndex = Popup.Z_INDEX;
    this.popupContainer.style.visibility = "inherit";
    this.popupContainer.style.display = verticalScroll ? "flex" : "block";
    this.popupContainer.style.opacity = this.popupOpacity || 1;

    this.visible = true;
    if (!skipEvent) Dom.emitEvent("p:PopupShown", this.node());

    if (!this.skipStack) {
        BaseWidget.registerClosable(this);
    }
};
Popup.prototype.close = function () {
    this.hide();
};
Popup.prototype.getClosableContainer = function () {
    return this.popupContainer;
};
Popup.prototype.hide = function (silent) {
    this.popupContainer.style.display = "none";
    this.popupContainer.style.opacity = 0;
    this.popupContainer.style.visibility = "hidden";
    this.visible = false;
    if (!silent) Dom.emitEvent("p:PopupHidden", this.node());
    if (this.onHide) this.onHide();

    BaseWidget.unregisterClosable(this);
    // if (this._parent) {
    //     if (!this._parent._keepShowing) {
    //        this._parent.hide();
    //    } else {
    //        this._parent._keepShowing = false;
    //    }
    // }
};
