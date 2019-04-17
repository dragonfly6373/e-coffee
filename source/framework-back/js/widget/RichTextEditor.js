function RichTextEditor() {
    RichTextEditor.installCKEditorPlugins();
    BaseWidget.call(this);

    var id = "richTextEditor" + (new Date().getTime());
    this.initialized = false;
    this.pendingData = null;
    this.editorEventHandlers = {};
    this.contentCSS = "";
    RichTextEditor.instance = this;
    this.bind("click", this.onSourceButtonClicked, this.editSourceButton);
}

__extend(BaseTemplatedWidget, RichTextEditor);

RichTextEditor.prototype.onAttached = function () {
    var thiz = this;
    var connectorPath = "/team/" + ADMIN_CONTEXT.teamAlias + "/controller/ckconnector/command";
    var config = {
        toolbarGroups: [
            { name: 'basicstyles', groups: [ 'styles', 'basicstyles', 'colors', 'cleanup' ] },
            { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align' ] },
            '/',
            { name: 'links', groups: [ 'links' ] },
            { name: 'insert', groups: [ 'insert' ] },
            { name: 'clipboard', groups: [ 'undo','clipboard' ] },
            { name: 'editing', groups: [ 'find', 'selection', 'spellchecker', 'editing' ] }
        ],
        removeButtons: 'Styles,SelectAll,Cut,Copy,Paste,Flash,Smiley,SpecialChar,PageBreak,Iframe',
        //skin: 'moono-lisa',
        removePlugins: "elementspath,resize,magicline,iframe",
        extraPlugins: "cms-youtube",
        allowedContent: true,
        entities_latin: false,
        entities_greek: false,
        contentsCss: ["/framework/webui/framework/js/widget/RichTextEditor-content.less?t=" + new Date().getTime()],
        filebrowserUploadUrl: connectorPath + "?command=QuickUpload&type=Images",
        filebrowserImageUploadUrl: connectorPath + "?command=QuickUpload&type=Images",
        _last: true,
        fillEmptyBlocks: false
    };
    console.log("*** Editor config", config);
    this.editor = CKEDITOR.replace(this.contentInput, config);

    CKFinder.setupCKEditor( this.editor, {
        basePath : "/js/ckfinder2.6.2.1",
        connectorPath: connectorPath
    });


    this.editor.on("instanceReady", function() {
        var editable = thiz.editor.editable();

        editable.attachListener(editable, "input", function () {
            thiz.onSizeChanged();
        });

        editable.attachListener(editable, "keyup", function(event) {
            if (event.data.$.keyCode == DOM_VK_ESCAPE) {
                BaseWidget.handleClosableEscapeKey(event.data.$);
                return;
            }

            thiz.onSizeChanged();
        });

        window.setTimeout(function () {
            thiz.editSourceButton.parentNode.removeChild(thiz.editSourceButton);
            thiz.getEditorToolbar().appendChild(thiz.editSourceButton);

            thiz.initialized = true;

            if (thiz.pendingData) {
                thiz.setContent(thiz.pendingData.content, thiz.pendingData.callback);
                thiz.clearPendingData();
            }

            window.setTimeout(function () {
                Dom.addClass(thiz.node(), "Initialized");
                Dom.emitEvent(RichTextEditor.EDITOR_INITIALIZED_EVENT_NAME, thiz.node(), {});

                thiz.editor.on("change", function () {
                    Dom.emitEvent(RichTextEditor.TEXT_CHANGE_EVENT_NAME, thiz.node(), {});
                });
                thiz.resetUndo();
            }, 100);
        }, 100);
    });

    Dom.addClass(this.node(), "ScrollerInstalled");

    function heightWatcher() {
        try {
            thiz.onSizeChanged();
        } finally {
            window.setTimeout(heightWatcher, 1000);
        }
    }

    window.setTimeout(heightWatcher, 500);

};
RichTextEditor.prototype.getFocusNode = function () {
    return this.editor.container;
};
RichTextEditor.prototype.clearPendingData = function () {
    if (!this.pendingData) return;
    delete this.pendingData.content;
    delete this.pendingData.callback;
    delete this.pendingData;
};
RichTextEditor.prototype.setContent = function (content, callback) {
    if (!content) content = "";
    if (this.initialized) {
        this.clearPendingData();
        this.editor.setData(content.html ? content.html : content, callback);
        this.contentCSS = content.css || "";
        this.applyCSS(this.contentCSS);
        try {
            this.onSizeChanged();
        } catch (e) { }
    } else {
        this.pendingData = { content: content, callback: callback };
    }
};
RichTextEditor.prototype.getContent = function () {
    return this.editor.getData().trim();
};
RichTextEditor.prototype.getContentStylesheet = function () {
    return this.contentCSS;
};
RichTextEditor.prototype.getTextContent = function () {
    return this.getContent().replace(/<[^>]*>/g, "");
};
RichTextEditor.prototype.onIframeInitialized = function (editor) {
    this.editor = editor;
    this.onSizeChanged(this.editor);
    this.initialized = true;
    Dom.emitEvent(RichTextEditor.EDITOR_INITIALIZED_EVENT_NAME, this.node(), {});

    var thiz = this;
    this.editor.on(RichTextEditor.TEXT_CHANGE_EVENT_NAME, function () {
        Dom.emitEvent(RichTextEditor.TEXT_CHANGE_EVENT_NAME, thiz.node(), {});
    });
};
RichTextEditor.prototype.getEditorFrame = function () {
    return this.node().querySelector(":scope iframe");
};
RichTextEditor.prototype.getEditorToolbar = function () {
    return this.node().querySelector(":scope .cke_top");
};
RichTextEditor.prototype.onSizeChanged = function () {
    if (!this.initialized) return;
    var iframe = this.getEditorFrame();
    var size = {
        width: this.editor.document.$.body.scrollWidth,
        height: this.editor.document.$.body.scrollHeight + 30
    };

    if (size.height != this.lastContentHeight) {
        iframe.parentNode.style.height = Math.max(size.height, 200) + "px";
        this.updateScrolling("bringSelectionIntoView");

        this.lastContentHeight = size.height;
    }
};
RichTextEditor.prototype.getSelectionBoundingRect = function (dy) {
    try {
        var iframe = this.getEditorFrame();
        var selection = iframe.contentWindow.getSelection();
        var range = selection.getRangeAt(0);
        if (range.getClientRects().length > 0) {
            return range.getBoundingClientRect();
        } else {
            return range.startContainer.getBoundingClientRect();
        }
    } catch (e) {
        return null;
    }
};
RichTextEditor.CLASS_TOOLBAR_SHIFTED = "ToolbarShifted";
RichTextEditor.prototype.shiftToolbar = function (d, scrollPane) {
    var toolbar = this.getEditorToolbar();

    this.toolbarPadding.style.height = (toolbar.offsetHeight + 5) + "px";
    if (d > 0) {
        if (!Dom.hasClass(this.node(), RichTextEditor.CLASS_TOOLBAR_SHIFTED)) {
            var rect = scrollPane.getBoundingClientRect();
            var thisRect = this.node().getBoundingClientRect();
            var bodyRect = document.body.getBoundingClientRect();

            Dom.addClass(this.node(), RichTextEditor.CLASS_TOOLBAR_SHIFTED);
            toolbar.style.top = rect.top + "px";
            toolbar.style.left = (thisRect.left) + "px";
            toolbar.style.right = (bodyRect.width - thisRect.right) + "px";
        }
    } else {
        Dom.removeClass(this.node(), RichTextEditor.CLASS_TOOLBAR_SHIFTED);
        toolbar.style.top = "0px";
        toolbar.style.width = "auto";
    }
};
RichTextEditor.prototype.updateScrolling = function (bringSelectionIntoView) {
    var scrollPane = Dom.findUpward(this.node(), function (n) {
        return n.scrollHeight > n.offsetHeight;
    });

    if (!scrollPane) {
        this.shiftToolbar(0);
        return;
    }

    var r1 = this.node().getBoundingClientRect();
    var r2 = scrollPane.getBoundingClientRect();

    if (bringSelectionIntoView) {
        var sr = this.getSelectionBoundingRect();
        if (sr) {
            var safeCaretHeight = Util.em() * 3;

            var caretTop = sr.top + this.getEditorFrame().getBoundingClientRect().top;

            var d = caretTop + safeCaretHeight - (r2.top + r2.height);
            if (d > 0) {
                scrollPane.scrollTop += d;
            } else {
                d = r2.top + this.getEditorToolbar().offsetHeight - caretTop + safeCaretHeight;
                if (d > 0) {
                    scrollPane.scrollTop -= d;
                }
            }

            r1 = this.node().getBoundingClientRect();
        }
    }

    var dy = r2.top - r1.top;
    this.shiftToolbar(Math.max(dy - 1, 0), scrollPane);

    if (!this.scrollPaneWatched) {
        Dom.registerEvent(scrollPane, "scroll", function () {
            this.updateScrolling();
        }.bind(this), false);
        this.scrollPaneWatched = true;
    }
};
RichTextEditor.prototype.applyCSS = function (css) {
    if (this.styleNode) this.styleNode.parentNode.removeChild(this.styleNode);

    var doc = this.editor.document.$;

    var head = doc.head || doc.getElementsByTagName("head")[0];

    var style = doc.createElement("style");
    style.type = "text/css";

    if (style.styleSheet) {
        style.styleSheet.cssText = "";
    }

    head.appendChild(style);
    style.appendChild(doc.createTextNode(css));

    this.styleNode = style;
};
RichTextEditor.prototype.onSourceButtonClicked = function () {
    new RichTextEditorAdvancedDialog().callback(function (content) {
        if (content) {
            this.setContent(content);
            Dom.emitEvent(RichTextEditor.TEXT_CHANGE_EVENT_NAME, this.node(), {});
        }
    }.bind(this)).open({
        html: this.getContent(),
        css: this.getContentStylesheet()
    });
};
RichTextEditor.installCKEditorPlugins = function () {
    if (RichTextEditor._CKEditorPluginsInstalled) return;

    function toYoutubeHTML(video) {
        var json = JSON.stringify(video);
        var width = video.width || 640;
        var height = video.height || 360;
        var url = "https://www.youtube.com/embed/" + video.id;
        return "<iframe allowfullscreen=\"\" frameborder=\"0\""
                    + " width=\"" + width + "\""
                    + " height=\"" + height + "\""
                    + " src=\"" + url + "\""
                    + "></iframe>";
    }
    CKEDITOR.plugins.add("cms-youtube", {
        lang: [ "en"],
        init: function (editor) {
            console.log("Plugin init called.");
            editor.addCommand("cms-youtube", {
                exec: function (editor) {
                    new RichTextEditorYoutubeDetailDialog().callback(function (video) {
                        if (video) editor.insertHtml(toYoutubeHTML(video));
                    }).open();
                }
            });

            editor.ui.addButton("Youtube", {
                label : "Youtube",
                toolbar : "insert",
                command : "cms-youtube",
                icon : "/framework/webui/framework/images/toolbar-youtube.png"
            });

            editor.on("doubleclick", function (event) {
                var element = event.data.element;
                if (!element) return;
                var json = element.getAttribute("data-json");
                if (!json) return;
                json = atob(json);
                var video = JSON.parse(json);
                new RichTextEditorYoutubeDetailDialog().callback(function (v) {
                    if (v) {
                        editor.insertHtml(toYoutubeHTML(v));
                        element.parentNode.removeChild(element);
                    }
                }).open(video);
            });
        }
    });

    console.log("Plugin installed");

    RichTextEditor._CKEditorPluginsInstalled = true;
};

RichTextEditor.TEXT_CHANGE_EVENT_NAME = "text-change";
RichTextEditor.EDITOR_INITIALIZED_EVENT_NAME = "p:ItemInitialized";
RichTextEditor.prototype.resetUndo = function () {
    this.editor.resetUndo();
}
