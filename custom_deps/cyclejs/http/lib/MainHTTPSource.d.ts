/// <reference types="core-js" />
import { Stream, MemoryStream } from 'xstream';
import { HTTPSource } from './interfaces';
import { StreamAdapter } from '@cycle/base';
import { Response, ResponseStream, RequestOptions } from './interfaces';
export declare class MainHTTPSource implements HTTPSource {
    private _res$$;
    private runStreamAdapter;
    private _name;
    private _namespace;
    constructor(_res$$: Stream<MemoryStream<Response> & ResponseStream>, runStreamAdapter: StreamAdapter, _name: string, _namespace?: Array<string>);
    filter(predicate: (request: RequestOptions) => boolean): HTTPSource;
    select(category?: string): any;
    isolateSource: (source: HTTPSource, scope: string) => HTTPSource;
    isolateSink: (sink: Stream<any>, scope: string) => Stream<any>;
}
