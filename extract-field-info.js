;

// Load dependencies
(function() {
    "use strict";
    var noop = function() {},

        originalConsoleLog = console.log,

        injectOrFail = function(path) {
            var result = phantom.injectJs(path);

            if (result !== true) {
                throw new Error("Could not inject " + path);
            }
        }

        // Hide console logging during libary loading
    console.log = noop;

    // Until a fully functioning require(...) is implemented
    injectOrFail("lib/underscore-min.js");
    injectOrFail("lib/q.min.js");

    // Restore console logging
    console.log = originalConsoleLog;
}());

(function(global, _) {
    "use strict";

    var defaults = {
        debugLevel: 4,
        scripts: ["lib/jquery-2.0.3.min.js", "lib/underscore-min.js", "lib/formfieldinfo.joelpurra.js"],
        timeout: 10000
    },
        // TODO: use a deep clone function
        options = {
            debugLevel: defaults.debugLevel,
            scripts: defaults.scripts.slice(0),
            timeout: defaults.timeout
        },
        priv = {},
        modes = {},
        qDef = {},
        _generalMixins = {},
        debug = {
            level: 4,
            out: function(fn, lvl, args) {
                if (lvl >= this.level) {
                    fn.apply(console, priv.toArray(args));
                }
            }
        };

    debug.init = function() {
        ["log", "debug", "info", "warn", "error"].forEach(function(fnName, index, array) {
            this[fnName] = function() {
                this.out(console[fnName], index, arguments);
            };
        }, debug);
    };

    modes.help = function(done) {
        // TODO: make debug level a command line argument
        console.log("# extract-field-info.js: extracts general form field info from HTML pages over HTTP.");
        console.log("# Usage: extract-field-info.js <mode> [arguments]");
        console.log("#   MODE \t\t ARGUMENTS");
        console.log("#   ---- \t\t ---------");

        Object.keys(modes).forEach(function(key) {
            var mode = modes[key];

            console.log("#   " + key + " \t\t " + priv.getModeFunctionArguments(mode).join(" "));
        });

        done();
    };

    modes.fields = function(done, address) {
        var tag = "mode.fields";

        function parseFieldSummaries(fieldSummaries) {
            debug.log(tag, "then", arguments, address, fieldSummaries, fieldSummaries.length);

            priv.printFieldSummaries(fieldSummaries);
        }

        Q.when(qDef.getFieldSummaries(address)).then(parseFieldSummaries, priv.logError(tag, "fail")).fin(done);
    };

    modes.shared = function(done, address1, address2, more) {
        var tag = "modes.shared",
            // Replacing the dummy addresses
            // Fix by improving the command line help/usage system
            addresses = priv.toArray(arguments).slice(1),
            i, allRequests = [];

        function afterFetched(fieldSummariesArray) {
            var tag = "modes.shared.afterFetched",
                _fieldSummariesArray = _(fieldSummariesArray);

            _fieldSummariesArray.each(function(fieldSummaries, index, list) {
                debug.log(tag, "fieldSummaries", index, "[i].length", fieldSummaries.length);
            });

            var shared = priv.getFieldSummariesIntersection(fieldSummariesArray);

            // HACK: unwrap underscore object so it won't get wrapped twice
            priv.printFieldSummaries(shared.toArray());
        }

        for (i = 0; i < addresses.length; i++) {
            allRequests.push(qDef.getFieldSummaries(addresses[i]));
        }

        Q.all(allRequests).then(afterFetched, priv.logError(tag, "fail")).fin(done);
    };

    priv.getFunctionArguments = function(fn) {
        var source = fn.toString(),
            start = source.indexOf("("),
            end = source.indexOf(")"),
            args = source.substring(start + 1, end).split(",");

        return args;
    };

    priv.getModeFunctionArguments = function(fn) {
        return priv.getFunctionArguments(fn).slice(1);
    }

    priv.getPageFieldGroups = function(page) {
        var fieldGroups = page.evaluate(function() {
            return JoelPurra.FormFieldInfo.getFields().removeEmptyNames().mergeArrays().groups().toArray();
        });

        return fieldGroups;
    };

    priv.getPageFieldSummaries = function(page) {
        var fieldSummaries = page.evaluate(function() {
            return JoelPurra.FormFieldInfo.getFields().removeEmptyNames().mergeArrays().groups().nameValues().toArray();
        });

        return fieldSummaries;
    };

    priv.printFieldSummaries = function(fieldSummaries) {

        _(fieldSummaries).each(function(fieldSummary, index, list) {
            console.log("\"" + fieldSummary.name + "\"", fieldSummary.values.map(function(value) {
                return "\"" + value + "\""
            }).toString());
        });
    };

    priv.getFieldSummariesIntersection = function(fieldSummariesArray) {
        var tag = "priv.getFieldSummariesIntersection",
            _fieldSummariesArray = _(fieldSummariesArray),
            intersection = _fieldSummariesArray.intersectionPropertyEq("name");

        return intersection;
    };

    priv.toArray = function(args) {
        return Array.prototype.slice.call(args, 0);
    };

    priv.injectJss = function(page, scripts) {
        debug.log("priv.injectJss", "start", scripts);

        var success = true;

        scripts.forEach(function(script, index, array) {
            success = success && priv.injectJs(page, script);
        });

        debug.log("priv.injectJss", success ? "done" : "fail", scripts);

        return success;
    };

    priv.injectJs = function(page, script) {
        debug.log("priv.injectJs", "start", script);

        var success = page.injectJs(script);

        debug.log("priv.injectJs", success ? "done" : "fail", script);

        return success;
    };

    priv.gotoUrl = function(address, callback) {
        var tag = "priv.gotoUrl",
            page = require("webpage").create();

        function release() {
            debug.log(tag, "release", address, page);

            page.release();
        }

        page.open(address, function(status) {
            debug.log("page.open(...)", status, address);

            try {
                if (status === "success") {
                    //if (debug.isLogEnabled()) 
                    {
                        // TODO: implement debug.isLogEnabled()
                        var title = page.evaluate(function() {
                            return document.title;
                        });

                        debug.log("Page title is " + title);
                    }

                    var scriptsSuccess = priv.injectJss(page, options.scripts);

                    var jQueryVersion = page.evaluate(function() {
                        return window.jQuery.fn.jquery;
                    });

                    debug.log("jQuery version", jQueryVersion);

                    var underscoreVersion = page.evaluate(function() {
                        return _.VERSION;
                    });

                    debug.log("underscore version", underscoreVersion);

                    callback.call(null, null, page);
                } else {
                    callback.call(null, status);
                }
            } catch (e) {
                debug.error(tag, "catch", e);

                throw e;
            } finally {
                release();
            }
        });
    };

    priv.done = function() {
        debug.log("done");

        var timer = setTimeout(function() {
            debug.log("really done");

            global.exit();
        }, 1000);
    };

    priv.init = function() {
        var system = require("system"),
            commandLineArguments = system.args,
            mode, args;

        // TODO: make debug level a command line argument
        debug.level = options.debugLevel;

        debug.log("commandLineArguments", commandLineArguments);

        try {
            if (commandLineArguments.length < 2) {
                mode = "help";
            } else {
                mode = commandLineArguments[1];
            }

            args = commandLineArguments.slice(2);
            args.unshift(priv.done);

            modes[mode].apply(null, args);
        } catch (e) {
            debug.error("priv.init", "General error", e);

            priv.done();
        } finally {
            debug.log("priv.init", "finally done")
        }
    };

    priv.logError = function() {
        var knownArgs = priv.toArray(arguments);

        return function() {
            debug.error.apply(debug, knownArgs.concat(priv.toArray(arguments)));
        }
    };

    qDef.gotoUrl = function(address, timeout) {
        var gotoDeferred = Q.ncall(priv.gotoUrl, priv, address);

        return Q.timeout(gotoDeferred, timeout);
    };

    qDef.getPageFieldGroups = function(address) {
        var tag = "qDef.getPageFieldGroups";

        function parsePage(page) {
            debug.log(tag, "then", arguments, page);

            var fieldGroups = priv.getPageFieldGroups(page);

            return fieldGroups;
        };

        return Q.when(qDef.gotoUrl(address, options.timeout)).then(parsePage, priv.logError(tag, "fail"));
    };

    qDef.getFieldSummaries = function(address) {
        var tag = "qDef.getFieldSummaries";

        function parsePage(page) {
            debug.log(tag, "then", arguments, page);

            var fieldSummaries = priv.getPageFieldSummaries(page);

            return fieldSummaries;
        };

        return Q.when(qDef.gotoUrl(address, options.timeout)).then(parsePage, priv.logError(tag, "fail"));
    };

    _generalMixins.filterPropertyEq = function(list, propertyName, value) {
        var filtered = _(list).filter(function(inner, index, list) {
            return inner[propertyName] === value;
        });

        return _(filtered);
    };

    _generalMixins.intersectionPropertyEq = function(lists, propertyName) {
        var tag = "_.intersectionPropertyEq",
            _lists = _(lists);

        var union = _.union.apply(_, _lists.toArray());
        union = _(union);

        debug.log(tag, "union.size()", union.size());

        var duplicates = union.filter(function(val, index, list) {
            var moreThanOne = union.filterPropertyEq(propertyName, val[propertyName]).size() > 1;

            return moreThanOne;
        });
        duplicates = _(duplicates);

        debug.log(tag, "duplicates.size()", duplicates.size());

        var discovered = {};

        var intersection = duplicates.filter(function(val, index, list) {
            if (discovered[val[propertyName]] === undefined) {
                discovered[val[propertyName]] = 1;

                return true;
            }

            discovered[val[propertyName]]++;

            return false;
        });
        intersection = _(intersection);

        debug.log(tag, "intersection.size()", intersection.size());

        return intersection;
    };

    // TODO: create a copy of underscore and add mixins locally only?
    _.mixin(_generalMixins);

    debug.init();
    priv.init();
}(phantom, _));