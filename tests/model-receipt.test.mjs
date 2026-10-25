import test from 'node:test';import assert from 'node:assert/strict';import {modelReceipt} from '../app/model-receipt.mjs';
test('receipt records contributors, failures and adapter; skips unused models',()=>{
 const p={model:'captioner',identity:'weights@sha',checkpoint:'org/model@revision',adapter:'adapter@digest',family:'family',status:'complete',input_assets:['rgb'],seconds:2};
 const rows=modelReceipt([{...p,role:'first'},{...p,role:'master',seconds:3},{model:'unused',status:'skipped'},{model:'broken',role:'thermal',status:'failed',seconds:1}]);
 assert.equal(rows.length,2);assert.equal(rows[0].completed,2);assert.equal(rows[0].seconds,5);assert.deepEqual(rows[0].roles,['first','master']);assert.deepEqual(rows[0].assets,['rgb']);assert.equal(rows[0].adapter,'adapter@digest');assert.equal(rows[1].completed,0);assert.equal(rows[1].failed,1);
});
