// Narration for the demo video: video/script.json -> video/vo/<id>.mp3 (+ durations in video/vo/durations.json)
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

const lines = JSON.parse(fs.readFileSync('video/script.json', 'utf8'));
fs.mkdirSync('video/vo', { recursive: true });
const voice = process.env.VOICE || 'zh-CN-YunjianNeural';

for (const l of lines) {
  const out = `video/vo/${l.id}.mp3`;
  if (fs.existsSync(out)) continue;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const dir = `video/vo/_${l.id}`; fs.mkdirSync(dir, { recursive: true });
      const res = await tts.toFile(dir, l.zh, { rate: '-4%', pitch: '-2Hz' });
      fs.renameSync(res.audioFilePath, out);
      fs.rmSync(dir, { recursive: true, force: true });
      console.log('ok', l.id); break;
    } catch (e) { console.log('retry', l.id, e.message); await new Promise(r => setTimeout(r, 1500)); }
  }
}

// durations via ffmpeg
const durations = {};
for (const l of lines) {
  const r = spawnSync(ffmpeg.path, ['-i', `video/vo/${l.id}.mp3`, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = [...r.stderr.matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)].pop();
  durations[l.id] = m ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : 4;
}
fs.writeFileSync('video/vo/durations.json', JSON.stringify(durations, null, 2));
console.log(durations);
process.exit(0);
