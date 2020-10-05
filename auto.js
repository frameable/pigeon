const { diff, patch, reverse } = require('./index');
const { _clone } = require('./helpers');

const meta = new WeakMap();
const _cid = Math.random().toString(36).substring(2);

class AutoPigeon {

  constructor() {
    meta.set(this, {
      history: [],
      stash: [],
    });
  }

  static from(data, cid=_cid) {
    const doc = new AutoPigeon();
    meta.get(doc).cid = cid;
    Object.assign(doc, data);
    return doc;
  }

  static clone(doc) {
    const clone = AutoPigeon.from(doc);
    meta.get(clone).history.push(...meta.get(doc).history);
    return clone;
  }

  static getChanges(left, right) {
    const _diff = diff(left, right);
    const changes = {
      diff: _diff,
      ts: Date.now(),
      cid: meta.get(left).cid,
    }
    return changes;
  }

  static rewindChanges(doc, ts, cid) {

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

  static fastForwardChanges(doc) {
    const { stash, history } = meta.get(doc);
    let change;
    while (change = stash.pop()) {
      patch(doc, change.diff);
      history.push(change);
    }
  }

  static applyChanges(doc, changes) {
    const newDoc = AutoPigeon.clone(doc);
    AutoPigeon.rewindChanges(newDoc, changes.ts, changes.cid);
    patch(newDoc, changes.diff);
    AutoPigeon.fastForwardChanges(newDoc);
    meta.get(newDoc).history.push(changes);
    meta.get(newDoc).history.sort((a, b) => a.ts - b.ts);
    return newDoc;
  }

  static change(doc, fn) {
    const tmp = _clone(doc);
    fn(tmp);
    const changes = AutoPigeon.getChanges(doc, tmp);
    const newDoc = AutoPigeon.clone(doc);
    return AutoPigeon.applyChanges(newDoc, changes);
  }

  static getHistory(doc) {
    return meta.get(doc).history;
  }

  static load(str) {
    const { meta: _meta, data } = JSON.parse(str);
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
}

module.exports = AutoPigeon;
