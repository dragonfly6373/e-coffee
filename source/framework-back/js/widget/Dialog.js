function Dialog() {
    BaseTemplatedWidget.call(this);

    this.bind("click", this.handleActionClick, this.dialogFooter);
    this.bind("click", this.handleCloseClick, this.dialogClose);
    this.bind("mousedown", this.handleHeaderMouseDown, this.dialogHeaderPane);
    this.bind("keypress", this.handleBodyKeyPress, this.dialogBody);

    Dialog.ensureGlobalHandlers();
}
__extend(BaseTemplatedWidget, Dialog);

Dialog.ACTION_CANCEL = { type: "cancel", title: "Cancel", run: function () { return true; } };
Dialog.ACTION_CLOSE = { type: "cancel", title: "Close", run: function () { return true; } };

Dialog.ensureGlobalHandlers = function () {
    if (Dialog.globalHandlersRegistered) return;

    Dialog.getOwnerDocument().addEventListener("mousemove", Dialog.globalMouseMoveHandler, false);
    Dialog.getOwnerDocument().addEventListener("mouseup", function (event) {
        Dialog.heldInstance = null;
    }, false);

    Dialog.globalHandlersRegistered = true;
};

Dialog.prototype.canCloseNow = function () {
    if (this._busyCount) return false;

    if (this.closeHandler) return this.closeHandler.apply(this);
    return false;
}
Dialog.prototype.isEmbedded = function () {
    return this._container ? true : false;
}
Dialog.prototype.getFrameTemplate = function () {
    return BaseTemplatedWidget.getTemplatePrefix() + "Dialog.xhtml";
};
Dialog.prototype.buildDOMNode = function () {
    var frameTemplate = this.getFrameTemplate();
    var node = widget.Util.loadTemplateAsNodeSync(frameTemplate, this);

    //load also the sub-class template into the dialog body
    //please note that the binding will be done for both templates
    var contentNode = this.buildContentNode();

    if (this.grabHeight && !this.dontStretchBody) contentNode.setAttribute("flex", "1");
    this.dialogBody.appendChild(contentNode);

    return node;
};
Dialog.prototype.buildContentNode = function () {
    return widget.Util.loadTemplateAsNodeSync(this.getTemplatePath(), this, Dialog.getOwnerDocument());
};
Dialog.prototype.open = function (options) {
    var postSetupAction = function () {
        this.invalidateElements();
        this.show();
    }.bind(this);

    if (this.setup) {
        this.setup(options);
        postSetupAction();
    } else if (this.asyncSetup) {
        this.asyncSetup(options, postSetupAction);
    } else {
        postSetupAction();
    }
};
const DIALOG_BUTTON_ORDER = {
    "accept": Util.linux ? 10 : 1,
    "cancel": Util.linux ? 1 : 10,
    "extra1": -10,
    "extra2": -9,
    "extra3": -8
};
Dialog.prototype.invalidateElements = function () {
    var actions = this.getDialogActions();

    var startActions = [];
    var endOptions = [];

    this.closeHandler = null;
    this.positiveHandler = null;
    this.primaryButton = null;

    actions.forEach(function (a) {
        if (a.isValid && !a.isValid()) return;
        a.order = a.order || DIALOG_BUTTON_ORDER[a.type];
        if (typeof(a.order) == "undefined") a.order = -99;

        if (a.type == "cancel") {
            this.closeHandler = a.run;
        } else if (a.type == "accept") {
            this.positiveHandler = a.run;
        }
    }, this);

    actions.sort(function (a1, a2) {
        return a1.order - a2.order;
    });

    Dom.empty(this.dialogFooterStartPane);
    Dom.empty(this.dialogFooterMiddlePane);
    Dom.empty(this.dialogFooterEndPane);

    actions.forEach(function (a) {
        if (a.isApplicable && !a.isApplicable()) return;

        var button = this.createButton(a);
        if (a.order < 0) {
            this.dialogFooterStartPane.appendChild(button);
        } else if (a.order == 0) {
            this.dialogFooterMiddlePane.appendChild(button);
        } else {
            this.dialogFooterEndPane.appendChild(button);
        }

        if (a.type == "accept") this.primaryButton = button;
    }, this);


    Dom.empty(this.dialogTitle);
    this.dialogTitle.appendChild(Dialog.getOwnerDocument().createTextNode(this.e(this.title)));

    Dom.empty(this.dialogSubTitle);
    this.dialogSubTitle.appendChild(Dialog.getOwnerDocument().createTextNode(this.e(this.subTitle || "")));

    this.dialogClose.style.display = this.closeHandler ? "inline-block" : "none";

    if (this.onInvalidateElements) {
        this.onInvalidateElements();
    }
};

Dialog.prototype.createButton = function (action) {
    var button = Dialog.getOwnerDocument().createElement("button");
    button._action = action;
    var icon = this.e(action.icon);
    if (icon) {
        var i = Dialog.getOwnerDocument().createElement("i");
        i.appendChild(Dialog.getOwnerDocument().createTextNode(icon));
        button.appendChild(i);
    }

    var text = this.e(action.title);
    button.appendChild(Dialog.getOwnerDocument().createTextNode(text));
    button.setAttribute("mode", action.type);
    if (action.type == "accept") button.setAttribute("role", "primary");

    var disabled = action.isEnabled && !action.isEnabled();
    if (disabled) button.setAttribute("disabled", "true");

    return button;
};
Dialog.prototype.into = function(container, data) {
    this._container = container;
    this.callback(function(edited) {
    }).open(data);
    return this;
}
Dialog.prototype.getFrameOverflowStyle = function () {
    return "visible";
};
Dialog.prototype.show = function () {
    this._originalFocusedTarget = Dialog.lastFocusedTarget;
    this.dialogFrame.parentNode.removeChild(this.dialogFrame);

    var viewport = window;

    if (this.overlay) {
        if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    }
    if (this._container) {
        Dom.empty(this._container);
        this._container.appendChild(this.dialogFrame);
    } else {
        this.overlay = Dialog.getOwnerDocument().createElement("div");
        Dom.addClass(this.overlay, "Sys_DialogOverlay");
        Dom.addClass(this.overlay, "Sys_DialogOverlay_" + this.constructor.name);
        if (this.getDialogOverlayExtraClass) Dom.addClass(this.overlay, this.getDialogOverlayExtraClass());
        Dialog.getOwnerDocument().body.appendChild(this.overlay);
        Dialog.getOwnerDocument().body.appendChild(this.dialogFrame);
    }
    this.dialogFrame.style.left = "0px";
    this.dialogFrame.style.top = "0px";
    this.dialogFrame.style.position = "absolute";
    this.dialogFrame.style.visibility = "hidden";
    this.dialogFrame.style.display = "flex";
    this.dialogFrame.style.height = "auto";
    this.dialogFrame.style.overflow = this.getFrameOverflowStyle();
    this.dialogFrame.style.opacity = "0";
    this.dialogFrame.style.transition = "opacity 0.1s";
    this.dialogBody.style.height = null;

    var thiz = this;
    setTimeout(function () {

        if (thiz._container) {
            thiz.dialogFrame.style.right = "0px";
            thiz.dialogFrame.style.bottom = "0px";
            thiz.dialogFrame.style.height = "100%";
            thiz.dialogFrame.style.width = "100%";
        } else {
            var offset = thiz.getInnerOffset();
            var maxW = viewport.innerWidth - offset.w;
            var maxH = viewport.innerHeight - offset.h;

            var w = thiz.dialogFrame.offsetWidth;
            var h = thiz.dialogFrame.offsetHeight;

            var height = thiz.grabHeight ? maxH : Math.min(maxH, h);
            var width = thiz.grabWidth ? maxW : Math.min(maxW, w);

            thiz.dialogFrame.style.width = width + "px";
            thiz.dialogFrame.style.height = height + "px";
            thiz.dialogBody.style.height = thiz.dialogBody.offsetHeight + "px";
        }

        thiz.dialogFrame.style.visibility = "visible";
        thiz.dialogFrame.style.opacity = "1";

        thiz.dialogFrame.focus();
        if (thiz.onShown) thiz.onShown();

        if (!thiz._container) {
            thiz.alignToCenterWindow();
        }
    }, 100);

    BaseWidget.registerClosable(this);
};
Dialog.prototype.getInnerOffset = function () {
    return {w: 20, h: 6};
};
Dialog.prototype.invalidateSizing = function () {
    if (this._container) return;
    var viewport = Dialog.getOwnerWindow();

    var offset = this.getInnerOffset();
    var maxW = viewport.innerWidth - offset.w;
    var maxH = viewport.innerHeight - offset.h;

    this.dialogFrame.style.height = "auto";
    this.dialogBody.style.height = null;
    var h = this.dialogFrame.offsetHeight;
    var height = this.grabHeight ? maxH : Math.min(maxH, h);

    this.dialogFrame.style.height = height + "px";
    this.dialogBody.style.height = this.dialogBody.offsetHeight + "px";

    this.alignToCenterWindow();
};
Dialog.prototype.alignToCenterWindow = function () {
    if (this._container) return;
    var viewport = Dialog.getOwnerWindow();

    var screenW = viewport.innerWidth;
    var screenH = viewport.innerHeight;

    var w = this.dialogFrame.offsetWidth;
    var h = this.dialogFrame.offsetHeight;

    var x = (screenW - w) / 2;
    var y = (screenH - h) / 3; //NOTE: not actually centered. Having the dialog pulled up a little bit is better

    this.moveTo(x, y);
};
Dialog.prototype.moveTo = function (x, y) {
    this.dialogFrame.style.left = x + "px";
    this.dialogFrame.style.top = Math.max(y, 0) + "px";
    this.dialogX = x;
    this.dialogY = y;
};
Dialog.prototype.moveBy = function (dx, dy) {
    this.moveTo(this.dialogX + dx, this.dialogY + dy);
};
Dialog.prototype.close = function () {
    if (this._container) return;

    if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
    this.dialogFrame.style.transition = "opacity 0.1s";
    this.dialogFrame.style.opacity = "0";

    var args = [];
    if (arguments.length > 0 && this.callbackFunction) {
        for (var i = 0; i < arguments.length; i ++) {
            args.push(arguments[i]);
        }
    }

    window.setTimeout(function () {
        if (this.dialogFrame.parentNode) this.dialogFrame.parentNode.removeChild(this.dialogFrame);
        this.dialogFrame.style.display = "none";
        if (this.overlay) this.overlay.style.display = "none";

        BaseWidget.unregisterClosable(this);

        if (this.callbackFunction) {
            this.callbackFunction.apply(window, args);
        }
        this.onHide();

        if (this._originalFocusedTarget) {
            try {
                this._originalFocusedTarget.focus();
            } catch (e) {
            }
        }
    }.bind(this), 100);
};
Dialog.prototype.onHide = function () {
};
Dialog.prototype.callback = function (callback) {
    this.callbackFunction = callback;
    return this;
};

Dialog.prototype.handleActionClick = function (event) {
    var action = Dom.findUpwardForData(event.target, "_action");
    if (!action) return;

    var returnValue = action.run.apply(this);
    if (returnValue) this.close();
};
Dialog.globalMouseMoveHandler = function (event) {
    if (!Dialog.heldInstance) return;

    Dom.cancelEvent(event);

    if (Dialog.heldInstance.grabHeight && Dialog.heldInstance.grabWidth) return;

    var dx = event.screenX - Dialog._lastScreenX;
    var dy = event.screenY - Dialog._lastScreenY;

    Dialog._lastScreenX = event.screenX;
    Dialog._lastScreenY = event.screenY;

    Dialog.heldInstance.moveBy(dx, dy);
};
Dialog.globalFocusHandler = function (event) {
    Dialog.lastFocusedTarget = event.target;

    var ck = Dom.findParentWithClass("cke_dialog_body");
    if (ck) return;

    if (!BaseWidget.closables || BaseWidget.closables.length <= 0) return;
    var closable = BaseWidget.closables[BaseWidget.closables.length - 1];
    if (!__isSubClassOf(closable.constructor, Dialog)) return;

    var frame = Dom.findUpward(event.target, function (node) {
        return node == closable.dialogFrame;
    });

    if (frame) return;
    closable.dialogFrame.focus();
};
window.addEventListener("load", function () {
    Dialog.getOwnerDocument().addEventListener("focus", Dialog.globalFocusHandler, true);
}, false);

Dialog.getOwnerWindow = function () {
    return window;
};

Dialog.getOwnerDocument = function() {
    return Dialog.getOwnerWindow().document;
}

Dialog.prototype.handleCloseClick = function () {
    if (!this.closeHandler) return;
    var returnValue = this.closeHandler.apply(this);
    if (returnValue) this.close();
};
Dialog.prototype.handleHeaderMouseDown = function (event) {
    Dom.cancelEvent(event);
    Dialog.heldInstance = this;
    Dialog._lastScreenX = event.screenX;
    Dialog._lastScreenY = event.screenY;
};
Dialog.prototype.handleBodyKeyPress = function (event) {
    if (event.keyCode != DOM_VK_RETURN) return;
    if (!this.primaryButton) return;

    let node = Dom.findUpward(event.target, function (node) {
        return node.localName == "input" || node.localName == "select";
    })

    if (!node) return;
    this.primaryButton.click();
};

// ServiceFactory busy-indicator interface implementation
Dialog.prototype.busy = function (message) {
    if (!this._busyCount) this._busyCount = 0;
    this._busyCount ++;

    Dom.addClass(this.dialogFrame, "Busy");
    if (this.progressWidget) {
        this.progressWidget.setMessage(message || "Please wait...");
    }
};
Dialog.prototype.done = function () {
    if (typeof this._busyCount == "number" && this._busyCount > 0) this._busyCount --;

    if (this._busyCount == 0) {
        Dom.removeClass(this.dialogFrame, "Busy");
        if (this.progressWidget) {
            this.progressWidget.setMessage("");
        }
    }
};
Dialog.prototype.failed = function (e) {
};
Dialog.prototype.progressed = function (loaded, total, message) {
    var p = undefined ;
    if (typeof(loaded) != "undefined" && typeof(total) != "undefined"
        && total > 0) {
        p = Math.round(100 * loaded / total);
    }
    if (this.progressWidget) {
        this.progressWidget.setProgress(p, message);
    }
};
Dialog.prototype.asCustomIndicator = function (message) {
    var thiz = this;
    return {
        busy: function () {
            thiz.busy(message);
        },
        done: function () {
            thiz.done();
        },
        failed: function (e) {
            thiz.failed(e);
        },
        progressed: function (loaded, total) {
            thiz.progressed(loaded, total);
        }
    }
};


function BuilderBasedDialog(builder) {
    this.builder = builder;
    this.builder._dialog = this;
    Dialog.call(this);

    this.title = typeof(builder.title) == "function" ? builder.title.bind(this.builder) : builder.title;
};

__extend(Dialog, BuilderBasedDialog);

const DIALOG_SIZE_SPECS = {
        tiny: 120,
        mini: 200,
        smaller: 280,
        small: 350,
        normal: 450,
        large: 600,
        "slightly-larger": 700,
        larger: 800,
        huge: 1010
};

BuilderBasedDialog.prototype.buildContentNode = function () {
    var div = Dialog.getOwnerDocument().createElement("div");
    if (this.builder.size) {
        var size = (DIALOG_SIZE_SPECS[this.builder.size] / 12) * Util.em();
        div.style.width = size + "px";
    }
    this.builder.buildContent.call(this.builder, div);

    this.contentDiv = div;

    return div;
}
BuilderBasedDialog.prototype._newLegacyAction = function (action) {
    return {
        title: typeof(action.title) == "function" ? action.title.bind(this.builder) : action.title,
        type: action.isCloseHandler ? "cancel" : (action.primary ? "accept" : "extra1"),
        isApplicable: action.isApplicable ? action.isApplicable.bind(this.builder) : null,
        run: action.run.bind(this.builder)
    };
};
BuilderBasedDialog.prototype.onShown = function () {
    var target = this.contentDiv.querySelector(".Focusable");
    if (target && target.focus) target.focus();
    if (target && target.select) target.select();
};
BuilderBasedDialog.prototype.getDialogActions = function () {
    var thiz = this;
    return this.builder.actions.map(function (action) { return thiz._newLegacyAction(action); });
}
BuilderBasedDialog.prototype.quit = function () {
    this.close();
};

Dialog.hasOpenDialog = function () {
    for (var i = 0; i < BaseWidget.closables.length; i ++) {
        var closable = BaseWidget.closables[i];
        if (__isSubClassOf(closable.constructor, Dialog)) return true;
    }

    return false;
};

Dialog.alert = function (message, extra, onClose) {
    var builder = {
        title: message || "Information",
        size: message.size || "small",
        buildContent: function (container) {
            container.appendChild(Dom.newDOMElement({
                _name: "hbox", "class": "MessageDialog Info",
                _children: [
                    { _name: "icon", "class": "information" },
                    {
                        _name: "vbox", flex: 1, "class": "Messages",
                        _children: [
                            { _name: "div", _text: extra || ""}
                        ]
                    }
                ]
            }));
        },
        actions: [{
            title: "Close",
            primary: true,
            isCloseHandler: true,
            run: function () {
                this._dialog.quit();
                if (onClose) onClose();
                return true;
            }
        }]
    };
    new BuilderBasedDialog(builder).open();
}
Dialog.error = function (message, extra, onClose) {
    var builder = {
        title: "Error",
        size: "small",
        buildContent: function (container) {
            container.appendChild(Dom.newDOMElement({
                _name: "hbox", "class": "MessageDialog Error",
                _children: [
                    { _name: "icon", "class": "close-box" },
                    {
                        _name: "vbox", flex: 1, "class": "Messages",
                        _children: [
                            { _name: "strong", _text: message },
                            { _name: "p", _text: extra || ""}
                        ]
                    }
                ]
            }));
        },
        actions: [{
            title: "Close",
            primary: true,
            isCloseHandler: true,
            run: function () {
                this._dialog.quit();
                if (onClose) onClose();
                return true;
            }
        }]
    };
    new BuilderBasedDialog(builder).open();
}
Dialog.prompt = function (message, initialValue, acceptMessage, onInput, cancelMessage, onCancel) {
    var builder = {
        title: "Prompt",
        size: "small",
        buildContent: function (container) {
            container.appendChild(Dom.newDOMElement({
                _name: "hbox", "class": "MessageDialog Prompt",
                _children: [
                    { _name: "icon", "class": "help-circle" },
                    {
                        _name: "vbox", flex: 1, "class": "Messages",
                        _children: [
                            { _name: "p", _text: message || ""},
                            {
                                _name: "input",
                                type: "text",
                                style: "width: calc(100% - 10px); padding: 5px;",
                                "class": "Focusable",
                                _id: "input"
                            }
                        ]
                    }
                ]
            }, document, this));

            this.input.value = initialValue || "";
        },
        actions: [
                  {
                      title: acceptMessage ? acceptMessage : "OK",
                      primary: true,
                      run: function () {
                          this._dialog.quit();
                          if (onInput) onInput(this.input.value);
                          return true;
                      }
                  },
                  {
                      title: cancelMessage ? cancelMessage : "Cancel",
                      isCloseHandler: true,
                      run: function () {
                          this._dialog.quit();
                          if (onCancel) onCancel();
                          return true;
                      }
                  }
              ]
    };
    new BuilderBasedDialog(builder).open();
}
Dialog.confirm = function (question, extra, positiveActionTitle, onPositiveAnswer, negativeActionTitle, onNegativeAnswer, extraActionTitle, onExtraActionAnswer) {
    var builder = {
        title: "Confirm",
        size: "normal",
        buildContent: function (container) {
            container.appendChild(Dom.newDOMElement({
                _name: "hbox", "class": "MessageDialog Confirm",
                _children: [
                    { _name: "i", "class": "help-circle" },
                    {
                        _name: "vbox", flex: 1, "class": "Messages",
                        _children: [
                            { _name: "strong", _text: question },
                            { _name: "p", _text: extra || ""}
                        ]
                    }
                ]
            }));
        },
        actions: [
            {
                title: positiveActionTitle ? positiveActionTitle : "Yes",
                primary: true,
                run: function () {
                    this._dialog.quit();
                    if (onPositiveAnswer) onPositiveAnswer();
                    return true;
                }
            },
            {
                title: negativeActionTitle ? negativeActionTitle : "No",
                isCloseHandler: true,
                run: function () {
                    this._dialog.quit();
                    if (onNegativeAnswer) onNegativeAnswer();
                    return true;
                }
            },
            {
                title: extraActionTitle ? extraActionTitle : "Extra",
                isApplicable: function () {
                    return extraActionTitle;
                },
                run: function () {
                    this._dialog.quit();
                    if (onExtraActionAnswer) onExtraActionAnswer();
                    return true;
                }
            }
        ]
    };
    new BuilderBasedDialog(builder).open();
};
Dialog.select = function (items, callback, selectedItems, options) {
    if (!options) options = {};
    if (!selectedItems) selectedItems = [];
    var same = options.same || Util.sameRelax;
    var formatter = options.formatter || function (x) {return "" + x};
    var columns = options.columns || 1;
    var builder = {
        title: options.title || "Select",
        size: options.size || "normal",
        buildContent: function (container) {
            if (options.message) {
                var messageBox = Dialog.getOwnerDocument().createElement("hbox");
                container.appendChild(messageBox);

                messageBox.setAttribute("style", "align-items: flex-start; margin-bottom: 2em;")

                var i = Dialog.getOwnerDocument().createElement("icon");
                Dom.addClass(i, "help-circle");
                i.setAttribute("style", "font-size: 2em; color: #428BCA;");
                messageBox.appendChild(i);

                var p = Dialog.getOwnerDocument().createElement("p");
                messageBox.appendChild(p);
                p.appendChild(Dialog.getOwnerDocument().createTextNode(options.message));
                p.setAttribute("style", "margin: 0px; margin-left: 1em; min-height: 2em;");
                p.setAttribute("flex", "1");
            }

            var vbox = Dialog.getOwnerDocument().createElement("vbox");
            Dom.addClass(vbox, "SelectDialog");

            if (options.message) {
                Dom.addClass(vbox, "HasMessage");
            }

            this.inputs = [];
            for (var i = 0; i < items.length; i ++) {
                var id = "cb_" + widget.random();
                var holder = {};
                var span = Dom.newDOMElement({
                    _name: "hbox",
                    flex: 1,
                    "class": "SelectItem",
                    _children: [
                                {_name: "input", name: "ItemSelection", type: (options.exclusive ? "radio" : "checkbox"), _id: "checkbox", id: id, style: "vertical-align: middle;"},
                                {_name: "label", flex: "1", "for": id, _html: Dom.htmlEncode(formatter(items[i])), style: "padding-left: 1ex; vertical-align: middle; text-align:left"},
                                ]
                }, Dialog.getOwnerDocument(), holder);

                this.inputs.push(holder.checkbox);
                holder.checkbox._item = items[i];
                holder.checkbox.checked = Util.contains(selectedItems, items[i], same);
                vbox.appendChild(span);
                if (options.columnWidth) span.style.width = options.columnWidth;

                if (columns > 1 && (i + 1) % columns == 0) {
                    vbox.appendChild(Dialog.getOwnerDocument().createElement("br"));
                }
                if (i % columns > 0) {
                    span.style.marginLeft = "2em";
                }
            }
            container.appendChild(vbox);
        },
        actions: [
            {
                title: options.selectActionTitle || "Select",
                primary: true,
                run: function () {
                    var selected = [];
                    for (var i = 0; i < this.inputs.length; i ++) {
                        if (this.inputs[i].checked) selected.push(this.inputs[i]._item);
                    }

                    callback(selected);
                    return true;
                }
            },
            {
                title: "Cancel",
                isCloseHandler: true,
                run: function () {
                    return true;
                }
            }
        ]
    };
    new BuilderBasedDialog(builder).open();
};
