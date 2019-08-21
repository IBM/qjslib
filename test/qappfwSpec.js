// Copyright 2019 IBM Corporation All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0
/* eslint no-unused-vars: 0 */

var QRadarBrowser = window.qappfw.QRadar;

// Global mocks
var CURRENT_SCOPE = 1234;
var summaryId = 1331;
var getTableRowsSelected = function () {
    return "{\"ids\": [\"3\", \"7\", \"9\", \"12\"]}";
};

// Test browser qjslib
TestQRadar(QRadarBrowser);

function TestQRadar(QRadar) {

    QRadar.getWindowOrigin = function () {
        return "https://99.99.99.99";
    };

    QRadar.windowOrTab = function (url, tabName) {
        return { suppliedUrl: QRadar.getWindowOrigin() + "/console/" + url, suppliedTabName: tabName };
    };

    QRadar.getCookie = function (cookieName) {
        return "1234";
    };

    // Tests
    describe("QRadar namespace tests:", function () {

        describe("QRadar.fetch", function () {
            const TEST_API_ENDPOINT = "/api/test";
            const DEFAULT_CONTENT_TYPE = "application/json";
            const DEFAULT_CREDENTIALS = "same-origin";
            const CONTENT_TYPE = "Content-Type";
            const CREDENTIALS = "credentials";
            const QRADAR_CSRF = "QRadarCSRF";
            const OVERRIDE_CONTENT_TYPE = "application/zip";
            const OVERRIDE_CREDENTIALS = "omit";
            const OVERRIDE_TIMEOUT = 2000;
            const FETCH_JASMINE_TIMEOUT = 15000;
            const TIME_PAST_TIMEOUT = 1000;
            const FETCH_METHOD = "fetch";

            let originalTimeout;

            beforeEach(function () {
                // Up jasmine timeout to 10 seconds to allow for 5 second timeout tests
                originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
                jasmine.DEFAULT_TIMEOUT_INTERVAL = FETCH_JASMINE_TIMEOUT;
            });

            afterEach(function () {
                // Reset jasmine timeout
                jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
            });

            it("should default to content type 'application/json'", function () {
                spyOn(window, FETCH_METHOD);
                QRadar.fetch(TEST_API_ENDPOINT);
                // Get the options argument of the last call to fetch
                const options = window.fetch.calls.argsFor(0)[1];
                expect(options.headers[CONTENT_TYPE]).toEqual(DEFAULT_CONTENT_TYPE);
            });

            it("should default to credentials 'same-origin'", function () {
                spyOn(window, FETCH_METHOD);
                QRadar.fetch(TEST_API_ENDPOINT);
                // Get the options argument of the last call to fetch
                const options = window.fetch.calls.argsFor(0)[1];
                expect(options.headers[CREDENTIALS]).toEqual(DEFAULT_CREDENTIALS);
            });

            it("should populate the CSRF token", function () {
                spyOn(window, FETCH_METHOD);
                QRadar.fetch(TEST_API_ENDPOINT);
                // Get the options argument of the last call to fetch
                const options = window.fetch.calls.argsFor(0)[1];
                expect(options.headers[QRADAR_CSRF]).toEqual(CURRENT_SCOPE.toString());
            });

            it("should allow the content type to be overridden", function () {
                spyOn(window, FETCH_METHOD);
                let override = { headers: {} };
                override.headers[CONTENT_TYPE] = OVERRIDE_CONTENT_TYPE;

                QRadar.fetch(TEST_API_ENDPOINT, override);
                // Get the options argument of the last call to fetch
                const options = window.fetch.calls.argsFor(0)[1];
                expect(options.headers[CONTENT_TYPE]).toEqual(OVERRIDE_CONTENT_TYPE);
            });

            it("should allow the credentials to be overridden", function () {
                spyOn(window, FETCH_METHOD);
                let override = { headers: {} };
                override.headers[CREDENTIALS] = OVERRIDE_CREDENTIALS;

                QRadar.fetch(TEST_API_ENDPOINT, override);
                // Get the options argument of the last call to fetch
                const options = window.fetch.calls.argsFor(0)[1];
                expect(options.headers[CREDENTIALS]).toEqual(OVERRIDE_CREDENTIALS);
            });

            it("should time out after default timeout (5 seconds) if fetch takes too long", function (done) {
                // Mock core fetch and make it take > 5000ms
                spyOn(window, FETCH_METHOD).and.returnValue(new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, QRadar.DEFAULT_FETCH_TIMEOUT + TIME_PAST_TIMEOUT);
                }));

                QRadar.fetch(TEST_API_ENDPOINT)
                    .then(() => {
                        done(new Error("Failed to trigger timeout")); // Test fail as timeout not triggered
                    })
                    .catch((error) => {
                        expect(error.message).toContain("Unable to reach "); // Check error is timeout error
                        done();
                    });
            });

            it("should allow fetch to finish if fetch takes less than default timeout (5 seconds)", function (done) {
                // Mock core fetch and make it take < 5000ms
                spyOn(window, FETCH_METHOD).and.returnValue(new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 1);
                }));

                QRadar.fetch(TEST_API_ENDPOINT)
                    .then(() => {
                        done();
                    })
                    .catch((error) => {
                        done(error); // Test fail as timeout triggered/error occured
                    });
            });

            it("should time out after override timeout (2 seconds) if fetch takes too long", function (done) {
                // Mock core fetch and make it take > 2000ms
                spyOn(window, FETCH_METHOD).and.returnValue(new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, OVERRIDE_TIMEOUT + TIME_PAST_TIMEOUT);
                }));

                QRadar.fetch(TEST_API_ENDPOINT, { timeout: OVERRIDE_TIMEOUT })
                    .then(() => {
                        done(new Error("Failed to trigger timeout")); // Test fail as timeout not triggered
                    })
                    .catch((error) => {
                        expect(error.message).toContain("Unable to reach "); // Check error is timeout error
                        done();
                    });
            });

            it("should allow fetch to finish if fetch takes less than override timeout (2 seconds)", function (done) {
                // Mock core fetch and make it take < 2000ms
                spyOn(window, FETCH_METHOD).and.returnValue(new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 1);
                }));

                QRadar.fetch(TEST_API_ENDPOINT, { timeout: OVERRIDE_TIMEOUT })
                    .then(() => {
                        done();
                    })
                    .catch((error) => {
                        done(error); // Test fail as timeout triggered/error occured
                    });
            });

        });

        describe("QRadar.getApplicationId", function () {
            it("should return CURRENT_SCOPE value", function () {
                expect(QRadar.getApplicationId()).toEqual(1234);
            });
        });

        describe("QRadar.getApplicationBaseUrl", function () {
            it("should use CURRENT_SCOPE value in result when no argument is supplied", function () {
                expect(QRadar.getApplicationBaseUrl()).toEqual(
                    "https://99.99.99.99/console/plugins/1234/app_proxy");
            });

            it("should use id in result when id argument is supplied", function () {
                expect(QRadar.getApplicationBaseUrl(1138)).toEqual(
                    "https://99.99.99.99/console/plugins/1138/app_proxy");
            });
        });

        describe("QRadar.getSelectedRows", function () {
            it("should return getTableRowsSelected ids", function () {
                expect(QRadar.getSelectedRows()).toEqual(["3", "7", "9", "12"]);
            });
        });

        describe("QRadar.getItemId", function () {
            it("should return summaryId value if defined", function () {
                expect(QRadar.getItemId()).toEqual(1331);
            });
        });

        describe("QRadar.buildRestUrl", function () {
            it("should return api url if path starts with '/api/'", function () {
                expect(QRadar.buildRestUrl("/api/asset_model/assets/1676")).toMatch(
                    /^https:\/\/99.99.99.99\/api\/asset_model\/assets\/1676/);
            });

            it("should return app proxy url if path starts with '/application/'", function () {
                expect(QRadar.buildRestUrl("/application/myRestEndpoint")).toMatch(
                    /^https:\/\/99.99.99.99\/console\/plugins\/1234\/app_proxy\/myRestEndpoint/);
            });

            it("should return path if it doesn't start with '/api/' or '/application/'", function () {
                expect(QRadar.buildRestUrl("https://somehost/somepath")).toMatch(
                    /^https:\/\/somehost\/somepath/);
            });
        });

        describe("QRadar.generateHttpRequest", function () {
            describe("XMLHttpRequest.addEventListener", function () {
                beforeEach(function () {
                    spyOn(XMLHttpRequest.prototype, "addEventListener");
                });

                it("should not be called if no callback functions are supplied", function () {
                    var args = { httpMethod: "GET", path: "http://myhost/myapi" };
                    var xhr = QRadar.generateHttpRequest(args);
                    expect(XMLHttpRequest.prototype.addEventListener).not.toHaveBeenCalled();
                });

                it("should be called once when args.onComplete is supplied", function () {
                    var callbackComplete = function () { var x = "complete"; };
                    var args = { httpMethod: "GET", path: "http://myhost/myapi", onComplete: callbackComplete };
                    var xhr = QRadar.generateHttpRequest(args);
                    expect(XMLHttpRequest.prototype.addEventListener).toHaveBeenCalledTimes(1);
                    expect(XMLHttpRequest.prototype.addEventListener).toHaveBeenCalledWith("load", callbackComplete);
                });

                it("should be called twice when args.onError is supplied", function () {
                    var callbackError = function () { var y = "error"; };
                    var args = { httpMethod: "GET", path: "http://myhost/myapi", onError: callbackError };
                    var xhr = QRadar.generateHttpRequest(args);
                    expect(XMLHttpRequest.prototype.addEventListener).toHaveBeenCalledTimes(2);
                    expect(XMLHttpRequest.prototype.addEventListener).toHaveBeenCalledWith("error", callbackError);
                    expect(XMLHttpRequest.prototype.addEventListener).toHaveBeenCalledWith("abort", callbackError);
                });
            });

            describe("XMLHttpRequest.open", function () {
                beforeEach(function () {
                    spyOn(XMLHttpRequest.prototype, "open").and.callThrough();
                });

                it("should be, by default, asynchronous with no timeout", function () {
                    var args = { httpMethod: "GET", path: "http://myhost/myapi" };
                    var xhr = QRadar.generateHttpRequest(args);
                    expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith(
                        "GET", jasmine.stringMatching(/^http:\/\/myhost\/myapi/), true);
                    expect(xhr.timeout).toEqual(0);
                });

                it("should use args.timeout when args.async is not supplied", function () {
                    var args = { httpMethod: "GET", path: "http://myhost/myapi", timeout: 5000 };
                    var xhr = QRadar.generateHttpRequest(args);
                    expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith(
                        "GET", jasmine.stringMatching(/^http:\/\/myhost\/myapi/), true);
                    expect(xhr.timeout).toEqual(5000);
                });

                it("should use args.timeout when args.async is true", function () {
                    var args = { httpMethod: "GET", path: "http://myhost/myapi", async: true, timeout: 5000 };
                    var xhr = QRadar.generateHttpRequest(args);
                    expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith(
                        "GET", jasmine.stringMatching(/^http:\/\/myhost\/myapi/), true);
                    expect(xhr.timeout).toEqual(5000);
                });

                it("should ignore args.timeout when args.async is false", function () {
                    var args = { httpMethod: "GET", path: "http://myhost/myapi", async: false, timeout: 5000 };
                    var xhr = QRadar.generateHttpRequest(args);
                    expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith(
                        "GET", jasmine.stringMatching(/^http:\/\/myhost\/myapi/), false);
                    expect(xhr.timeout).toEqual(0);
                });
            });

            describe("addHttpHeaders with CSRF cookie present", function () {
                beforeEach(function () {
                    spyOn(XMLHttpRequest.prototype, "setRequestHeader");
                });

                describe("and no headers supplied and args.contentType not supplied", function () {
                    it("should not add default Content-Type on a GET", function () {
                        var args = { httpMethod: "GET", path: "http://myhost/myapi" };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(1);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                    });

                    it("should add default Content-Type on a POST", function () {
                        var args = { httpMethod: "POST", path: "http://myhost/myapi" };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(2);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json");
                    });

                    it("should add default Content-Type on a PUT", function () {
                        var args = { httpMethod: "PUT", path: "http://myhost/myapi" };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(2);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/json");
                    });
                });

                describe("and no headers supplied and args.contentType supplied", function () {
                    it("should not use args.contentType on a GET", function () {
                        var args = { httpMethod: "GET", path: "http://myhost/myapi", contentType: "application/json" };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(1);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                    });

                    it("should use args.contentType on a POST", function () {
                        var args = { httpMethod: "POST", path: "http://myhost/myapi", contentType: "text/plain" };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(2);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
                    });

                    it("should use args.contentType on a PUT", function () {
                        var args = { httpMethod: "PUT", path: "http://myhost/myapi", contentType: "text/plain" };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(2);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
                    });
                });

                describe("and Content-Type header supplied and args.contentType not supplied", function () {
                    it("should not add Content-Type header on a GET", function () {
                        var args = {
                            httpMethod: "GET", path: "http://myhost/myapi",
                            headers: [{ name: "Content-Type", value: "text/plain" }]
                        };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(1);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                    });

                    it("should add supplied Content-Type header on a POST", function () {
                        var args = {
                            httpMethod: "POST", path: "http://myhost/myapi",
                            headers: [{ name: "Content-Type", value: "text/plain" }]
                        };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(2);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
                    });

                    it("should add supplied Content-Type header on a PUT", function () {
                        var args = {
                            httpMethod: "PUT", path: "http://myhost/myapi",
                            headers: [{ name: "Content-Type", value: "text/plain" }]
                        };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(2);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
                    });
                });

                describe("and Content-Type header supplied and args.contentType supplied", function () {
                    it("should not add Content-Type header on a GET", function () {
                        var args = {
                            httpMethod: "GET", path: "http://myhost/myapi", contentType: "text/plain",
                            headers: [{ name: "Content-Type", value: "text/html" }]
                        };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(1);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                    });

                    it("should use args.contentType on a POST", function () {
                        var args = {
                            httpMethod: "POST", path: "http://myhost/myapi", contentType: "text/plain",
                            headers: [{ name: "Content-Type", value: "text/html" }]
                        };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(2);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
                    });

                    it("should use args.contentType on a PUT", function () {
                        var args = {
                            httpMethod: "PUT", path: "http://myhost/myapi", contentType: "text/plain",
                            headers: [{ name: "Content-Type", value: "text/html" }]
                        };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(2);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
                    });
                });

                describe("and multiple headers supplied", function () {
                    it("should use supplied headers", function () {
                        var args = {
                            httpMethod: "POST", path: "http://myhost/myapi",
                            headers: [{ name: "Content-Type", value: "text/html" },
                                { name: "Accept", value: "text/plain" },
                                { name: "Accept-Charset", value: "utf8" }]
                        };
                        var xhr = QRadar.generateHttpRequest(args);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledTimes(4);
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("QRadarCSRF", "1234");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Content-Type", "text/html");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Accept", "text/plain");
                        expect(XMLHttpRequest.prototype.setRequestHeader).toHaveBeenCalledWith("Accept-Charset", "utf8");
                    });
                });
            });
        });

        describe("QRadar.rest", function () {
            it("should throw Error if args.path is not supplied", function () {
                var args = { httpMethod: "GET" };
                expect(function () { QRadar.rest(args); }).toThrowError(
                    "Argument path is required for function rest");
            });

            it("should throw Error if args.path is null", function () {
                var args = { httpMethod: "GET", path: null };
                expect(function () { QRadar.rest(args); }).toThrowError(
                    "Argument path is required for function rest");
            });

            it("should throw Error if args.httpMethod is not supplied", function () {
                var args = { path: "/application/myendpoint" };
                expect(function () { QRadar.rest(args); }).toThrowError(
                    "Argument httpMethod is required for function rest");
            });

            it("should throw Error if args.httpMethod is null", function () {
                var args = { path: "/application/myendpoint", httpMethod: null };
                expect(function () { QRadar.rest(args); }).toThrowError(
                    "Argument httpMethod is required for function rest");
            });
        });

        describe("QRadar.openOffense", function () {
            it("should throw Error if offenseId is not supplied", function () {
                expect(function () { QRadar.openOffense(); }).toThrowError("You must supply an offense id");
            });

            it("should throw Error if offenseId is null", function () {
                expect(function () { QRadar.openOffense(null); }).toThrowError("You must supply an offense id");
            });

            it("should open in window if openWindow is not supplied", function () {
                var mockResult = QRadar.openOffense("12345");
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/sem/offensesummary?appName=Sem&pageId=OffenseSummary&summaryId=12345");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is undefined", function () {
                var zzz;
                var mockResult = QRadar.openOffense("12345", zzz);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/sem/offensesummary?appName=Sem&pageId=OffenseSummary&summaryId=12345");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is null", function () {
                var mockResult = QRadar.openOffense("12345", null);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/sem/offensesummary?appName=Sem&pageId=OffenseSummary&summaryId=12345");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is true", function () {
                var mockResult = QRadar.openOffense("12345", true);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/sem/offensesummary?appName=Sem&pageId=OffenseSummary&summaryId=12345");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in tab if openWindow is false", function () {
                var mockResult = QRadar.openOffense("12345", false);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/sem/offensesummary?appName=Sem&pageId=OffenseSummary&summaryId=12345");
                expect(mockResult.suppliedTabName).toEqual("SEM");
            });
        });

        describe("QRadar.openAsset", function () {
            it("should throw Error if assetId is not supplied", function () {
                expect(function () { QRadar.openAsset(); }).toThrowError("You must supply an asset id");
            });

            it("should throw Error if assetId is null", function () {
                expect(function () { QRadar.openAsset(null); }).toThrowError("You must supply an asset id");
            });

            it("should open in window if openWindow is not supplied", function () {
                var mockResult = QRadar.openAsset("12345");
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetails&listName=vulnList&assetId=12345");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is undefined", function () {
                var zzz;
                var mockResult = QRadar.openAsset("12345", zzz);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetails&listName=vulnList&assetId=12345");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is null", function () {
                var mockResult = QRadar.openAsset("12345", null);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetails&listName=vulnList&assetId=12345");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is true", function () {
                var mockResult = QRadar.openAsset("12345", true);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetails&listName=vulnList&assetId=12345");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in tab if openWindow is false", function () {
                var mockResult = QRadar.openAsset("12345", false);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetails&listName=vulnList&assetId=12345");
                expect(mockResult.suppliedTabName).toEqual("ASSETS");
            });
        });

        describe("QRadar.openAssetForIpAddress", function () {
            it("should throw Error if ipAddress is not supplied", function () {
                expect(function () { QRadar.openAssetForIpAddress(); }).toThrowError("You must supply an IP Address");
            });

            it("should throw Error if ipAddress is null", function () {
                expect(function () { QRadar.openAssetForIpAddress(null); }).toThrowError("You must supply an IP Address");
            });

            it("should open in window if openWindow is not supplied", function () {
                var mockResult = QRadar.openAssetForIpAddress("10.11.12.13");
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetailsFromIp" +
                    "&listName=vulnList&domainId=0&ipAddress=10.11.12.13");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is undefined", function () {
                var zzz;
                var mockResult = QRadar.openAssetForIpAddress("10.11.12.13", zzz);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetailsFromIp" +
                    "&listName=vulnList&domainId=0&ipAddress=10.11.12.13");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is null", function () {
                var mockResult = QRadar.openAssetForIpAddress("10.11.12.13", null);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetailsFromIp" +
                    "&listName=vulnList&domainId=0&ipAddress=10.11.12.13");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is true", function () {
                var mockResult = QRadar.openAssetForIpAddress("10.11.12.13", true);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetailsFromIp" +
                    "&listName=vulnList&domainId=0&ipAddress=10.11.12.13");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in tab if openWindow is false", function () {
                var mockResult = QRadar.openAssetForIpAddress("10.11.12.13", false);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/assetprofile/AssetDetails?dispatch=viewAssetDetailsFromIp" +
                    "&listName=vulnList&domainId=0&ipAddress=10.11.12.13");
                expect(mockResult.suppliedTabName).toEqual("ASSETS");
            });
        });

        describe("QRadar.openEventSearch", function () {
            it("should throw Error if aql is not supplied", function () {
                expect(function () { QRadar.openEventSearch(); }).toThrowError("You must supply an AQL string");
            });

            it("should throw Error if aql is null", function () {
                expect(function () { QRadar.openEventSearch(null); }).toThrowError("You must supply an AQL string");
            });

            it("should open in window if openWindow is not supplied", function () {
                var mockResult = QRadar.openEventSearch("select qid from events");
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=EventViewer&pageId=EventList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is undefined", function () {
                var zzz;
                var mockResult = QRadar.openEventSearch("select qid from events", zzz);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=EventViewer&pageId=EventList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is null", function () {
                var mockResult = QRadar.openEventSearch("select qid from events", null);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=EventViewer&pageId=EventList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is true", function () {
                var mockResult = QRadar.openEventSearch("select qid from events", true);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=EventViewer&pageId=EventList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in tab if openWindow is false", function () {
                var mockResult = QRadar.openEventSearch("select qid from events", false);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=EventViewer&pageId=EventList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toEqual("EVENTVIEWER");
            });
        });

        describe("QRadar.openFlowSearch", function () {
            it("should throw Error if aql is not supplied", function () {
                expect(function () { QRadar.openFlowSearch(); }).toThrowError("You must supply an AQL string");
            });

            it("should throw Error if aql is null", function () {
                expect(function () { QRadar.openFlowSearch(null); }).toThrowError("You must supply an AQL string");
            });

            it("should open in window if openWindow is not supplied", function () {
                var mockResult = QRadar.openFlowSearch("select qid from events");
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=Surveillance&pageId=FlowList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is undefined", function () {
                var zzz;
                var mockResult = QRadar.openFlowSearch("select qid from events", zzz);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=Surveillance&pageId=FlowList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is null", function () {
                var mockResult = QRadar.openFlowSearch("select qid from events", null);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=Surveillance&pageId=FlowList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in window if openWindow is true", function () {
                var mockResult = QRadar.openFlowSearch("select qid from events", true);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=Surveillance&pageId=FlowList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toBeNull();
            });

            it("should open in tab if openWindow is false", function () {
                var mockResult = QRadar.openFlowSearch("select qid from events", false);
                expect(mockResult.suppliedUrl).toEqual(
                    "https://99.99.99.99/console/do/ariel/arielSearch?appName=Surveillance&pageId=FlowList&dispatch=performSearch" +
                    "&value(timeRangeType)=aqlTime&value(searchMode)=AQL&value(aql)=select%20qid%20from%20events");
                expect(mockResult.suppliedTabName).toEqual("FLOWVIEWER");
            });
        });

    });
}
