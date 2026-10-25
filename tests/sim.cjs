// Minimal browser stand-in for running the SK3LAV11K story scripts together in node:vm.
// Each scenario loads the named inline scripts from index.html into one shared context,
// so events dispatched by one controller reach the others, as in the real page.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function scriptById(id) {
  const m = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`));
  if (!m) throw new Error(`script #${id} not found`);
  return m[1];
}

function classList() {
  const set = new Set();
  return {
    add: (...xs) => xs.forEach(x => set.add(x)),
    remove: (...xs) => xs.forEach(x => set.delete(x)),
    contains: x => set.has(x),
    toggle: (x, on) => { const v = on === undefined ? !set.has(x) : !!on; v ? set.add(x) : set.delete(x); return v; },
  };
}

function fakeContext2d() {
  const store = {};
  const gradient = { addColorStop() {} };
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient;
      return () => {};
    },
    set(target, prop, value) { target[prop] = value; return true; },
  });
}

function makeNode(id) {
  const node = {
    id, textContent: '', innerHTML: '', hidden: false, dataset: {}, width: 0, height: 0, offsetWidth: 1,
    style: { setProperty() {} }, classList: classList(), listeners: {},
    setAttribute() {}, getAttribute: () => null,
    addEventListener(type, fn) { (node.listeners[type] ||= []).push(fn); },
    getContext: () => fakeContext2d(),
  };
  node.querySelector = sel => {
    const key = `${id} ${sel}`;
    if (!nodes.has(key)) nodes.set(key, makeNode(key));
    return nodes.get(key);
  };
  return node;
}

let nodes;

function scenario(ids, { stage = 'skalavik' } = {}) {
  nodes = new Map();
  const get = id => { if (!nodes.has(id)) nodes.set(id, makeNode(id)); return nodes.get(id); };
  const body = { classList: classList() };
  body.classList.add('inrace');
  const listeners = {};
  const dispatched = [];
  let callbacks = [];
  let clock = 0;
  const document = {
    body,
    visibilityState: 'visible',
    getElementById: get,
    querySelector: sel => (sel === '.stagecard.sel'
      ? { getAttribute: () => stage }
      : get(`query:${sel}`)),
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
    dispatchEvent: evt => { dispatched.push(evt); (listeners[evt.type] || []).forEach(fn => fn(evt)); return true; },
  };
  const context = vm.createContext({
    document,
    requestAnimationFrame: fn => { callbacks.push(fn); return callbacks.length; },
    cancelAnimationFrame() {},
    performance: { now: () => clock },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    MutationObserver: class { observe() {} },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    innerWidth: 800, innerHeight: 450, devicePixelRatio: 1,
    setTimeout: () => 0, clearTimeout() {},
  });
  context.globalThis = context;
  for (const id of ids) vm.runInContext(scriptById(id), context, { filename: `${id}.js` });

  function step(ms = 120) {
    clock += ms;
    const run = callbacks;
    callbacks = [];
    run.forEach(fn => fn(clock));
  }
  function row(distance, split = '1:50.0') {
    get('hDist').textContent = String(distance);
    get('hSplit').textContent = split;
    step();
  }
  function rowRange(from, to, split, every = 10) {
    for (let d = from; d <= to; d += every) row(d, split);
  }
  const events = type => dispatched.filter(e => e.type === type);
  return { get, body, step, row, rowRange, events, state: () => context.SK3State, context };
}

module.exports = { html, scriptById, scenario };
