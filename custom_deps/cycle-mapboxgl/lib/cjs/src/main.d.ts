export declare function makeMapJSONDriver(accessToken: string): (descriptor$: any, runSA: any) => {
    select: (anchorId: any) => {
        observable: any;
        events: (eventName: any) => {
            observable: any;
            queryRenderedFilter: (info: any) => any;
        };
    };
};
