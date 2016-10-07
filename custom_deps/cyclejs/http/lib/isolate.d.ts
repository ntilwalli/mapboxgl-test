import { HTTPSource, RequestOptions, RequestInput } from './interfaces';
export interface Mappable<T, R> {
    map(project: (x: T) => R): Mappable<R, any>;
}
export declare function isolateSource(httpSource: HTTPSource, scope: string): HTTPSource;
export declare function isolateSink(request$: Mappable<RequestInput, RequestOptions>, scope: string): any;
