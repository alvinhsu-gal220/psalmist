const {chromium}=require('C:/Users/alvin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/alvin/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe'});
 const context=await browser.newContext({timezoneId:'America/Los_Angeles'}),page=await context.newPage();
 await page.clock.install({time:new Date('2026-10-13T18:00:00Z')});
 await page.goto('http://localhost:8765/psalmist.html');await page.locator('#appContent').waitFor({state:'visible'});
 await page.locator('#response').fill('Committed response');await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved in this browser');
 await page.evaluate(()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='calendar')throw new DOMException('Injected quota failure','QuotaExceededError');return originalPut.apply(this,args);};});
 await page.locator('#response').fill('Draft retained after quota failure');await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Not saved — retry');assert.equal(await page.locator('#response').inputValue(),'Draft retained after quota failure');
 const old=await page.evaluate(async()=>{IDBObjectStore.prototype.put=originalPut;const d=await PsalmistStorage.open(),v=await PsalmistStorage.snapshot(d),cal=await PsalmistStorage.month(d,'2026-10');d.close();return {...v,cal};});assert.equal(old.entries[0].text,'Committed response');assert.equal(old.cal[0].modified,old.entries[0].modified);
 await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved in this browser');
 console.log('PASS injected quota/save failure rolls back entry and calendar, preserves draft, retry succeeds');
 await page.evaluate(async()=>{
   const S=PsalmistStorage,d=await S.open(),before=await S.snapshot(d),encoded=await S.encode(d),validated=await S.decode(JSON.stringify(encoded));validated.payload.entries[0].text='Must not commit';
   const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='calendar')throw new DOMException('Injected restore failure','QuotaExceededError');return original.apply(this,args);};
   let failed=false;try{await S.replace(d,validated.payload,S.token(before.state));}catch{failed=true;}finally{IDBObjectStore.prototype.put=original;}
   const after=await S.snapshot(d);if(!failed||S.canonical(before)!==S.canonical(after))throw Error('Restore did not roll back');d.close();
 });
 console.log('PASS restore failure after clear rolls back the complete saved dataset');
 const second=await context.newPage();await second.clock.install({time:new Date('2026-10-13T18:00:00Z')});await second.goto('http://localhost:8765/psalmist.html');await second.locator('#appContent').waitFor({state:'visible'});
 await page.locator('#response').fill('Unsaved first-tab draft');await second.locator('#response').fill('Second-tab update');await second.locator('#save').click();await second.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved in this browser');
 await page.waitForFunction(()=>document.querySelector('#save').textContent==='Review latest data');assert.equal(await page.locator('#response').inputValue(),'Unsaved first-tab draft');assert.equal(await page.locator('#response').getAttribute('readonly'),'');
 await page.locator('#save').click();await page.locator('[data-choice=reload]').click();await page.waitForFunction(()=>!document.querySelector('#response').readOnly);assert.equal(await page.locator('#response').inputValue(),'Unsaved first-tab draft');
 console.log('PASS real two-tab conflict notification, draft preservation, explicit review/rebase');await second.close();
 // Discard local draft explicitly through the existing navigation dialog.
 await page.locator('#today').click();await page.locator('[data-choice=discard]').click();await page.waitForFunction(()=>document.querySelector('#response').value==='Second-tab update');
 await page.locator('#rangeTools summary').click();await page.locator('#rangeApply').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent==='Highlights saved.');
 await page.clock.setSystemTime(new Date('2026-10-14T07:00:01Z'));await page.clock.runFor(1200);
 assert.equal(await page.locator('#toolbar').isVisible(),false);assert.match(await page.locator('#readingState').innerText(),/saved entry/i);assert.match(await page.locator('#notice').innerText(),/new day/);
 await page.evaluate(async()=>{const S=PsalmistStorage,d=await S.open(),snap=await S.snapshot(d),old=snap.entries[0];let rejected=false;try{await S.save(d,{date:old.date,generation:snap.state.generationId,revision:old.revision,command:{type:'highlights',highlights:[]}});}catch{rejected=true;}if(!rejected)throw Error('Past highlights accepted');let futureRejected=false;try{await S.load(d,'2026-10-15');}catch{futureRejected=true;}if(!futureRejected)throw Error('Future reading opened');d.close();});
 console.log('PASS midnight rollover updates reading state, locks past highlights, rejects future access');
 await context.close();
 const migrationContext=await browser.newContext(),migration=await migrationContext.newPage();await migration.goto('http://localhost:8765/psalmist.html');await migration.locator('#appContent').waitFor({state:'visible'});
 await migration.locator('#response').fill('Migration fixture');await migration.locator('#save').click();await migration.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Saved in this browser');
 await migration.evaluate(async()=>{
   const S=PsalmistStorage,d=await S.open(),snap=await S.snapshot(d);d.close();
   await new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase('psalmist');r.onsuccess=resolve;r.onerror=()=>reject(r.error);});
   await new Promise((resolve,reject)=>{const r=indexedDB.open('psalmist',1);r.onupgradeneeded=()=>{const db=r.result,tx=r.transaction;for(const [n,k]of [['profiles','id'],['entries','date'],['textPacks','id'],['meta','key']])db.createObjectStore(n,{keyPath:k});tx.objectStore('profiles').put(snap.profile);tx.objectStore('meta').put(snap.state);snap.entries.forEach(e=>tx.objectStore('entries').put(e));snap.textPacks.forEach(p=>tx.objectStore('textPacks').put(p));};r.onerror=()=>reject(r.error);r.onsuccess=()=>{r.result.close();resolve();};});
 });
 await migration.reload();await migration.locator('#appContent').waitFor({state:'visible'});assert.equal(await migration.locator('#response').inputValue(),'Migration fixture');assert.equal(await migration.locator('#calendar .saved').count(),1);
 console.log('PASS real version-1 to version-2 migration preserves journal and rebuilds calendar index');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
