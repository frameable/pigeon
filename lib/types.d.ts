export declare type Primitive = null | boolean | string | number;
export interface Operation {
    op: string;
    path: string;
    value?: any;
    _prev?: any;
    _index?: string;
}
export interface Changes {
    diff: Operation[];
    ts: number;
    cid: number;
    seq?: number;
    gid?: string;
}
export declare type tsFn = () => number;
