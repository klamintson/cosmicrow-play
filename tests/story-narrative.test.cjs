// Story radio and objectives follow the SK3LAV11K Calling story bible.
const test = require('node:test');
const assert = require('node:assert/strict');
const { html, scenario } = require('./sim.cjs');

const ALL = ['skStoryGameplay', 'skCometMissionController', 'skV9FinaleController'];

test('chapters advance with the distance rowed', () => {
  const g = scenario(ALL);
  const label = () => g.get('query:#skStoryMission b').textContent;
  g.rowRange(0, 100, '1:50.0'); assert.equal(label(), '01 / THE LAST SIGNAL');
  g.rowRange(110, 520, '1:50.0'); assert.equal(label(), '03 / ARCADE COMET');
  g.rowRange(530, 1210, '1:50.0'); assert.equal(label(), '05 / THE DEFENDER');
  g.rowRange(1220, 1560, '1:50.0'); assert.equal(label(), '07 / BROKEN FORMATION');
  g.rowRange(1570, 1840, '1:50.0'); assert.equal(label(), 'FINAL / WARDEN-9');
});

test('only Echo, TJ Pacer, Ines, Warden-9 and Captain Johan speak', () => {
  const speakers = new Set();
  for (const m of html.matchAll(/speaker:'([^']+)'/g)) speakers.add(m[1]);
  const radio = html.match(/<script id="skStoryGameplay">([\s\S]*?)<\/script>/)[1];
  // radio rows: [metres, 'chapter', objective, 'SPEAKER', 'line']
  for (const m of radio.matchAll(/\[\d+,'[^']*',(?:"[^"]*"|'[^']*'|null),'([^']+)','/g)) speakers.add(m[1]);
  assert.ok(speakers.has('TJ PACER') && speakers.has('INES'), [...speakers].join());
  for (const s of speakers) assert.ok(['ECHO', 'TJ PACER', 'INES', 'WARDEN-9', 'CAPTAIN JOHAN'].includes(s), s);
});

test('retired story elements are gone from the story scripts', () => {
  const story = ['skStoryGameplay', 'skCinematicV7Controller', 'skCometMissionController', 'skV9FinaleController']
    .map(id => html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`))[1]).join('\n');
  for (const word of ['GHOST', 'SPECTRE', 'TJ PACER TAKEN', 'TRACTOR', 'MISSION COMPLETE', 'HOUSE EASTER EGG', 'TJ Laser', 'grandm']) {
    assert.ok(!story.includes(word), word);
  }
  assert.match(html, /<span class="rl">SK3LAV11K Calling<\/span>/);
});

test('the comet result reaches the story radio', () => {
  const g = scenario(ALL);
  g.rowRange(0, 1000, '1:50.0');
  assert.equal(g.events('cosmicrow:comet-result').length, 1);
  assert.match(g.get('skRadioText').textContent, /Comet down|got past us/);
});

test('a won finale updates the objective; Echo says "Signal unstable." on a loss', () => {
  const won = scenario(ALL);
  won.rowRange(0, 1820, '1:50.0'); won.rowRange(1830, 2000, '1:46.0');
  assert.equal(won.get('skMissionObjective').textContent, 'WARDEN-9 DOWN · CROSS THE LINE');
  const lost = scenario(ALL);
  lost.rowRange(0, 1820, '1:50.0'); lost.rowRange(1830, 2000, '1:52.0');
  assert.equal(lost.get('skRadioText').textContent, 'Signal unstable.');
});

test('outside the story stage nothing activates', () => {
  const g = scenario(ALL, { stage: 'orbit' });
  g.rowRange(0, 2000, '1:46.0');
  assert.equal(g.body.classList.contains('sk-story-active'), false);
  assert.equal(g.events('cosmicrow:comet-result').length, 0);
  assert.equal(g.events('cosmicrow:warden-result').length, 0);
});
