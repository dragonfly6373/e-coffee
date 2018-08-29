function TestView(node) {
    BaseTemplatedWidget.call(this);

    this.dataView.registerCustomRenderer("mname", function (data, value) {
        return { _name: "hbox",
        _children: [
            {_name: "img", style: "width: 32px; height: 32px;", src: "https://dummyimage.com/32x32/ab1" + data.id+ "b/ffffff.png&text=" + data.id}
        ]};
    });

    this.dataView.registerActions([
        {
            title: "Multi Edit",
            icon: "pencil",
            run: function (items) {
                console.log("Items", items);
            },
            applicable: function (count, dataView) {
                return count > 0;
            }
        },
        {
            title: "Multi Edit 2",
            icon: "camera",
            run: function (items) {
                console.log("Items", items);
            },
            applicable: function (count, dataView) {
                return count % 2 == 1;
            },
            important: true
        }
    ], "Edit");
    
    this.bind("click", function () {
        this.dataView.refreshDataList();
    }, this.reloadButton);
    
    this.dataView.addEventListener("p:ItemClicked", function (event) {
        console.log(event);
    }, false);
    
    this.dataView.addEventListener("p:PageLoaded", function (event) {
        this.header.innerHTML = "" + event.detail.totalItems + " items loaded";
    }.bind(this), false);
}
__extend(BaseTemplatedWidget, TestView);

TestView.prototype.setup = function () {
};

TestView.prototype.onAttached = function () {

};
