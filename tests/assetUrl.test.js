import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assetUrl} from '../src/assetUrl.js';
test('local media paths respect the Pages subpath without rewriting external media',()=>{
 assert.equal(assetUrl('/resources/phonics.mp4','/AC/'),'/AC/resources/phonics.mp4');
 assert.equal(assetUrl('/resources/audio-0.svg','/'),'/resources/audio-0.svg');
 assert.equal(assetUrl('/avatars/kk.png','/AC'),'/AC/avatars/kk.png');
 for(const value of ['https://example.com/a.mp4','data:image/png;base64,abc','blob:abc','/AC/resources/a.wav',undefined]) assert.equal(assetUrl(value,'/AC/'),value);
});
