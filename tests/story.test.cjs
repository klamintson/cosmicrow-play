// Arcade Comet (chapter 3): three rowing waves from 500 m to 1,000 m.
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { html, scenario } = require('./sim.cjs');

const STORY = ['skStoryGameplay', 'skCometMissionController'];

test('every inline game script parses successfully', () => {
  let count = 0;
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (!match[1].trim()) continue;
    assert.doesNotThrow(() => new vm.Script(match[1], { filename: `inline-${++count}.js` }));
  }
  assert.ok(count >= 10);
});

// Hold 1:50 to set the target, then row each wave as described.
function comet({ chase = '1:50.0', surge = '1:46.0', between = '1:50.0', brk = '1:50.0' } = {}) {
  const g = scenario(STORY);
  g.rowRange(0, 490, '1:50.0');
  g.rowRange(500, 650, chase);
  for (let d = 660; d <= 800; d += 10) {
    const inSurge = (d >= 670 && d < 715) || (d >= 735 && d < 780);
    g.row(d, inSurge ? surge : between);
  }
  g.rowRange(810, 1000, brk);
  return g;
}

test('rowing every wave well defeats the comet', () => {
  const g = comet();
  const done = g.events('cosmicrow:comet-result');
  assert.equal(done.length, 1);
  assert.equal(done[0].detail.success, true);
  assert.equal(done[0].detail.waves, 3);
  assert.deepEqual([...g.state().comet.won], [true, true, true]);
});

test('missing both surges loses the dodge wave but two waves still win', () => {
  const g = comet({ surge: '1:50.0' });
  assert.deepEqual([...g.state().comet.won], [true, false, true]);
  assert.equal(g.events('cosmicrow:comet-result')[0].detail.success, true);
});

test('rowing off pace lets the comet escape, and the result fires once', () => {
  const g = comet({ chase: '2:10.0', surge: '2:10.0', between: '2:10.0', brk: '2:10.0' });
  const done = g.events('cosmicrow:comet-result');
  assert.equal(done.length, 1);
  assert.equal(done[0].detail.success, false);
  assert.match(g.get('skCometMessage').textContent, /got past us/);
});

test('the break wave has a tighter tolerance than the chase', () => {
  // 1:55 is 5 s off a 1:50 target: inside the chase tolerance (6 s), outside the break tolerance (4 s).
  const g = comet({ chase: '1:55.0', brk: '1:55.0' });
  assert.deepEqual([...g.state().comet.won], [true, true, false]);
});

test('sitting still charges nothing and the gap to the comet grows', () => {
  const g = scenario(STORY);
  g.rowRange(0, 520, '1:50.0');
  const before = g.state().comet;
  for (let i = 0; i < 80; i++) g.row(520, '1:50.0');
  const after = g.state().comet;
  assert.equal(after.tail, before.tail);
  assert.ok(after.gap > before.gap, `gap ${before.gap} -> ${after.gap}`);
  assert.equal(g.events('cosmicrow:comet-result').length, 0);
});

test('the comet panel only shows during the encounter and Echo calls the surges', () => {
  const g = scenario(STORY);
  g.rowRange(0, 400, '1:50.0');
  assert.equal(g.get('skCometMission').classList.contains('live'), false);
  g.rowRange(410, 670, '1:50.0');
  assert.equal(g.get('skCometMission').classList.contains('live'), true);
  assert.match(g.get('skCometMessage').textContent, /Surge/);
  g.rowRange(680, 1100, '1:50.0');
  assert.equal(g.get('skCometMission').classList.contains('live'), false);
});
