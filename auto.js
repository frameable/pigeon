const assert = require('assert');
const diff = require('./diff');
const patch = require('./patch');
const reverse = require('./reverse');
const { _clone, _crc, _configure, _config } = require('./helpers');

let HISTORY_LENGTH = 1000;

const meta = new WeakMap();
const _cid = _id();

class AutoPigeon {

  constructor() {
    meta.set(this, {
      history: [],
      stash: [],
      warning: null,
      gids: {},
    });
  }

  static from(data, cid=_cid) {
    let doc = new AutoPigeon();
    meta.get(doc).cid = cid;
    doc = AutoPigeon.change(doc, doc => Object.assign(doc, data));
    return doc;
  }

  static _forge(data, cid=_cid) {
    let doc = new AutoPigeon();
    meta.get(doc).cid = cid;
    Object.assign(doc, _clone(data));
    return doc;
  }

  static alias(doc) {
    let alias = new AutoPigeon();
    meta.set(alias, meta.get(doc));
    Object.assign(alias, doc);
    return alias;
  }

  static init() {
    return AutoPigeon.from({});
  }

  static clone(doc, historyLength=HISTORY_LENGTH) {
    const clone = AutoPigeon._forge(doc);
    meta.get(clone).history = meta.get(doc).history;
    meta.get(clone).gids = _clone(meta.get(doc).gids);
    AutoPigeon.pruneHistory(meta.get(clone), historyLength)
    return clone;
  }

  static pruneHistory(meta, historyLength) {
    const docHistoryLength = meta.history.length;
    if (docHistoryLength > historyLength) {
      const prunedHistory = meta.history.slice(0, docHistoryLength - historyLength);
      for (const item of prunedHistory) {
        delete meta.gids[item.gid];
      }
    }
    meta.history = meta.history.slice(-historyLength);
  }

  static getChanges(left, right) {
    const _diff = diff(left, right);
    const changes = {
      diff: _diff,
      cid: meta.get(left).cid,
      ts: _config.getTimestamp(),
      seq: _seq(),
      gid: _id(),
    }
    return changes;
  }

  static rewindChanges(doc, ts, cid) {

    const { history } = meta.get(doc);

    while (true) {
      if (history.length <= 1) break;
      const change = history[history.length - 1];
      if (change.ts > ts || (change.ts == ts && change.cid > cid)) {
        const c = meta.get(doc).history.pop();
        patch(doc, reverse(c.diff));
        delete meta.get(doc).gids[c.gid];
        meta.get(doc).stash.push(c);
        continue;
      }
      break;
    }
  }

  static fastForwardChanges(doc) {
    const { stash, history } = meta.get(doc);
    let change;
    while (change = stash.pop()) {
      patch(doc, change.diff);
      meta.get(doc).gids[change.gid] = 1;
      history.push(change);
    }
  }

  static applyChangesInPlace(doc, changes) {
    return AutoPigeon.applyChanges(doc, changes, true);
  }

  static applyChanges(doc, changes, inplace) {
    meta.get(doc).warning = null;
    const newDoc = inplace ? doc : AutoPigeon.clone(doc);
    if (meta.get(doc).gids[changes.gid]) {
      return newDoc;
    }
    try {
      AutoPigeon.rewindChanges(newDoc, changes.ts, changes.cid);
    } catch (e) {
      meta.get(newDoc).warning = 'rewind failed: ' + e;
    }
    try {
      patch(newDoc, changes.diff);
      meta.get(newDoc).gids[changes.gid] = 1;
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
    while (idx > 1 && history[idx - 1].ts > changes.ts) idx--;
    history.splice(idx, 0, changes);
    return newDoc;
  }

  static change(doc, fn) {

    assert(doc instanceof AutoPigeon);
    assert(fn instanceof Function);

    const tmp = _clone(doc);
    fn(tmp);
    const changes = AutoPigeon.getChanges(doc, tmp);
    return AutoPigeon.applyChanges(doc, changes);
  }

  static getHistory(doc) {
    return meta.get(doc).history;
  }

  static merge(doc1, doc2) {
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

  static getWarning(doc) {
    return meta.get(doc).warning;
  }

  static getMissingDeps(doc) {
    return false;
  }

  static setHistoryLength(len) {
    HISTORY_LENGTH = len;
  }

  static setTimestamp(fn) {
    _config.getTimestamp = fn;
  }

  static crc(doc) {
    return _crc(doc);
  }

  static load(str, historyLength=HISTORY_LENGTH) {
    const { meta: _meta, data } = JSON.parse(str);
    AutoPigeon.pruneHistory(_meta, historyLength);
    const doc = AutoPigeon.from(data);
    Object.assign(meta.get(doc), _meta);
    return doc;
  }

  static save(doc) {
    const { cid, ..._meta } = meta.get(doc);
    return JSON.stringify({
      meta: _meta,
      data: doc,
    });
  }

  static configure(options) {
    _configure(options);
  }
}

function _id() {
  return Math.random().toString(36).substring(2);
}

let seq = 0;
function _seq() {
  return seq++;
}

module.exports = AutoPigeon;
