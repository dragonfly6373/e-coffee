function NPatchScalableView(n) {
    BaseTemplatedWidget.call(this);

    this.originalSize = {
        w: parseInt(n.getAttribute("width"), 10),
        h: parseInt(n.getAttribute("height"), 10)
    };

    var d = n.getAttribute("d");
    this.model = NPatchScalableView.parsePathData(d);

    this.xCells = NPatchScalableView.parseCellString(n.getAttribute("xcells"));
    this.yCells = NPatchScalableView.parseCellString(n.getAttribute("ycells"));

    this.pathPadding = n.hasAttribute("padding") ? parseInt(n.getAttribute("padding"), 10) : 0;
}
__extend(BaseTemplatedWidget, NPatchScalableView);

NPatchScalableView.prototype.onSizeChanged = function () {
    var w = this.node().offsetWidth;
    var h = this.node().offsetHeight;

    var stroke = Math.ceil(parseFloat(window.getComputedStyle(this.path).strokeWidth));
    if (stroke % 2 == 1) stroke ++;

    this.svg.setAttribute("width", w);
    this.svg.setAttribute("height", h);

    w -= stroke + 2 * this.pathPadding;
    h -= stroke + 2 * this.pathPadding;

    var delta = stroke / 2 + this.pathPadding

    var model = JSON.parse(JSON.stringify(this.model));
    var d = NPatchScalableView.scalePathData(model, this.xCells, this.yCells, this.originalSize, {w: w, h: h});
    this.path.setAttribute("d", d);
    this.path.setAttribute("transform", "translate(" + delta + ", " + delta + ")");
};

NPatchScalableView.buildNPatchModel = function (cells, originalSize, newSize) {
    var totalScaleSize = 0;
    for (var i = 0; i < cells.length; i ++) {
        var cell = cells[i];
        totalScaleSize += (cell.to - cell.from);
    }

    var r = (newSize - (originalSize - totalScaleSize)) / totalScaleSize;

    var models = [];
    var total = 0;
    var scaledTotal = 0;
    var last = false;

    //add a sentinel
    cells = cells.concat([{from: originalSize, to: originalSize + 1}]);

    for (var i = 0; i < cells.length; i ++) {
        var cell = cells[i];
        if (cell.from == cell.to) continue;

        var last = (i == cell.length - 2);

        var model = null;
        if (cell.from > total) {
            model = {
                start: total,
                size: cell.from - total,
                scaledStart: scaledTotal,
                scale: false
            };

            models.push(model);
            total = cell.from;
            scaledTotal += model.size;
        }

        if (cell.from >= originalSize) break;

        var scaledSize = (last ? (newSize - (originalSize - cell.to) - scaledTotal) : (r * (cell.to - cell.from)));

        model = {
            start: total,
            size: cell.to - cell.from,
            scaledStart: scaledTotal,
            scaledSize: scaledSize,
            scale: true
        };

        model.r = model.scaledSize / model.size;

        models.push(model);
        total = cell.to;
        scaledTotal += model.scaledSize;
    }

    return models;
};

NPatchScalableView.parsePathData = function (pathDataLiteral) {
    function normalize(pin) {
        // pin.x = Math.round(pin.x);
        // if (typeof(pin.y) == "number") pin.y = Math.round(pin.y);
    }
    function normalizeAll(pins) {
        // for (var pin of pins) normalize(pin);
    }

    function processMultiPoints(points, current, chunk, relative) {
        var count = Math.ceil(points.length / chunk);
        for (var i = 0; i < count; i ++) {
            var pin = points[i * chunk + (chunk - 1)];

            for (var j = 0; j < (chunk - 1); j ++) {
                var p = points[i * chunk + j];
                if (relative) {
                    p.x += current.x;
                    p.y += current.y;
                }

                p.fixed = true;
            }

            normalize(pin);

            if (relative) {
                pin.x += current.x;
                pin.y += current.y;
            }
            current = pin;
        }

        return current;
    }

    //parse the original data
    var RE = /([A-Z])([^A-DF-Z]*)/gi;
    var commands = [];
    var result = null;
    var current = {x: 0, y: 0};
    while ((result = RE.exec(pathDataLiteral))) {
        var c = result[1];
        var command = {
            command: c.toUpperCase()
        };
        var data = result[2].trim();
        if (data) {
            var DATA_RE = /(\-?[0-9\.eE\-]+)(\,(\-?[0-9\.eE\-]+))?/g;
            var points = [];
            var result2 = null;
            while ((result2 = DATA_RE.exec(data))) {
                var x = parseFloat(result2[1]);
                var y = result2[3];
                if (y) y = parseFloat(y);
                points.push({
                    x: x,
                    y: y
                });
            }

            if (c == "M" || c == "L" || c == "T") {
                normalizeAll(points);
                command.points = points;
                current = points[points.length - 1];
            } else if (c == "m" || c == "l" || c == "t") {
                for (var i = 0; i < points.length; i ++) {
                    var p = points[i];
                    p.x += current.x;
                    p.y += current.y;

                    current = p;
                }
                normalizeAll(points);
                command.points = points;
            } else if (c == "H") {
                for (var i = 0; i < points.length; i ++) {
                    var p = points[i];
                    p.y = current.y;
                    current = p;
                }
                normalizeAll(points);
                command.points = points;
                command.command = "L";
            } else if (c == "h") {
                for (var i = 0; i < points.length; i ++) {
                    var p = points[i];
                    p.x += current.x;
                    p.y = current.y;
                    current = p;
                }
                normalizeAll(points);
                command.points = points;
                command.command = "L";
            } else if (c == "V") {
                for (var i = 0; i < points.length; i ++) {
                    var p = points[i];
                    p.y = p.x;
                    p.x = current.x;
                    current = p;
                }
                normalizeAll(points);
                command.points = points;
                command.command = "L";
            } else if (c == "v") {
                for (var i = 0; i < points.length; i ++) {
                    var p = points[i];
                    p.y = p.x + current.y;
                    p.x = current.x;
                    current = p;
                }
                normalizeAll(points);
                command.points = points;
                command.command = "L";
            } else if (c == "c" || c == "C") {
                current = processMultiPoints(points, current, 3, c == "c");
                command.points = points;
            } else if (c == "s" || c == "S") {
                current = processMultiPoints(points, current, 2, c == "s");

                command.points = points;
            } else if (c == "q" || c == "Q") {
                current = processMultiPoints(points, current, 2, c == "q");
                command.points = points;
            } else if ((c == "a" || c == "A") && points.length == 5) {
                for (var i = 0; i < points.length; i ++) {
                    var p = points[i];
                    p.fixed = true;
                    p.noRelativeRecalcuate = true;
                }
                var pin = points[4];
                pin.fixed = false;
                pin.noRelativeRecalcuate = false;
                if (c == "a") {
                    pin.x += current.y;
                    pin.y += current.y;
                }
                current = pin;

                normalizeAll(points);
                command.points = points;
                command.command = "A";
            }
        }

        commands.push(command);
    }

    return commands;

};

NPatchScalableView.calculateScaledPosition = function (value, models) {
    if (!models || models.length == 0) return value;
    var m = null;

    if (value < models[0].start) {
        m = models[0];
    } else {
        for (var i = 0; i < models.length; i ++) {
            var model = models[i];
            if (model.start <= value && value < (model.start + model.size)) {
                m = model;
                break;
            }
        }

        if (!m) m = models[models.length - 1];
    }

    if (m) {
        var d = value - m.start;

        if (m.scale) d *= m.r;

        return d + m.scaledStart;
    }

    return value;
};


NPatchScalableView.scalePathData = function (pathCommands, xCells, yCells, originalSize, newSize) {
    xCells = xCells || [];
    yCells = yCells || [];

    var xModel = NPatchScalableView.buildNPatchModel(xCells, originalSize.w, newSize.w);
    var yModel = NPatchScalableView.buildNPatchModel(yCells, originalSize.h, newSize.h);

    var newData = "";

    for (var k = 0; k < pathCommands.length; k ++) {
        var command = pathCommands[k];
        if (command.points) {
            var last = -1;
            for (var i = 0; i < command.points.length; i ++) {
                var pin = command.points[i];
                if (pin.fixed) {
                    continue;
                }

                var x = NPatchScalableView.calculateScaledPosition(pin.x, xModel);
                var y = NPatchScalableView.calculateScaledPosition(pin.y, yModel);

                for (var j = last + 1; j < i; j ++) {
                    if (command.points[j].noRelativeRecalcuate) continue;
                    command.points[j].x = x + command.points[j].x - pin.x;
                    if (typeof(command.points[j].y) == "number") command.points[j].y = y + command.points[j].y - pin.y;
                }

                pin.x = x;
                pin.y = y;
                last = i;
            }
        }

        if (newData) newData += " ";
        newData += command.command;
        if (command.points) {
            for (var i = 0; i < command.points.length; i ++) {
                var y = command.points[i].y;
                newData += (i > 0 ? " " : "") + command.points[i].x + (typeof(y) == "number" ? ("," + y) : "");
            }
        }
    }

    return newData;
};
NPatchScalableView.generatePathDOM = function (model, xCells, yCells, originalSize, size, style) {
    var specs = [];
    var d = NPatchScalableView.scalePathData(model, xCells, yCells, originalSize, size);
    specs.push({
        _name: "path",
        _uri: "http://www.w3.org/2000/svg",
        d: d,
        "stroke-linecap": "square",
        style: style ? style : ""
    });

    return Dom.newDOMFragment(specs);
};

NPatchScalableView.parseCellString = function (literal) {
    var cells = [];
    var blocks = literal.split(/[ ]+/);
    for (var i = 0; i < blocks.length; i ++) {
        var block = blocks[i];
        if (block.match(/^[ ]*([0-9]+)[ ]*\-[ ]*([0-9]+)[ ]*$/)) {
            cells.push({
                from: parseInt(RegExp.$1, 10),
                to: parseInt(RegExp.$2, 10)
            })
        }
    }

    return cells;
};
