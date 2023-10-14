import bravuraMetadata from "../../../consts/metadata/bravura_metadata.json"
import Note from "../../note";
import Classes from "../../../consts/metadata/classes.json";
import { SMUFLElement, SMUFLGroup, SMUFLText } from "./interfaces";
import Metadata from "../../../consts/metadata.json";
import Ranges from "../../../consts/metadata/ranges.json";
import SVGRenderer from "./renderer";

export default function SVGNote(note: Note): SMUFLGroup{
	const children: SMUFLElement[] = []
	const noteGlyphName = searchNoteGlyphName(note)
	const noteBBox = SVGRenderer.getBBoxByGlyphName(noteGlyphName)
	const accidentalGlyphName: Classes["accidentals"][number] | null = isNoteAccidental(note) ? calcNoteAccidental(note) :null 
	const legerLineGlyphName: Ranges["staves"]["glyphs"][number] | null = isNoteLegerLine(note) ? searchLegerLineGlyphName(note) : null 
	const pureNote = [{ element: "text", glyphName: noteGlyphName, ...noteBBox } as SMUFLText]
	
	if(accidentalGlyphName)
		children.push({ type: "accidental", element: "text", glyphName: accidentalGlyphName, ...SVGRenderer.getBBoxByGlyphName(accidentalGlyphName)} as SMUFLText)
	if(legerLineGlyphName)
		pureNote.push({ type: "legerLine", element: "text", glyphName: legerLineGlyphName, ...SVGRenderer.getBBoxByGlyphName(legerLineGlyphName) } as SMUFLText)

	children.push({ element: "g", ...noteBBox, children: pureNote } as SMUFLGroup)
	
	return {
		type: "note", 
		element: "g",
		y: calcNoteY(note),
		width: children.reduce((acc, item)=>acc + item.width, 0),
		children: children.map((child, i, array) => array[i-1] ? {...child, x: array[i-1].width}: child)
	}
}

const searchNoteGlyphName = (note: Note) => 
	Classes.forTextBasedApplications
		.filter((glyphName) => glyphName.includes("note"))	
		.filter((noteGlyphName) => noteGlyphName.includes(String(calcNoteFraction(note))))
		.filter((fraction) => fraction.includes(String(calcNoteStem(note))))[0]
const searchLegerLineGlyphName = (note: Note) => 
	Ranges.staves.glyphs
		.filter((glyphName) => glyphName.includes("legerLine"))[0]
		// .filter((legerLineGlyphName) =>calcNoteFraction(note))
		// .filter((fraction) => fraction)[0]
const ajustNotePitch = ({pitch}:Note) => pitch - Metadata.midiMiddleC
const calcNoteBasePitch = (note: Note) => ajustNotePitch(note) % Metadata.baseOctaveKeys.length as Metadata["baseOctaveKeys"][number]
const calcNoteAccidental = ({prevNote, pitch}: Note) => !prevNote ? "accidentalSharp": prevNote.pitch < pitch ? "accidentalSharp" : "accidentalFlat";
const calcNoteStem = (note: Note) => ajustNotePitch(note) >= 11 ? "Down" : "Up"
const calcNoteOctave = (note: Note) => Math.trunc(ajustNotePitch(note) / Metadata.baseOctaveKeys.length)
const calcNoteOctaveY = (note: Note) => calcNoteOctave(note) * (Metadata.baseWhiteKeys.length + 1)
const calcNotePosition = (note: Note) =>{
	let pitch =  ajustNotePitch(note)
	const accidental = isNoteAccidental(note) ? calcNoteAccidental(note) : null
	if(accidental === "accidentalSharp") pitch -= 1
	if(accidental === "accidentalFlat") pitch += 1
	return pitch
}
const calcNoteWhiteKeyPosition = (note: Note) => 
	(Metadata.baseWhiteKeys as number[]).indexOf((Metadata.baseOctaveKeys as number[]).indexOf(calcNotePosition(note)));
const calcNoteY = (note:Note) =>  (2 - (calcNoteWhiteKeyPosition(note) + calcNoteOctaveY(note))) * bravuraMetadata.engravingDefaults.thickBarlineThickness
const calcNoteFraction = ({fraction}: Note): Metadata["noteFractions"][number]=> {
	if (fraction === 2) return "Half"
	if (fraction === 4) return "Quarter"
	if (fraction === 8) return "8th"
	if (fraction === 16) return "16th"
	return "Whole"
}
const isNoteAccidental = (note: Note) => !(Metadata.baseWhiteKeys).some((key)=> key===calcNoteBasePitch(note))
const isNoteLegerLine = (note: Note) => 0 === calcNotePosition(note)
