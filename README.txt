COSMICROW: SKÁLAVÍK CALLING — ECHO V7 + INTERACTIVE COMET

Separate test build; your published CosmicRow remains unchanged.

This test branch preserves the original 3D stages, helmeted TJ Pacer artwork,
PM5 integration, rowing physics, pace boats, and boss mechanics.

The story includes six distance-triggered cinematics and an Arcade Comet
defence objective. Echo provides mission guidance; TJ Pacer is the
waveboard-riding defender. Hold a consistent live 500-metre split during the
comet encounter (500–1100 metres of story rowing) to charge an 8-metre comet
tail. Clearing three waves defeats the blockade. Stopping or rowing off-pace
does not win the encounter. Ship-name-based cockpit accents vary by vessel.

The encounter consumes the game's existing split/distance HUD telemetry. It
does not alter PM5 measurements, race timers, Concept2 watts, or logbook data.

Start the game and choose Skálavík Calling to see the new story.

Run the source checks with: node --test tests/story.test.cjs

Browser graphics (WebGL) and a real PM5 are not verified on this test branch.
Use the existing live website for important rowing sessions. Bluetooth may not
work if opening a file directly from iPad Files.
