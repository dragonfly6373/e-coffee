function PropertiesPage() {
    BaseTemplatedWidget.call(this);
    var thiz = this;
    this.bind("click", function (){
            thiz.dumpValue();
    }, this.getValueButton);
}
__extend(BaseTemplatedWidget, PropertiesPage);
PropertiesPage.prototype.dumpValue = function() {
    var map = {};

    for (var i = 0; i < this._editors.length; i++) {
        var editor = this._editors[i];
        map[editor._schema.name] = editor.getValue();
    }
    console.log(map);
}
PropertiesPage.prototype.onAttached = function() {
    //console.log("onAttached called");
    //console.trace();
    var schemas = PropertySchema.schemas;
    Dom.empty(this.editorsContainer);

    var valuesMap = {
        "backgroundColor": "#336699FF",
        "padding": 2.3,
        "description": "Long description text here",
        "border": {
            "color": "#456544FF",
            "width": 3,
        },
        "palette": ["#223344FF", "#000011FF"],
        "default": false,
        "for": "All"
    };
    this._editors = [];
    this._editorsPathMap = {};
    for (var i = 0; i < schemas.length; i++) {
        var schema = schemas[i];
        var f = PropertySchema.editorsMap[schema.type];
        if (!f) {
            console.log("Impl of " + schema.type + " not found");
            continue;
        }
        //console.log("Editor " +f);
        var editor = new f();
        var valueForEditor = valuesMap[schema.name];
        var v = this.valuesMap ? this.valuesMap[schema.name] : undefined;
        if (v === undefined) {
            v = schema.defaultValue;
        }
        editor.setRefSchema(schema);
        editor.setValue(v);
        editor.into(this.editorsContainer);
        var path = "/" + schema.name;
        editor.setContext(this, path);
        if (i < schemas.length -1) {
            this.editorsContainer.appendChild(Dom.newDOMElement({_name: "div", class: "Separator"}));
        }
        editor.render();
        this._editors.push(editor);
        this._editorsPathMap[path] = editor;
    }

}
