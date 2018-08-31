function Carousel(node) {
    BaseTemplatedWidget.call(this);
    this.index = 0;
    
    this.duration = Dom.getAttributeAsInt(node, "duration", 650);
    this.scrollMode = Dom.getAttributeAsString(node, "mode", Carousel.MODE_LOOP); // "NONE" | "REVERSED" | "LOOP"
    this.autoSlide = Dom.getAttributeAsInt(node, "auto-slide", 3000);     // set -1 to disable
    this.showStatus = Dom.getAttributeAsBoolean(node, "show-status", true);

    this.bind("click", this.scrollPrev.bind(this, this.duration), this.previousButton);
    this.bind("click", this.scrollNext.bind(this, this.duration), this.nextButton);
    this.bind("touchstart", this._handleTouchStart, this.imageContainer);
    this.bind("touchmove", this._handleTouchMove, this.imageContainer);
    this.bind("touchend", this._handleTouchEnd, this.imageContainer);
}
__extend(BaseTemplatedWidget, Carousel);

Carousel.MODE_REVERSED = "reversed";
Carousel.MODE_LOOP = "loop";
Carousel.MODE_NONE = "none";

Carousel.prototype.onAttached = function () {
    if (this.scrollMode.toLowerCase() == Carousel.MODE_LOOP) {
        if (this.imageContainer.childNodes.length > 2) this.prepareLooping();
        else this.scrollMode = Carousel.MODE_REVERSED;
    }
}

Carousel.prototype.onSizeChanged = function () {
    if (!Dom.hasClass(this.node(), "Initialized")) return;

    Dom.doOnSelector(this.imageContainer, "img", function (img) {
        Util.cropImage(img, true);
    });
};

Carousel.prototype.setContentFragment = function (fragment) {
    var elements = fragment.childNodes;
    if (this.showStatus) {
        this.statusContainer.innerHTML = "";
        Dom.removeClass(this.statusContainer, "Hidden");
    }
    for (var i = 0; i < elements.length; i ++) {
        var element = elements[i];
        if (!element.nodeName || !element.getAttribute) continue;
        element._index = i;
        this.imageContainer.appendChild(element);
        var img = Dom.getTag("img", element);
        Util.cropImage(img, true);
        if (this.showStatus) {
            var icon = Dom.newDOMElement({
                _name: "icon",
                class: "circle" + (i == 0 ? " Active" : ""),
            });
            this.bind("click", this.onIndexClick.bind(this), icon);
            this.statusContainer.appendChild(icon);
        }
    }
    Dom.addClass(this.node(), "Initialized");
    this.startTimer();
}

Carousel.prototype.prepareLooping = function() {
    if (this.scrollMode.toLowerCase() != Carousel.MODE_LOOP) return;
    if (this.index == 0 ) {
        var element = Dom.findLastChildWithClass(this.imageContainer, "SliderItem");
        this.imageContainer.removeChild(element);
        Dom.prepend(element, this.imageContainer);
        this.index++;
        this.scrollTo(this.index, 0);
    }
    if (this.index == this.imageContainer.childNodes.length - 1) {
        var element = Dom.findFirstChildWithClass(this.imageContainer, "SliderItem");
        this.imageContainer.removeChild(element);
        Dom.append(element, this.imageContainer);
        this.index--;
        this.scrollTo(this.index, 0);
    }
}

Carousel.prototype.scrollTo = function(index, duration) {
    var thiz = this;
    var currentActive = Dom.findFirstChildWithClass(this.imageContainer, "Active");
    var element = Dom.getChildByIndex(this.imageContainer, index);
    if (!element) return Promise.resolve();
    var offsetLeft = element.offsetLeft;
    var startLeft = this.imageContainer.scrollLeft;
    var target = Math.round(offsetLeft);
    duration = Math.round(duration);
    Dom.removeClass(currentActive, "Active");
    Dom.addClass(element, "Active");
    if (duration < 0) {
        return Promise.reject("bad duration");
    }
    if (duration === 0) {
        this.imageContainer.scrollLeft = target;
        this.setStatus(parseInt(element._index));
        return Promise.resolve();
    }
    var start_time = Date.now();
    var end_time = start_time + duration;
    var distance = target - startLeft;
    var smooth_step = function(start, end, point) {
        if (point <= start) { return 0; }
        if (point >= end) { return 1; }
        var x = (point - start) / (end - start);
        return x * x * (3 - 2 * x);
    }

    return new Promise(function(resolve, reject) {
        var previous_left = thiz.imageContainer.scrollLeft;
        var scroll_frame = function() {
            if(thiz.imageContainer.scrollLeft != previous_left) {
                reject("interrupted");
                return;
            }
            var now = Date.now();
            var point = smooth_step(start_time, end_time, now);
            var frameLeft = Math.round(startLeft + (distance * point));
            thiz.imageContainer.scrollLeft = frameLeft;
            if ((thiz.imageContainer.scrollLeft === previous_left && thiz.imageContainer.scrollLeft !== frameLeft)
            || (now >= end_time)) {
                thiz.setStatus(parseInt(element._index));
                thiz.startTimer();
                resolve();
                return;
            }
            previous_left = thiz.imageContainer.scrollLeft;
            setTimeout(scroll_frame, 0);
        }
        setTimeout(scroll_frame, 0);
    });
}

Carousel.prototype.scrollPrev = function (duration) {
    var thiz = this;
    if (this.index > 0) this.index--;
    else if (this.scrollMode.toLowerCase() == Carousel.MODE_REVERSED) this.index = this.imageContainer.childNodes.length - 1;
    else return;
    this.scrollTo(this.index, duration).then(function() {
        thiz.prepareLooping();
    });
}

Carousel.prototype.scrollNext = function (duration) {
    var thiz = this;
    if (this.imageContainer.childNodes.length > (this.index + 1)) this.index++;
    else if (this.scrollMode.toLowerCase() == Carousel.MODE_REVERSED) this.index = 0;
    else return;
    this.scrollTo(this.index, duration).then(function() {
        thiz.prepareLooping();
    });
}

Carousel.prototype._handleTouchStart = function(event) {
    this.startX = event.touches[0].clientX;
    this.captureLeft = this.imageContainer.scrollLeft;
    this.clearTimer();
}

Carousel.prototype._handleTouchMove = function(event) {
    // console.log("# HANDLE TouchMove");
    var endX = event.touches[0].clientX;
    var d = endX - this.startX;
    this.imageContainer.scrollLeft = this.captureLeft - d;
}

Carousel.prototype._handleTouchEnd = function(event) {
    var thiz = this;
    var endX = event.changedTouches[0].clientX;
    var d = endX - this.startX;
    var w = this.imageContainer.clientWidth;
    var p = Math.abs(d) * 100 / w;
    var s = (100 - p) / 100;
    if (p > 25) {
        if (d > 0) {
            if (this.index != 0) this.scrollPrev(this.duration * s);
            else this.prepareLooping();
        } else {
            if (this.imageContainer.childNodes.length != (this.index + 1)) this.scrollNext(this.duration * s);
            else this.prepareLooping();
        }
    } else {
        // console.log("re-position current frame");
        this.scrollTo(this.index, this.duration * s).then(function() {
            thiz.prepareLooping();
        });
    }
    this.startX = null;
}

Carousel.prototype.onIndexClick = function(event) {
    var thiz = this;
    var node = event.target;
    var index = Dom.getIndexInParent(node);
    if (Dom.hasClass(node, "Active")) return;
    this.clearTimer();
    if (this.scrollMode.toLowerCase() != Carousel.MODE_LOOP) {
        var currentActive = Dom.findFirstChildWithClass(this.statusContainer, "Active");
        Dom.removeClass(currentActive, "Active");
        Dom.addClass(node, "Active");
        this.scrollTo(index, this.duration).then(function(){
            thiz.index = index;
        });
    } else {
        var activeSlide = Dom.findFirstChildWithClass(this.imageContainer, "Active");
        var slideIndex = Dom.getIndexInParent(activeSlide);
        var currentIndex = parseInt(activeSlide._index);
        var size = this.statusContainer.childNodes.length;
        var step = index - currentIndex;
        var newIndex = slideIndex + step;
        if (newIndex > (size - 1)) newIndex -= size;
        else if (newIndex < 0) newIndex += size;
        this.scrollTo(newIndex, this.duration).then(function() {
            thiz.index = newIndex;
            thiz.prepareLooping();
        }).catch(function(err) {
            console.log("Interrupted:", err);
        });
    }
}

Carousel.prototype.setStatus = function(index) {
    var current = Dom.findChildWithClass(this.statusContainer, "Active");
    Dom.removeClass(current, "Active");
    current = Dom.getChildByIndex(this.statusContainer, index);
    Dom.addClass(current, "Active");
}

Carousel.prototype.clearTimer = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
    }
}

Carousel.prototype.startTimer = function() {
    this.clearTimer();
    if (this.autoSlide > 0) this.timer = setTimeout(this.scrollNext.bind(this, this.duration), this.autoSlide);
}
