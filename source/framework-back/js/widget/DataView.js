function DataView(node) {
    BaseTemplatedWidget.call(this);

    var thiz = this;
    this.specId = Util.getProperty(node, "spec-id", null);

    this.customColumRendererMap = {};
    this.actions = [];

    this.bind("click", function () {
        new DataViewFilterDialog().callback(function (valueMap) {
            if (typeof(valueMap) == "undefined") return;
            for (var name in valueMap) {
                thiz.savedView.valueMap[name] = valueMap[name];
            }
            thiz._updateSavedView();
            thiz.filterView.setValueMap(thiz.savedView.valueMap);
            thiz._updateDataTableView();
        }).open({
            spec: thiz.spec,
            valueMap: thiz.savedView && thiz.savedView.valueMap || {}
        });
    }, this.editFilterButton);

    this.bind("p:ItemSelected", function () {
        thiz._updateView();

    }, this.savedFilterCombo);

    var applyFilterChange = function () {
        this.applyFilterChangeTimer = null;
        var valueMap = this.filterView.getValueMap();
        for (var name in valueMap) {
            this.savedView.valueMap[name] = valueMap[name];
        }

        this._updateSavedView();
        this._updateDataTableView();
    }.bind(this);

    this.bind("p:PropertyValueChanged", function (event) {
        if (this.applyFilterChangeTimer) window.clearTimeout(this.applyFilterChangeTimer);
        this.applyFilterChangeTimer = window.setTimeout(applyFilterChange, 600);
    }, this.filterView);

    this.bind("click", function (event) {
        if (!this.savedView.sortedBy) {
            this.savedView.sortedBy = {
                name: this.dataListSource.order.propertyName || "name",
                asc: this.dataListSource.order.asc || true
            }
        }
        if (!this.savedView.columns) this.savedView.columns = this.dataTable.getVisibleColumnIds();
        if (!this.savedView.specId) this.savedView.specId = this.specId;

        new DataViewSavedViewUpdateDialog().callback(function (savedView) {
            if (!savedView) return;
            this.savedFilterCombo.reload(function () {
                this.savedFilterCombo.setSelectedSavedView(savedView);
                this._updateView();
            }.bind(this));

        }.bind(this)).open({savedView: this.savedView});
    }, this.saveButton);

    this.dataTable.comparer = this.paginator.comparer = Util.sameId;
}
__extend(BaseTemplatedWidget, DataView);

DataView.prototype.setup = function () {
    var thiz = this;
    this.savedFilterCombo.init(this.spec, function () {
        thiz.setupImpl();
    });
};
DataView.prototype.setupImpl = function () {
    var thiz = this;
    this._initializeDataTable();

    this.paginator.setup({
        getTotalItemText: function(total) {
            return String.format("Total %d items", total);
        },
        showPaginator: true,
        withoutStatus: true,
        onPageLoaded: function (p, count) {
            thiz.refreshedAt = new Date().getTime();
            var start = p.currentPage * p.pageSize + 1;
            var end = start + count - 1;
            Dom.emitCustomEvent("p:PageLoaded", thiz.node(), {
                page: p.currentPage,
                totalPages: p.totalPages,
                totalItems: p.totalItems
            });

            // Dom.setInnerText(thiz.contentDescription, String.format("Showing items {0}-{1} of {2}", start, end, p.totalItems));
        },
        comparer: function (a, b) {
            return a.id == b.id;
        },
        useButtons: true,
        avoidPageSizeRecalculation: this.spec.fixedPageSize ? true : false
    });
    this.paginator.pageSize = this.spec.fixedPageSize || 20;
    this.paginator.control(this.dataTable);
    this.paginator.needCalculatePageSize = function () {
        return thiz.spec.fixedPageSize ? false : true;
    };

    this.dataTable.addListener({
        onSelectionChanged: function (data, fromUserAction) {
            // if (!fromUserAction) return;
            thiz._invalidateActions();
            Dom.emitCustomEvent("p:SelectionChanged", thiz.node(), {
                count: thiz.getSelectedItemCount(),
                total: thiz.paginator.totalItems
            });
        }
    });

    this.showingFilters = [];
    this.spec.filters.map(function (filter) {
        if (filter.visible) thiz.showingFilters.push(filter);
    });

    this.filterView.setFilterList(this.showingFilters);

    this.setupDone = true;
    this._updateView();
};
DataView.prototype._updateView = function () {
    this.originalSavedView = this.savedFilterCombo.getSelectedSavedView();

    var replacer = function (key, value) {
        if (!value || !(this[key] instanceof Date)) return value;
        return "date(" + this[key].getTime() + ")";
    };

    this.savedView = JSON.parse(JSON.stringify(this.originalSavedView || {valueMap: {}}, replacer), _globalJSONReviver);
    this.filterView.setValueMap(this.savedView.valueMap || {});
    this._updateDataTableView();
    this.saveButton.disabled = true;
    this._invalidateActions();
};

DataView.prototype.onAttached = function () {
    var thiz = this;

    $dataViewService.getSpecification(this.specId, function (spec) {
        thiz.spec = spec;
        thiz.spec.id = thiz.specId;
        thiz.setup();
    });
};

DataView.prototype._updateDataTableView = function () {
    var thiz = this;

    var defaultOrder = {
        propertyName: "name",
        asc: true
    };

    if (this.savedView && this.savedView.sortedBy && this.savedView.sortedBy) {
        defaultOrder.propertyName = this.savedView.sortedBy.name || defaultOrder.propertyName;
        defaultOrder.asc = this.savedView.sortedBy.asc || defaultOrder.asc;
    } else {
        if (this.spec.defaultSortColumn) {
            defaultOrder.propertyName = this.spec.defaultSortColumn;
            defaultOrder.asc = typeof(this.spec.defaultSortDirection) != undefined ? this.spec.defaultSortDirection : true;
        } else {
            var sortableColumn = null;
            for (var i = 0; i < this.spec.columns.length; i ++) {
                var c = this.spec.columns[i];
                if (c.sortable) {
                    sortableColumn = c;
                    break;
                }
            }

            if (sortableColumn) {
                defaultOrder.propertyName = sortableColumn.fieldName;
            }
        }
    }

    this.dataListSource = {
        order: defaultOrder,
        term: "",
        paramName: "name",
        loadPage: function (pageIndex, pageSize, handler, failed) {
            $dataViewService.list(thiz.specId, thiz.savedView.valueMap || {}, pageIndex * pageSize, pageSize, [{name: this.order.propertyName, asc: this.order.asc}], function (data) {
                handler(data.result, data.count);
            }, thiz.dataTable);
        },

        getOrder: function () {
            return this.order;
        },
        setOrder: function (order) {
            this.order = order;
        }
    };

    // set visible columns
    if (this.savedView.columns) this.dataTable.setVisibleColumnIds(this.savedView.columns);

    window.setTimeout(function () {
        this.paginator.setSource(this.dataListSource);
        // this.dataTable.invalidateSizing();
    }.bind(this), 200);
};

DataView.RENDERER = {
    Date: function (data, value) {
        return { _name: "hbox",
        _children: [
            {_name: "span", _text: "" + value}
        ]};
    },
    Number: function (data, value) {
        return { _name: "hbox",
        _children: [
            {_name: "span", _text: "" + value}
        ]};
    },
    NumberAsBoolean: function (data, value) {
        return { _name: "hbox",
        _children: [
            {_name: "span", _text: (value == 1 ? "YES" : "NO")}
        ]};
    },
    String: function (data, value) {
        return { _name: "hbox",
        _children: [
            {_name: "span", _text: "" + value}
        ]};
    },
    Html: function (data, value) {
        return { _name: "hbox",
        _children: [
            {_name: "span", _html: "" + value}
        ]};
    },
    "String[]": function (data, value) {
        return { _name: "hbox",
        _children: [
            {_name: "span", _text: "" + (value ? value.join("\n") : "")}
        ]};
    },
    "Html[]": function (data, value) {
        return {
            _name: "vbox",
            _html: (value ? (value.map(function (row) { return "<div><span>" + row + "</span></div>"; }).join("\n")) : "")
        };
    }
};
DataView.prototype.registerCustomRenderer = function (fieldName, renderer) {
    this.customColumRendererMap[fieldName] = renderer;
};

DataView.prototype._installTableColumn = function (specCol) {
    var thiz = this;
    var column = new DataTable.GenericDomColumn(specCol.title, function (data) {
        var renderer = thiz.customColumRendererMap[specCol.fieldName] || DataView.RENDERER[specCol.rendererType || specCol.type || "String"];
        return renderer(data, data[specCol.fieldName]);
    }).width(specCol.sizing);
    if (specCol.sortable) column = column.sortable(specCol.sortFieldName || specCol.fieldName);
    if (!specCol.visible) column = column.hiddenByDefault();
    if (!specCol.removable) column = column.isUnremovable();

    this.dataTable.column(column);
};
DataView.prototype._initializeDataTable = function () {
    this.spec.columns.map(this._installTableColumn.bind(this));
    this.dataTable.configurable().selector(true);
    this.dataTable.useFloatingHeader = true;
    var thiz = this;
    this.dataTable.setDefaultSelectionHandler({
        run: function (data, event) {
            var fieldName = null;
            var cell = Dom.findUpward(event.target, function (node) {
                return node.getAttribute && node.getAttribute("column-id");
            });

            if (cell) fieldName = cell.getAttribute("column-id");

            if (thiz.selectionHandler) {
                thiz.selectionHandler(data, fieldName, cell, event);
            }

            Dom.emitCustomEvent("p:ItemClicked", thiz.node(), {
                cell: cell,
                fieldName: fieldName
            });
        }
    });
    this.dataTable.addOrderRequestListener({
        changeOrder: function (order) {
            thiz.savedView.sortedBy = {
                name: order.propertyName,
                asc: order.asc
            };
            thiz._updateSavedView();
        }
    });
    this.dataTable.addColumnSettingListener({
        changeColumnSetting: function (columnIds) {
            thiz.savedView.columns = columnIds;
            thiz._updateSavedView();
        }
    });
    this.dataTable.setColumnSettingDialog(DataTableOrderingColumnSettingDialog);
    this.dataTable.setup();
};
DataView.prototype._invalidateActions = function () {
    if (!this.actions || !this.setupDone) return;
    this.actions.forEach(function (action) {
        action.invalidate();
    });
};
DataView.prototype._updateSavedView = function () {
    var v1 = this.originalSavedView && typeof(this.originalSavedView) == "object" ? JSON.stringify(this.originalSavedView) : this.originalSavedView;
    var v2 = this.savedView && typeof(this.savedView) == "object" ? JSON.stringify(this.savedView) : this.savedView;

    var modified = v1 != v2;
    this.savedFilterCombo.setSelectedSavedView(this.savedView, modified, this.originalSavedView);
    this.saveButton.disabled = !modified;
}
DataView.prototype.setDefaultSelectionHandler = function (handler) {
    this.selectionHandler = handler;
};

DataView.prototype.createActionBarAction = function (action) {
    var thiz = this;
    return {
        isVisible: function () {
            if (typeof(action.visible) == "undefined") {
                return true;
            } else {
                if (typeof(action.visible) == "function") return action.visible(thiz.getSelectedItemCount(), thiz);
                return action.visible;
            }
        },
        isApplicable: function () {
            if (typeof(action.applicable) == "undefined") {
                return thiz.getSelectedItemCount() > 0;
            } else {
                if (typeof(action.applicable) == "function") return action.applicable(thiz.getSelectedItemCount(), thiz);
                return action.applicable;
            }
        },
        getIcon: function () {
            return typeof action.icon == "function" ? action.icon() : action.icon;
        },
        getTitle: function () {
            return (typeof action.title == "function" ? action.title() : action.title);
        },
        run: function () {
            thiz.getSelectedItems(action.run, true);
        },
        getGroup: function () {
            return (typeof action.group == "function" ? action.group() : action.group) || "No group";
        },
        id: action.id
    };
};
DataView.prototype.createActionMenuAction = function (action) {
    var thiz = this;
    return {
        title: action.title,
        icon: action.icon,
        run: function () {
            thiz.getSelectedItems(action.run, true);
        },
        applicable: function () {
            if (typeof(action.applicable) == "undefined") {
                return thiz.getSelectedItemCount() > 0;
            } else {
                if (typeof(action.applicable) == "function") return action.applicable(thiz.getSelectedItemCount(), thiz);
                return action.applicable;
            }
        },
        visible: function () {
            if (typeof(action.visible) == "undefined") {
                return true;
            } else {
                if (typeof(action.visible) == "function") return action.visible(thiz.getSelectedItemCount(), thiz);
                return action.visible;
            }
        },
        group: action.group
    };
};
DataView.prototype.registerActions = function (actions, title, icon) {
    var actionMenu = null;
    var actionBar = null;
    var thiz = this;
    for (var i = 0; i < actions.length; i ++) {
        var action = actions[i];
        if (action.important) {
            if (!actionBar) {
                actionBar = new ActionBar();
            }

            actionBar.register(this.createActionBarAction(action));

        } else {
            if (!actionMenu) {
                actionMenu = new ActionMenu();
                actionMenu.setTitle({label: title || "Action", icon: icon});
            }
            actionMenu.register(this.createActionMenuAction(action));
        }
    }

    if (actionMenu) {
        this.actions.push(actionMenu);
        this.actionBar.appendChild(actionMenu.node());
    }
    if (actionBar) {
        this.actions.push(actionBar);
        this.actionBar.appendChild(actionBar.node());
    }

    this._invalidateActions();
};
DataView.prototype.getSelectedItems = function (callback) {
    return this.paginator.getSelectedItems(callback);
};
DataView.prototype.getSelectedItemCount = function () {
    return this.paginator.getSelectionCount();
};
DataView.prototype.getSelectedItems = function (callback) {
    return this.paginator.getSelectedItems(callback);
};
DataView.prototype.isSelectAllMarked = function () {
    return this.dataTable.isSelectAll();
};
DataView.prototype.refreshDataList = function (keepSelection) {
    if (!keepSelection) this.paginator.clearSelection();
    this.paginator.refresh();
    this._invalidateActions();
};
