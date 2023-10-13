import Note from "./note";

interface BarConstructorArgs{
	notes: Note[]
	timeSignature?: [number, number]
}

class Bar implements BarConstructorArgs{
	notes
	timeSignature
	prevBar?: Bar;
	nextBar?: Bar;
	constructor({notes, timeSignature}: BarConstructorArgs){
		this.notes = notes
		this.timeSignature = timeSignature
	}
}

export default Bar