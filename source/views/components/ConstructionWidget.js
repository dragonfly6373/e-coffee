function ConstructionWidget() {
    BaseTemplatedWidget.call(this);
}
__extend(BaseTemplatedWidget, ConstructionWidget);

ConstructionWidget.prototype.buildDOMNode = function() {
    return Dom.newDOMElement({
        _name: "vbox",
        _style: "align-items: center; margin: 3em 0em; color: #666",
        _children: [
            {_name: "h3",  _text: "This feature is under construction. Please come again later!"}
        ]
    });
}
