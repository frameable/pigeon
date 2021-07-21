import { diff } from './diff';
import { patch } from './patch';
import { reverse } from './reverse';
import { AutoPigeon } from './auto';
declare const auto: typeof AutoPigeon;
declare type AutoDoc = typeof AutoPigeon;
export { diff, patch, reverse, auto, AutoDoc, };
