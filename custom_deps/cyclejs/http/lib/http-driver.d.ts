/// <reference types="core-js" />
import { Stream, MemoryStream } from 'xstream';
import { ResponseStream, RequestOptions, RequestInput, Response } from './interfaces';
export declare function optionsToSuperagent(rawReqOptions: RequestOptions): any;
export declare function createResponse$(reqInput: RequestInput): Stream<Response>;
export declare type ResponseMemoryStream = MemoryStream<Response> & ResponseStream;
export declare function makeHTTPDriver(): Function;
