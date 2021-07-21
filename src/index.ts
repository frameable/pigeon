import { diff } from './diff';
import { patch } from './patch';
import { reverse } from './reverse';
import { AutoPigeon } from './auto';

const auto = AutoPigeon;

type AutoDoc = typeof AutoPigeon;

export {
  diff,
  patch,
  reverse,
  auto,
  AutoDoc,
};
