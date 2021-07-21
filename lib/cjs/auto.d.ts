import { Changes, tsFn, AutoDoc } from './types';
declare class AutoPigeon {
    constructor();
    static from(data: object, cid?: string): AutoPigeon;
    static _forge(data: object, cid?: string): AutoPigeon;
    static init(): AutoPigeon;
    static clone(doc: object, historyLength?: number): AutoPigeon;
    static getChanges(left: object, right: object): {
        diff: {
            op: string;
            path: string;
        }[];
        cid: any;
        ts: number;
        seq: number;
        gid: string;
    };
    static rewindChanges(doc: object, ts: number, cid: number): void;
    static fastForwardChanges(doc: object): void;
    static applyChanges(doc: object, changes: Changes): AutoPigeon;
    static change(doc: AutoDoc, fn: (_: AutoDoc) => AutoPigeon): AutoPigeon;
    static getHistory(doc: AutoDoc): any;
    static merge(doc1: AutoDoc, doc2: AutoDoc): AutoPigeon;
    static getWarning(doc: AutoDoc): any;
    static getMissingDeps(): boolean;
    static setHistoryLength(len: number): void;
    static setTimestamp(fn: tsFn): void;
    static crc(doc: AutoDoc): number;
    static load(str: string, historyLength?: number): AutoPigeon;
    static save(doc: AutoDoc): string;
}
export { AutoPigeon };
