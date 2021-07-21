import assert from 'assert';
import { diff } from './diff';
import { patch } from './patch';
import { reverse } from './reverse';
import { _clone, _crc } from './helpers';

let HISTORY_LENGTH = 1000;

const meta = new WeakMap();
const _cid = _id();

interface Changes {
  diff: any[]
  ts: number
  cid: number
  seq?: number
  gid?: string
}

type tsFn = () => number

class AutoPigeon {

  constructor() {
    meta.set(this, {
      history: [],
      stash: [],
      warning: null,
    });
  }

  static from(data: any, cid=_cid) {
    let doc = new AutoPigeon();
    meta.get(doc).cid = cid;
    doc = AutoPigeon.change(doc, (doc: any) => Object.assign(doc, data));
    return doc;
  }

  static _forge(data: any, cid=_cid) {
    let doc = new AutoPigeon();
    meta.get(doc).cid = cid;
    Object.assign(doc, _clone(data));
    // const changes = AutoPigeon.getChanges(doc, data);
    return doc;
  }

  static init() {
    return AutoPigeon.from({});
  }

  static clone(doc: any, historyLength=HISTORY_LENGTH) {
    const clone = AutoPigeon._forge(doc);
    meta.get(clone).history = meta.get(doc).history.slice(-historyLength);
    return clone;
  }

  static getChanges(left: any, right: any) {
    const _diff = diff(left, right);
    const changes = {
      diff: _diff,
      cid: meta.get(left).cid,
      ts: _ts(),
      seq: _seq(),
      gid: _id(),
    }
    return changes;
  }

  static rewindChanges(doc: any, ts: number, cid: number) {

    const { history } = meta.get(doc);

    while (true) {
      if (!history.length) break;
      const change = history[history.length - 1];
      if (change.ts > ts || (change.ts == ts && change.cid > cid)) {
        const c = meta.get(doc).history.pop();
        patch(doc, reverse(c.diff));
        meta.get(doc).stash.push(c);
        continue;
      }
      break;
    }
  }

  static fastForwardChanges(doc: any) {
    const { stash, history } = meta.get(doc);
    let change;
    while (change = stash.pop()) {
      patch(doc, change.diff);
      history.push(change);
    }
  }

  static applyChanges(doc: any, changes: Changes) {
    meta.get(doc).warning = null;
    const newDoc = AutoPigeon.clone(doc);
    try {
      AutoPigeon.rewindChanges(newDoc, changes.ts, changes.cid);
    } catch (e) {
      meta.get(newDoc).warning = 'rewind failed: ' + e;
    }
    try {
      patch(newDoc, changes.diff);
    } catch (e) {
      meta.get(newDoc).warning = 'patch failed: ' + e;
    }
    try {
      AutoPigeon.fastForwardChanges(newDoc);
    } catch (e) {
      meta.get(newDoc).warning = 'forward failed: ' + e;
    }
    const history = meta.get(newDoc).history;
    let idx = history.length;
    while (idx > 0 && history[idx - 1].ts > changes.ts) idx--;
    history.splice(idx, 0, changes);
    return newDoc;
  }

  static change(doc: any, fn: any) {

    assert(doc instanceof AutoPigeon);
    assert(fn instanceof Function);

    const tmp = _clone(doc);
    fn(tmp);
    const changes = AutoPigeon.getChanges(doc, tmp);
    return AutoPigeon.applyChanges(doc, changes);
  }

  static getHistory(doc: any) {
    return meta.get(doc).history;
  }

  static merge(doc1: any, doc2: any) {
    let doc = AutoPigeon.from({});
    const history1 = AutoPigeon.getHistory(doc1);
    const history2 = AutoPigeon.getHistory(doc2);
    const changes = [];
    while (history1.length || history2.length) {
      if (!history2.length) {
        changes.push(history1.shift());

      } else if (!history1.length) {
        changes.push(history2.shift());

      } else if (history1[0].gid === history2[0].gid) {
        changes.push(history1.shift() && history2.shift());

      } else if (history1[0].ts < history2[0].ts) {
        changes.push(history1.shift());

      } else if (history1[0].ts == history2[0].ts) {

        if (history1[0].seq < history2[0].seq) {
          changes.push(history1.shift());
        } else {
          changes.push(history2.shift());
        }

      } else {
        changes.push(history2.shift());
      }
    }

    for (const c of changes) {
      doc = AutoPigeon.applyChanges(doc, c);
    }
    return doc;
  }

  static getWarning(doc: any) {
    return meta.get(doc).warning;
  }

  static getMissingDeps() {
    return false;
  }

  static setHistoryLength(len: number) {
    HISTORY_LENGTH = len;
  }

  static setTimestamp(fn: tsFn) {
    _ts = fn;
  }

  static crc(doc: any) {
    return _crc(doc);
  }

  static load(str: string, historyLength=HISTORY_LENGTH) {
    const { meta: _meta, data } = JSON.parse(str);
    _meta.history = _meta.history.slice(-historyLength);
    const doc = AutoPigeon.from(data);
    Object.assign(meta.get(doc), _meta);
    return doc;
  }

  static save(doc: any) {
    const { cid, ..._meta } = meta.get(doc);
    return JSON.stringify({
      meta: _meta,
      data: doc,
    });
  }
}

function _id() {
  return Math.random().toString(36).substring(2);
}

let _ts = function() {
  return Date.now();
}

let seq = 0;
function _seq() {
  return seq++;
}

export { AutoPigeon }
