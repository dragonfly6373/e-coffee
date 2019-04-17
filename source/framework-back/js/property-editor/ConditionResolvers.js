var ConditionResolvers = {
    "==": function (a, b) {
        return a == b;
    },

    ">": function (a, b) {
        return a > b;
    },

    ">=": function (a, b) {
        return a >= b;
    },

    "<": function (a, b) {
        return a < b;
    },

    "<=": function (a, b) {
        return a <= b;
    },

    "!=": function (a, b) {
        return a != b;
    },

    "===": function (a, b) {
        return a === b;
    },

    "!==": function (a, b) {
        return a !== b;
    },

    "contains": function (a, b) {
        return a && a.indexOf && a.indexOf(b) >= 0;
    },

    "matches": function (a, b) {
        return a && a.match && a.match(b);
    },
    "disabled": function () {
        return false;
    }
};
