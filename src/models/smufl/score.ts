import * as R from "remeda";
import * as Core from "../core";
import * as SMUFL from "./";

export class Score {
	type: "Pagination" | "VerticalScroll" | "HorizontalScroll";
	clientWidth: number;
	tracks: SMUFL.Track[];
	rows: SMUFL.Row[];
	constructor(
		{ tracks }: Core.Score,
		clientWidth: number,
		type: Score["type"],
	) {
		this.type = type;
		this.clientWidth = clientWidth;
		this.tracks = tracks.map((track) => new SMUFL.Track(track));
		this.rows = this.layout(this.tracks);
	}
	layout(tracks: SMUFL.Track[]): SMUFL.Row[] {
		// TODO: clientWidthによってスペースを変更する処理
		const ajustSpacing = (tracks: SMUFL.Track[]): SMUFL.Track[] => {
			const verticalNotesCollection = tracks[0].bars
				.map((_, barIndex) => tracks.map((track) => track.bars[barIndex]))
				.map((verticalBars) =>
					verticalBars[0].notes.map((_, noteIndex) =>
						verticalBars.map((verticalBar) => verticalBar.notes[noteIndex]),
					),
				);
			// biome-ignore lint/complexity/noForEach: <explanation>
			verticalNotesCollection.forEach((verticalBars) => {
				// biome-ignore lint/complexity/noForEach: <explanation>
				verticalBars.forEach((verticalNotes) => {
					const maxWidthVerticalNote = R.pipe(
						verticalNotes,
						R.sortBy((note) => note.glyph.staffWidth),
						R.last(),
					);
					if (maxWidthVerticalNote)
						// biome-ignore lint/complexity/noForEach: <explanation>
						verticalNotes.forEach((note) => {
							if (
								note.glyph.staffWidth !== maxWidthVerticalNote.glyph.staffWidth
							)
								note.spacing.right =
									maxWidthVerticalNote.glyph.staffWidth - note.glyph.staffWidth;
						});
					if (verticalNotes.some((note) => R.isDefined(note.accidental)))
						// biome-ignore lint/complexity/noForEach: <explanation>
						verticalNotes.forEach((note) => {
							if (R.isNil(note.accidental)) note.spacing.left = 1;
						});
				});
			});

			return tracks;
		};
		const layoutNewLine = (tracks: SMUFL.Track[]): SMUFL.Row[] => {
			const generateRow = (
				tracks: SMUFL.Track[],
				start: number,
				end?: number,
				prev?: SMUFL.Row["prev"],
			) =>
				new SMUFL.Row(
					tracks.map((track) => ({
						...track,
						bars: track.bars.slice(start, end),
					})),
					prev,
				);
			const firstTrack = R.first(tracks);
			if (R.isNil(firstTrack)) throw new Error();
			return firstTrack.bars.reduce<{
				rows: SMUFL.Row[];
				width: number;
				start: number;
				prev?: SMUFL.Row | undefined;
			}>(
				(acc, cur, i) => {
					acc.width += cur.width;
					if (acc.width > this.clientWidth) {
						const row = generateRow(tracks, acc.start, i, acc.prev);
						acc.width = cur.width;
						acc.rows.push(row);
						acc.prev = row;
						acc.start = i;
					}
					if (
						i === firstTrack.bars.length - 1 &&
						acc.width < this.clientWidth
					) {
						const row = generateRow(tracks, acc.start, undefined, acc.prev);
						acc.rows.push(row);
						acc.prev = row;
					}
					return acc;
				},
				{ rows: [], width: 0, start: 0, prev: undefined },
			).rows;
		};
		const spacingTracks = ajustSpacing(tracks);
		if (this.type === "HorizontalScroll") return [new SMUFL.Row(spacingTracks)];
		if (this.type === "VerticalScroll") return layoutNewLine(spacingTracks);
		if (this.type === "Pagination") return [];
		return [];
	}
}
