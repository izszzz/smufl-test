import * as R from "remeda";
import Core from "../../core";
import "../../../extensions/int16array/to_float32array.extensions";
import Soundfont2 from "../../files/soundfont2";
// Reference https://github.com/gree/sf2synth.js/blob/master/src/sound_font_synth.js

export class SourceExporter {
  score;
  sf2;
  ctx;
  constructor(
    score: InstanceType<typeof Core.Score>,
    sf2: Soundfont2,
    ctx: AudioContext
  ) {
    this.score = score;
    this.sf2 = sf2;
    this.ctx = ctx;
  }
  export() {
    return this.score.tracks.map((track) => {
      const preset = this.sf2.getPreset(track.preset);
      console.log(preset);
      const sounds = R.pipe(
        preset.presetBags,
        R.map((pbag) =>
          pbag.presetGenerators.map((pgen) =>
            pgen.instrumentBags?.map((ibag) =>
              ibag.instrumentGenerators.map((igen) => {
                if (!igen.sample || !igen.sampleHeader) return null;
                const float32 = igen.sample.toFloat32Array();
                const buffer = this.ctx.createBuffer(
                  1,
                  float32.length,
                  igen.sampleHeader.sampleRate
                );
                buffer.getChannelData(0).set(float32);
                return { buffer, sampleHeader: igen.sampleHeader };
              })
            )
          )
        ),
        R.flat(3),
        R.compact
      );
      return {
        sounds: sounds.map((sound) => {
          const source = this.ctx.createBufferSource();
          source.buffer = sound.buffer;
          if (sound.sampleHeader.loopEnd > sound.sampleHeader.loopStart) {
            const loopStart =
              sound.sampleHeader.loopStart - sound.sampleHeader.start;
            source.loopStart = loopStart / sound.sampleHeader.sampleRate;
            source.loopEnd =
              (sound.sampleHeader.loopEnd - sound.sampleHeader.start) /
              sound.sampleHeader.sampleRate;
            source.loop = true;
          }
          const baseDetune =
            sound.sampleHeader.originalKey -
            sound.sampleHeader.correction / 100.0;
          track.notes.reduce((acc, cur) => {
            source.playbackRate.setValueAtTime(
              1.0 * 2 ** ((100.0 * (cur.pitch - baseDetune)) / 1200.0),
              this.ctx.currentTime +
                Core.convertTimeToSeconds(cur.start, track.getMetadata().bpm)
            );
            acc += cur.start + cur.duration;
            return acc;
          }, 0);
          return source;
        }),
        track,
      };
    });
  }
}
