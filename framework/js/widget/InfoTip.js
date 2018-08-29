function InfoTip() {
    Popup.call(this);

    //avoid auto close
    this.skipStack = true;
    this.forceInside = false;
    this.useZIndex = false;
    this.popupOpacity = 0.999999;

    // this.bind("click", function () {
    //     this.hide();
    // }, this.tipClose);

    this.bind("p:PopupShown", this.handlePopupShown);
    this.bind("p:PopupHidden", this.handlePopupHidden);

    this.bind("click", function () {
        if (this.skipStack) this.close();
    }, this.popupContainer);

}
__extend(Popup, InfoTip);


InfoTip.prototype.setContentFragment = function (fragment) {
    this.contentHolder.appendChild(fragment);
};
InfoTip.prototype.setExplicitClose = function (explicitClose) {
    this.skipStack = explicitClose;
    Dom.toggleClass(this.popupContainer, "WithClose", explicitClose);
};
InfoTip.prototype.setType = function (type) {
    this.popupContainer.setAttribute("type", type || "");
};
InfoTip.prototype.handlePopupShown = function () {
    var thiz = this;
    (function tracker() {
        thiz.anchorTrackTimer = null;
        if (!document.body.contains(thiz.lastShowOptions.anchor)) {
            thiz.close();
            return;
        }
        try {
            thiz.invalidatePosition();
        } finally {
            thiz.anchorTrackTimer = window.setTimeout(tracker, 20);
        }
    })();
};
InfoTip.prototype.handlePopupHidden = function () {
    if (this.anchorTrackTimer) window.clearTimeout(this.anchorTrackTimer);
    this.anchorTrackTimer = null;
};

InfoTip.prototype.onBeforeVisible = function (x, y, hAlign, vAlign) {
    this.popupContainer.setAttribute("valign", vAlign);

    var scaleX = hAlign.indexOf("right") >= 0 ? -1 : 1;
    var scaleY = vAlign == "bottom" ? -1 : 1;
    this.balloon.onSizeChanged();
    this.balloon.svg.style.transform = "scale(" + scaleX + "," + scaleY + ")";
};
InfoTip.show = function (anchor, message, explicitClose, onClose, type, hAlign, offsetX, offsetY) {
    if (anchor.__tip && anchor.__tip.isVisible()) {
        anchor.__tip.hide();
        return;
    }
    var tip = new InfoTip();
    tip.setExplicitClose(explicitClose ? true : false);
    tip.setType(type);
    tip.setContentFragment(Dom.newDOMFragment([{_name: "div", "_text": message}]));
    if (onClose) Dom.registerEvent(tip.node(), "p:PopupHidden", onClose, false);
    var hPadding = typeof(offsetX) == "undefined" ? -5 : offsetX;
    var vPadding = typeof(offsetY) == "undefined" ? -7 : offsetY;
    console.log("hPadding: ", hPadding, "vPadding:" , vPadding);
    tip.show(anchor, hAlign ? hAlign : "left-inside", "top", hPadding, vPadding, "autoFlip");
    tip.onHide = function() {
        delete anchor.__tip;
    };
    tip.shouldCloseOnBlur = function(event) {
        var found = Dom.findUpward(event.target, function (node) {
            return node == anchor;
        });
        return !found;
    };
    anchor.__tip = tip;

    return tip;
};
