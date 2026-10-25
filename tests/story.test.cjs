const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('every inline game script parses successfully', () => {
  let count = 0;
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (!match[1].trim()) continue;
    assert.doesNotThrow(() => new vm.Script(match[1], { filename: `inline-${++count}.js` }));
  }
  assert.ok(count >= 7);
});

function scenario() {
  const script = html.match(/<script id="skCometMissionController">([\s\S]*?)<\/script>/)[1];
  const nodes = new Map();
  const classList = () => {
    const values = new Set();
    return {
      add: (...items) => items.forEach(x => values.add(x)),
      remove: (...items) => items.forEach(x => values.delete(x)),
      contains: x => values.has(x),
    };
  };
  function get(id) {
    if (!nodes.has(id)) nodes.set(id, {
      textContent: '',
      dataset: {},
      style: { setProperty() {} },
      classList: classList(),
    });
    return nodes.get(id);
  }
  const body = { classList: classList() };
  body.classList.add('sk-story-active');
  const events = [];
  let nextFrame;
  const document = {
    body,
    getElementById: get,
    dispatchEvent: evt => events.push(evt),
  };
  const context = vm.createContext({
    document,
    requestAnimationFrame: cb => { nextFrame = cb; },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  vm.runInContext(script, context);
  let now = 0;
  function row(distance, pace) {
    get('hDist').textContent = String(distance) + ' m';
    get('hSplit').textContent = pace;
    nextFrame(now += 120);
  }
  return { get, row, events, body };
}

test('good rowing pace defeats all three comet waves', () => {
  const game = scenario();
  for (let d = 0; d <= 850; d += 10) game.row(d, '1:50.0');
  assert.equal(game.get('skCometSector').textContent, 'CLEAR');
  assert.equal(game.get('skCometWaves').textContent, '3 / 3');
  assert.equal(game.events.length, 1);
  assert.equal(game.events[0].detail.success, true);
});

test('off-target rowing fails, and the event fires only once', () => {
  const game = scenario();
  for (let d = 0; d < 500; d += 10) game.row(d, '1:50.0');
  for (let d = 500; d <= 1250; d += 10) game.row(d, '2:10.0');
  assert.equal(game.get('skCometSector').textContent, 'BREACHED');
  assert.equal(game.events.length, 1);
  assert.equal(game.events[0].detail.success, false);
});

test('remaining still does not charge the comet tail', () => {
  const game = scenario();
  for (let d = 0; d < 500; d += 10) game.row(d, '1:50.0');
  game.row(510, '1:50.0');
  const before = game.get('skCometTail').textContent;
  for (let tick = 0; tick < 50; tick++) game.row(510, '1:50.0');
  assert.equal(game.get('skCometWaves').textContent, '0 / 3');
  assert.equal(game.get('skCometTail').textContent, before);
});
