// The ending and the in-world visuals: runs a whole story row and checks nothing throws.
const test = require('node:test');
const assert = require('node:assert/strict');
const { scenario } = require('./sim.cjs');

const ALL = ['skStoryGameplay', 'skCometMissionController', 'skV9FinaleController', 'skSK3Visuals', 'skEndingController'];

function fullRow(finalSplit) {
  const g = scenario(ALL);
  g.rowRange(0, 1820, '1:50.0');
  g.rowRange(1830, 2000, finalSplit);
  g.body.classList.remove('inrace'); // the race ends at 2,000 m
  g.step(); g.step();
  return g;
}

test('a won campaign shows the ending card', () => {
  const g = fullRow('1:46.0');
  const el = g.get('skEnding');
  assert.equal(el.hidden, false);
  assert.ok(el.classList.contains('won'));
  assert.match(el.querySelector('.sk-end-echo').textContent, /SK3LAV11K signal restored\./);
  assert.match(el.querySelector('.sk-end-card').innerHTML, /Campaign complete\./);
});

test('a lost finale shows "Warden-9 holds" and offers a retry', () => {
  const g = fullRow('1:52.0');
  const el = g.get('skEnding');
  assert.equal(el.hidden, false);
  assert.ok(el.classList.contains('lost'));
  assert.match(el.querySelector('.sk-end-card').innerHTML, /WARDEN-9 HOLDS[\s\S]*Row again to retry/);
});

test('quitting early shows no ending', () => {
  const g = scenario(ALL);
  g.rowRange(0, 1200, '1:50.0');
  g.body.classList.remove('inrace'); g.step(); g.step();
  const el = g.get('skEnding');
  assert.equal(el.classList.contains('won') || el.classList.contains('lost'), false);
});

test('the visuals layer draws every chapter without errors', () => {
  const g = fullRow('1:46.0');
  assert.equal(g.state().visualError, undefined);
});
