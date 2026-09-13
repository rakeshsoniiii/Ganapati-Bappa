import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {chapterAt,chapterOpacity,storyBeats} from './dist/timeline.js';
const offsets=Array.from({length:12},(_,i)=>i*1000);
assert.deepEqual(chapterAt(0,offsets,1000),{index:0,local:0});
assert.deepEqual(chapterAt(7499,offsets,1000),{index:7,local:.499});
assert.deepEqual(chapterAt(7000,offsets,1000),{index:7,local:0});
assert.deepEqual(chapterAt(11000,offsets,1000),{index:11,local:0});
assert.equal(chapterOpacity(11,0,false),1);
assert.equal(chapterOpacity(0,0,false),1);
assert.equal(chapterOpacity(5,.999,true),1);
const html=readFileSync('dist/index.html','utf8');
assert.equal((html.match(/class="chapter"/g)||[]).length,12);
for(const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g))assert.ok(existsSync('dist/'+match[1].split('?')[0]),'Missing '+match[1]);
for(const file of ['ganesha.png','kailash.png','visarjan.png','nexis.png'])assert.ok(existsSync('dist/assets/'+file));
console.log('Story boundaries, reverse seeking, credits visibility, and local assets passed.');


assert.ok(existsSync('dist/vendor/Water.js'));
assert.ok(existsSync('dist/assets/waternormals.jpg'));

assert.equal(storyBeats(0).flight,0);
assert.equal(storyBeats(.48).flight,1);
assert.equal(storyBeats(.7).fall,1);
assert.equal(storyBeats(.5).restore,1);
assert.equal(storyBeats(.68).dive,1);
assert.equal(storyBeats(.1).impact,0);
console.log('Throw, impact, restoration, dive and reverse-scroll reset beats passed.');
