;

// Until a fully functioning require(...) is implemented
phantom.injectJs("lib/underscore-min.js");

(function(global, _) {
    var defaults = {
        debugLevel: 4,
        scripts: ["lib/underscore-min.js", "lib/formfieldinfo.joelpurra.js"]
    },
        // TODO: use a deep clone function
        options = {
            debugLevel: defaults.debugLevel,
            scripts: defaults.scripts.slice(0)
        },
        priv = {},
        modes = {},
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
        priv.gotoUrl(address, function(error, page) {

            var results = priv.getPageResult(page),
                simplifiedResults = priv.simplifyResults(results);

            priv.printResults(simplifiedResults);

            done();
        });
    };

    modes.shared = function(done) {
        var addresses = priv.toArray(arguments).slice(1),
            address, i, allResults = [],
            resultsCount = 0,
            resultsTarget = addresses.length;

        for (i = 0; i < addresses.length; i++) {
            address = addresses[i];

            allResults.push({
                address: address,
                results: []
            });

            function gotoUrl(i, address) {

                priv.gotoUrl(address, function(error, page) {
                    var results = priv.getPageResult(page);

                    allResults[i].results = results;

                    resultsCount++;

                    if (resultsCount === resultsTarget) {
                        afterFetched();
                    }
                });
            }

            function afterFetched() {
                var simplified = _(allResults).map(function(result, index, list) {
                    var out = {
                        address: result.address,
                        results: priv.simplifyResults(result.results)
                    };

                    return out;
                });

                var union = _.union.apply(_, _(simplified).pluck("results"));

                var duplicates = union.filter(function(val, index, list) {
                    return union.filter(function(inner, index, list) {
                        return val.name === inner.name;
                    }).length > 1;
                });

                var discovered = {};

                var shared = duplicates.filter(function(val, index, list) {
                    if (discovered[val.name] === undefined) {
                        discovered[val.name] = 1;

                        return true;
                    }

                    discovered[val.name]++;

                    return false;
                });

                priv.printResults(shared);

                done();
            }

            // Copy variables to inner scope, since they are mutable
            // TODO: think of immutability? recursive function?
            gotoUrl(i, address);
        }
    };

    priv.getPageResult = function(page) {
        var results = {};

        results.mergedGroups = page.evaluate(function() {
            return JoelPurra.FormFieldInfo.getFields().removeEmptyNames().mergeArrays().groups().toArray();
        });

        return results;
    };

    priv.simplifyResults = function(results) {
        var simplified = _(results.mergedGroups).map(function(value, index, list) {
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

    priv.printResults = function(simplifiedResults) {
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
        var page = require("webpage").create();

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
                    callback.call(null, status, page);
                }
            } catch (e) {
                debug.error("priv.gotoUrl", e);

                throw e;
            } finally {
                debug.log("priv.gotoUrl", "finally releasing page", page);

                page.release();
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

    debug.init();
    priv.init();
}(phantom, _));