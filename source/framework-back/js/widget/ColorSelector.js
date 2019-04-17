function ColorSelector() {
    BaseTemplatedWidget.call(this);
    this.color = Color.fromString("#DA8500");
    this.invalidateUI();
    this.initializeGridSelector();

    //get the radius
    this.pinHeld = false;

    this.updatingColor = true;

    var thiz = this;
    //register the event handler
    // wheel selector event handler
    this.htmlCodeInput.addEventListener("change", function(event) {
        var val = thiz.htmlCodeInput.value;
        if (val == "") {
            thiz.htmlCodeInput.value = thiz.color.toRGBString() || "";
            return;
        }
        var uppercaseVal = val.toRGBString ? val.toRGBString().toUpperCase() : (val.toUpperCase ? val.toUpperCase() : val);
        // Translate standard HTML color strings:
        if (uppercaseVal[0] != "#") {
            switch (val) {
                case "GREEN":
                    uppercaseVal = "#008000";
                    break;
                case "LIME":
                    uppercaseVal = "#00FF00";
                    break;
                case "OLIVE":
                    uppercaseVal = "#808000";
                    break;
                case "TEAL":
                    uppercaseVal = "#008080";
                    break;
                case "YELLOW":
                    uppercaseVal = "#FFFF00";
                    break;
                case "RED":
                    uppercaseVal = "#FF0000";
                    break;
                case "MAROON":
                    uppercaseVal = "#800000";
                    break;
                case "PURPLE":
                    uppercaseVal = "#800080";
                    break;
                case "FUCHSIA":
                    uppercaseVal = "#FF00FF";
                    break;
                case "NAVY":
                    uppercaseVal = "#000080";
                    break;
                case "BLUE":
                    uppercaseVal = "#0000FF";
                    break;
                case "AQUA":
                    uppercaseVal = "#00FFFF";
                    break;
                case "WHITE":
                    uppercaseVal = "#FFFFFF";
                    break;
                case "SILVER":
                    uppercaseVal = "#CC0C0C0";
                    break;
                case "GRAY":
                    uppercaseVal = "#808080";
                    break;
                default: // BLACK
                    uppercaseVal = "#000000";
                    break;
            }
        } else if (uppercaseVal.length > 7) {
            uppercaseVal = uppercaseVal.substring(7);
        }

        var a = thiz.color.a;
        thiz.color = Color.fromString(uppercaseVal);
        thiz.color.a = a;
        thiz.onValueChanged(thiz.htmlCodeInput);
    }, false);
    this.brightScale.addEventListener("change", function(event) {
        var hsv = thiz.color.getHSV();
        var a = thiz.color.a;

        thiz.color = Color.fromHSV(hsv.hue, hsv.saturation, thiz.brightScale.value);
        thiz.color.a = a;
        thiz.onValueChanged(thiz.brightScale);
    }, false);
    this.brightScale.addEventListener("mouseup", function(event) {
        // thiz._emitChangeEvent();
    }, false);

    this.opacity.addEventListener("change", function(event) {
        thiz.color.a = thiz.opacity.value / 100;
        thiz.onValueChanged(thiz.opacity);
    }, false);


    this.bright.addEventListener("input", function(event) {
        if (!thiz.bright.value) thiz.bright.value = 0;

        var hsv = thiz.color.getHSV();
        var a = thiz.color.a;

        thiz.color = Color.fromHSV(hsv.hue, hsv.saturation, thiz.bright.value);
        thiz.color.a = a;
        thiz.onValueChanged(thiz.bright);
    }, false);

    this.hue.addEventListener("input", function(event) {
        if (!thiz.hue.value) thiz.hue.value = 0;

        var hsv = thiz.color.getHSV();
        var a = thiz.color.a;

        thiz.color = Color.fromHSV(thiz.hue.value, hsv.saturation, hsv.value);
        thiz.color.a = a;
        thiz.onValueChanged(thiz.hue);
    }, false);
    this.sat.addEventListener("input", function(event) {
        if (!thiz.sat.value) thiz.sat.value = 0;

        var hsv = thiz.color.getHSV();
        var a = thiz.color.a;

        thiz.color = Color.fromHSV(hsv.hue, thiz.sat.value, hsv.value);
        thiz.color.a = a;
        thiz.onValueChanged(thiz.sat);
    }, false);
    this.wheelOverlay.addEventListener("mousedown", function(event) {
        if (thiz.getAttribute("disabled")) return;
        ColorSelector.heldInstance = thiz;
        var r = thiz.wheelOverlay.getBoundingClientRect();
        var x = event.clientX - r.left;
        var y = event.clientY - r.top;

        var r = Math.sqrt((thiz.radius - x) * (thiz.radius - x) + (thiz.radius - y) * (thiz.radius - y));

        if (r > thiz.radius) {
            return;
        }

        thiz.pin.style.left = x + "px";
        thiz.pin.style.top = y + "px";
        thiz.pinHeld = true;

        var h = Math.round(Math.atan2(thiz.radius - y, x - thiz.radius) * 180 / Math.PI);
        h = (h + 360) % 360;

        var s = Math.round(r * 100 / thiz.radius);

        var value = thiz.color.getHSV().value;
        if (value == 0) value = 100;
        var a = thiz.color.a;

        thiz.color = Color.fromHSV(h, s, value);
        thiz.color.a = a;
        thiz.onValueChanged(thiz.wheelImage);
        thiz.clearSelectedColor(thiz.recentlyUsedColor);
    }, false);

    if (this.hasAttribute("color")) {
        this.setColor(Color.fromString(this.getAttribute("color")));
    } else {
        this.setColor(new Color());
    }

    this.gridSelectorContainer.addEventListener("click", function (event) {
        var colorCell = Dom.findUpward(event.target, function (n) {
            return n.hasAttribute("color");
        });
        if (!colorCell) return;
        thiz.updatingColor = false;
        thiz.selectColorCell(colorCell);
        thiz._emitCloseEvent();
    }, false);
}
__extend(BaseTemplatedWidget, ColorSelector);

ColorSelector.heldInstance = null;

/*
    Register global event listener
 */
document.addEventListener("mousemove", function (event) {
    if (!ColorSelector.heldInstance) return;
    ColorSelector.heldInstance._handleMouseMove(event);
}, false);

document.addEventListener("mouseup", function (event) {
    if (!ColorSelector.heldInstance) return;
    ColorSelector.heldInstance._handleMouseUp(event);
    ColorSelector.heldInstance = null;
}, false);

ColorSelector.prototype.onInsertedIntoDocument = function () {
    var thiz = this;
    window.setTimeout(function () {
        thiz.radius = thiz.wheelImage.offsetWidth / 2;
        thiz.invalidateUI();
    }, 10);
};
ColorSelector.prototype._handleMouseMove = function (event) {
    event.preventDefault();

    var r = this.wheelOverlay.getBoundingClientRect();
    var x = event.clientX - r.left;
    var y = event.clientY - r.top;

    var r = Math.sqrt((this.radius - x) * (this.radius - x) + (this.radius - y) * (this.radius - y));

    if (r > this.radius) {
        x = Math.round(this.radius * (r - this.radius + x) / r);
        y = Math.round(this.radius * (r - this.radius + y) / r);

        r = this.radius;
    }

    this.pin.style.left = x + "px";
    this.pin.style.top = y + "px";

    var h = Math.round(Math.atan2(this.radius - y, x - this.radius) * 180 / Math.PI);
    h = (h + 360) % 360;

    var s = Math.round(r * 100 / this.radius);
    var value = this.color.getHSV().value;
    var a = this.color.a;

    this.color = Color.fromHSV(h, s, value);
    this.color.a = a;
    this.updatingColor = true;
    this.onValueChanged(this.wheelImage);
};
ColorSelector.prototype._handleMouseUp = function (event) {
    this.pinHeld = false;
    this.updatingColor = false;
};
ColorSelector.prototype._handleHueSatNumberChange = function () {
    var hsv = this.color.getHSV();
    var h = hsv.hue;
    var s = hsv.saturation;
    var a = (h <= 180 ? h : h - 360) * Math.PI / 180;

    var x = this.radius + Math.round(this.radius * (s / 100) * Math.cos(a));
    var y = this.radius - Math.round(this.radius * (s / 100) * Math.sin(a));

    this.pin.style.left = x + "px";
    this.pin.style.top = y + "px";
};
ColorSelector.prototype._emitChangeEvent = function () {
    if (this._disableEventFiringOnce) {
        this._disableEventFiringOnce = false;
        return;
    }
    var event = document.createEvent("Events");
    event.initEvent("ValueChange", false, false);
    this.dispatchEvent(event);
};
ColorSelector.prototype._emitCloseEvent = function () {
    Dom.emitEvent("p:CloseColorSelector", this.node(), {});
};
ColorSelector.prototype._changHS = function (hue, sat) {
    this.hue.value = hue;
    this.sat.value = sat;
    this._emitChangeEvent();
};
ColorSelector.prototype.setColor = function (color) {
    this.selectedCell = null;
    this.color = color;
    this.onValueChanged();
    if (!this.selectedCell) {
        var uppercaseVal = this.color.toRGBString().toUpperCase();
    }
};
ColorSelector.prototype.setGridSelectorColor = function () {
    if (!this._initialized) this.initializeGridSelector();

    var uppercaseVal = this.color.toRGBString().toUpperCase();

    var thiz = this;
    Dom.doOnChildRecursively(this.gridSelectorContainer, function (n) {
        if (n.getAttribute) {
            if (n.getAttribute("color") == uppercaseVal) {
                n.setAttribute("selected", "true");
                thiz.selectedCell = n;
            } else {
                n.removeAttribute("selected");
            }
        }
    });
};
ColorSelector.prototype.initializeGridSelector = function () {
    if (this._initialized) return;
    this._initialized = true;
};
ColorSelector.prototype.clearSelectedColor = function (parentNode) {
    Dom.doOnAllChildren(parentNode, function (n) {
        if (n.removeAttribute) n.removeAttribute("selected");
    });
};
ColorSelector.prototype.selectColorCell = function (cell, selectFromRecentlyUsedColors) {
    //change selected cell
    if (this.selectedCell) {
        this.selectedCell.removeAttribute("selected");
    }
    this.selectedCell = cell;
    this.selectedCell.setAttribute("selected", "true");

    if (selectFromRecentlyUsedColors) {
        this.color =  Color.fromString(cell.getAttribute("color"));
        this.onValueChanged();
    } else {
        var a = this.color.a;
        this.color =  Color.fromString(cell.getAttribute("color"));
        this.color.a = a;

        this.onValueChanged(this.gridSelectorContainer);
    }
};
ColorSelector.prototype.isColorCell = function (cell) {
    return cell && cell.nodeType != 3 && cell.hasAttribute("color");
};
ColorSelector.prototype.getColor = function () {
    return this.color;
};
ColorSelector.prototype.isModified = function () {
    return this.isUserModified;
};
ColorSelector.prototype.onAttached = function () {
    var thiz = this;
    thiz.radius = thiz.wheelImage.offsetWidth / 2;
    window.setTimeout(function () {
        thiz.radius = thiz.wheelImage.offsetWidth / 2;
    }, 10);
};
ColorSelector.prototype.invalidateUI = function (source) {
    this.previewBox.style.backgroundColor = this.color.toRGBAString();
    if (source) this.isUserModified = true;
    var hsv = this.color.getHSV();

    if (source != this.hue) this.hue.value = hsv.hue;
    if (source != this.sat) this.sat.value = hsv.saturation;
    if (source != this.bright) this.bright.value = hsv.value;
    if (source != this.brightScale) this.brightScale.value = hsv.value;
    if (source != this.htmlCodeInput) this.htmlCodeInput.value = this.color.toRGBString();
    if (source != this.opacity) this.opacity.value = Math.round(this.color.a * 100);
    this.opacityText.innerHTML = Math.round(this.color.a * 100) + "%";

    if (source != this.wheelImage) this._handleHueSatNumberChange();
    if (source != this.gridSelectorContainer) this.setGridSelectorColor();

    this.previewBox.style.backgroundColor = this.color.toRGBAString();
};
ColorSelector.prototype.onValueChanged = function (source) {
    this.invalidateUI(source);
    //this.clearSelectedColor(this.recentlyUsedColor);
    this._emitChangeEvent();
};
