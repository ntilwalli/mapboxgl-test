"use strict";
var isolate_1 = require('./isolate');
var xstream_adapter_1 = require('@cycle/xstream-adapter');
var MainHTTPSource = (function () {
    function MainHTTPSource(_res$$, runStreamAdapter, _name, _namespace) {
        if (_namespace === void 0) { _namespace = []; }
        this._res$$ = _res$$;
        this.runStreamAdapter = runStreamAdapter;
        this._name = _name;
        this._namespace = _namespace;
        this.isolateSource = isolate_1.isolateSource;
        this.isolateSink = isolate_1.isolateSink;
    }
    MainHTTPSource.prototype.filter = function (predicate) {
        var filteredResponse$$ = this._res$$.filter(function (r$) { return predicate(r$.request); });
        return new MainHTTPSource(filteredResponse$$, this.runStreamAdapter, this._name, this._namespace);
    };
    MainHTTPSource.prototype.select = function (category) {
        var res$$ = this._res$$;
        if (category) {
            res$$ = this._res$$.filter(function (res$) { return res$.request && res$.request.category === category; });
        }
        var out = this.runStreamAdapter.adapt(res$$, xstream_adapter_1.default.streamSubscribe);
        out._isCycleSource = this._name;
        return out;
    };
    return MainHTTPSource;
}());
exports.MainHTTPSource = MainHTTPSource;
//# sourceMappingURL=MainHTTPSource.js.map