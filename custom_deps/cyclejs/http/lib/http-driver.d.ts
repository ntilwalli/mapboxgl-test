/// <reference types="core-js" />
import { Stream } from 'xstream';
import { RequestOptions, RequestInput, Response } from './interfaces';
export declare function optionsToSuperagent(rawReqOptions: RequestOptions): any;
export declare function createResponse$(reqInput: RequestInput): Stream<Response>;
export declare function makeHTTPDriver(): Function;
