import Core from "..";
import { describe, expect, test } from "vitest";
import { importCore } from ".";

describe("c_major", async () => {
  const core = await importCore("c_major");
  describe("Score", () => {
    test("Event", () =>
      expect(core).toMatchObject({
        start: 0,
        duration: 0,
        end: 0,
      }));
    describe(".metaevents", () => {
      test(".timesignature", () =>
        expect(core.metaevents.data.timesignature).toEqual([
          new Core.Metaevents.Map.Timesignature({
            denominator: 4,
            numerator: 4,
          }),
        ]));
      test(".bpm", () =>
        expect(core.metaevents.data.bpm).toEqual([
          new Core.Metaevents.Map.Bpm({ value: 120 }),
        ]));
      test(".keysignature", () =>
        expect(core.metaevents.data.keysignature).toEqual([
          new Core.Metaevents.Map.Keysignature({
            tonality: false,
            accidental: 0,
          }),
        ]));
    });
    describe(".elements", () =>
      test(".length", () => expect(core.elements).toHaveLength(0)));
    describe(".tracks", () =>
      test("length", () => expect(core.tracks).toHaveLength(0)));
  });
});
