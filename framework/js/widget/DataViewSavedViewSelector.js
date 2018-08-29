function DataViewSavedViewSelector(node) {
    BaseTemplatedWidget.call(this);
    var thiz = this;

    this.itemRepeaterView.populator = function (data, binding, node) {
        if (!data) {
            Dom.setInnerText(binding.itemNameLabel, "View All");
            Dom.setInnerText(binding.itemDescriptionLabel,  "No filter applied");
            Dom.addClass(binding._node, "Null");
        } else {
            Dom.setInnerText(binding.itemNameLabel, data.name);
            binding.itemDescriptionLabel.innerHTML = "";
            binding.itemDescriptionLabel.appendChild(thiz.generateFilterDescription(data));

            Dom.toggleClass(binding._node, "DefaultView", data.isDefault);
        }

        binding._node._savedView = data;
    };

    this.popup.setPopupClass("DataViewSavedViewSelectorPopup");

    this.bind("p:PopupShown", function () {
        if (this.dnd) return;
        this._setupReordering();
    }, this.popup);
    this.bind("p:PopupHidden", function () {
        this._lastPopupHiddenAt = new Date().getTime();
    }, this.popup);

    this.bind("click", this._showPopup);
    this.bind("click", this._handleMenuClick, this.itemRepeaterView.node());
}
__extend(BaseTemplatedWidget, DataViewSavedViewSelector);

DataViewSavedViewSelector.prototype.init = function (spec, callback) {
    this.spec = spec;
    
    this.filterMap = {};
    for (var i = 0; i < this.spec.filters.length; i ++) {
        var filter = this.spec.filters[i];
        this.filterMap[filter.fieldName] = filter;
    }

    var thiz = this;
    $dataViewService.getAllSavedViewsBySpecification(this.spec.id, function (paginatedList) {
        thiz._render(paginatedList.result);
        var defaultSavedView = paginatedList.result.find(function (item) {
            return item.isDefault;
        });

        thiz.setSelectedSavedView(defaultSavedView ? defaultSavedView : null, false, null);

        if (callback) callback();
    });
};

DataViewSavedViewSelector.FILTER_TO_DESCRIPTION_CONVERTER = {
    Range: function (filter, value) {
        var valueText = "";
        if (!value || ((typeof(value.from) == "undefined" || value.from === null) && (typeof(value.to) == "undefined" || value.to === null))) {
            return null;
        }
        
        var time = filter.extra && filter.extra.withTime;
        
        if (value.from !== null && value.from !== undefined) {
            var s = value.from;
            if (value.from instanceof Date) {
                s = moment(value.from).format(time ? DateTimePicker.getDateTimeFormat() : DateTimePicker.getDateFormat());
            }
            
            valueText = "from " + s;
        }
        if (value.to !== null && value.to !== undefined) {
            var s = value.to;
            if (value.to instanceof Date) {
                s = moment(value.to).format(time ? DateTimePicker.getDateTimeFormat() : DateTimePicker.getDateFormat());
            }
            valueText += " to " + s;
        }
        
        return {
            _name: "span",
            _children: [
                {
                    _name: "span",
                    "class": "Name",
                    _text: filter.title + ": "
                },
                {
                    _name: "span",
                    "class": "Value",
                    _text: valueText
                }
            ]
        };
    },
    List: function (filter, value) {
        if (!value) return null;
        var childs = [];
        var names = [];
        for (var i = 0 ; i < filter.values.length; i++) {
            var item = filter.values[i];
            if (value.indexOf(item.key) >= 0) names.push(item.value);
            childs.push({key: item.key, value: item.value || ""})
        }
        
        if (names.length == 0) return null;
        
        return {
            _name: "span",
            _children: [
                {
                    _name: "span",
                    "class": "Name",
                    _text: filter.title + ": "
                },
                {
                    _name: "span",
                    "class": "Value",
                    _text: names.join(", ")
                }
            ]
        };
    },
    ExclusiveList: function (filter, value) {
        if (!value) return null;
        var childs = [];
        var names = [];
        for (var i = 0 ; i < filter.values.length; i++) {
            var item = filter.values[i];
            if (value.indexOf(item.key) >= 0) names.push(item.value);
            childs.push({key: item.key, value: item.value || ""})
        }
        
        if (names.length == 0) return null;
        
        return {
            _name: "span",
            _children: [
                {
                    _name: "span",
                    "class": "Name",
                    _text: filter.title + ": "
                },
                {
                    _name: "span",
                    "class": "Value",
                    _text: names.join(", ")
                }
            ]
        };
    },
    Text: function (filter, value) {
        if (!value) return null;
        return {
            _name: "span",
            _children: [
                {
                    _name: "span",
                    "class": "Name",
                    _text: filter.title + ": "
                },
                {
                    _name: "span",
                    "class": "Value",
                    _text: value
                }
            ]
        };
    }
};

DataViewSavedViewSelector.prototype.generateFilterDescription = function (savedView) {
    var filters = [];
    
    if (savedView && savedView.valueMap) {
        for (var name in savedView.valueMap) {
            var value = savedView.valueMap[name];
            var filter = this.filterMap[name];
            
            if (!filter) continue;
            var node = DataViewSavedViewSelector.FILTER_TO_DESCRIPTION_CONVERTER[filter.filterType](filter, value);
            if (!node) continue;
            filters.push(node);
        }
        
        if (filters.length > 0) {
            return Dom.newDOMFragment(filters);
        }
    }
    return document.createTextNode("No filter applied");
};
DataViewSavedViewSelector.prototype.setSelectedSavedView = function (savedView, modified, originalSavedView) {
    if (!savedView) {
        Dom.setInnerText(this.nameLabel, "View All");
        Dom.setInnerText(this.descriptionLabel,  "No filter applied");
        Dom.addClass(this.displayBox, "Null");
        Dom.removeClass(this.displayBox, "DefaultView");
    } else {
        if (!modified) {
            Dom.setInnerText(this.nameLabel, savedView.name);
        } else {
            if (originalSavedView) {
                Dom.setInnerText(this.nameLabel, savedView.name + " (modified)");
            } else {
                Dom.setInnerText(this.nameLabel, "Unsaved View");
            }
        }

        this.descriptionLabel.innerHTML = "";
        this.descriptionLabel.appendChild(this.generateFilterDescription(savedView));
        Dom.removeClass(this.displayBox, "Null");
        Dom.toggleClass(this.displayBox, "DefaultView", savedView.isDefault);
    }

    Dom.toggleClass(this.displayBox, "Modified", modified ? true : false);

    this.selectedSavedView = savedView;
    this.modified = modified;
    this.originalSavedView = originalSavedView;

    this._markAsSelected(this.selectedSavedView);
};
DataViewSavedViewSelector.prototype.getSelectedSavedView = function () {
    return this.selectedSavedView;
};

DataViewSavedViewSelector.prototype._markAsSelected = function (savedView) {
    Dom.doOnSelector(this.itemRepeaterView.node(), ".SavedViewItem", function (view) {
        var selected = false;
        if (!view._savedView) {
            selected = !savedView;
        } else {
            selected = savedView && savedView.id == view._savedView.id;
        }

        Dom.toggleClass(view, "Selected", selected);
    });
};
DataViewSavedViewSelector.prototype._showPopup = function () {
    var now = new Date().getTime();
    console.log(this._lastPopupHiddenAt, now);
    if (this.popup != null && (this.popup.isVisible() || (this._lastPopupHiddenAt && this._lastPopupHiddenAt >= now - 100))) {
        this.popup.hide();
        return;
    }
    this.popup.setMinWidth(this.node().offsetWidth);
    this.popup.show(this.node(), "left-inside", "bottom", 0, 5, "autoFlip");
};
DataViewSavedViewSelector.prototype.reload = function (callback) {
    var thiz = this;
    $dataViewService.getAllSavedViewsBySpecification(this.spec.id, function (paginatedList) {
        thiz._render(paginatedList.result);
        if (callback) callback();
    });
};

DataViewSavedViewSelector.prototype._render = function (list) {
    var actualList = [null].concat(list);

    this.itemRepeaterView.setItems(actualList);
};
DataViewSavedViewSelector.prototype._handleMenuClick = function (event) {
    var item = Dom.findParentWithClass(event.target, "SavedViewItem");
    if (!item) return;

    if (Dom.findParentWithClass(event.target, "AnonId_makeDefaultButton")) {
        this._makeDefault(item._savedView);
        return;
    }
    if (Dom.findParentWithClass(event.target, "AnonId_deleteButton")) {
        this._delete(item._savedView);
        return;
    }

    this.setSelectedSavedView(item._savedView, false, null);
    this.popup.hide();
    Dom.emitEvent("p:ItemSelected", this.node(), {});
};

DataViewSavedViewSelector.prototype._setupReordering = function () {
    var baseFunction = DragAndDropManager.DROP_AT_CONTAINER(false);
    var dropTargetFinderFunction = function (event, manager) {
        var target = baseFunction(event, manager);
        if (target && target.element) {
            if (Dom.hasClass(target.element, "Null") && target.mode == DragAndDropManager.DROP_PREV_SIBLING) {
                return null;
            }
        }
        return target;
    }.bind(this);
    this.dnd = new DragAndDropManager()
    .source(this.itemRepeaterView.node())
    .anchor(function (node) {
        return Dom.hasClass(node, "ItemDragger");
    })
    .itemInfo(function (anchor) {
        var item = Dom.findParentWithClass(anchor, "SavedViewItem");
        if (!item) return null;
        return {
            element: item,
            data: item._savedView
        };
    })
    .destination(this.itemRepeaterView.node())
    .canDrop(function (data) {
        return data ? true : false;
    }
    .bind(this))
    .dropAt(dropTargetFinderFunction)
    .setup();

    this.dnd.createDragImageNode = function () {
        var node = Dom.newDOMElement({
            _name: "div",
            "class": "SavedViewItemDragImage"
        });
        node.style.width = Dom.getOffsetWidth(DragAndDropManager.draggable) + "px";
        node.style.height = Dom.getOffsetHeight(DragAndDropManager.draggable) + "px";
        node.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
        return node;
    };
    this.dnd.createDropHintNode = function () {
        return Dom.newDOMElement({
            _name: "div",
            "class": "DropHint"
        });
    };
    this.dnd.onDrop = function (draggable, draggedData, target) {
        if (!draggable || !target) return;
        if (target.mode == DragAndDropManager.DROP_APPEND) {
            if (draggable.parentNode) draggable.parentNode.removeChild(draggable);
            target.element.appendChild(draggable);
        } else if (target.mode == DragAndDropManager.DROP_PREV_SIBLING) {
            if (target.element != draggable) {
                var container = target.element.parentNode;
                if (draggable.parentNode) draggable.parentNode.removeChild(draggable);
                container.insertBefore(draggable, target.element);
            }
        }
        Dom.addClass(draggable, "JustDropped");

        window.setTimeout(function () {
            Dom.removeClass(draggable, "JustDropped");
        }, 100);

        this._saveOrdersLater();
    }.bind(this);
};

DataViewSavedViewSelector.prototype._saveOrdersLater = function () {
    if (this._orderSavingTimeout) window.clearTimeout(this._orderSavingTimeout);
    var thiz = this;
    this._orderSavingTimeout = window.setTimeout(function () {
        thiz._saveOrders();
        thiz._orderSavingTimeout = null;
    }, 1000);
};
DataViewSavedViewSelector.prototype._saveOrders = function () {
    var ids = [];
    Dom.doOnSelector(this.itemRepeaterView.node(), ".SavedViewItem", function (view) {
        if (view._savedView) ids.push(view._savedView.id);
    });

    $dataViewService.updateSavedViewOrders(this.spec.id, ids, function () {
        SnackBar.show("Saved view orders were saved successfully.");
    });
};
DataViewSavedViewSelector.prototype._makeDefault = function (savedView) {
    var thiz = this;

    $dataViewService.makeSavedViewAsDefault(savedView.id, function () {
        SnackBar.show("'" + savedView.name + "' was successfully makred as default.");
        $dataViewService.getAllSavedViewsBySpecification(thiz.spec.id, function (paginatedList) {
            thiz._render(paginatedList.result);
            thiz._markAsSelected(thiz.selectedSavedView);
        });
    });
};
DataViewSavedViewSelector.prototype._delete = function (savedView) {
    var thiz = this;
    Dialog.confirm("Are you sure you want to delete this saved view?",
        "This operation cannot be rolled back. Deleted save view cannot be restored.",
        "Delete", function () {
            $dataViewService.deleteSavedView(savedView.id, function () {
                $dataViewService.getAllSavedViewsBySpecification(thiz.spec.id, function (paginatedList) {
                    thiz._render(paginatedList.result);

                    // var defaultSavedView = paginatedList.result.find(function (item) {
                    //     return item.isDefault;
                    // });
                    //
                    // thiz.setSelectedSavedView(defaultSavedView ? defaultSavedView : null, false, null);
                    //
                    // if (callback) callback();
                });
            });
        },
        "Cancel", function () {
    });
};
