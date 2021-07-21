interface Changes {
    diff: any[];
    ts: number;
    cid: number;
    seq?: number;
    gid?: string;
}
declare type tsFn = () => number;
declare class AutoPigeon {
    constructor();
    static from(data: any, cid?: string): AutoPigeon;
    static _forge(data: any, cid?: string): AutoPigeon;
    static init(): AutoPigeon;
    static clone(doc: any, historyLength?: number): AutoPigeon;
    static getChanges(left: any, right: any): {
        diff: {
            op: any;
            path: string;
        }[];
        cid: any;
        ts: number;
        seq: number;
        gid: string;
    };
    static rewindChanges(doc: any, ts: number, cid: number): void;
    static fastForwardChanges(doc: any): void;
    static applyChanges(doc: any, changes: Changes): AutoPigeon;
    static change(doc: any, fn: any): AutoPigeon;
    static getHistory(doc: any): any;
    static merge(doc1: any, doc2: any): AutoPigeon;
    static getWarning(doc: any): any;
    static getMissingDeps(): boolean;
    static setHistoryLength(len: number): void;
    static setTimestamp(fn: tsFn): void;
    static crc(doc: any): number;
    static load(str: string, historyLength?: number): AutoPigeon;
    static save(doc: any): string;
}
export { AutoPigeon };
