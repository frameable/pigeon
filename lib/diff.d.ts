declare function diff(left: any, right: any): {
    op: string;
    path: string;
}[];
export { diff };
