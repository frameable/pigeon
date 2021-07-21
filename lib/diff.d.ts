declare function diff(left: any[] | any, right: any[] | any): {
    op: any;
    path: string;
}[];
interface Operation {
    op: string;
    path: string;
    value?: any;
    _prev?: any;
    _index?: string;
}
export { diff, Operation };
