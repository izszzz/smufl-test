import * as R from "remeda";
import Metadata from "../consts/metadata.json";
import glyphNames from "../consts/metadata/glyphnames.json";
import Glyphnames from "../consts/metadata/glyphnames.json";
import { SMUFLExporter } from "../exporters/smufl_exporter";
import * as Core from "../models/core";
import * as SMUFL from "../models/smufl";
interface SVGRendererOptions {
	layoutType: SMUFL.Score["type"];
	fontSize: number;
}

// TODO: barsがemptyの場合
// TODO: 設計考え直したほうがいい
class SVGRenderer {
	element: HTMLElement;
	score: Core.Score;
	svg: SVGSVGElement;
	fontSize: SVGRendererOptions["fontSize"];
	fontSizeRatio: number;
	layoutType: SMUFL.Score["type"] = "HorizontalScroll";
	constructor(
		element: HTMLElement,
		score: Core.Score,
		options?: SVGRendererOptions,
	) {
		this.element = element;
		this.score = score;
		this.fontSize = 30;
		if (options) {
			if (options.fontSize) this.fontSize = options.fontSize;
			if (options.layoutType) this.layoutType = options.layoutType;
		}
		this.fontSizeRatio = this.fontSize / Metadata.defaultFontSize;
		this.svg = this.createSVGElement("svg", {
			width: "100%",
			height: "100%",
			"font-size": this.fontSize,
		});
		this.upsertSVGElement();
	}
	createTransform(x: number, y: number) {
		const transform = this.svg.createSVGTransform();
		transform.setTranslate(x, y);
		return transform;
	}
	createSMULFSVGElement = (
		glyphName: keyof Glyphnames,
		attributes?: Parameters<typeof this.createSVGElement>[1],
	) => this.createUnicodeText(glyphNames[glyphName].codepoint, attributes);
	createSVGElement = <K extends keyof SVGElementTagNameMap>(
		qualifiedName: K,
		attributes: Record<string, unknown> = {},
	) => {
		const element = document.createElementNS(
			"http://www.w3.org/2000/svg",
			qualifiedName,
		);
		if (element instanceof SVGGElement) {
			element.transform.baseVal.appendItem(
				this.createTransform(
					((attributes.x as number) ?? 0) * this.fontSizeRatio,
					((attributes.y as number) ?? 0) * this.fontSizeRatio,
				),
			);
		}
		R.pipe(
			attributes,
			R.mapValues((v, k) =>
				["x", "y", "width", "height"].includes(k) && R.isNumber(v)
					? v * this.fontSizeRatio
					: v,
			),
			R.toPairs,
			// biome-ignore lint/complexity/noForEach: <explanation>
			R.forEach(([k, v]) => element.setAttribute(k, String(v))),
		);
		return element;
	};
	changeFontSize = (fontSize: number) => {
		this.fontSize = fontSize;
		this.fontSizeRatio = this.fontSize / Metadata.defaultFontSize;
		this.svg = this.createSVGElement("svg", {
			width: "100%",
			height: "100%",
			"font-size": this.fontSize,
		});
		this.upsertSVGElement();
	};
	private upsertSVGElement = () => {
		while (this.element.firstChild) this.element.firstChild.remove();
		this.element
			.appendChild(this.svg)
			.appendChild(
				this.createSVGScore(
					new SMUFLExporter(this.score).export(
						this.svg.clientWidth / this.fontSizeRatio,
					),
				),
			);
	};
	private createUnicodeText = (
		code: string,
		attributes?: Parameters<typeof this.createSVGElement>[1],
	) => this.createText(code.replace("U+", "&#x"), attributes);
	private createText(
		content: string,
		attributes?: Parameters<typeof this.createSVGElement>[1],
	) {
		const text = this.createSVGElement("text", attributes);
		text.innerHTML = content;
		return text;
	}

	private createSVGScore = (score: SMUFL.Score) => {
		console.log(score);
		const root = this.createSVGElement("g");
		// create staffs
		// biome-ignore lint/complexity/noForEach: <explanation>
		score.rows.forEach((row, i) => {
			const trackRowElement = this.createSVGElement("g", {
				type: "row",
				y: 20 * i + 10,
			});
			const barlinesElement = this.createSVGElement("g", {
				type: "barlines",
			});
			root.appendChild(trackRowElement);
			trackRowElement.appendChild(barlinesElement);
			for (const masterBar of row.masterBars) {
				R.times(score.tracks.length * 3 - 2, (i) =>
					barlinesElement.appendChild(
						this.createSMULFSVGElement("barlineSingle", {
							type: "barline",
							y: i * 4,
							x: masterBar.x,
						}),
					),
				);
			}
			for (const track of row.tracks) {
				const trackElement = this.createSVGElement("g", {
					type: "track",
					y: track.y,
				});
				trackRowElement.appendChild(trackElement);
				for (const bar of track.bars) {
					const barElement = this.createSVGElement("g", {
						type: "bar",
						x: bar.x,
					});
					const staffsElement = this.createSVGElement("g", {
						type: "staffs",
					});
					const notesElement = this.createSVGElement("g", {
						type: "notes",
					});
					const metadataElement = this.createSVGElement("g", {
						type: "metadata",
						y: -1,
					});

					trackElement.appendChild(barElement);
					barElement.appendChild(metadataElement);
					barElement.appendChild(notesElement);
					barElement.appendChild(staffsElement);

					R.times(
						score.masterBars.find((masterBar) => masterBar.id === bar.core.id)
							?.width ?? 0,
						(i) => {
							const staffGlyph = SMUFL.Staff.getStaffGlyph(
								1,
								bar.track.staffLineCount,
							);
							staffsElement.appendChild(
								this.createSMULFSVGElement(staffGlyph.glyphName, {
									type: "staff",
									x: i,
								}),
							);
						},
					);
					if (bar.metadata) {
						for (const { glyphName, x, y } of bar.metadata.glyphs.flat()) {
							metadataElement.appendChild(
								this.createSMULFSVGElement(glyphName, { x, y }),
							);
						}
					}
					for (const note of bar.notes) {
						const noteElement = this.createSVGElement("g", {
							type: "note",
							x: note.x,
							y: note.y,
						});
						notesElement.appendChild(noteElement);
						for (const glyph of note.glyphs) {
							if (R.isArray(glyph)) {
								for (const g of glyph) {
									noteElement.appendChild(
										this.createSMULFSVGElement(g.glyphName, { x: g.x }),
									);
								}
							} else {
								noteElement.appendChild(
									this.createSMULFSVGElement(glyph.glyphName, { x: glyph.x }),
								);
							}
						}
					}
				}
			}

			// row.staffs.forEach((trackStaffs, i) => {
			// 	const trackElement = this.createSVGElement("g", {
			// 		type: "track",
			// 		y: 4 * i,
			// 	});
			// 	trackRowElement.appendChild(trackElement);
			// 	const staffs = trackStaffs.flat();
			// 	// biome-ignore lint/complexity/noForEach: <explanation>
			// 	staffs.forEach((staff, i) => {
			// 		const staffElement = this.createSVGElement("g", {
			// 			type: "note",
			// 			x: staffs.slice(0, i).reduce((acc, cur) => acc + cur.width, 0),
			// 		});
			// 		trackElement.appendChild(staffElement);
			// 		staffElement.appendChild(
			// 			this.createSMULFSVGElement(staff.staffGlyph.glyphName, {
			// 				...staff.staffGlyph,
			// 			}),
			// 		);
			// 		if (staff.glyph instanceof SMUFL.Glyph)
			// 			staffElement.appendChild(
			// 				this.createSMULFSVGElement(staff.glyph.glyphName, {
			// 					...staff.glyph,
			// 				}),
			// 			);
			// 		if (staff.glyph instanceof SMUFL.Ligature)
			// 			// biome-ignore lint/complexity/noForEach: <explanation>
			// 			staff.glyph.glyphs.forEach((g) =>
			// 				staffElement.appendChild(
			// 					this.createSMULFSVGElement(g.glyphName, { ...g }),
			// 				),
			// 			);
			// 	});
			// });
		});
		// create barlines
		const createBarline = (
			trackRowsLength: number,
			glyphName: Parameters<typeof this.createSMULFSVGElement>[0],
			attributes: Parameters<typeof this.createSMULFSVGElement>[1],
		) =>
			R.times(trackRowsLength * 3 - 2, (i) =>
				this.createSMULFSVGElement(glyphName, {
					...attributes,
					type: "barline",
					y: i * 4,
				}),
			);
		// biome-ignore lint/complexity/noForEach: <explanation>
		// score.rows.forEach((row, i) => {
		// 	const trackRowElement = this.createSVGElement("g", {
		// 		type: "barline",
		// 		y: 20 * i + 10,
		// 	});
		// 	root.appendChild(trackRowElement);
		// 	// biome-ignore lint/complexity/noForEach: <explanation>
		// 	row.barlines.forEach((barline) => {
		// 		// biome-ignore lint/complexity/noForEach: <explanation>
		// 		createBarline(score.tracks.length, barline.glyph.glyphName, {
		// 			x: barline.x,
		// 		}).forEach((barline) => trackRowElement.appendChild(barline));
		// 	});
		// });

		return root;
	};
}
export default SVGRenderer;