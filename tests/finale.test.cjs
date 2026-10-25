// Warden-9 finale: 1,830 m to 2,000 m. Rowing performance decides it.
const test = require('node:test');
const assert = require('node:assert/strict');
const { scenario } = require('./sim.cjs');

const STORY = ['skStoryGameplay', 'skV9FinaleController'];

function finale(splitAfter, until = 2000) {
  const g = scenario(STORY);
  g.rowRange(0, 1820, '1:50.0');
  g.rowRange(1830, until, splitAfter);
  return g;
}

test('a fast final sprint breaks all three shields and lands the strike', () => {
  const g = finale('1:46.0');
  const done = g.events('cosmicrow:warden-result');
  assert.equal(done.length, 1);
  assert.equal(done[0].detail.success, true);
  assert.equal(done[0].detail.layers, 3);
});

test('holding race pace is not enough: distance alone does not break the shields', () => {
  const g = finale('1:50.0');
  const done = g.events('cosmicrow:warden-result');
  assert.equal(done.length, 1);
  assert.equal(done[0].detail.success, false);
});

test('stopping during the finale never hands over the victory', () => {
  const g = scenario(STORY);
  g.rowRange(0, 1820, '1:50.0');
  g.rowRange(1830, 1880, '1:46.0');
  const charged = g.state().warden.charge;
  for (let i = 0; i < 200; i++) g.row(1880, '1:46.0');
  assert.equal(g.events('cosmicrow:warden-result').length, 0);
  assert.ok(g.state().warden.charge < charged, 'the shield repairs while the player is stopped');
});

test('the objective counts down the shields', () => {
  const g = finale('1:46.0', 1850);
  assert.match(g.get('skMissionObjective').textContent, /SHIELD 1 OF 3 · HOLD 1:48/);
  g.rowRange(1860, 1880, '1:46.0');
  assert.match(g.get('skMissionObjective').textContent, /SHIELD 2 OF 3/);
  g.rowRange(1890, 1920, '1:46.0');
  assert.match(g.get('skMissionObjective').textContent, /SHIELD 3 OF 3/);
});
