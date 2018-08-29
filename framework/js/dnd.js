function DragAndDropManager(container) {
    this.container = container;
    DragAndDropManager.managers.push(this);
}

DragAndDropManager.managers = [];

DragAndDropManager.getManagersAfterValidation = function() {
    var m = [];
    for (var i = 0; i < DragAndDropManager.managers.length; i ++) {
        var manager = DragAndDropManager.managers[i];
        var valid = (manager.sourceContainer && document.body.contains(manager.sourceContainer))
            || (manager.destContainer && document.body.contains(manager.destContainer));
        if (!valid) {
            m.push(manager);
        }
    }
    for (var i = 0; i < m.length; i ++) {
        m[i].destroy();
    }
    return DragAndDropManager.managers;
};

DragAndDropManager.hasOngoingDrag = function () {
    return DragAndDropManager.dragSource;
}
DragAndDropManager.prototype.source = function (sourceContainer) {
    this.sourceContainer = sourceContainer;
    return this;
};
DragAndDropManager.prototype.anchor = function (draggbleAnchorFunction) {
    this.draggbleAnchorFunction = draggbleAnchorFunction;
    return this;
};
DragAndDropManager.prototype.itemInfo = function (itemInfoFunction) {
    this.itemInfoFunction = itemInfoFunction;
    return this;
};
DragAndDropManager.prototype.destination = function (destContainer) {
    this.destContainer = destContainer;
    return this;
};
DragAndDropManager.prototype.dropAt = function (droppableFinderFunction) {
    this.droppableFinderFunction = droppableFinderFunction;
    return this;
};
DragAndDropManager.prototype.canDrop = function (canDropFunction) {
    this.checkAccept = canDropFunction;
    return this;
};
DragAndDropManager.DROP_AT_CONTAINER = function (horizontal, subContainerFinder, itemBoundGetter) {
    var finder = function (event, manager) {
        var nearest = null;
        var d = 0;
        var before = false;

        //get all target containers
        var containers = [];
        function appendContainerRecursive(container) {
            containers.push(container);
            if (subContainerFinder) {
                var subContainers = subContainerFinder(container);
                if (subContainers) {
                    for (var i = 0; i < subContainers.length; i ++) {
                        var subContainer = subContainers[i];
                        appendContainerRecursive(subContainer);
                    }
                }
            }
        }
        appendContainerRecursive(manager.destContainer);

        //find matching containers
        var x = event.clientX;
        var y = event.clientY;
        var smallestContainer = containers.filter(function (container) {
            var rect = container.getBoundingClientRect();

            return rect.left <= x && x <= rect.left + rect.width
                    && rect.top <= y && y <= rect.top + rect.height;
        }).reduce(function (a, b) {
            if (a.contains(b)) return b;
            return a;
        });

        for (var i = 0; i < smallestContainer.childNodes.length; i ++) {
            var child = smallestContainer.childNodes[i];
            if (child.nodeType != Node.ELEMENT_NODE || child == manager.currentDropHintNode || child._isDropHint) continue;

            var rect = itemBoundGetter ? itemBoundGetter(child) : child.getBoundingClientRect();
            var dx = event.clientX - (rect.left + rect.width / 2);
            var dy = event.clientY - (rect.top + rect.height / 2);
            var d2 = Math.sqrt(dx * dx + dy * dy);

            if (!nearest || d > d2) {
                nearest = child;
                d = d2;
                before = horizontal ? (dx < 0) : (dy < 0);
            }
        }

        if (!nearest) {
            return {
                element: smallestContainer,
                mode: DragAndDropManager.DROP_APPEND
            };
        }

        if (before) {
            return {
                nearest: nearest,
                element: nearest,
                mode: DragAndDropManager.DROP_PREV_SIBLING
            };
        } else {
            var next = nearest.nextElementSibling;
            while (next && next._isDropHint) next = next.nextElementSibling;

            if (next) {
                return {
                    nearest: nearest,
                    element: next,
                    mode: DragAndDropManager.DROP_PREV_SIBLING
                };
            } else {
                return {
                    element: smallestContainer,
                    mode: DragAndDropManager.DROP_APPEND
                };
            }
        }
    };

    return finder;
};

DragAndDropManager.prototype.setup = function () {
    if (this.sourceContainer) {
        this.handleMouseDownFunction = this.handleMouseDown.bind(this);
        Dom.registerEvent(this.sourceContainer, "mousedown", this.handleMouseDownFunction, false);
    }
    if (DragAndDropManager.managers.length == 1) {
        Dom.registerEvent(document, "mouseup", DragAndDropManager.handleGlobalMouseUp, false);
        Dom.registerEvent(document, "mousemove", DragAndDropManager.handleGlobalMouseMove, false);
    }
    return this;
};
DragAndDropManager.prototype.destroy = function () {
    if (this.sourceContainer) {
        Dom.unregisterEvent(this.sourceContainer, "mousedown", this.handleMouseDownFunction, false);
    }
    this._removeDragImage();
    this._removeDropHint();
    var index = DragAndDropManager.managers.indexOf(this);
    DragAndDropManager.managers.splice(index, 1);

    if (DragAndDropManager.managers.length == 0) {
        Dom.unregisterEvent(document, "mouseup", DragAndDropManager.handleGlobalMouseUp, false);
        Dom.unregisterEvent(document, "mousemove", DragAndDropManager.handleGlobalMouseMove, false);
    }
};

DragAndDropManager.handleGlobalMouseMove = function (event) {
    var managers = DragAndDropManager.getManagersAfterValidation();
    for (var i = 0; i < managers.length; i ++) {
        managers[i].handleMouseMove(event);
    }
};
DragAndDropManager.handleGlobalMouseUp = function (event) {
    try {
        var managers = DragAndDropManager.getManagersAfterValidation();
        for (var i = 0; i < managers.length; i ++) {
            var manager = managers[i];
            if (manager.destContainer) manager.handleDestinationMouseUp(event);
        }

        if (DragAndDropManager.dragSource) {
            if (DragAndDropManager.draggableDataAccepted) {
                DragAndDropManager.dragSource.handleDragSourceAccepted(event);
            } else {
                DragAndDropManager.dragSource.handleDragSourceCanceled(event);
            }
        }

        for (var i = 0; i < managers.length; i ++) {
            manager.handleDragFinished(DragAndDropManager.draggableDataAccepted);
        }
    } finally {
        DragAndDropManager.cleanup();
    }
};
DragAndDropManager.cleanup = function () {
    if (DragAndDropManager.draggable) Dom.removeClass(DragAndDropManager.draggable, "CurrentDraggable");
    DragAndDropManager.draggable = null;
    DragAndDropManager.draggedData = null;
    DragAndDropManager.dragSource = null;
    DragAndDropManager.draggableDataAccepted = false;
}
DragAndDropManager.prototype._findDraggableInfo = function (event) {
    var element = null;

    try {
        element = Dom.findUpward(event.target, function (node) {
            var draggable = this.draggbleAnchorFunction(node);
            if (draggable) return true;
            return false;
        }.bind(this));
    } catch (e) {
        console.error(e);
        return null;
    }

    if (!element) return null;
    var info = this.itemInfoFunction(element);

    return info;
};
DragAndDropManager.prototype._findDropTarget = function (event) {
    var dropTarget = this.droppableFinderFunction(event, this);

    return dropTarget;
};
DragAndDropManager.prototype.handleDragFinished = function (accepted) {
    if (this.autoScrollTimer) {
        window.clearTimeout(this.autoScrollTimer);
        this.autoScrollTimer = null;
    }
    if (this.dropAimedTimer) {
        window.clearTimeout(this.dropAimedTimer);
        this.dropAimedTimer = null;
    }

    this._removeDropHint();

    if (this.onDragFinished) this.onDragFinished(accepted);
    BaseWidget.unregisterClosable(this);
};
DragAndDropManager.prototype.handleMouseDown = function (event) {
    if (this.dropAimedTimer) {
        window.clearTimeout(this.dropAimedTimer);
        this.dropAimedTimer = null;
    }

    if (!this.sourceContainer) return;

    var draggableInfo = this._findDraggableInfo(event);
    if (!draggableInfo) return;

    Dom.cancelEvent(event);

    /*
     * storing these into global scope to enable cross-manager dragging
     */
    DragAndDropManager.draggable = draggableInfo.element;
    DragAndDropManager.draggedData = draggableInfo.data;
    DragAndDropManager.dragSource = this;
    DragAndDropManager.draggableDataAccepted = false;

    DragAndDropManager.draggableSize = {
        width: Dom.getOffsetWidth(DragAndDropManager.draggable),
        height: Dom.getOffsetHeight(DragAndDropManager.draggable)
    };

    var rect = DragAndDropManager.draggable.getBoundingClientRect();
    this.draggableDx = event.clientX - rect.left;
    this.draggableDy = event.clientY - rect.top + (document.body.getBoundingClientRect().top);

    var wrapper = document.createElement("div");
    Dom.addClass(wrapper, "DragImageWrapper");
    wrapper.style.position = "absolute";
    wrapper.style.width = rect.width + "px";
    wrapper.style.height = rect.height + "px";
    wrapper.style.top = rect.top + "px";
    wrapper.style.left = rect.left + "px";
    wrapper.style.cursor = "pointer";
    wrapper.style.boxShadow = "0px 0px 0.2em rgba(0, 0, 0, 0.3)";
    wrapper.style.opacity = 0.9;
    wrapper.appendChild(this.createDragImageNode());

    document.body.appendChild(wrapper);
    this.dragImage = wrapper;
    
    DragAndDropManager.activeDragSource = this;

    BaseWidget.registerClosable(this);

    if (this.onDragStart) this.onDragStart();

    Dom.addClass(DragAndDropManager.draggable, "CurrentDraggable");
};
DragAndDropManager.prototype.handleMouseMove = function (event) {
    if (!DragAndDropManager.hasOngoingDrag()) return;

    if (this == DragAndDropManager.activeDragSource) {
        this._handleDragSourceMouseMove(event);
    }
    if (this.destContainer) {
        this._handleDestinationMouseMove(event);
    }
};
DragAndDropManager.prototype._handleDragSourceMouseMove = function (event) {
    Dom.cancelEvent(event);

    var x = event.clientX - this.draggableDx;
    var y = event.clientY - this.draggableDy;

    this.dragImage.style.left = x + "px";
    this.dragImage.style.top = y + "px";
};
DragAndDropManager.prototype.handleDragSourceAccepted = function (event) {
    Dom.cancelEvent(event);
    this._removeDragImage();

    if (this.onDragAccepted) this.onDragAccepted(DragAndDropManager.draggable, DragAndDropManager.draggedData);
};
DragAndDropManager.prototype.handleDragSourceCanceled = function (event) {
    if (event) Dom.cancelEvent(event);
    this._removeDragImage();

    if (this.onDragCanceled) this.onDragCanceled(DragAndDropManager.draggable, DragAndDropManager.draggedData);
};

DragAndDropManager.DROP_PREV_SIBLING = "prevSibling";
DragAndDropManager.DROP_APPEND = "append";

DragAndDropManager.prototype.close = function () {
    if (DragAndDropManager.dragSource) DragAndDropManager.dragSource.handleDragSourceCanceled();
    for (var i = 0; i < DragAndDropManager.managers.length; i ++) {
        DragAndDropManager.managers[i].handleDragFinished(false);
    }
    DragAndDropManager.cleanup();
};

DragAndDropManager.prototype.handleDestinationMouseUp = function (event) {
    if (this.autoScrollTimer) {
        window.clearTimeout(this.autoScrollTimer);
        this.autoScrollTimer = null;
    }
    if (this.dropAimedTimer) {
        window.clearTimeout(this.dropAimedTimer);
        this.dropAimedTimer = null;
    }
    if (!DragAndDropManager.hasOngoingDrag()) {
        this._removeDropHint();
        return;
    }

    var rect = this.destContainer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > (rect.left + rect.width)
        || event.clientY < rect.top || event.clientY > (rect.top + rect.height)) {
            this._removeDropHint();
            return;
    }

    var target = this.currentDropTarget;
    this._removeDropHint();
    if (target) {
        if (this.onDrop) this.onDrop(DragAndDropManager.draggable, DragAndDropManager.draggedData, target);
        DragAndDropManager.draggableDataAccepted = true;
    }
};
DragAndDropManager.prototype._removeDropHint = function () {
    if (this.currentDropHintNode) {
        if (this.currentDropHintNode.parentNode) this.currentDropHintNode.parentNode.removeChild(this.currentDropHintNode);
    }

    this.currentDropHintNode = null;
    this.currentDropTarget = null;
};
DragAndDropManager.prototype._removeDragImage = function () {
    if (this.dragImage) {
        if (this.dragImage.parentNode) this.dragImage.parentNode.removeChild(this.dragImage);
    }
    this.dragImage = null;
};
DragAndDropManager.prototype.processDestinationScroll = function (event) {
    var scrollPane = Dom.findUpward(this.destContainer, function (n) {
        return n.scrollHeight > n.offsetHeight;
    });

    if (!scrollPane) return;

    var rect = scrollPane.getBoundingClientRect();
    var delta = 2 * Util.em();
    var shouldScroll = false;
    if (rect.top < event.clientY && rect.top + delta > event.clientY) {
        this.autoScrollDelta = 0 - Math.round(Util.em() * 2);
        shouldScroll = true;
    } else if (rect.top + rect.height > event.clientY && rect.top + rect.height - delta < event.clientY) {
        this.autoScrollDelta = Math.round(Util.em() * 2);
        shouldScroll = true;
    }

    var thiz = this;
    if (shouldScroll) {
        if (!this.autoScrollTimer) {
            this.autoScrollTimer = window.setTimeout(function () {
                thiz.autoScroll();
            }, 100);
        }
    } else {
        window.clearTimeout(this.autoScrollTimer);
        this.autoScrollTimer = null;
    }
};
DragAndDropManager.prototype.autoScroll = function () {
    var scrollPane = Dom.findUpward(this.destContainer, function (n) {
        return n.scrollHeight > n.offsetHeight;
    });

    if (!scrollPane) {
        this.autoScrollTimer = null;
    } else {
        var thiz = this;
        scrollPane.scrollTop += this.autoScrollDelta;
        this.autoScrollTimer = window.setTimeout(function () {
            thiz.autoScroll();
        }, 50);
    }
};

DragAndDropManager.prototype._handleDestinationMouseMove = function (event) {
    if (!DragAndDropManager.hasOngoingDrag()) {
        this._removeDropHint();
        return;
    }

    if (this.checkAccept && !this.checkAccept(DragAndDropManager.draggedData)) {
        this._removeDropHint();
        return;
    }

    var rect = this.destContainer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > (rect.left + rect.width)
        || event.clientY < rect.top || event.clientY > (rect.top + rect.height)) {
            this._removeDropHint();
            return;
    }

    this.processDestinationScroll(event);

    var dropTarget = this._findDropTarget(event);
    if (!dropTarget) {
        this._removeDropHint();
        this.currentDropTarget = null;
        return;
    }

    if (this.onAimed && dropTarget.nearest) {
        if (this.dropAimedTimer) {
            window.clearTimeout(this.dropAimedTimer);
            this.dropAimedTimer = null;
        }

        var thiz = this;
        this.dropAimedTimer = window.setTimeout(function () {
            thiz.onAimed(dropTarget.nearest);
            thiz.dropAimedTimer = null;
        }, 500);
    }


    if (this.currentDropTarget != null) {
        if (this.currentDropTarget.element == dropTarget.element
                && this.currentDropTarget.mode == dropTarget.mode) {
            return;
        }
    }

    var node = this.currentDropHintNode;
    if (node) {
        if (node.parentNode) node.parentNode.removeChild(node);
    } else {
        node = this.createDropHintNode();
        node._isDropHint = true;
        this.currentDropHintNode = node;
    }

    if (dropTarget.mode == DragAndDropManager.DROP_PREV_SIBLING) {
        dropTarget.element.parentNode.insertBefore(node, dropTarget.element);
    } else {
        dropTarget.element.appendChild(node);
    }

    this.currentDropTarget = dropTarget;
};
DragAndDropManager.prototype.createDragImageNode = function () {
    return DragAndDropManager.draggable.cloneNode(true);
};
DragAndDropManager.prototype.createDropHintNode = function () {
    var node = DragAndDropManager.draggable.cloneNode(true);
    return node;
};
