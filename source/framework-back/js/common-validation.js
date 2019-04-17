(function (installationScope) {

function __ext() {
    var __base = arguments[0];
    var sub = arguments[1];

    sub.prototype = Object.create(__base.prototype);
    sub.prototype.constructor = sub;
    sub.__base = __base;

    return sub;
}

var ValidationManager = {
    patterns: {
        URL_REGEX: /^(?:(?:https?:)?\/\/)\w+[\w-]*(?:\.[\w\.-]+)+.*/,
        // ref: http://emailregex.com/
        EMAIL_REGEX: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    }
};
ValidationManager.patterns.RELATIVE_URL_REGEX = new RegExp("(" + /^\/\w.+$/.source + ")|(" + ValidationManager.patterns.URL_REGEX.source + ")");

function getDOMNode(input) {
    return (typeof (input.node) == "function") ? input.node() : input;
};
function saveValidationResult(input, result) {
    ensureListeners(input);

    var node = getDOMNode(input);
    Dom.toggleClass(node, "CV_Invalid", !result.valid);
    node._cvValidationResult = result;

    if (input.getFocusNode) {
        input.getFocusNode()._cvValidationResult = result;
    }
};

function handleInputFocus(event) {
    var node = Dom.findUpwardForNodeWithData(event.target, "_cvValidationResult");
    if (!node) return;

    invalidateTip(node._cvValidationResult);
}
function invalidateTip(result) {
    var node = getDOMNode(result.input);
    if (node._cvLastInfoTip) {
        node._cvLastInfoTip.close();
        if (node._cvLastInfoTip.popupContainer && document.body.contains(node._cvLastInfoTip.popupContainer)) {
            document.body.removeChild(node._cvLastInfoTip.popupContainer);
        }
    }
    if (!result.valid) {
        node._cvLastInfoTip = InfoTip.show(node, result.message, true, null, "error");
    }
}
function handleInputBlur(event) {
    var node = Dom.findUpwardForNodeWithData(event.target, "_cvValidationResult");
    node = getDOMNode(node._cvValidationResult.input);
    if (!node) return;
    if (node._cvLastInfoTip) node._cvLastInfoTip.close();
}
function handleInputChange(event) {
    var node = Dom.findUpwardForNodeWithData(event.target, "_cvValidationResult");
    var result = node._cvValidationResult;
    if (!result.liveValidation) return;
    var newResult = result.rule.validate({});
    newResult.liveValidation = result.liveValidation;
    saveValidationResult(newResult.input, newResult);
    if (node._cvLastInfoTip && node._cvLastInfoTip.isVisible()) {
        invalidateTip(newResult);
    }
}
function ensureListeners(input) {
    if (input._cvFocusListenerInstalled) return;

    var node = getDOMNode(input);
    var focusNode = input.getFocusNode ? input.getFocusNode() : node;

    Dom.registerEvent(focusNode, "focus", handleInputFocus, true);
    Dom.registerEvent(focusNode, "blur", handleInputBlur, true);

    Dom.registerEvent(node, "input", handleInputChange);
    Dom.registerEvent(node, "p:ItemSelected", handleInputChange);
    Dom.registerEvent(node, "p:ValueUpdated", handleInputChange);
    Dom.registerEvent(node, "p:SelectionChanged", handleInputChange);
    Dom.registerEvent(node, "text-change", handleInputChange);
    Dom.registerEvent(node, "p:FileModified", handleInputChange);
    input._cvFocusListenerInstalled = true;
}

ValidationManager.run = function (ruleSet) {
    var context = {
        ruleSet: ruleSet
    };

    var allValid = true;
    var failedInputs = [];
    for (var i = 0; i < ruleSet.rules.length; i ++) {
        var rule = ruleSet.rules[i];
        if (failedInputs.indexOf(rule.input) >= 0) continue;

        var result = rule.validate(context);
        result.liveValidation = ruleSet.liveValidation;

        saveValidationResult(result.input, result);

        if (!result.valid) {
            failedInputs.push(result.input);

            if (allValid) {
                if (typeof(result.input.focus) == "function") {
                    result.input.focus();
                } else {
                    getDOMNode(result.input).focus();
                }
            }
            allValid = false;
        }
    }

    return allValid;
};

function RuleSet() {
    this.rules = [];
    this.liveValidation = false;
}
RuleSet.prototype._add = function (rule, condition) {
    this.rules.push(condition ? new ConditionalRule(rule, condition) : rule);
};
RuleSet.prototype.custom = function(baseRule, getValueFunction, condition) {
    if (!(baseRule instanceof BaseRule)) return this;
    if (getValueFunction) {
        baseRule.getValue = function() {
            return getValueFunction(this);
        }
    }
    this._add(baseRule, condition);
    return this;
}
RuleSet.prototype.required = function (input, message, condition) {
    this._add(new RequiredRule(input, message), condition);
    return this;
};
RuleSet.prototype.pattern = function (input, regex, message, condition) {
    this._add(new PatternMatchedRule(input, regex, message), condition);
    return this;
};
RuleSet.prototype.dateAfter = function (input, refInput, message, condition) {
    this._add(new DateAfterRule(input, refInput, message), condition);
    return this;
};
RuleSet.prototype.min = function (input, min, exclusive, message, condition) {
    this._add(new MinValueRule(input, min, exclusive, message), condition);
    return this;
};
RuleSet.prototype.max = function (input, min, exclusive, message, condition) {
    this._add(new MaxValueRule(input, min, exclusive, message), condition);
    return this;
};

RuleSet.prototype.rule = function (rule) {
    this._add(rule);
    return this;
};
RuleSet.prototype.live = function (live) {
    this.liveValidation = live;
    return this;
};

function BaseRule(input, message) {
    this.input = input;
    this.message = message;
}

BaseRule.prototype.getValue = function () {
    if (this.input.getAttribute) {
        if (this.input.localName == "input" || this.input.localName == "textarea") return this.input.value.trim();
    }

    if (this.input instanceof ComboManager) return this.input.getSelectedItem();
    if (this.input instanceof FileUploadView) {
        var path = this.input.getCommaSeparatedStoragePaths();
        return path && path.length > 0 ? path : undefined;
    }
    if (this.input instanceof DateTimePicker) return this.input.getDate();
    if (this.input instanceof RichTextEditor) return this.input.getContent();

    return this.input.getValue ? this.input.getValue() : undefined;
};

BaseRule.prototype.failed = function (message) {
    return {
        valid: false,
        input: this.input,
        rule: this,
        message: message || this.message
    };
};
BaseRule.prototype.ok = function (message) {
    return {
        valid: true,
        input: this.input,
        rule: this,
        message: message || ""
    };
};

function RequiredRule(input, message) {
    BaseRule.call(this, input, message);
}
__ext(BaseRule, RequiredRule);

RequiredRule.prototype.validate = function (context) {
    var value = this.getValue();
    if (!value) return this.failed();
    if (!value.toString().trim()) return this.failed();

    return this.ok();
};


function PatternMatchedRule(input, regex, message) {
    BaseRule.call(this, input, message);
    this.regex = regex;
}
__ext(BaseRule, PatternMatchedRule);

PatternMatchedRule.prototype.validate = function (context) {
    var value = this.getValue();
    if (value == undefined || (value.length > 0 && !value.toString().match(this.regex))) return this.failed();

    return this.ok();
};

function MinValueRule(input, min, exclusive, message) {
    BaseRule.call(this, input, message);
    this.min = min;
    this.exclusive = exclusive;
}
__ext(BaseRule, MinValueRule);

MinValueRule.prototype.validate = function (context) {
    var value = this.input.valueAsNumber;
    if (isNaN(value)) return this.ok();

    if ((value < this.min && !this.exclusive) || (value <= this.min && this.exclusive)) return this.failed();

    return this.ok();
};
function MaxValueRule(input, max, exclusive, message) {
    BaseRule.call(this, input, message);
    this.max = max;
    this.exclusive = exclusive;
}
__ext(BaseRule, MaxValueRule);

MaxValueRule.prototype.validate = function (context) {
    var value = this.input.valueAsNumber;
    if (isNaN(value)) return this.ok();

    if ((value > this.max && !this.exclusive) || (value >= this.max && this.exclusive)) return this.failed();

    return this.ok();
};

function DateAfterRule(input, refInput, message) {
    BaseRule.call(this, input, message);
    this.refInput = refInput;
}
__ext(BaseRule, DateAfterRule);

DateAfterRule.prototype.validate = function (context) {
    var date1 = this.refInput.getDate();
    var date2 = this.input.getDate();

    if (!date1) return date2 ? this.failed() : this.ok();
    return (date2 && date2.getTime() > date1.getTime()) ? this.ok() : this.failed();
};

function GenericRule(input, validationFunction, message) {
    BaseRule.call(this, input, message);
    if (typeof(validationFunction) != "function") {
        throw "The validation callback is required!";
    }
    this.validationFunction = validationFunction;
}
__ext(BaseRule, GenericRule);
GenericRule.prototype.validate = function (context) {
    return this.validationFunction.call(this, context) ? this.ok() : this.failed();
};


function ConditionalRule(rule, condition) {
    BaseRule.call(this, rule.input, rule.message);
    if (typeof(condition) != "function") {
        throw "The condition is required!";
    }
    this.rule = rule;
    this.condition = condition;
}
__ext(BaseRule, ConditionalRule);

ConditionalRule.prototype.validate = function (context) {
    if (!this.condition()) return this.ok();

    return this.rule.validate(context);
};

var Condition = {
    checked: function (input) {
        return function () {
            return input.checked;
        };
    },
    notEmpty: function (input) {
        return function () {
            return input.value ? (input.value.toString().trim() ? true : false) : false;
        };
    },
    hasKeySelected: function (combo, key, value) {
        return function () {
            var item = combo.getSelectedItem();
            if (!item) return false;
            return item[key] == value;
        }
    },
    or: function () {
        var conditions = [];
        for (var i = 0; i < arguments.length; i ++) {
            conditions.push(arguments[i]);
        }
        return function () {
            for (var i = 0; i < conditions.length; i ++) {
                if (conditions[i]()) return true;
            }

            return false;
        };
    },
    and: function () {
        var conditions = [];
        for (var i = 0; i < arguments.length; i ++) {
            conditions.push(arguments[i]);
        }
        return function () {
            for (var i = 0; i < conditions.length; i ++) {
                if (!conditions[i]()) return false;
            }

            return true;
        };
    },
    not: function (c) {
        return function () {
            return !c();
        };
    }
}


installationScope.ValidationManager = ValidationManager;
installationScope.RuleSet = RuleSet;
installationScope.RequiredRule = RequiredRule;
installationScope.PatternMatchedRule = PatternMatchedRule;
installationScope.GenericRule = GenericRule;
installationScope.Condition = Condition;
})(window);
