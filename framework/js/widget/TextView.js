function TextView() {
    BaseTemplatedWidget.call(this);
}
__extend(BaseTemplatedWidget, TextView);
TextView.prototype.onAttached = function() {
}
TextView.prototype.setText = function(text) {
    Dom.setInnerText(this.label, text);
    var h = Dom.getOffsetHeight(this.label);
    var w = Dom.getOffsetWidth(this.label);
    
}
