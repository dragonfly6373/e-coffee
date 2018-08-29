function MediaCollectionView() {
    BaseTemplatedWidget.call(this);
    this.items = [];

    var thiz = this;
    this.mediaGrid = new MediaCollectionView.Impl.MediaGrid(this.node(),
                        {
                            spacing: 2,
                            onItemClicked: function (item) {
                                thiz.startSlideShowAt(thiz.items.indexOf(item));
                            },
                            onMoreClicked: function () {
                                thiz.startSlideShowAt(thiz.mediaGrid.moreIndex);
                            }
                        });

    this.closable = {
        close: function () {
            document.body.removeChild(thiz.fullscreenView);
        }
    };

    this.bind("click", function () {
        this.closable.close();
        BaseWidget.unregisterClosable(this.closable);
    }, this.closeButton);

    this.bind("click", function () {
        this.gotoMedia(this.currentIndex - 1);
    }, this.prevButton);
    this.bind("click", function () {
        this.gotoMedia(this.currentIndex + 1);
    }, this.nextButton);
}

__extend(BaseTemplatedWidget, MediaCollectionView);
MediaCollectionView.prototype.setIndicator = function(indicator) {
    this._indicator = indicator;
}
MediaCollectionView.prototype.startSlideShowAt = function (index) {
    if (this.fullscreenView.parentNode) this.fullscreenView.parentNode.removeChild(this.fullscreenView);

    document.body.appendChild(this.fullscreenView);
    BaseWidget.registerClosable(this.closable);

    this.gotoMedia(index);
};
MediaCollectionView.prototype.gotoMedia = function (index) {
    if (index >= this.items.length || index < 0) return;
    this.currentIndex = index;
    var item = this.items[index];
    this.fullscreenImageView.setIndicator(this._indicator);
    this.fullscreenImageView.setUrl(item.src);
    Dom.toggleClass(this.fullscreenView, "HasNext", this.items.length > this.currentIndex + 1);
    Dom.toggleClass(this.fullscreenView, "HasPrev", this.currentIndex > 0);

};
MediaCollectionView.prototype.handleMoreClicked = function () {
};

MediaCollectionView.prototype.setContentFragment = function (fragment) {
    var urls = [];
    for (var i = 0; i < fragment.childNodes.length; i ++) {
        var node = fragment.childNodes[i];
        if (!node || !node.getAttribute) continue;
        var src = node.getAttribute("src");
        if (!src) continue;

        urls.push(src);
    }

    if (urls && urls.length > 0) this.setUrls(urls);
};
MediaCollectionView.prototype.setUrls = function (urls, callback) {
    var items = [];
    var index = -1;

    var thiz = this;
    function next() {
        index ++;
        if (index >= urls.length) {
            thiz.setItems(items);
            if (callback) callback();
            Dom.addClass(thiz.node(), "Initialized");
            return;
        }

        var url = urls[index];
        var item = {
            src: url,
            thumbSrc: url.replace(/(\.[a-z]+)$/i, "-thumb$1")
        };
        items.push(item);

        var image = new Image();
        var retried = false;
        image.onload = function () {
            item.width = image.naturalWidth;
            item.height = image.naturalHeight;

            next();
        };
        image.onerror = function () {
            if (retried || item.src == item.thumbSrc) {
                item.width = 10;
                item.height = 10;
                next();
            } else {
                image.src = item.src;
                retried = true;
            }
        };
        image.src = item.thumbSrc;
    }

    next();
};
MediaCollectionView.prototype.setItems = function (items) {
    this.items = items;
    this.mediaGrid.setItems(items);
};

MediaCollectionView.Impl = {};

(function (context) {
    "use strict";
    function fallback(value, defaultValue) {
        return typeof(value) != "undefined" ? value : defaultValue;
    }
    function _getSize(view) {
        return {w: view.offsetWidth, h: view.offsetHeight};
    }
    function getTop(view) {
        return (view.offsetParent ? getTop(view.offsetParent) : 0) + view.offsetTop;
    }
    function findTopForClass(node, className) {
        if (node.classList && node.classList.contains(className)) return node;
        if (node.parentNode) return findTopForClass(node.parentNode, className);
        return null;
    }

    var SPECS = {
        "1L": {
            layout: "<hbox>{0}</hbox>",
            height: function () {
                var item = this.items[0];
                return item.w ? Math.round(this.W * item.height / item.width) : 0;
            }
        },
        "1P": {
            layout: "<hbox>{0}</hbox>",
            height: function () {
                var item = this.items[0];
                return item.w ? Math.round(this.W * Math.min(1.5, item.height / item.width)) : 0;
            }
        },
        "1S": {
            layout: "<hbox>{0}</hbox>",
            height: function () {
                return this.W;
            }
        },
        "2S": {
            layout: "<hbox>{0}{1}</hbox>",
            height: function () {
                return Math.round((this.W - this.spacing) / 2);
            }
        },
        "2PP": {
            layout: "<hbox>{0}{1}</hbox>",
            height: function () {
                return this.W;
            }
        },
        "2LL": {
            layout: "<vbox>{0}{1}</vbox>",
            height: function () {
                return this.W;
            }
        },
        "2LP": "2S",
        "2PL": "2S",
        "2LS": "2S",
        "2PS": "2S",
        "3L": {
            layout: "<vbox>{0}<hbox>{1}{2}</hbox></vbox>",
            height: function () {
                return this.W;
            }
        },
        "3P": {
            layout: "<hbox>{0}<vbox>{1}{2}</vbox></hbox>",
            height: function () {
                return this.W;
            }
        },
        "3S": {
            layout: "<hbox>{0}{1}{2}</hbox>",
            height: function () {
                return Math.round((this.W - 2 * this.spacing) / 3);
            }
        },
        "4L": {
            layout: "<vbox>{0:2}<hbox>{1}{2}{3}</hbox></vbox>",
            height: function () {
                return this.W;
            }
        },
        "4P": {
            layout: "<hbox>{0:2}<vbox>{1}{2}{3}</vbox></hbox>",
            height: function () {
                return this.W;
            }
        },
        "4S": {
            layout: "<vbox><hbox>{0}{1}</hbox><hbox>{2}{3}</hbox></vbox>",
            height: function () {
                return this.W;
            }
        }
    };

    var MAX_DEFINED = 4;
    var SQUARE_THRESHOLD = 0.1;

    function getOrientation(item) {
        if (item.height == 0 || item.width == 0) return "S";
        var r = item.width / item.height;
        var o = r < (1 - SQUARE_THRESHOLD) ? "P" : (r > (1 + SQUARE_THRESHOLD) ? "L" : "S");
        return (o == "P" && item.video) ? "S" : o;
    }
    function findSpec(items) {
        var count = Math.min(items.length, MAX_DEFINED);
        var name = "" + count + getOrientation(items[0]) + (items.length > 1 ? getOrientation(items[1]) : "#");
        for (var spName in SPECS) {
            if (name.indexOf(spName) == 0) {
                var spec = SPECS[spName];
                while (typeof(spec) == "string") spec = SPECS[spec];
                return spec;
            }
        }

        return null;
    }

    function MediaGrid(providedContainer, optionalOptions) {
        var options = optionalOptions || {};

        this.options = {
            spacing: options.spacing || 2,
            onItemClicked: options.onItemClicked || null,
            onMoreClicked: options.onMoreClicked || null
        };

        this.container = providedContainer;
        this.uniqueClassName = "MediaGridInstance" + (new Date().getTime());

        var thiz = this;

        this.container.addEventListener("click", function (e) {
            var view = findTopForClass(e.target, "ItemView");
            if (view) {
                var viewMore = findTopForClass(e.target, "ItemViewSeeMore");
                if (viewMore) {
                    if (thiz.options.onMoreClicked) thiz.options.onMoreClicked();
                    return;
                }

                if (thiz.options.onItemClicked && view._item) thiz.options.onItemClicked(view._item);
            }
        }, false);
    }

    function generateCSS() {
        var css = "";
        var prefix = "." + this.uniqueClassName + " ";
        css += prefix + "hbox, " + prefix + "vbox {display: -webkit-box; display: -webkit-flex; display: -ms-flexbox; display: flex; overflow: hidden;}\n";
        css += prefix + "hbox {-webkit-flex-direction: row; flex-direction: row; -webkit-flex-wrap: nowrap; flex-wrap: nowrap;}\n";
        css += prefix + "vbox {-webkit-flex-direction: column; flex-direction: column; -webkit-flex-wrap: nowrap; flex-wrap: nowrap;}\n";
        css += prefix + "*[flex='1'] {flex: 1 1 1em;}\n";
        css += prefix + "*[flex='2'] {flex: 2 1 1em;}\n";
        css += prefix + "*[flex='3'] {flex: 3 1 1em;}\n";
        css += prefix + "*[flex='4'] {flex: 4 1 1em;}\n";
        css += prefix + "hbox > * + * {margin-left: " + this.options.spacing + "px;}\n";
        css += prefix + "vbox > * + * {margin-top: " + this.options.spacing + "px;}\n";
        css += prefix + "*[item] {position: relative; overflow: hidden;}\n";
        css += prefix + "*[media-type='video'] {background: #333;}\n";
        css += prefix + "*[item] > .ItemViewSeeMore {position: absolute; background: rgba(0, 0, 0, 0.5); top: 0px; left: 0px; right: 0px; bottom: 0px; display: -webkit-box; display: -webkit-flex; display: -ms-flexbox; display: flex; overflow: hidden; -webkit-flex-direction: row; flex-direction: row; -webkit-flex-wrap: nowrap; flex-wrap: nowrap; align-items: flex-center; align-items: center;}\n";
        css += prefix + "*[item] > .ItemViewSeeMore > span {font-size: 2em; color: #FFF; text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.4); display: block; flex: 1 1 1em; text-align: center;}\n";
        css += prefix + "*[item] > .ItemOverlay:hover > span {opacity: 1;}\n";

        var head = this.container.ownerDocument.head || this.container.ownerDocument.getElementsByTagName("head")[0];
        var style = document.createElement("style");
        style.type = "text/css";

        if (style.styleSheet) {
            style.styleSheet.cssText = "";
        }

        head.appendChild(style);
        style.appendChild(document.createTextNode(css));
    }

    function createItemView(item, container, index) {
        //center crop
        var ps = _getSize(container);
        if (ps.w == 0 || ps.h == 0) return;
        var o = getOrientation(item);
        var r = (item.video && o != "L") ? Math.max(item.width / ps.w, item.height / ps.h) : Math.min(item.width / ps.w, item.height / ps.h);

        var img = container.ownerDocument.createElement("img");
        var w = Math.round(item.width / r);
        var h = Math.round(item.height / r);
        var ml = Math.round((ps.w - w) / 2);
        var mt = Math.round((ps.h - h) / 2);

        img.setAttribute("style", "width: " + w + "px; height: " + h + "px; margin-left: " + ml + "px; margin-top: " + mt + "px;");
        var src = item.thumbSrc;
        if (w > item.width || h > item.height) src = item.src;

        img.src = src;
        container.appendChild(img);
        container.setAttribute("media-type", item.video ? "video" : "photo");

        // if (item.video) {
        //     var overlay = container.ownerDocument.createElement("div");
        //     overlay.setAttribute("class", "ItemOverlay");
        //     overlay.className = "ItemOverlay";
        //     var i = container.ownerDocument.createElement("i");
        //     i.setAttribute("class", "fa play-circle-o");
        //     i.className = "fa fa-play-circle-o";
        //
        //     overlay.appendChild(i);
        //     container.appendChild(overlay);
        // }
    }

    function populateMediaItems(container, items) {
        if (!container || !container.childNodes) return;

        this.lastPopulatedItemView = null;
        this.lastPopulatedItemIndex = -1;
        for (var i = 0; i < container.childNodes.length; i ++) {
            var child = container.childNodes[i];
            if (!child.getAttribute) continue;

            var index = child.getAttribute("item");
            if (index) {
                index = parseInt(index, 10);
                var item = items[index];
                if (!item) continue;

                if (index > this.lastPopulatedItemIndex) {
                    this.lastPopulatedItemIndex = index;
                    this.lastPopulatedItemView = child;
                }

                createItemView.call(this, item, child, index);
                child._item = item;
            } else {
                populateMediaItems.call(this, child, items);
            }
        }
    }

    MediaGrid.prototype.setItems = function (items, callback) {
        this.items = items;
        this.moreIndex = 0;

        var context = {
            items: items,
            W: _getSize(this.container).w,
            spacing: this.options.spacing
        };

        var spec = findSpec(items);

        var html = spec.layout;
        html = html.replace(/\{([0-9]+)(:([0-9]))?\}/g, function (full, index, x, flex) {
            var f = flex || "1";
            return "<div item=\"" + index + "\" flex=\"" + f + "\" class=\"ItemView\"></div>";
        });
        html = html.replace(/box>/g, function (full) {
            return "box flex=\"1\">";
        });

        var grid = this.container.ownerDocument.createElement("div");
        grid.innerHTML = html;
        var box = grid.firstChild;

        var height = spec.height.call(context);

        this.container.innerHTML = "";
        this.container.appendChild(grid);

        box.style.width = context.W + "px";
        box.style.height = height + "px";
        grid.style.width = context.W + "px";
        grid.style.height = height + "px";
        grid.style.overflow = "hidden";

        grid.setAttribute("class", "MediaGrid " + this.uniqueClassName);
        grid.className = "MediaGrid " + this.uniqueClassName;

        generateCSS.call(this);
        this.grid = grid;

        var thiz = this;
        window.setTimeout(function() {
            populateMediaItems.call(thiz, grid, items);

            if (items.length > MAX_DEFINED) {
                var remaining = items.length - MAX_DEFINED;
                var overlay = thiz.container.ownerDocument.createElement("div");
                overlay.setAttribute("class", "ItemViewSeeMore");
                overlay.className = "ItemViewSeeMore";
                var span = thiz.container.ownerDocument.createElement("span");
                span.innerHTML = "+" + remaining;

                overlay.appendChild(span);
                thiz.lastPopulatedItemView.appendChild(overlay);
                thiz.moreIndex = MAX_DEFINED;
            }
        }, 10);
    };


    context.MediaGrid = MediaGrid;
}(MediaCollectionView.Impl));
