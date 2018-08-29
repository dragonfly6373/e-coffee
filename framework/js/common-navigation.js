var CommonNavigation = (function () {
    var activeModule = null;
    var rootModule = null;
    var currentPath = [];
    var handlingHashChange = false;
    var updatingPathMemory = false;
    var ignoreNextHashChange = false;
    var lastAutoNavigation = null;

    function setRoot(navigationModule) {
        rootModule = navigationModule;
        currentPath = [];

        navigateToCurrentHash();
    }

    function handleHashChange(event) {
        if (!rootModule) return;
        if (ignoreNextHashChange) {
            ignoreNextHashChange = false;
            return;
        }
        if (updatingPathMemory) return;

        navigateToCurrentHash(function () {
        });
    }

    function navigateToCurrentHash(callback) {
        console.log("navigateToCurrentHash called");
        updatingPathMemory = true;
        lastAutoNavigation = null;
        var hash = "" + window.location.hash;
        var steps = hash.replace(/^#(\/)?/, "").split("/");
        var i = 0;
        while (i <= currentPath.length - 1
                && i <= steps.length - 1
                && currentPath[i].name == steps[i]) i ++;

        // close trailing module
        if (i <= currentPath.length - 1) {
            for (var j = currentPath.length - 1; j >= i; j --) {
                if (currentPath[j].module.close) currentPath[j].module.close();
                currentPath.splice(j, 1);
            }
        }

        var postRunnable = function () {
            if (lastAutoNavigation) {
                if (lastAutoNavigation.currentModule == currentPath[currentPath.length - 1].module) {
                    push(lastAutoNavigation.name, lastAutoNavigation.childModule, "replace");
                }
            }
            if (callback) callback();
            updatingPathMemory = false;
        }

        if (i <= steps.length - 1) {
            var j = i - 1;
            var currentModule = (i >= 1) ? currentPath[i - 1].module : rootModule;

            var next = function () {
                console.log("next: " + j + ", steps", steps);
                j ++;
                if (j >= steps.length || !currentModule.navigate) {
                    postRunnable();
                    return;
                }

                var name = steps[j];

                if (!name) {
                    next();
                    return;
                }
                currentModule.navigate(name, function (module) {
                    if (!module) {
                        window.history.replaceState("", "", calculateHash());
                        postRunnable();
                        return;
                    }
                    currentPath.push({
                        name: name,
                        module: module
                    });

                    currentModule = module;
                    next();
                });
            };

            next();
        } else {
            postRunnable();
        }
    }

    function calculateHash() {
        var h = "#";
        for (var i = 0; i < currentPath.length; i ++) {
            var step = currentPath[i];
            h += "/" + step.name;
        }

        return h;
    }

    function push(name, module, replace) {
        currentPath.push({
            name: name,
            module: module
        });

        var h = calculateHash();

        if (!replace) {
            window.location.hash = h;
        } else {
            window.history.replaceState("", "", h);
        }
    }

    function onNavigateToChildModule(currentModule, name, childModule, isAuto) {
        if (updatingPathMemory) {
            if (isAuto) {
                lastAutoNavigation = {
                    currentModule: currentModule,
                    name: name,
                    childModule: childModule
                };
            }
            return;
        }

        if (currentModule) {
            var i = currentPath.map(function (a) {
                return a.module;
            }).indexOf(currentModule);

            console.log("i = ", i);
            if (i >= 0) {
                if (i + 1 < currentPath.length) {
                    currentPath.splice(i + 1, currentPath.length - i - 1);
                }
            } else {
                if (currentModule != rootModule) return;
                currentPath = [];
            }
        }

        ignoreNextHashChange = true;
        push(name, childModule);
    };

    function onNavigationModuleClosed(module) {
        if (updatingPathMemory) return;

        var i = currentPath.map(function (a) {
            return a.module;
        }).indexOf(module);
        if (i < 0) return;
        currentPath.splice(i, currentPath.length - i);

        ignoreNextHashChange = true;
        window.location.hash = calculateHash();
    }

    function newUnnavigatableModule() {
        return {
            navigate: function (name, callback) {callback(null);},
            close: function () {}
        }
    }

    window.addEventListener("hashchange", handleHashChange, false);

    return {
        setRoot: setRoot,
        onNavigateToChildModule: onNavigateToChildModule,
        onNavigationModuleClosed: onNavigationModuleClosed,
        newUnnavigatableModule: newUnnavigatableModule
    }
})();


/*
Module Inteface = {
    navigate: function (id, callback) {} -> Return module in callback
}
*/
