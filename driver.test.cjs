// Run: node driver.test.cjs <path-to-typescript-module>
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const ts = require(process.argv[2] || 'typescript');
const source = fs.readFileSync(require('path').join(__dirname, 'display.ts'), 'utf8');
let time = 0, worker, writes = [], workers = 0;
const tickEnd = {};
const context = { Math, NumberFormat: {UInt8BE: 0},
 pins: {i2cWriteNumber: (address, value) => writes.push({address, value})},
 control: {waitMicros: () => {}, inBackground: f => {worker=f; workers++;}},
 basic: {pause: () => {throw tickEnd;}}, input: {runningTime: () => time}
};
vm.createContext(context);
vm.runInContext(ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES5}}).outputText, context);
const d = context.display;
function tick(t) {time=t; writes=[]; try {worker();} catch(e) {if(e!==tickEnd) throw e;} return decode(writes);}
function decode(records) {
 const nibbles=[];
 for(let i=1;i<records.length;i++) {
  const prev=records[i-1].value, cur=records[i].value;
  if((prev&4) && !(cur&4)) nibbles.push({n:cur>>4, rs:cur&1});
 }
 const bytes=[];
 for(let i=0;i<nibbles.length;i+=2) {
  assert(nibbles[i+1]); assert.equal(nibbles[i].rs,nibbles[i+1].rs);
  bytes.push({value:(nibbles[i].n<<4)|nibbles[i+1].n,rs:nibbles[i].rs});
 }
 return bytes;
}
function frameText(bytes) {return bytes.filter(x=>x.rs).map(x=>String.fromCharCode(x.value)).join('');}
d.init(0x27);
assert.equal(workers,1);
assert(writes.every(x=>x.address===0x27));
// Four reset nibbles precede full commands.
assert.deepEqual(decode(writes.slice(12)).map(x=>x.value),[0x28,0x08,0x01,0x06,0x0c]);
for(let i=0;i<4;i++) d.writeString('Row '+i,i,100);
let b=tick(0);
assert.deepEqual(b.filter(x=>!x.rs).map(x=>x.value),[0x80,0xc0,0x94,0xd4]);
assert.equal(frameText(b),'Row 0'.padEnd(20)+'Row 1'.padEnd(20)+'Row 2'.padEnd(20)+'Row 3'.padEnd(20));
d.writeString('ABCDEFGHIJKLMNOPQRSTUV',0,100);
d.writeString('abcdefghijklmnopqrstuv',1,200);
tick(0);
assert.equal(tick(999).length,0);
assert.equal(frameText(tick(1000)),'BCDEFGHIJKLMNOPQRSTU'+'bcdefghijklmnopqrstu');
assert.equal(frameText(tick(1100)),'CDEFGHIJKLMNOPQRSTUV');
assert.equal(frameText(tick(1200)),'cdefghijklmnopqrstuv');
assert.equal(tick(2099).length,0);
assert.equal(frameText(tick(2100)),'ABCDEFGHIJKLMNOPQRST');
// Replacing a running message resets its scroll position and removes old characters.
d.writeString('X',1,100);
assert.equal(frameText(tick(2110)),'X'.padEnd(20));
d.writeString('ä',2,100);
assert.equal(frameText(tick(2120)),'?'.padEnd(20));
d.writeString('ignored',4,100);
assert.equal(tick(2130).length,0);
d.clear();
assert.equal(tick(10000).length,0);
writes=[]; d.backlight(false); assert.equal(writes[writes.length-1].value,0);
writes=[]; d.backlight(true); assert.equal(writes[writes.length-1].value,8);
writes=[]; d.init(0x3f); assert(writes.every(x=>x.address===0x3f)); assert.equal(workers,1);
writes=[]; d.init(0x40); assert.equal(writes.length,0);
console.log('PASS: initialization, address, four row offsets, padding, independent scrolling, endpoint delays, replacement, ASCII fallback, bounds, clear, backlight, single worker');
