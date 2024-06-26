import path from "path";
import Core from "../../../models/smufl/core";

export const importCore = async (fileName: string) =>
  new Core.Importer(
    await import(
      path.join("..", "..", "..", "fixtures", "core", `${fileName}.json`)
    )
  ).import();
