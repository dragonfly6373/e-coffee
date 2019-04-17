function DataViewFilterView(node) {
    BaseTemplatedWidget.call(this);

    this.propertiesWidget.onValueChanged = this.onValueChanged;
    this.propertiesWidget.ignoreValueIfDependencyUnsatisfied(true);
}
__extend(BaseTemplatedWidget, DataViewFilterView);

DataViewFilterView.FILTER_TO_SCHEMA_CONVERTER = {
    Range: function (filter, value) {
        var schema = {
            displayName: filter.title,
            name: filter.fieldName,
            description: filter.description,
            type: "Complex",
            schemas: [
                {
                    displayName: filter.title + " from",
                    name: "from",
                    type: filter.extra.dataType == "Date" ? "Date" : "Number",
                    minValue: filter.minValue,
                    maxValue: filter.maxValue,
                    decimal: filter.extra && filter.extra.decimal,
                    defaultValue: filter.extra && filter.extra.defaultFrom,
                    blankValue: null
                },
                {
                    displayName: filter.title + " to",
                    name: "to",
                    type: filter.extra.dataType == "Date" ? "Date" : "Number",
                    minValue: filter.minValue,
                    maxValue: filter.maxValue,
                    decimal: filter.extra && filter.extra.decimal,
                    defaultValue: filter.extra && filter.extra.defaultTo,
                    blankValue: null,
                    useEndOfDay: filter.extra && filter.extra.useEndDateEOD
                }
            ]
        };
        
        return schema;
    },
    List: function (filter, value) {
        var childs = [];
        for (var i = 0 ; i < filter.values.length; i++) {
            var item = filter.values[i];
            childs.push({key: item.key, value: item.value || ""})
        }
        var schema = {
            displayName: filter.title,
            name: filter.fieldName,
            description: filter.description,
            defaultValue: filter.extra.defaultValue || [],
            type: "Enum",
            exclusive: false,
            items: childs
        };

        return schema;
    },
    ExclusiveList: function (filter, value) {
        var schema = {
            displayName: filter.title,
            name: filter.fieldName,
            description: filter.description,
            type: "Enum",
            exclusive: true,
            defaultValue: filter.extra.defaultValue || 0,
            items: filter.values
        };

        return schema;
    },
    Text: function (filter, value) {
        var schema = {
            displayName: filter.title,
            name: filter.fieldName,
            defaultValue: filter.extra.defaultValue || "",
            type: "String",
            placeHolder: filter.description
        };

        return schema;
    }
};

DataViewFilterView.prototype.setFilterList = function (filters, valueMap) {
    this.valueMap = valueMap || {};
    var schemas = filters.map(this.filterToSchema.bind(this));
    this.propertiesWidget.setSchemas(schemas);
    this.propertiesWidget.setValue(this.valueMap);
    this.propertiesWidget.setup();
};
DataViewFilterView.prototype.filterToSchema = function (filter) {
    var converter = DataViewFilterView.FILTER_TO_SCHEMA_CONVERTER[filter.filterType];
    var schema = converter(filter, this.valueMap[filter.fieldName]);
    if (filter.dependencies && filter.dependencies.length > 0) {
        schema.depends = [];
        filter.dependencies.map(function (d) {
            schema.depends.push({
                path: "/" + d.path,
                op: d.condition,
                values: d.values
            });
        });
    }
    return schema;
};
DataViewFilterView.prototype.setValueMap = function (valueMap) {
    this.propertiesWidget.setValue(valueMap);
    this.propertiesWidget.setup();
};
DataViewFilterView.prototype.getValueMap = function () {
    return this.propertiesWidget.getValue();
};
DataViewFilterView.prototype.onValueChanged = function (data) {
    Dom.emitEvent("p:PropertyValueChanged", this.node(), {});
};
DataViewFilterView.prototype.clearFilters = function () {
    this.propertiesWidget.setValue({});
    this.propertiesWidget.setup(true);
}
