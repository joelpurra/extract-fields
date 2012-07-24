;

// Load dependencies
{
    // Hide cosole logging during libray loading
    var noop = function() {},
        originalConsoleLog = console.log;
    console.log = noop;

    // Until a fully functioning require(...) is implemented
    phantom.injectJs("lib/underscore-min.js");
    phantom.injectJs("lib/q.min.js");
    console.log = originalConsoleLog;
}

(function(global, _) {
    var defaults = {
        debugLevel: 4,
        scripts: ["lib/underscore-min.js", "lib/formfieldinfo.joelpurra.js"],
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

    modes.fields = function(done, address) {
        var tag = "mode.fields";

        function parseSimplifiedResults(combo) {
            debug.log(tag, "then", arguments, combo, combo.address, combo.result.length);

            priv.printSimplifiedResults(combo.result);
        }

        Q.when(qDef.getSimplifiedResults(address)).then(parseSimplifiedResults, priv.logError(tag, "fail")).fin(done);
    };

    modes.shared = function(done) {
        var tag = "modes.shared",
            addresses = priv.toArray(arguments).slice(1),
            i, allRequests = [];

        function afterFetched(allResults) {
            var tag = "modes.shared.afterFetched"
            _allResults = _(allResults);

            debug.log(tag, allResults);

            _allResults.each(function(combo, index, list) {
                debug.log(tag, "allResults", index, "[i].address", combo.address, "[i].result.length", combo.result.length);
            })

            var union = _.union.apply(_, _allResults.pluck("result"));

            debug.log(tag, "union.length", union.length);

            var duplicates = union.filter(function(val, index, list) {
                var moreThanOne = union.filter(function(inner, index, list) {
                    return val.name === inner.name;
                }).length > 1;

                return moreThanOne;
            });

            debug.log(tag, "duplicates.length", duplicates.length);

            var discovered = {};

            var shared = duplicates.filter(function(val, index, list) {
                if (discovered[val.name] === undefined) {
                    discovered[val.name] = 1;

                    return true;
                }

                discovered[val.name]++;

                return false;
            });

            debug.log(tag, "shared.length", shared.length);

            priv.printSimplifiedResults(shared);
        }

        for (i = 0; i < addresses.length; i++) {
            // Copy variables to inner scope, since they are mutable
            // TODO: think of immutability? recursive function?
            allRequests.push(qDef.getSimplifiedResults(addresses[i]));
        }

        Q.all(allRequests).then(afterFetched, priv.logError(tag, "fail")).fin(done);
    };

    priv.getPageResult = function(page) {
        var results = page.evaluate(function() {
            return JoelPurra.FormFieldInfo.getFields().removeEmptyNames().mergeArrays().groups().toArray();
        });

        return results;
    };

    priv.simplifyResults = function(results) {
        var simplified = _(results).map(function(value, index, list) {
            var fieldGroup = _(value),
                first = fieldGroup.first(),
                simpler = {
                    name: first.name,
                    values: fieldGroup.pluck("value")
                };

            return simpler;
        });

        return simplified;
    };

    priv.printSimplifiedResults = function(simplifiedResults) {
        _(simplifiedResults).each(function(simplifiedResult, index, list) {
            console.log("\"" + simplifiedResult.name + "\"", simplifiedResult.values.map(function(value) {
                return "\"" + value + "\""
            }).toString());
        });
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

                    var jQueryVersion = page.evaluate(function() {
                        return jQuery.fn.jquery;
                    });

                    debug.log("jQuery version", jQueryVersion);

                    var scriptsSuccess = priv.injectJss(page, options.scripts);

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
                // TODO: make debug level a command line argument
                console.log("Usage: extract-field-info.js <mode> [arguments]");

                priv.done();
            } else {
                mode = commandLineArguments[1];
                args = commandLineArguments.slice(2);
                args.unshift(priv.done);

                modes[mode].apply(null, args);
            }

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
    }

    qDef.gotoUrl = function(address, timeout) {
        var gotoDeferred = Q.ncall(priv.gotoUrl, priv, address);

        return Q.timeout(gotoDeferred, timeout);
    };

    qDef.getPageResult = function(address) {
        var tag = "qDef.getPageResult";

        function parsePage(page) {
            debug.log(tag, "then", arguments, page);

            var result = priv.getPageResult(page);

            return result;
        };

        return Q.when(qDef.gotoUrl(address, options.timeout)).then(parsePage, priv.logError(tag, "fail"));
    }

    qDef.getSimplifiedResults = function(address) {
        var tag = "qDef.getSimplifiedResults";

        function simplify(result) {
            debug.log(tag, "then", arguments, result);

            var simplifiedResults = priv.simplifyResults(result);

            var combo = {
                address: address,
                result: simplifiedResults
            }

            return combo;
        };

        return Q.when(qDef.getPageResult(address)).then(simplify, priv.logError(tag, "fail"));
    }

    debug.init();
    priv.init();
}(phantom, _));