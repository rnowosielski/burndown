var system = require('system');
var args = system.args;

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000,
        start = new Date().getTime(),
        condition = false,
        interval = setInterval(function() {
            if ( (new Date().getTime() - start < maxtimeOutMillis) && !condition ) {
                condition = (typeof(testFx) === "string" ? eval(testFx) : testFx());
            } else {
                if(!condition) {
                    console.log("'waitFor()' timeout");
                    phantom.exit(1);
                } else {
                    console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
                    setTimeout(function() {
                      typeof(onReady) === "string" ? eval(onReady) : onReady();
                    }, 1000);
                    clearInterval(interval);
                }
            }
        }, 250);
};

function retrievePageImage(urlToRetrieve, waitForSelector, extractSelector, credentials) {
    function waitForElement(selector, callback, timeout) {
        waitFor(function check() {
            return page.evaluate(function (selector) {
                return !!document.querySelector(selector);
            }, selector);
        }, callback, timeout);
    }

    console.log("Starting execution of phantomjs")
    var page = require('webpage').create();
    var fs = require('fs');
    if (credentials) {
        page.customHeaders = {'Authorization': 'Basic ' + btoa(credentials)};
    }
    page.viewportSize = {width: 1920, height: 1080};
    page.onError = function (msg, trace) {
        console.error(msg);
        trace.forEach(function (item) {
            console.error('  ', item.file, ':', item.line);
        });
    };
    page.onConsoleMessage = function (msg, lineNum, sourceId) {
        console.log(msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    };
    page.open(urlToRetrieve, function (status) {
        console.log("Status of retrieving page: " + status);
        if (status === "success") {
            console.log("Waiting for [" + waitForSelector + "]")
            waitForElement(waitForSelector, function () {
                page.evaluate(function() {
                    var element = document.getElementById("ghx-chart-show-non-working-days");
                    if (element.checked) {
                      element.click();
                    }
                });
                console.log("Extracting [" + extractSelector + "]")
                var clipRect = page.evaluate(function (extractSelector) {
                    var layout = document.querySelector(extractSelector);
                    if (layout) {
                        return layout.getBoundingClientRect();
                    } else {
                        return null;
                    }
                }, extractSelector);
                if (clipRect) {
                    page.clipRect = {
                        top: clipRect.top,
                        left: clipRect.left,
                        width: clipRect.width,
                        height: clipRect.height
                    };
                }
                console.log("Rendering...")
                page.render('/tmp/capture.png', {format: 'png'});
                console.log("Finishing execution of phantomjs")
                phantom.exit();
            }, 30000);
        } else {
            phantom.exit();
            console.log("Finishing execution of phantomjs")
        }
    });
}

retrievePageImage(args[1], args[2], args[3], args[4]);
