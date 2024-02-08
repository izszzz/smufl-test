import fs from "fs";
import * as R from "remeda";
import * as Core from "../core";
import { MidiImporter } from "./midi_importer";

const toArrayBuffer = (buffer: Buffer) =>
	buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const importMidiFile = (path: string) =>
	new MidiImporter(toArrayBuffer(fs.readFileSync(path)));
const path = "src/models/importer/fixtures/midi/";

describe("Note", () => {
	test("export quarter middle C Core.Note", () => {
		const { score } = importMidiFile(`${path}quarter_middle_c.mid`);
		expect(score.tracks).toContainEqual(
			new Core.Track({
				name: "track",
				bars: [
					new Core.Bar({ notes: [new Core.Note({ pitch: 60, fraction: 4 })] }),
				],
			}),
		);
	});

	test("export one-eight middle C Core.Note", () => {
		const { score } = importMidiFile(`${path}one-eight_middle_c.mid`);
		expect(score.tracks).toContainEqual(
			new Core.Track({
				name: "track",
				bars: [
					new Core.Bar({ notes: [new Core.Note({ pitch: 60, fraction: 8 })] }),
				],
			}),
		);
	});
});

describe("Track", () => {
	test("export two-track", () => {
		const { score } = importMidiFile(`${path}two-track.mid`);
		expect(score.tracks).toEqual(
			R.times(
				2,
				() =>
					new Core.Track({
						name: "track",
						bars: [
							new Core.Bar({
								notes: [new Core.Note({ pitch: 60, fraction: 4 })],
							}),
						],
					}),
			),
		);
	});
});

describe("Score Metadata", () => {
	describe("timeSig", () => {
		test("export 4/4 score", () => {
			const { score } = importMidiFile(`${path}time-signature_4-4.mid`);
			expect(score.metadata.timeSignature).toEqual({
				denominator: 4,
				numerator: 4,
			});
		});
		test("export 3/4 score", () => {
			const { score } = importMidiFile(`${path}time-signature_3-4.mid`);
			expect(score.metadata.timeSignature).toEqual({
				denominator: 4,
				numerator: 3,
			});
		});
	});

	describe("BPM", () => {
		test("export 120 score", () => {
			const { score } = importMidiFile(`${path}bpm_120.mid`);
			expect(score.metadata.bpm).toEqual(120);
		});
		test("export 140 score", () => {
			const { score } = importMidiFile(`${path}bpm_140.mid`);
			expect(score.metadata.bpm).toEqual(140);
		});
	});
});