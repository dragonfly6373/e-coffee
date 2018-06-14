var Condition = function(query) {
    this.query = query;
    this.queue = [];
};

Condition.prototype = {
    and: function(condition) {
        this.queue.push({operator: " AND", condition: condition});
    },
    or: function(condition) {
        this.queue.push({operator: " OR", condition: condition});
    }
}

Condition.prototype.toString = function() {
    return " WHERE" + this.build();
}

Condition.prototype.build = function() {
    var queryStr = this.query;
    for (var i in this.queue) {
        var opt = this.queue[i];
        queryStr += " " + opt.operator + (opt.condition.queue.length ? " (" + opt.condition.build() + ")" : " " + opt.condition.build());
    }
    return queryStr;
}

Condition.__proto__ = {
    eq: function(name, value) {
        return new Condition(" " + name + " = " + value);
    },
    ne: function(name, value) {
        return new Condition(" " + name + " != " + value);
    },
    gt: function(name, value) {
        return new Condition(" " + name + " > " + value);
    },
    gte: function(name, value) {
        return new Condition(" " + name + " >= " + value);
    },
    lt: function(name, value) {
        return new Condition(" " + name + " < " + value);
    },
    lte: function(name, value) {
        return new Condition(" " + name + " <= " + value);
    },
    in: function(name, args) {
        return new Condition(" " + name + " IN (" + args.join(", ") + ")");
    },
    between: function(name, start, end) {
        return new Condition(" " + name + " BETWEEN (" + start + ", " + end + ")");
    },
    isNull: function(name) {
        return new Condition(" " + name + " IS NULL");
    },
    isNotNull: function(name) {
        return new Condition(" " + name + " IS NOT NULL");
    },
    iLike: function(name, value) {
        return new Condition(" " + name + " ILIKE " + value);
    }
}
