function ColorPicker() {
    BaseTemplatedWidget.call(this);

    this.bind("click", function () {
        this.popup.show(this.node(), "left-inside", "bottom", 0, 5, "autoFlip");
    });

    this.bind("p:PopupShown", function () {
        if (this.color) this.setColorInternal(this.color);
    }, this.popup.node());
    var thiz = this;
    this.bind("click", function () {
        var color = thiz._defaultColor ? this._defaultColor : ColorPicker.BLANK_COLOR;
        if (JSON.stringify(color) != JSON.stringify(this.color)) {
            this.setColorInternal(color);
            Dom.emitEvent("p:ValueChanged", this.node(), {});
        }
        this.popup.hide();
    }, this.clearButton);

    this.popup.setPopupClass("ColorPickerPopup");
    this.generateRecentColors();

    this.contributors = [];
    var thiz = this;

    this.setupScale(this.hueValueGrid,
        function (value) {
            return {
                x: value.x - Math.round(this._pin.offsetWidth / 2),
                y: value.y - Math.round(this._pin.offsetHeight / 2)
            }
        },
        function (value) {
            value.x = Math.max(0, Math.min(this.offsetWidth - 1, value.x));
            value.y = Math.max(0, Math.min(this.offsetHeight - 1, value.y));
        }, function (color, value) {
            return {
                h: Math.max(0, Math.min(359, Math.round(359 * value.x / (this.offsetWidth - 1)))),
                s: color.s,
                v: Math.max(0, Math.min(100, Math.round(100 * (1 - value.y / (this.offsetHeight - 1))))),
                a: color.a
            };
        }, function (color) {
            return {
                x: Math.round((this.offsetWidth - 1) * color.h / 359),
                y: (this.offsetHeight - 1) - Math.round((this.offsetHeight - 1) * color.v / 100)
            };
        });

    this.setupScale(this.satScale,
        function (value) {
            var border = 2;
            var height = this._pin.offsetHeight;

            var y = value.y - Math.round(height / 2);

            return {
                x: 0 - border,
                y: Math.max(0 - border, Math.min(this.offsetHeight - height, y))
            }
        },
        function (value) {
            value.x = 0;
            value.y = Math.max(0, Math.min(this.offsetHeight - 1, value.y));
        }, function (color, value) {
            return {
                h: color.h,
                s: Math.max(0, Math.min(100, Math.round(100 * (1 - value.y / (this.offsetHeight - 1))))),
                v: color.v,
                a: color.a
            }
        }, function (color) {
            var from = Color.fromHSV(color.h, 0, color.v).toRGBString();
            var to = Color.fromHSV(color.h, 100, color.v).toRGBString();

            ColorPicker.setGradientBackground(this, from, to);

            return {
                x: 0,
                y: (this.offsetHeight - 1) - Math.round((this.offsetHeight - 1) * color.s / 100)
            };
        });

    this.setupScale(this.opacityScale,
        function (value) {
            var border = 2;
            var height = this._pin.offsetHeight;

            var y = value.y - Math.round(height / 2);

            return {
                x: 0 - border,
                y: Math.max(0 - border, Math.min(this.offsetHeight - height, y))
            }
        },
        function (value) {
            value.x = 0;
            value.y = Math.max(0, Math.min(this.offsetHeight - 1, value.y));
        }, function (color, value) {
            return {
                h: color.h,
                s: color.s,
                v: color.v,
                a: Math.max(0, Math.min(1, 1 - value.y / (this.offsetHeight - 1)))
            };
        }, function (color) {
            var c = Color.fromHSV(color.h, color.s, color.v);
            c.a = 0;
            var from = c.toRGBAString();

            c.a = 1;
            var to = c.toRGBAString();

            ColorPicker.setGradientBackground(thiz.opacityBackground, from, to);

            return {
                x: 0,
                y: (this.offsetHeight - 1) - Math.round((this.offsetHeight - 1) * color.a)
            };
        });

    Dom.registerEvent(document, "mousemove", ColorPicker.handleGlobalMouseMove, false);
    Dom.registerEvent(document, "mouseup", ColorPicker.handleGlobalMouseUp, false);

    this.contributors.push({
        node: this.hexInput,
        output: function (color) {
            var c = Color.fromString(thiz.hexInput.value).getHSV();

            return {
                h: c.hue,
                s: c.saturation,
                v: c.value,
                a: color.a
            };
        },
        input: function (color) {
            thiz.hexInput.value = color.blank ? "" : Color.fromHSV(color.h, color.s, color.v).toRGBString();
        },
        event: "input"
    });
    this.contributors.push({
        node: this.opacityInput,
        output: function (color) {
            if (thiz.opacityInput.value.match(/^[\s]*([0-9]+)%[\s]*$/)) {
                return {
                    h: color.h,
                    s: color.s,
                    v: color.v,
                    a: Math.max(0, Math.min(100, parseInt(RegExp.$1, 10))) / 100
                };
            } else {
                return color;
            }
        },
        input: function (color) {
            thiz.opacityInput.value = Math.max(0, Math.min(100, Math.round(color.a * 100))) + "%";
        },
        event: "input"
    });


    this.bindContributors();
    this.setDefaultColor("#FFFFFF")
}
__extend(BaseTemplatedWidget, ColorPicker);

ColorPicker.PALETTE = ["#5FA5DC", "#7EC658", "#FCD836", "#FD9015", "#F86968", "#EB1D06", "#7E26DE", "#303030", "#FFFFFF"];
ColorPicker.BLANK_COLOR = {
    h: 0,
    s: 100,
    v: 100,
    a: 1,
    blank: true
};
ColorPicker.TRANSPARENT_COLOR = {
    h: 0,
    s: 100,
    v: 100,
    a: 0,
    blank: true
};

ColorPicker.prototype.onDetached = function() {
    if (this.popup) {
        this.popup.kill();
    }
}

ColorPicker.prototype.setDefaultColor = function (rgbaHex) {
    this._defaultColor = this.toColor(rgbaHex);
    this.setColorInternal(this._defaultColor);
}
ColorPicker.prototype.setInfoWhenDefaultColorSelected = function (msg) {
    this.infoWhenDefaultColorSelected = msg;
}
ColorPicker.prototype.generateRecentColors = function() {
    for (var i = 0; i < ColorPicker.PALETTE.length; i ++) {
        var color = ColorPicker.PALETTE[i];
        var div = this.node().ownerDocument.createElement("div");
        div.style.background = color;
        div._hex = color;
        this.recentColorsPane.appendChild(div);
    }

    this.bind("click", function (event) {
        var hex = Dom.findUpwardForData(event.target, "_hex");
        if (!hex) return;

        if (JSON.stringify(this.toColor(hex)) != JSON.stringify(this.color)) {
            this.setRGBAHexColorString(hex);
            Dom.emitEvent("p:ValueChanged", this.node(), {});
        }
    }, this.recentColorsPane);
};
ColorPicker.handleGlobalMouseMove = function (event) {
    if (!ColorPicker._heldInstance) return;
    Dom.cancelEvent(event);

    if (ColorPicker._heldScale) {
        ColorPicker.updateScaleValueFromEvent(ColorPicker._heldScale, event);
        Dom.emitEvent("p:ScaleValueChanged", ColorPicker._heldScale, {});
    }
};
ColorPicker.handleGlobalMouseUp = function (event) {
    ColorPicker._heldInstance = null;
};
ColorPicker.updateScaleValueFromEvent = function(scale, event) {
    var rect = scale.getBoundingClientRect();
    var value = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };

    ColorPicker.setScaleValue(scale, value);

    return value;
};
ColorPicker.setScaleValue = function(scale, value) {
    scale._valueNormalizer(value);
    var position = scale._positionMapper(value);

    scale._value = value;
    scale._pin.style.left = position.x + "px";
    scale._pin.style.top = position.y + "px";
};
ColorPicker.setGradientBackground = function (element, from, to) {
    var css = "background-repeat: no-repeat; background-image: -webkit-linear-gradient(90deg, _from, _to); background-image: -moz-linear-gradient(90deg, _from, _to); background-image: -ms-linear-gradient(90deg, _from, _to); background-image: -o-linear-gradient(90deg, _from, _to); background-image: linear-gradient(0deg, _from, _to);";
    css = css.replace(/_from/g, from).replace(/_to/g, to);
    element.setAttribute("style", css);
};
ColorPicker.prototype.setupScale = function (scale, positionMapper, valueNormalizer, output, input) {
    var pin = scale.getElementsByClassName("Pin")[0];
    scale._positionMapper = positionMapper;
    scale._valueNormalizer = valueNormalizer;
    scale._output = output;
    scale._input = input;
    scale._pin = pin;

    var thiz = this;
    Dom.registerEvent(scale, "mousedown", function (event) {
        Dom.cancelEvent(event);
        ColorPicker._heldInstance = thiz;
        ColorPicker._heldScale = scale;

        var value = ColorPicker.updateScaleValueFromEvent(scale, event);
        Dom.emitEvent("p:ScaleValueChanged", scale, {});
    }, false);

    this.contributors.push({
        node: scale,
        output: function (color) {
            return scale._output(color, scale._value);
        },
        input: function (color) {
            var value = scale._input(color);
            ColorPicker.setScaleValue(scale, value);
        },
        event: "p:ScaleValueChanged"
    });
};
ColorPicker.prototype.bindContributors = function () {
    for (var i = 0; i < this.contributors.length; i ++) {
        this.bindOneContributor(this.contributors[i]);
    }
};

ColorPicker.prototype.setColor = function (color) {
    if (!color) {
        this.setColorInternal(ColorPicker.BLANK_COLOR);
        return;
    }
    if (typeof color == "string") {
        if (color == "transparent") {
            this.setColorInternal(ColorPicker.TRANSPARENT_COLOR);
        } else {
            this.setRGBAHexColorString(color);
        }
    } else if (typeof color.r != "undefined") {
        this.setRGBAColor(color);
    }
};
ColorPicker.prototype.setRGBAColor = function (rgba) {
    var hsv = Color.RGB2HSV(rgba);

    var color = {
        h: hsv.hue,
        s: hsv.saturation,
        v: hsv.value,
        a: rgba.a || 1
    };

    this.setColorInternal(color);
};
ColorPicker.prototype.setRGBAHexColorString = function (hex) {
    this.setColorInternal(this.toColor(hex));
};
ColorPicker.prototype.toColor = function(hex) {
    var rgba = Color.fromString(hex);
    var hsv = Color.RGB2HSV(rgba);
    var color = {
        h: hsv.hue,
        s: hsv.saturation,
        v: hsv.value,
        a: typeof(rgba.a) == "undefined" ? 1 : rgba.a
    };
    return color;
}
ColorPicker.prototype.getRGBAHexColorString = function () {
    if (!this.color) return null;
    if (this.color.blank) return Color.fromHSVA(ColorPicker.TRANSPARENT_COLOR.h, ColorPicker.TRANSPARENT_COLOR.s, ColorPicker.TRANSPARENT_COLOR.v, ColorPicker.TRANSPARENT_COLOR.a).toString();
    var c = Color.fromHSVA(this.color.h, this.color.s, this.color.v, this.color.a);
    return c.toString();
};
ColorPicker.prototype.getRGBAColorString = function () {
    if (!this.color) return null;
    if (this.color.blank) return Color.fromHSVA(ColorPicker.TRANSPARENT_COLOR.h, ColorPicker.TRANSPARENT_COLOR.s, ColorPicker.TRANSPARENT_COLOR.v, ColorPicker.TRANSPARENT_COLOR.a).toRGBAString();
    var c = Color.fromHSVA(this.color.h, this.color.s, this.color.v, this.color.a);
    return c.toRGBAString();
};
ColorPicker.prototype.getRGBColorString = function () {
    if (!this.color) return null;
    if (this.color.blank) return Color.fromHSVA(ColorPicker.TRANSPARENT_COLOR.h, ColorPicker.TRANSPARENT_COLOR.s, ColorPicker.TRANSPARENT_COLOR.v, ColorPicker.TRANSPARENT_COLOR.a).toRGBString();
    var c = Color.fromHSVA(this.color.h, this.color.s, this.color.v, this.color.a);
    return c.toRGBString();
};
ColorPicker.prototype.getColor = function () {
    if (!this.color || this.color.blank) return null;
    return this.color;
};

ColorPicker.prototype.setColorInternal = function (color, fromContributor) {
    var c = Color.fromHSVA(color.h, color.s, color.v, color.a);
    this.colorDisplayInner.style.background = color.blank ? "transparent" : c.toRGBAString();

    var sameDefaultColor = typeof(this._defaultColor) != "undefined" && this._defaultColor.h == color.h
    && this._defaultColor.s == color.s && this._defaultColor.v == color.v && this._defaultColor.a == color.a;
    if (sameDefaultColor) {
        Dom.addClass(this.node(), "DefaultColor");
        this.infoText.innerHTML = this.infoWhenDefaultColorSelected || "";
        this.infoText.style.display = "block";
    } else {
        Dom.removeClass(this.node(), "DefaultColor");
        this.infoText.innerHTML = "";
        this.infoText.style.display = "none";
    }

    for (var i = 0; i < this.contributors.length; i ++) {
        var contributor = this.contributors[i];
        if (contributor != fromContributor) contributor.input(color);
    }

    this.color = color;

    //fire both user-action-result event and api-result event
    if (fromContributor) Dom.emitEvent("p:ValueChanged", this.node(), {});
    Dom.emitEvent("p:ValueUpdated", this.node(), {});
};

ColorPicker.prototype.bindOneContributor = function (contributor) {
    var thiz = this;
    Dom.registerEvent(contributor.node, contributor.event, function (event) {
        var color = contributor.output(thiz.color);
        thiz.setColorInternal(color, contributor);
    }, false);
};

ColorPicker.prototype.setEnable = function (enable) {
    this.node().disabled = !enable;
};
ColorPicker.prototype.isEnable = function () {
    return !this.node().disabled;
};
