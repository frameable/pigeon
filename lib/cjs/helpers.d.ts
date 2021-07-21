declare function _path(path: string | number, k?: string | number, o?: unknown): string;
declare function _decodePath(path: string): string[];
declare function _typeof(x: unknown): "string" | "number" | "bigint" | "boolean" | "symbol" | "undefined" | "object" | "function" | "array" | "null";
declare function _isPrimitive(x: unknown): boolean;
declare function _clone(x: any): any;
declare function _entangled(a: unknown, b: unknown): boolean | undefined;
declare function _objId(x: any): any;
declare function _op(op: any, path: string, extra: any): {
    op: any;
    path: string;
};
declare function _stable(x: any): string;
declare function _crc(x: any): number;
export { _path, _typeof, _isPrimitive, _clone, _entangled, _objId, _op, _stable, _crc, _decodePath, };
