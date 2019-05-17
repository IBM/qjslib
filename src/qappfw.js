// Copyright 2019 IBM Corporation All Rights Reserved.
//
// SPDX-License-Identifier: Apache-2.0

// Global QRadar variables
/*global CURRENT_SCOPE, getTableRowsSelected, summaryId, appName, pageId*/

import "core-js/features/promise";
import "whatwg-fetch";

/**
 * Static class providing utility functions for QRadar
 */
class QRadar {
    /**
     * Returns the id of the current application.
     * <p>
     * This function can only be used where JavaScript is included using
     * the page_scripts section of an application manifest.json file.
     *
     * @returns {Number} The id of the current application.
     *
     * @throws Error if application could not be identified.
     *
     */
    static getApplicationId()
    {
        if (typeof(CURRENT_SCOPE) == "undefined")
        {
            throw new Error("Unable to determine application id");
        }

        return CURRENT_SCOPE;
    }

    /**
     * Returns the base URL of an application.
     * <p>
     * The format of the returned URL is: https://&lt;ip address&gt;/console/plugins/&lt;app id&gt;/app_proxy
     * <p>
     * This function can only be used where JavaScript is included using
     * the page_scripts section of an application manifest.json file.
     *
     * @param {Number} [id] - The id of an application to get the base URL for.
     *                        If not supplied, the id of the current application is used.
     *
     * @returns {String} The base URL of an application.
     *
     * @throws Error if id was not supplied and the current application could not be identified.
     *
     */
    static getApplicationBaseUrl(id)
    {
        let appId;

        if (id == null)
        {
            appId = QRadar.getApplicationId();
        }
        else
        {
            appId = id;
        }

        return QRadar.getWindowOrigin() + "/console/plugins/" + appId + "/app_proxy";
    }

    /**
     * Returns the ids of selected rows on a list page such as the offense or asset list.
     *
     * @returns {Array} The ids of the selected rows.
     *                  If no rows are selected, the array will be empty.
     *
     * @throws Error if the current page does not contain a table of selectable rows.
     *
     */
    static getSelectedRows()
    {
        if (typeof(getTableRowsSelected) != "undefined")
        {
            let tableRows = JSON.parse(getTableRowsSelected());
            return tableRows.ids;
        }

        throw new Error("Could not determine the selected rows; is this a list page?");
    }

    /**
     * Returns the id of the item being viewed (e.g. asset, offense).
     *
     * @returns {String} Item id.
     *
     * @throws Error if the current page does not support item identification.
     *
     */
    static getItemId()
    {
        if (typeof(summaryId) != "undefined")
        {
            return summaryId;
        }

        let assetIdElement = document.getElementById("assetId");

        if (assetIdElement)
        {
            return assetIdElement.value;
        }

        let pageName = (typeof(appName) != "undefined" && typeof(pageId) != "undefined") ?
            appName + "." + pageId : window.location.pathname;

        throw new Error("QRadar.getItemId is not currently supported on page " + pageName);
    }

    /**
     * Calls a REST method using an XMLHttpRequest.
     *
     * @param {Object} args
     *
     * @param {String} args.httpMethod - The HTTP method to use (GET/PUT/POST/DELETE).
     *
     * @param {String} args.path - The path to the REST endpoint.
     * <ul>
     * <li> To call a QRadar REST API, path must start with "/api".
     * <li> To call a REST endpoint in your application, path must start with "/application".
     * <li> Any other path must be a fully-qualified URL, otherwise the function behaviour is undefined.
     * </ul>
     *
     * @param {String} [args.body] - The data to POST or PUT.
     *
     * @param {function} [args.onComplete] - Callback function to be invoked when the REST request finishes.
     *                                       The function can access the XMLHttpRequest using "this".
     *
     * @param {function} [args.onError] - Callback function to be invoked if the REST request fails to complete.
     *
     * @param {Array} [args.headers] - Headers to be supplied with the REST request.
     *                                 Each array entry should be a JSON object with "name" and "value" properties.
     *
     * @param {String} [args.contentType="application/json"] - MIME type of a POST or PUT request.
     *                                                         Default value is used only if Content-Type is not
     *                                                         supplied in args.headers.
     *
     * @param {Number} [args.timeout] - HTTP timeout, in milliseconds, to be supplied with an asynchronous REST request.
     *                                  If args.async is false, the timeout is ignored.
     *
     * @param {boolean} [args.async=true] - Set to false to make a synchronous request.
     *                                      WARNING: this is not recommended.
     *
     * @throws Error if any required arguments are missing.
     *
     */
    static rest(args)
    {
        QRadar._checkRequiredArguments("rest", args, ["httpMethod", "path"]);

        let httpRequest = QRadar.generateHttpRequest(args);

        httpRequest.send(args.body);
    }
    
    /**
     * Uses the fetch API (or polyfilled alternative) to make a HTTP request, returning a promise.
     * 
     * @param {String} path - The path to the endpoint.
     * <ul>
     * <li> To call a QRadar REST API, path must start with "/api".
     * <li> To call a REST endpoint in your application, path must start with "/application".
     * <li> Any other path must be a fully-qualified URL, otherwise the function behaviour is undefined.
     * </ul>
     * @param {Object} options - Fetch options, defining method, headers etc. Includes a timeout.
     * See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Supplying_request_options
     * @param {Number} [args.timeout] - How long to wait before timing out the request, default 10000ms (10 seconds)
     * @param {String} [args.credentials] - CORS credentials type to use, default "same-origin"
     * @param {Array} [args.headers] - Headers included in the request, default ["Content-Type": "application/json"]
     * @returns Fetch promise that when resolved executed the request
     */
    static fetch(path, options = {}) {
        let url = QRadar.buildRestUrl(path);
        if (!options.headers) {
            options.headers = {};
        }
        // Add CSRF
        options.headers[QRadar.QRADAR_CSRF] = QRadar.getCookie(QRadar.QRADAR_CSRF);
        // If content type not set, set to default
        if (!(QRadar.CONTENT_TYPE in options.headers)) {
            options.headers[QRadar.CONTENT_TYPE] = QRadar.CONTENT_TYPE_DEFAULT;
        }
        // If credentials not set, set to default
        // Credentials required to send cookies with request
        if (!(QRadar.CREDENTIALS_TYPE in options.headers)) {
            options.headers[QRadar.CREDENTIALS_TYPE] = QRadar.CREDENTIALS_DEFAULT;
        }
        if (!(QRadar.TIMEOUT_TYPE in options)) {
            options.timeout = QRadar.DEFAULT_FETCH_TIMEOUT;
        }
        // Create a promise race, allowing a user defined timeout to be set
        return Promise.race([
            window.fetch(url, options),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Unable to reach ${url} after ${options.timeout} ms`)), options.timeout)
            )
        ]);
    }

    /**
     * Returns information on the currently logged in QRadar user, including their name and role.
     *
     * @returns {Object} The currently logged in QRadar user.
     *                   WARNING this function uses a synchronous JavaScript call.
     *
     */
    static getCurrentUser()
    {
        let currentUser = null;

        QRadar.rest(
            {
                async: false,
                httpMethod: "POST",
                path: QRadar.getWindowOrigin() + "/console/JSON-RPC/QRadar.getUserByPageContext",
                body: JSON.stringify(
                    {
                        method: "QRadar.getUserByPageContext",
                        contextName: "UserList",
                        QRadarCSRF: QRadar.getCookie("QRadarCSRF"),
                        params: null,
                        id: "1"
                    }),
                onComplete: function()
                {
                    let responseObj;
                    eval("responseObj = " + this.responseText);
                    currentUser = responseObj.result;
                }
            });

        return currentUser;
    }

    /**
     * Opens the details page of an offense, either in a new window or in the Offenses tab.
     *
     * @param {String|Number} offenseId - The id of the offense to be viewed.
     * @param {boolean} [openWindow=true] - If true, open the result in a new window.
     *                                      Otherwise, open in the Offenses tab.
     *
     * @throws Error if offenseId is not supplied or if the offense could not be displayed.
     *
     */
    static openOffense(offenseId, openWindow)
    {
        if (offenseId == null)
        {
            throw new Error("You must supply an offense id");
        }

        return QRadar.windowOrTab(
            "do/sem/offensesummary?appName=Sem&pageId=OffenseSummary&summaryId=" + offenseId,
            openWindow === false ? "SEM" : null);
    }

    /**
     * Opens the details page of an asset, either in a new window or in the Assets tab.
     *
     * @param {String|Number} assetId - The id of the asset to be viewed.
     * @param {boolean} [openWindow=true] - If true, open the result in a new window.
     *                                      Otherwise, open in the Assets tab.
     *
     * @throws Error if assetId is not supplied or if the asset could not be displayed.
     *
     */
    static openAsset(assetId, openWindow)
    {
        if (assetId == null)
        {
            throw new Error("You must supply an asset id");
        }

        return QRadar.windowOrTab(
            "do/assetprofile/AssetDetails?dispatch=viewAssetDetails&listName=vulnList&assetId=" + assetId,
            openWindow === false ? "ASSETS" : null);
    }

    /**
     * Opens the details page of an asset for an IP address, either in a new window or in the Assets tab.
     *
     * @param {String} ipAddress - The IP address of the asset to be viewed.
     * @param {boolean} [openWindow=true] - If true, open the result in a new window.
     *                                      Otherwise, open in the Assets tab.
     *
     * @throws Error if ipAddress is not supplied or if the asset could not be displayed.
     *
     */
    static openAssetForIpAddress(ipAddress, openWindow)
    {
        if (ipAddress == null)
        {
            throw new Error("You must supply an IP Address");
        }

        return QRadar.windowOrTab(
            "do/assetprofile/AssetDetails?dispatch=viewAssetDetailsFromIp&listName=vulnList" +
            "&domainId=0&ipAddress=" + ipAddress, openWindow === false ? "ASSETS" : null);
    }

    /**
     * Runs an event search with the specified AQL string, either in a new window or the Event Viewer tab.
     *
     * @param {String} aql - The AQL search string to execute.
     * @param {boolean} [openWindow=true] - If true, open the search in a new window.
     *                                      Otherwise, open in the Event Viewer tab.
     *
     * @throws Error if aql is not supplied or if the search results could not be displayed.
     *
     */
    static openEventSearch(aql, openWindow)
    {
        if (aql == null)
        {
            throw new Error("You must supply an AQL string");
        }

        return QRadar.windowOrTab(
            "do/ariel/arielSearch?appName=EventViewer&pageId=EventList&dispatch=performSearch" +
            "&value(timeRangeType)=aqlTime&value(searchMode)=AQL" +
            "&value(aql)=" + encodeURIComponent(aql), openWindow === false ? "EVENTVIEWER" : null);
    }

    /**
     * Runs a flow search with the specified AQL string, either in a new window or the Flow Viewer tab.
     *
     * @param {String} aql - The AQL search string to execute.
     * @param {boolean} [openWindow=true] - If true, open the search in a new window.
     *                                      Otherwise, open in the Flow Viewer tab.
     *
     * @throws Error if aql is not supplied or if the search results could not be displayed.
     *
     */
    static openFlowSearch(aql, openWindow)
    {
        if (aql == null)
        {
            throw new Error("You must supply an AQL string");
        }

        return QRadar.windowOrTab(
            "do/ariel/arielSearch?appName=Surveillance&pageId=FlowList&dispatch=performSearch" +
            "&value(timeRangeType)=aqlTime&value(searchMode)=AQL" +
            "&value(aql)=" + encodeURIComponent(aql), openWindow === false ? "FLOWVIEWER" : null);
    }

    /**
     * Selects and returns a service from a list retrieved by a /gui_app_framework/named_services
     * REST API call.
     * @param {Array} services - The array returned by /gui_app_framework/named_services.
     * @param {String} serviceName - The name of the service to look for in services.
     * @param {String} serviceVersion - The version of the service to look for in services.
     *
     * @returns {Object} The service with the given name and version from the services list.
     *
     * @throws Error if the services list did not contain an entry with the given name and version.
     */
    static getNamedService(services, serviceName, serviceVersion)
    {
        for (let i = 0; i < services.length; i++)
        {
            if (services[i].name === serviceName && services[i].version == serviceVersion)
            {
                return services[i];
            }
        }

        throw new Error("Service " + serviceName + " version " + serviceVersion + " not found");
    }

    /**
     * Selects and returns a service endpoint.
     *
     * @param {Object} service - A service object as returned by {@link QRadar.getNamedService}.
     * @param {String} endpointName - The name of the endpoint to look for in the service object.
     *
     * @returns {Object} The service endpoint with the given name.
     *
     * @throws Error if the service object did not contain an endpoint with the given name.
     *
     */
    static getNamedServiceEndpoint(service, endpointName)
    {
        if (service.endpoints != null)
        {
            for (let i = 0; i < service.endpoints.length; i++)
            {
                if (service.endpoints[i].name === endpointName)
                {
                    return service.endpoints[i];
                }
            }
        }

        throw new Error("Service endpoint " + endpointName + " not found");
    }

    /**
     * Populates an arguments object to be used in a {@link QRadar.rest|QRadar.rest} call to a named service endpoint.
     *
     * @param {Object} restArgs - A possibly empty object which will be populated with arguments for a
     *                            call to {@link QRadar.rest|QRadar.rest}. The properties of restArgs which can be
     *                            populated by this function are: httpMethod, path, body and contentType.
     *                            All other properties must be populated by the caller.
     * @param {Object} endpoint - A service endpoint object as returned
     *                            by {@link QRadar.getNamedServiceEndpoint|QRadar.getNamedServiceEndpoint}.
     * @param {Object} [parameterValues] - Contains properties whose values will be used to populate the
     *                                     endpoint's PATH/QUERY/BODY parameters.
     * @param {Object} [bodyValue] - A complete body value to be supplied with a POST or PUT.
     *
     * @returns {Object} restArgs populated with properties from endpoint, parameterValues and bodyValue.
     *
     * @throws Error if a parameterValue property was not supplied for each endpoint PATH parameter.
     *
     * @see {@link QRadar.rest|QRadar.rest}
     *
     */
    static buildNamedServiceEndpointRestArgs(restArgs, endpoint, parameterValues, bodyValue)
    {
        let usingBodyValue = (bodyValue != null);
        let resolvedPath = endpoint.path;
        let requestMimeType = (endpoint.request_mime_type == null ? QRadar.CONTENT_TYPE_DEFAULT : endpoint.request_mime_type);
        let isJsonRequest = QRadar._isJsonMimeType(requestMimeType);
        let isFormRequest = !isJsonRequest && QRadar._isFormMimeType(requestMimeType);
        let requestBodyString;
        let requestBodyJson;

        if (endpoint.parameters != null)
        {
            let parameterDefinition;
            let parameterValue;

            for (let i = 0; i < endpoint.parameters.length; i++)
            {
                parameterDefinition = endpoint.parameters[i];
                parameterValue = (parameterValues == null) ? null : parameterValues[parameterDefinition.name];

                if (parameterValue == null)
                {
                    if (parameterDefinition.location === "PATH")
                    {
                        throw new Error("No value was supplied for PATH parameter " + parameterDefinition.name);
                    }

                    continue;
                }

                switch (parameterDefinition.location)
                {
                case "PATH":
                    resolvedPath = QRadar._addPathParameter(resolvedPath, parameterDefinition.name, parameterValue);
                    break;

                case "QUERY":
                    resolvedPath = QRadar._addQueryParameter(resolvedPath, parameterDefinition.name, parameterValue);
                    break;

                case "BODY":
                    if (usingBodyValue)
                    {
                        console.log("Ignoring BODY parameter " + parameterDefinition.name +
                                        ", using supplied body value instead");
                    }
                    else if (isJsonRequest)
                    {
                        if (requestBodyJson == null)
                        {
                            requestBodyJson = {};
                        }

                        requestBodyJson[parameterDefinition.name] = parameterValue;
                    }
                    else if (isFormRequest)
                    {
                        requestBodyString =
                                QRadar._addFormBodyParameter(requestBodyString, parameterDefinition.name, parameterValue);
                    }
                    else
                    {
                        console.log("Ignoring BODY parameter " + parameterDefinition.name +
                                        " due to unsupported request mime type " + requestMimeType);
                    }
                    break;
                }
            }
        }

        restArgs.path = resolvedPath;
        restArgs.httpMethod = endpoint.http_method;

        if (usingBodyValue)
        {
            restArgs.body = JSON.stringify(bodyValue);
        }
        else if (isJsonRequest)
        {
            restArgs.body = requestBodyJson;
        }
        else if (requestBodyString != null)
        {
            restArgs.body = requestBodyString;
        }

        if (endpoint.http_method == "POST" || endpoint.http_method == "PUT" || restArgs.body != null)
        {
            restArgs.contentType = requestMimeType;
        }

        return restArgs;
    }

    /**
     * Makes a REST API call to a named service endpoint.
     * <p>
     * This is a wrapper function which calls the /gui_app_framework/named_services REST API,
     * picks out the specified service endpoint, and invokes it using the supplied parameters/values.
     *
     * @param {String} serviceName - See {@link QRadar.getNamedService|QRadar.getNamedService} serviceName.
     * @param {String} serviceVersion - See {@link QRadar.getNamedService|QRadar.getNamedService} serviceVersion.
     * @param {String} endpointName - See {@link QRadar.getNamedServiceEndpoint|QRadar.getNamedServiceEndpoint} endpointName.
     * @param {Object} restArgs - See {@link QRadar.buildNamedServiceEndpointRestArgs|QRadar.buildNamedServiceEndpointRestArgs} restArgs.
     * @param {Object} [parameterValues] - See {@link QRadar.buildNamedServiceEndpointRestArgs|QRadar.buildNamedServiceEndpointRestArgs} parameterValues.
     * @param {Object} [bodyValue] - See {@link QRadar.buildNamedServiceEndpointRestArgs|QRadar.buildNamedServiceEndpointRestArgs} bodyValue.
     *
     * @throws Error if any wrapped function call fails.
     *
     */
    static callNamedServiceEndpoint(serviceName, serviceVersion, endpointName, restArgs, parameterValues, bodyValue)
    {
        QRadar.rest({
            httpMethod: "GET",
            path: "/api/gui_app_framework/named_services",
            onComplete: function() {
                let services = JSON.parse(this.responseText);
                let service = QRadar.getNamedService(services, serviceName, serviceVersion);
                let endpoint = QRadar.getNamedServiceEndpoint(service, endpointName);
                QRadar.buildNamedServiceEndpointRestArgs(restArgs, endpoint, parameterValues, bodyValue);
                QRadar.rest(restArgs);
            }
        });
    }

    //========================== Private functions ==========================

    /**
     * Returns the origin of the current window's URL.
     * <p>
     * Origin means the protocol, host and port (optional).
     *
     * @returns {String} The window origin.
     *
     * @function QRadar.getWindowOrigin
     * @private
     */
    static getWindowOrigin()
    {
        return window.location.origin;
    }

    /**
     * Opens a URL in a window or tab.
     *
     * @param {String} url - The url to be opened.
     * @param {String} [tabName] - The name of the tab where the url will be opened.
     *                             If not supplied, the url is opened in a window.
     *
     * @throws Error if the URL could not be opened.
     *
     * @function QRadar.windowOrTab
     * @private
     */
    static windowOrTab(url, tabName)
    {
        if (tabName)
        {
            return top.setActiveTab(tabName, url);
        }

        let w = window.open(QRadar.getWindowOrigin() + "/console/" + url, "_blank",
            "width=900,height=750,scrollbars=yes,resizable=yes");

        if (w == null)
        {
            throw new Error("Unable to open window for URL " + url);
        }

        w.focus();
    }

    /**
     * Builds a full URL using the given path.
     *
     * @param {String} path - See rest function's args.path for details.
     *
     * @returns {String} The full URL for path.
     *
     * @function QRadar.buildRestUrl
     * @private
     */
    static buildRestUrl(path)
    {
        let url = path;

        if (path.indexOf(QRadar.PATH_PREFIX_API) === 0)
        {
            url = QRadar.getWindowOrigin() + path;
        }
        else if (path.indexOf(QRadar.PATH_PREFIX_APPLICATION) === 0)
        {
            url = QRadar.getApplicationBaseUrl() + path.substr(QRadar.PATH_PREFIX_APPLICATION.length - 1);
        }

        // Add a timestamp to ensure we don't receive a browser-cached response.
        url = QRadar._addQueryParameter(url, (new Date()).getTime(), "");

        return url;
    }

    /**
     * Returns the value of a cookie.
     *
     * @param {String} cookieName - The name of the cookie.
     *
     * @returns {String|undefined} The cookie value if cookieName exists, undefined otherwise.
     *
     * @function QRadar.getCookie
     * @private
     */
    static getCookie(cookieName)
    {
        let value = "; " + document.cookie;
        let parts = value.split("; " + cookieName + "=");
        if (parts.length === 2)
        {
            return parts.pop().split(";").shift();
        }
    }

    /**
     * Generates an XMLHttpRequest for use in a REST call.
     *
     * @param {Object} args - See rest function for details.
     *
     * @returns {XMLHttpRequest}
     *
     * @function QRadar.generateHttpRequest
     * @private
     */
    static generateHttpRequest(args)
    {
        let httpRequest = new XMLHttpRequest();

        if (args.onComplete)
        {
            httpRequest.addEventListener("load", args.onComplete);
        }

        if (args.onError)
        {
            httpRequest.addEventListener("error", args.onError);
            httpRequest.addEventListener("abort", args.onError);
        }

        let async = (args.async !== false);

        httpRequest.open(args.httpMethod, QRadar.buildRestUrl(args.path), async);

        if (typeof(args.timeout) == "number" && async === true)
        {
            httpRequest.timeout = args.timeout;
        }

        QRadar._addHttpHeaders(httpRequest, args);

        return httpRequest;
    }


    //========================== Internal items ==========================

    static _checkRequiredArguments(functionName, args, required)
    {
        for (let i = 0; i < required.length; i++)
        {
            if (typeof(args[required[i]]) == "undefined" || args[required[i]] == null)
            {
                throw new Error("Argument " + required[i] + " is required for function " + functionName);
            }
        }
    }

    static _addCsrfHttpHeader(httpRequest)
    {
        let csrfToken = QRadar.getCookie(QRadar.QRADAR_CSRF);

        if (csrfToken != null)
        {
            httpRequest.setRequestHeader(QRadar.QRADAR_CSRF, csrfToken);
        }
    }

    static _addHttpHeaders(httpRequest, args)
    {
        let contentTypeNeeded = (args.httpMethod == "POST" || args.httpMethod == "PUT");
        let contentTypeAdded = false;

        if (contentTypeNeeded && args.contentType)
        {
            httpRequest.setRequestHeader(QRadar.CONTENT_TYPE, args.contentType);
            contentTypeAdded = true;
        }

        if (args.headers)
        {
            for (let i = 0; i < args.headers.length; ++i)
            {
                if (!args.headers[i].name)
                {
                    throw new Error("Header " + i + " passed to REST call " + args.path +
                                    " is invalid: " + JSON.stringify(args.headers[i]));
                }

                if (args.headers[i].name == QRadar.CONTENT_TYPE)
                {
                    if (contentTypeAdded || !contentTypeNeeded)
                    {
                        continue;
                    }

                    contentTypeAdded = true;
                }

                httpRequest.setRequestHeader(args.headers[i].name, args.headers[i].value);
            }
        }

        if (contentTypeNeeded && !contentTypeAdded)
        {
            httpRequest.setRequestHeader(QRadar.CONTENT_TYPE, QRadar.CONTENT_TYPE_DEFAULT);
        }

        QRadar._addCsrfHttpHeader(httpRequest);
    }

    static _addPathParameter(path, parameterName, parameterValue)
    {
        return path.split("{" + parameterName + "}").join(parameterValue);
    }

    static _addQueryParameter(path, parameterName, parameterValue)
    {
        let separator = path.indexOf("?") == -1 ? "?" : "&";
        return path + separator + parameterName + "=" + parameterValue;
    }

    static _addFormBodyParameter(requestBody, parameterName, parameterValue)
    {
        let nameEqualsValue = parameterName + "=" + parameterValue;

        return (requestBody == null) ? nameEqualsValue : (requestBody + "&" + nameEqualsValue);
    }

    static _isJsonMimeType(requestMimeType)
    {
        return requestMimeType.indexOf(QRadar.CONTENT_TYPE_JSON) != -1;
    }

    static _isFormMimeType(requestMimeType)
    {
        return requestMimeType === QRadar.CONTENT_TYPE_FORM;
    }

}

QRadar.PATH_PREFIX_API = "/api/";
QRadar.PATH_PREFIX_APPLICATION = "/application/";
QRadar.CONTENT_TYPE = "Content-Type";
QRadar.CONTENT_TYPE_JSON = "application/json";
QRadar.CONTENT_TYPE_FORM = "application/x-www-form-urlencoded";
QRadar.CONTENT_TYPE_DEFAULT = QRadar.CONTENT_TYPE_JSON;
QRadar.QRADAR_CSRF = "QRadarCSRF";
QRadar.CREDENTIALS_SAME_ORIGIN = "same-origin";
QRadar.CREDENTIALS_DEFAULT = QRadar.CREDENTIALS_SAME_ORIGIN;
QRadar.CREDENTIALS_TYPE = "credentials";
QRadar.TIMEOUT_TYPE = "timeout";
QRadar.DEFAULT_FETCH_TIMEOUT = 10000;

export {
    QRadar
};
