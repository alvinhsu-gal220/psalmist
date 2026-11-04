const {chromium}=require('C:/Users/alvin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),path=require('node:path');
const executablePath='C:/Users/alvin/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe';
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath});
  try{
    const context=await browser.newContext({timezoneId:'America/Los_Angeles',viewport:{width:1440,height:1100}});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.clock.install({time:new Date('2026-11-04T20:00:00Z')});
    await page.goto('http://localhost:8765/psalmist.html');await page.locator('#appContent').waitFor({state:'visible'});
    await page.evaluate(async()=>{
      const S=PsalmistStorage,d=await S.open(),snap=await S.snapshot(d);
      const fixture={format:'psalmist',version:1,translation:'KJV',textVersion:'aruljohn-kjv-2026-09-24',startDate:'2026-11-01',timeZone:'America/Los_Angeles',preferences:{},entries:{
        '2026-11-01':{text:'A quiet thought.\n\nThere is room to slow down, to notice the words I have hurried past, and to trust that this ordinary day is held with care.\n\nI want to carry a little of that stillness into the conversations ahead.\n\n<script>not executable</script>',reading:{chapter:1,part:null},modified:'2026-11-01T20:00:00.000Z',highlights:[{id:'old-mark',color:'gold',segments:[{verse:1,start:0,end:12}]}]},
        '2026-11-02':{text:'',reading:{chapter:2,part:null},modified:'2026-11-02T20:00:00.000Z',highlights:[{id:'mark-only',color:'sage',segments:[{verse:1,start:0,end:8}]}]},
        '2026-11-03':{text:'',reading:{chapter:3,part:null},modified:'2026-11-03T20:00:00.000Z',highlights:[]}
      }};
      const decoded=await S.decode(JSON.stringify(fixture));await S.replace(d,decoded.payload,S.token(snap.state));d.close();
    });
    await page.reload();await page.locator('#appContent').waitFor({state:'visible'});
    const snap=()=>page.evaluate(async()=>{const d=await PsalmistStorage.open();try{return await PsalmistStorage.snapshot(d);}finally{d.close();}});
    const open=async date=>{if(await page.locator('#yourDays').isVisible())await page.locator('#yourDays').click();await page.locator(`[data-date="${date}"]`).click();await page.waitForFunction(date=>document.querySelector('#readingState').textContent.endsWith(date),date);};
    await open('2026-11-01');
    assert.equal(await page.locator('#toggleScripture').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('#toggleSidebar').getAttribute('aria-expanded'),'false');
    assert.equal(await page.locator('#response').isVisible(),false);
    assert.match(await page.locator('#responseRead').innerText(),/<script>not executable<\/script>/);
    assert.equal(await page.locator('#responseRead script').count(),0);
    assert.equal(await page.locator('#toolbar').isVisible(),false);
    await page.screenshot({path:path.join(__dirname,'past-entry-default.png'),fullPage:true});
    const original=await snap(),initialWidth=(await page.locator('#responsePanel').boundingBox()).width;
    await page.locator('#toggleScripture').click();assert((await page.locator('#responsePanel').boundingBox()).width>initialWidth);
    await page.locator('#toggleSidebar').click();await page.locator('#toggleScripture').click();
    await page.screenshot({path:path.join(__dirname,'past-entry-expanded.png'),fullPage:true});
    await page.locator('#toggleSidebar').click();assert.deepEqual((await snap()).entries,original.entries);
    console.log('PASS past entry reads first; safe plain text; independent panel states do not write data');

    const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
    const {root}=await cdp.send('DOM.getDocument');
    for(const selector of ['#responseRead','#response']){
      if(selector==='#response'){await page.locator('#editResponse').click();assert.equal(await page.locator('#save').isDisabled(),true);}
      const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});
      const fonts=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
      if(selector==='#responseRead')assert(fonts.fonts.some(f=>f.familyName==='Ink Free'),'Ink Free display glyphs missing');
      else{
        // Chromium does not expose native textarea shadow glyphs through this node.
        assert.match(await page.locator(selector).evaluate(e=>getComputedStyle(e).fontFamily),/Ink Free/);
        await page.screenshot({path:path.join(__dirname,'past-entry-editing.png'),fullPage:true});
      }
    }
    await cdp.detach();
    await page.locator('#response').fill('Discard this edit');await page.locator('#toggleScripture').click();await page.locator('#toggleSidebar').click();
    assert.equal(await page.locator('#response').inputValue(),'Discard this edit');await page.locator('#cancelResponse').click();
    assert.deepEqual((await snap()).entries,original.entries);
    await page.locator('#editResponse').click();await page.locator('#response').fill('A real past-entry edit');
    await page.evaluate(()=>{window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='calendar')throw new DOMException('Injected save failure','QuotaExceededError');return originalPut.apply(this,args);};});
    await page.locator('#save').click();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Not saved — retry');
    assert.equal(await page.locator('#response').inputValue(),'A real past-entry edit');assert(await page.locator('#notice').isVisible());
    assert.deepEqual((await snap()).entries,original.entries);
    await page.evaluate(()=>{IDBObjectStore.prototype.put=originalPut;});await page.locator('#save').click();await page.locator('#editResponse').waitFor({state:'visible'});
    let saved=await snap();assert.equal(saved.entries.length,3);assert.equal(saved.entries[0].text,'A real past-entry edit');assert.deepEqual(saved.entries[0].highlights,original.entries[0].highlights);
    assert.notEqual(saved.entries[0].modified,original.entries[0].modified);assert.equal(saved.entries.some(e=>e.date==='2026-11-04'),false);
    await page.locator('#editResponse').click();await page.locator('#response').fill('');await page.locator('#save').click();await page.locator('#editResponse').waitFor({state:'visible'});
    assert.equal((await snap()).entries[0].text,'');
    await open('2026-11-02');assert(await page.locator('#editResponse').isVisible());assert.equal(await page.locator('mark').count(),1);
    await open('2026-11-03');assert.equal(await page.locator('mark').count(),0);assert.match(await page.locator('#saveStatus').innerText(),/No text or highlights/);
    console.log('PASS edit/cancel/no-op, failed-save rollback/retry, original-date save and preserved marks; empty and highlights-only entries');

    await page.locator('#editResponse').click();await page.locator('#response').fill('Save during navigation');await page.locator('#today').click();
    await page.locator('[data-choice=keep]').click();assert.equal(await page.locator('#response').inputValue(),'Save during navigation');
    await page.locator('#today').click();await page.locator('[data-choice=save]').click();await page.waitForFunction(()=>document.querySelector('#readingState').textContent==="Today's reading");
    assert.equal((await snap()).entries[2].text,'Save during navigation');assert(await page.locator('#response').isVisible());
    await page.locator('#response').fill('A draft across midnight');await page.clock.setSystemTime(new Date('2026-11-05T08:00:01Z'));await page.clock.runFor(1200);
    assert.equal(await page.locator('#journalLayout').getAttribute('data-view'),'past');assert.equal(await page.locator('#response').inputValue(),'A draft across midnight');assert(await page.locator('#response').isVisible());
    await page.locator('#today').click();await page.locator('[data-choice=discard]').click();await page.waitForFunction(()=>document.querySelector('#readingState').textContent==="Today's reading");
    await open('2026-11-01');
    console.log('PASS navigation keep/save/discard and midnight preserves editor while locking highlights');

    await page.locator('#editResponse').click();await page.locator('#response').fill('My past draft');
    const second=await context.newPage();await second.clock.install({time:new Date('2026-11-05T20:00:00Z')});await second.goto('http://localhost:8765/psalmist.html');await second.locator('#appContent').waitFor({state:'visible'});
    await second.locator('[data-date="2026-11-01"]').click();await second.locator('#editResponse').click();await second.locator('#response').fill('Saved in another tab');await second.locator('#save').click();
    await page.waitForFunction(()=>document.querySelector('#save').textContent==='Review latest data');assert.equal(await page.locator('#response').inputValue(),'My past draft');
    await page.locator('#save').click();await page.locator('[data-choice=reload]').click();await page.waitForFunction(()=>!document.querySelector('#response').readOnly);
    assert.equal(await page.locator('#response').inputValue(),'My past draft');await page.locator('#cancelResponse').click();assert.equal(await page.locator('#responseRead').innerText(),'Saved in another tab');
    await second.close();console.log('PASS real past-entry two-tab conflict preserves draft and Cancel restores latest committed text');

    for(const width of [320,390,768,1024,1440]){
      await page.setViewportSize({width,height:1000});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Overflow '+width);
      if(width<=850){
        await page.locator('#toggleScripture').click();assert(await page.locator('#panelDialog').isVisible());assert(await page.locator('#psalmTitle').isVisible());
        await page.keyboard.press('Escape');assert.equal(await page.locator('#panelDialog').isVisible(),false);assert.equal(await page.locator('#toggleScripture').evaluate(e=>e===document.activeElement),true);
        await page.locator('#yourDays').click();assert(await page.locator('#calendar').isVisible());
        const cells=await page.locator('#calendar .day').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().width));assert(Math.min(...cells)>=43,'Calendar touch width');
        await page.locator('#closePanel').click();assert.equal(await page.locator('#sidebarContent').isVisible(),false);
        if(width===390){
          await page.locator('#editResponse').click();await page.locator('#response').fill('A long response. '.repeat(700));
          await page.locator('#yourDays').click();await page.locator('[data-date="2026-11-02"]').click();await page.locator('[data-choice=keep]').waitFor({state:'visible'});
          assert.equal(await page.locator('#panelDialog').isVisible(),false);await page.locator('[data-choice=keep]').click();assert.equal(await page.locator('#response').inputValue(),'A long response. '.repeat(700));
          await page.locator('#cancelResponse').click();
          await page.locator('#sidebarRail [data-section="backupTitle"]').click();await page.locator('#restoreBackup').click();
          await page.locator('#backupFile').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});
          await page.waitForFunction(()=>document.querySelector('#notice').classList.contains('error'));assert(await page.locator('#notice').isVisible());
          assert.equal(await page.locator('#panelDialog').isVisible(),false);
          await page.screenshot({path:path.join(__dirname,'past-entry-mobile.png'),fullPage:true});
        }
      }
    }
    await page.setViewportSize({width:1440,height:1100});
    if(await page.locator('#toggleScripture').getAttribute('aria-expanded')==='false')await page.locator('#toggleScripture').click();
    await page.screenshot({path:path.join(__dirname,'past-entry-after-navigation.png'),fullPage:true});
    const font=await page.locator('#responseRead').evaluate(e=>({family:getComputedStyle(e).fontFamily,size:getComputedStyle(e).fontSize,available:document.fonts.check('24px "Ink Free"')}));
    assert.match(font.family,/Ink Free/);assert.equal(font.size,'24px');assert(font.available);
    assert.deepEqual(errors,[]);console.log('PASS five responsive widths, modal drawer Escape/focus, calendar targets and Ink Free font availability');
    await context.close();
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
