// Test data

var QRadar = window.qappfw.QRadar;

var indexEndpoint =
{
    "name": "index",
    "path": "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/",
    "http_method": "GET",
    "response": { "mime_type": "text/html" },
    "error_mime_type": "text/plain"
};

var getEndpoint =
{
    "name": "getuser",
    "path": "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/user/{id1}/{id2}",
    "http_method": "GET",
    "parameters": [
        { "location": "PATH", "name": "id1" },
        { "location": "PATH", "name": "id2" },
        { "location": "QUERY", "name": "username" },
        { "location": "QUERY", "name": "dept" }
    ],
    "response": { "mime_type": "application/json" },
    "error_mime_type": "text/html"
};

var addFormEndpoint =
{
    "name": "addformuser",
    "path": "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/userform",
    "http_method": "POST",
    "request_mime_type": "application/x-www-form-urlencoded",
    "parameters": [
        { "location": "BODY", "name": "username" },
        { "location": "BODY", "name": "dept" }
    ],
    "response": { "mime_type": "application/json" },
    "error_mime_type": "text/html"
};

var addJsonEndpoint =
{
    "name": "addjsonuser",
    "path": "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/user",
    "http_method": "POST",
    "request_mime_type": "application/json",
    "parameters": [
        { "location": "BODY", "name": "username" },
        { "location": "BODY", "name": "dept" }
    ],
    "response": { "mime_type": "application/json" },
    "error_mime_type": "text/html"
};

var addXmlEndpoint =
{
    "name": "addxmluser",
    "path": "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/userxml",
    "http_method": "POST",
    "request_mime_type": "application/xml",
    "parameters": [
        { "location": "BODY", "name": "username" },
        { "location": "BODY", "name": "dept" }
    ],
    "response": { "mime_type": "application/xml" },
    "error_mime_type": "text/html"
};

var updateEndpoint =
{
    "name": "updateuser",
    "path": "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/user/{id}",
    "http_method": "PUT",
    "request_mime_type": "application/json",
    "parameters": [{ "location": "PATH", "name": "id" }],
    "response": { "mime_type": "application/json" },
    "error_mime_type": "text/html"
};

var nodeService =
{
    "name": "nodejs",
    "version": "1.0",
    "application_id": 1052,
    "uuid": "58a6dd2a-afe0-4d82-8c65-2b9083c2e244",
    "endpoints": [indexEndpoint, getEndpoint, addFormEndpoint, addJsonEndpoint, addXmlEndpoint, updateEndpoint]
};

// Tests
describe("QRadar named service tests:", function () {
    describe("QRadar.getNamedService", function () {
        var thingService =
        {
            "name": "thing", "version": "3.2", "application_id": 1101,
            "uuid": "90bfe27a-afe0-4d82-8c65-2b9083c2e244",
            "endpoints": [{
                "name": "getthing", "http_method": "GET",
                "path": "https://6.7.8.9/console/plugins/1101/app_proxy:thing/things",
                "response": { "mime_type": "application/json" }, "error_mime_type": "text/html"
            }]
        };

        var services = [nodeService, thingService];

        it("should throw Error if service name does not exist", function () {
            expect(function () { QRadar.getNamedService(services, "nosuchservice", "1.0"); }).toThrowError(
                "Service nosuchservice version 1.0 not found");
        });

        it("should throw Error if service version does not exist", function () {
            expect(function () { QRadar.getNamedService(services, "nodejs", "2.0"); }).toThrowError(
                "Service nodejs version 2.0 not found");
        });

        it("should find existing service", function () {
            expect(QRadar.getNamedService(services, "nodejs", "1.0")).toEqual(nodeService);
        });

        it("should find another existing service", function () {
            expect(QRadar.getNamedService(services, "thing", "3.2")).toEqual(thingService);
        });
    });

    describe("QRadar.getNamedServiceEndpoint", function () {
        it("should throw Error if endpoint does not exist", function () {
            expect(function () { QRadar.getNamedServiceEndpoint(nodeService, "nosuchendpoint"); }).toThrowError(
                "Service endpoint nosuchendpoint not found");
        });

        it("should find existing endpoint", function () {
            expect(QRadar.getNamedServiceEndpoint(nodeService, "getuser")).toEqual(getEndpoint);
        });
    });

    describe("QRadar.buildNamedServiceEndpointRestArgs", function () {
        it("should handle simple GET endpoint with no parameters", function () {
            var restArgs = QRadar.buildNamedServiceEndpointRestArgs({}, indexEndpoint);
            expect(restArgs.path).toEqual("https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/");
            expect(restArgs.httpMethod).toEqual("GET");
            expect(restArgs.contentType).toBeUndefined();
            expect(restArgs.body).toBeUndefined();
        });

        it("should handle PATH and QUERY parameters", function () {
            var parameters = { id1: "1234", id2: "z25", username: "fred", dept: "support" };
            var restArgs = QRadar.buildNamedServiceEndpointRestArgs({}, getEndpoint, parameters);
            expect(restArgs.path).toEqual(
                "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/user/1234/z25?username=fred&dept=support");
            expect(restArgs.httpMethod).toEqual("GET");
            expect(restArgs.contentType).toBeUndefined();
            expect(restArgs.body).toBeUndefined();
        });

        it("should handle BODY parameters for a form request", function () {
            var parameters = { username: "fred", dept: "support" };
            var restArgs = QRadar.buildNamedServiceEndpointRestArgs({}, addFormEndpoint, parameters);
            expect(restArgs.path).toEqual(
                "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/userform");
            expect(restArgs.httpMethod).toEqual("POST");
            expect(restArgs.contentType).toEqual("application/x-www-form-urlencoded");
            expect(restArgs.body).toEqual("username=fred&dept=support");
        });

        it("should handle BODY parameters for a JSON request", function () {
            var parameters = { username: "fred", dept: "support" };
            var restArgs = QRadar.buildNamedServiceEndpointRestArgs({}, addJsonEndpoint, parameters);
            expect(restArgs.path).toEqual(
                "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/user");
            expect(restArgs.httpMethod).toEqual("POST");
            expect(restArgs.contentType).toEqual("application/json");
            expect(restArgs.body).toEqual({ username: "fred", dept: "support" });
        });

        it("should handle JSON body value", function () {
            var parameters = { id: "1234" };
            var body = { username: "fred", dept: "sales" };
            var restArgs = QRadar.buildNamedServiceEndpointRestArgs({}, updateEndpoint, parameters, body);
            expect(restArgs.path).toEqual(
                "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/user/1234");
            expect(restArgs.httpMethod).toEqual("PUT");
            expect(restArgs.contentType).toEqual("application/json");
            expect(restArgs.body).toEqual(JSON.stringify(body));
        });

        it("should ignore BODY parameters when a body value is supplied", function () {
            var parameters = { username: "jack", dept: "support" };
            var body = { username: "jim", dept: "sales" };
            var restArgs = QRadar.buildNamedServiceEndpointRestArgs({}, addJsonEndpoint, parameters, body);
            expect(restArgs.path).toEqual(
                "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/user");
            expect(restArgs.httpMethod).toEqual("POST");
            expect(restArgs.contentType).toEqual("application/json");
            expect(restArgs.body).toEqual(JSON.stringify(body));
        });

        it("should ignore BODY parameters if request mime type is not supported", function () {
            var parameters = { username: "jack", dept: "support" };
            var restArgs = QRadar.buildNamedServiceEndpointRestArgs({}, addXmlEndpoint, parameters);
            expect(restArgs.path).toEqual(
                "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/userxml");
            expect(restArgs.httpMethod).toEqual("POST");
            expect(restArgs.contentType).toEqual("application/xml");
            expect(restArgs.body).toBeUndefined();
        });

        it("should throw an Error if a PATH parameter value is missing", function () {
            var parameters = { id1: "1234", username: "fred", dept: "support" };
            expect(function () { QRadar.buildNamedServiceEndpointRestArgs({}, getEndpoint, parameters); }).toThrowError(
                "No value was supplied for PATH parameter id2");
        });

        it("should ignore missing QUERY parameters", function () {
            var parameters = { id1: "1234", id2: "z25", dept: "support" };
            var restArgs = QRadar.buildNamedServiceEndpointRestArgs({}, getEndpoint, parameters);
            expect(restArgs.path).toEqual(
                "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/user/1234/z25?dept=support");
            expect(restArgs.httpMethod).toEqual("GET");
            expect(restArgs.contentType).toBeUndefined();
            expect(restArgs.body).toBeUndefined();
        });

        it("should ignore missing BODY parameters", function () {
            var parameters = { username: "fred" };
            var restArgs = QRadar.buildNamedServiceEndpointRestArgs({}, addJsonEndpoint, parameters);
            expect(restArgs.path).toEqual(
                "https://1.2.3.4/console/plugins/1052/app_proxy:nodejs/user");
            expect(restArgs.httpMethod).toEqual("POST");
            expect(restArgs.contentType).toEqual("application/json");
            expect(restArgs.body).toEqual({ username: "fred" });
        });
    });
});
