import { UPPER_ARCH, LOWER_ARCH, archExtent, layoutWidths } from '../src/model/arch.js';
import { TOOTH_SPECS } from '../src/model/tooth.js';
console.log('extentU', archExtent('U').toFixed(1), 'extentL', archExtent('L').toFixed(1));
for (const s of [0, 10, 20, 30, 40, 50, 60, 65, 70]) { const a = UPPER_ARCH.at(s), b = LOWER_ARCH.at(s); console.log(s, 'U', a.x.toFixed(1), a.z.toFixed(1), 'L', b.x.toFixed(1), b.z.toFixed(1), 'n', a.nx.toFixed(2), a.nz.toFixed(2)); }
const pos = layoutWidths([1,2,3,4,5,6,7,8].map(p => TOOTH_SPECS['L'+p].md));
console.log('lower centres', pos.map(p => p.toFixed(1)).join(' '));
const posU = layoutWidths([1,2,3,4,5,6,7,8].map(p => TOOTH_SPECS['U'+p].md));
console.log('upper centres', posU.map(p => p.toFixed(1)).join(' '));
