"use strict";
function isolateSource(httpSource, scope) {
    return httpSource.filter(function (request) {
        return Array.isArray(request._namespace) &&
            request._namespace.indexOf(scope) !== -1;
    });
}
exports.isolateSource = isolateSource;
function isolateSink(request$, scope) {
    return request$.map(function (req) {
        if (typeof req === "string") {
            return { url: req, _namespace: [scope] };
        }
        var reqOptions = req;
        reqOptions._namespace = reqOptions._namespace || [];
        reqOptions._namespace.push(scope);
        return reqOptions;
    });
}
exports.isolateSink = isolateSink;
//# sourceMappingURL=isolate.js.map