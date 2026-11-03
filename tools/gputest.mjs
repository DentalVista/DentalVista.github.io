import puppeteer from 'puppeteer-core';
for (const args of [['--enable-gpu','--ignore-gpu-blocklist','--use-angle=d3d11'], ['--use-angle=swiftshader','--enable-unsafe-swiftshader']]) {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: [...args, '--no-sandbox'] });
  const p = await b.newPage();
  const info = await p.evaluate(() => { const c = document.createElement('canvas'); const gl = c.getContext('webgl2'); if (!gl) return 'no webgl2'; const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); });
  console.log(args[0], '=>', info);
  await b.close();
}
