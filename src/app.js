(() => {
  'use strict';
  const S=window.PsalmistStorage, $=id=>document.getElementById(id), clone=x=>structuredClone(x);
  const palette={gold:'#f4dea0',sage:'#d8e5c8',rose:'#f3d6cd',blue:'#d4e6ed'};
  let db,profile,state,pack,entry=null,selected,draft={text:'',highlights:[]},busy=false,failed=false,stale=false;
  let pending=null,chosen=null,lastToday='',calendarTicket=0,preview=null,startBusy=false;
  let persistenceRequested=false;
  const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('psalmist-changes'):null;
  const today=()=>S.dateIn(profile.timeZone);
  const textDirty=()=>draft.text!==(entry?.text||'');
  const marksDirty=()=>S.canonical(draft.highlights)!==S.canonical(entry?.highlights||[]);
  const dirty=()=>!!profile&&(textDirty()||marksDirty());
  const passages=()=>pack.chapters[S.reading(profile,selected).chapter-1].verses.slice(S.reading(profile,selected).first-1,S.reading(profile,selected).last);
  function notice(text,error=false){$('notice').textContent=text;$('notice').classList.toggle('error',error);}
  function controls(){
    const ready=!!profile&&!busy&&!stale,current=!!profile&&selected===today();
    $('today').disabled=!ready;$('response').disabled=!profile||busy;$('response').readOnly=stale;
    $('save').disabled=!ready||(!dirty()&&!failed);
    $('save').textContent=failed?'Retry save':'Save response';
    document.querySelectorAll('.color,#remove,#rangeApply').forEach(b=>b.disabled=!ready||!current);
    $('remove').disabled=!ready||!current||!chosen;
    $('toolbar').hidden=!current;$('rangeTools').hidden=!current;
    $('downloadBackup').disabled=!profile||busy;$('restoreBackup').disabled=!profile||busy;
    $('currentMonth').disabled=!ready;$('lastMonth').disabled=!ready;$('month').disabled=!ready;
    let status='No response saved yet';
    if(busy)status='Saving…';
    else if(stale)status='Journal changed in another tab — review before saving';
    else if(failed)status='Not saved — retry';
    else if(textDirty()&&entry?.highlights.length&&!marksDirty())status='Highlights saved · Response has unsaved changes';
    else if(dirty())status='Unsaved changes';
    else if(entry)status=!entry.text&&!entry.highlights.length?'Saved entry · No text or highlights':'Saved in this browser';
    $('saveStatus').textContent=status;
    $('modified').textContent=profile&&entry?.modified?'Last modified '+new Date(entry.modified).toLocaleString(undefined,{timeZone:profile.timeZone,timeZoneName:'short'}):'';
    if(stale){$('save').disabled=busy;$('save').textContent='Review latest data';}
    document.querySelectorAll('.color').forEach(b=>b.setAttribute('aria-pressed',String(draft.highlights.find(h=>h.id===chosen)?.color===b.dataset.color)));
  }
  function choose(title,message,options){
    return new Promise(resolve=>{
      const dialog=$('choiceDialog');$('choiceTitle').textContent=title;$('choiceMessage').textContent=message;$('choiceActions').replaceChildren();
      let answered=false;const finish=value=>{if(answered)return;answered=true;dialog.close();resolve(value);};
      options.forEach(o=>{const b=document.createElement('button');b.textContent=o.label;b.dataset.choice=o.value;if(o.primary)b.className='primary';b.onclick=()=>finish(o.value);$('choiceActions').append(b);});
      dialog.oncancel=e=>{e.preventDefault();finish(null);};dialog.showModal();$('choiceActions').firstElementChild.focus();
    });
  }
  function announceChange(kind,date){channel?.postMessage({kind,date,generation:state?.generationId});}
  async function persist(command){
    if(busy||stale||!profile)return false;
    busy=true;notice('');controls();
    try{
      const result=await S.save(db,{date:selected,generation:state.generationId,revision:entry?.revision||0,command});
      entry=result.entry;state=result.state;failed=false;
      if(command.type==='highlights')draft.highlights=clone(entry?.highlights||[]);
      else draft.text=entry?.text||'';
      announceChange('save',selected);notice(command.type==='highlights'?'Highlights saved.':'Response saved.');
      if(!persistenceRequested&&navigator.storage?.persist){persistenceRequested=true;navigator.storage.persisted().then(granted=>granted||navigator.storage.persist()).catch(()=>{});}
      return true;
    }catch(e){failed=true;notice('Could not save. '+e.message,true);return false;}
    finally{busy=false;controls();await calendar();}
  }
  async function saveText(){
    if(busy||stale||!profile)return false;
    if(marksDirty()){
      if(selected!==today()){
        const answer=await choose('Unsaved highlights for a past date','These highlight changes cannot be saved now that the date is past. Your written response can still be saved.',[{value:'keep',label:'Keep editing'},{value:'discard',label:'Discard unsaved highlight changes and save text'}]);
        if(answer!=='discard')return false;draft.highlights=clone(entry?.highlights||[]);renderText();
      }else if(!(await persist({type:'highlights',highlights:clone(draft.highlights)})))return false;
    }
    if(!textDirty()){failed=false;controls();return true;}
    return persist({type:'text',text:draft.text});
  }
  async function leaveDraft(){
    if(!dirty())return true;
    const answer=await choose('Unsaved changes','Save your changes before continuing, or explicitly discard them.',[{value:'keep',label:'Keep editing'},{value:'save',label:'Save and continue',primary:true},{value:'discard',label:'Discard changes'}]);
    if(answer==='save')return saveText();
    if(answer==='discard'){draft={text:entry?.text||'',highlights:clone(entry?.highlights||[])};failed=false;render();return true;}
    return false;
  }
  async function calendar(){
    if(!profile||!db)return;
    const value=$('month').value,ticket=++calendarTicket;
    try{
      const rows=await S.month(db,value);if(ticket!==calendarTicket)return;
      const savedDates=new Set(rows.map(e=>e.date)),[year,month]=value.split('-').map(Number),now=today();
      const c=$('calendar');c.replaceChildren();$('monthLabel').textContent=new Date(value+'-01T12:00:00Z').toLocaleDateString(undefined,{month:'long',year:'numeric',timeZone:'UTC'});
      for(const name of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']){const el=document.createElement('span');el.className='dow';el.textContent=name;c.append(el);}
      const first=new Date(value+'-01T12:00:00Z').getUTCDay(),days=new Date(Date.UTC(year,month,0)).getUTCDate();
      for(let i=0;i<first;i++)c.append(document.createElement('span'));
      for(let n=1;n<=days;n++){
        const date=value+'-'+String(n).padStart(2,'0'),exists=savedDates.has(date),isFuture=date>now;
        const accessible=date>=profile.startDate&&!isFuture&&(date===now||exists),b=document.createElement('button');
        b.className='day'+(exists&&!isFuture?' saved':'')+(date===now?' today':'');b.textContent=n;
        b.disabled=busy||stale||!accessible;b.setAttribute('aria-pressed',String(date===selected));
        const label=new Date(date+'T12:00:00Z').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
        b.setAttribute('aria-label',label+(date===now?', today':'')+(exists&&!isFuture?', saved entry':'')+(date===selected?', selected':'')+(!accessible?', unavailable':''));
        b.dataset.date=date;b.onclick=()=>openDate(date,true);c.append(b);
      }
    }catch(e){if(ticket===calendarTicket)notice('The calendar could not be loaded. '+e.message,true);}
  }
  function renderText(){
    const target=$('verses');target.replaceChildren();if(!pack)return;
    for(const v of passages()){
      const number=Number(v.verse),row=document.createElement('div'),n=document.createElement('sup'),span=document.createElement('span');
      row.className='verse';n.textContent=number;span.className='verseText';span.dataset.verse=number;
      let pos=0;const ranges=draft.highlights.flatMap(h=>h.segments.filter(s=>s.verse===number).map(s=>({...s,h}))).sort((a,b)=>a.start-b.start);
      for(const s of ranges){
        span.append(document.createTextNode(v.text.slice(pos,s.start)));const m=document.createElement('mark');m.textContent=v.text.slice(s.start,s.end);m.style.background=palette[s.h.color];m.dataset.highlight=s.h.id;
        const current=selected===today();m.tabIndex=current?0:-1;if(current)m.setAttribute('role','button');
        m.setAttribute('aria-label',s.h.color+' highlight: '+m.textContent+(current?'':', read-only'));m.classList.toggle('selected',chosen===s.h.id);
        m.onclick=()=>{if(!current||busy||stale)return;chosen=s.h.id;pending=null;notice('Selected highlight · '+s.h.color+'. Choose a color or Remove.');renderText();controls();$('verses').querySelector(`[data-highlight="${CSS.escape(chosen)}"]`)?.focus();};
        m.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();m.click();}};span.append(m);pos=s.end;
      }
      span.append(document.createTextNode(v.text.slice(pos)));row.append(n,span);target.append(row);
    }
  }
  function rangeWords(){
    if(!pack)return;const r=S.reading(profile,selected);
    for(const [verseId,wordId] of [['fromVerse','fromWord'],['toVerse','toWord']]){
      const text=pack.chapters[r.chapter-1].verses[Number($(verseId).value)-1]?.text||'',el=$(wordId);el.replaceChildren();
      [...text.matchAll(/\S+/g)].forEach((m,i)=>{const o=document.createElement('option');o.value=i;o.textContent=(i+1)+'. '+m[0];el.append(o);});
    }
  }
  function fillRange(){for(const id of ['fromVerse','toVerse']){$(id).replaceChildren();passages().forEach(v=>{const o=document.createElement('option');o.value=v.verse;o.textContent='Verse '+v.verse;$(id).append(o);});}rangeWords();}
  function render(){
    if(!profile||!selected||!pack)return;const r=S.reading(profile,selected),day=S.day(selected)-S.day(profile.startDate)+1;
    $('dateLabel').textContent=new Date(selected+'T12:00:00Z').toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
    $('dayLabel').textContent='Day '+day+' · Cycle '+(Math.floor((day-1)/171)+1);
    $('readingState').textContent=selected===today()?"Today's reading":'Saved entry · '+selected;
    $('psalmTitle').textContent='Psalm '+r.chapter+(r.part?' · Section '+r.part+' of 22':'');$('verseRange').textContent=r.part?'· Verses '+r.first+'–'+r.last:'';
    $('response').value=draft.text;$('zoneInfo').textContent='Journal time zone: '+profile.timeZone;
    $('highlightHelp').textContent=selected===today()?'Select words, then choose a color. Select a highlight to edit it.':'Highlights are read-only for past dates. You can still edit your response.';
    renderText();fillRange();controls();calendar();
  }
  async function openDate(date,focus=false,skipDraft=false){
    if(busy||!profile||stale)return false;
    if(!skipDraft&&!(await leaveDraft()))return false;
    busy=true;controls();
    try{const loaded=await S.load(db,date);profile=loaded.profile;state=loaded.state;entry=loaded.entry||null;pack=loaded.pack;selected=date;draft={text:entry?.text||'',highlights:clone(entry?.highlights||[])};pending=chosen=null;failed=false;notice('');render();if(focus)$('psalmTitle').focus();return true;}
    catch(e){notice(e.message,true);return false;}finally{busy=false;controls();calendar();}
  }
  async function start(){
    if(startBusy||busy)return;startBusy=true;$('opening').hidden=false;$('appContent').hidden=true;$('opening').querySelector('h1').textContent='Opening your journal…';$('recovery').hidden=true;
    try{
      if(location.protocol==='file:')throw Error('Open Start-Psalmist.cmd to use the journal at its consistent local browser address.');
      if(!window.indexedDB||!crypto.subtle)throw Error('This browser cannot provide the local storage needed by Psalmist.');
      db?.close();db=await S.open({blocked:()=>{$('openingMessage').textContent='Close other Psalmist tabs, then wait for the journal to open.';},changed:()=>{stale=true;controls();notice('The application storage was upgraded. Keep any draft text, then reload.',true);}});
      const initialized=await S.initialize(db);profile=initialized.profile;state=initialized.state;stale=false;
      lastToday=today();const loaded=await S.load(db,lastToday);entry=loaded.entry||null;pack=loaded.pack;selected=lastToday;draft={text:entry?.text||'',highlights:clone(entry?.highlights||[])};
      failed=false;pending=chosen=null;$('month').value=lastToday.slice(0,7);$('opening').hidden=true;$('appContent').hidden=false;render();await history();
    }catch(e){profile=null;entry=null;pack=null;stale=false;$('opening').querySelector('h1').textContent="Your journal couldn't be opened";$('openingMessage').textContent=e.message+'\nSaved data has not been replaced.';$('recovery').hidden=false;$('recoverBackup').disabled=!db;$('today').disabled=true;}
    finally{startBusy=false;}
  }
  function captureSelection(){
    if(!profile||selected!==today()||busy||stale)return;const s=getSelection();if(!s.rangeCount||s.isCollapsed)return;
    const r=s.getRangeAt(0),parent=n=>(n.nodeType===1?n:n.parentElement)?.closest('[data-verse]'),a=parent(r.startContainer),b=parent(r.endContainer);
    if(!a||!b||!$('verses').contains(a)||!$('verses').contains(b)){pending=null;return;}
    const offset=(el,node,n)=>{const p=document.createRange();p.selectNodeContents(el);p.setEnd(node,n);return p.toString().length;};
    const first=Number(a.dataset.verse),last=Number(b.dataset.verse),segments=[],rr=S.reading(profile,selected);
    for(let verse=first;verse<=last;verse++){const text=pack.chapters[rr.chapter-1].verses[verse-1].text,start=verse===first?offset(a,r.startContainer,r.startOffset):0,end=verse===last?offset(b,r.endContainer,r.endOffset):text.length;if(end>start)segments.push({verse,start,end,quote:text.slice(start,end)});}
    pending=segments;chosen=null;
  }
  async function highlight(color,remove=false){
    if(!profile||selected!==today()||busy||stale){notice('Highlights can only be changed for today.');return;}
    const next=clone(draft.highlights),current=next.find(h=>h.id===chosen);
    if(remove){if(!current){notice('Select an existing highlight first.');return;}next.splice(next.indexOf(current),1);}
    else if(current){if(current.color===color)return;current.color=color;}
    else {if(!pending?.length){notice('Select text first, or use Select passage below.');return;}next.push({id:crypto.randomUUID(),color,segments:clone(pending)});}
    try{S.highlights(next,S.reading(profile,selected),pack);}catch(e){notice(e.message+' Choose another passage or edit the existing highlight.',true);return;}
    draft.highlights=next;chosen=pending=null;getSelection().removeAllRanges();renderText();controls();await persist({type:'highlights',highlights:next});
  }
  function applyRange(){
    if(!profile||busy||selected!==today())return;
    const fv=Number($('fromVerse').value),tv=Number($('toVerse').value),fw=Number($('fromWord').value),tw=Number($('toWord').value);
    if(fv>tv||(fv===tv&&fw>tw)){notice('Choose an ending word after the starting word.');return;}
    pending=[];chosen=null;const r=S.reading(profile,selected);
    for(let verse=fv;verse<=tv;verse++){const text=pack.chapters[r.chapter-1].verses[verse-1].text,words=[...text.matchAll(/\S+/g)],start=verse===fv?words[fw].index:0,end=verse===tv?words[tw].index+words[tw][0].length:text.length;pending.push({verse,start,end,quote:text.slice(start,end)});}
    highlight($('rangeColor').value);
  }
  async function history(){try{const value=await S.backupHistory(db);$('backupHistory').textContent='Last backup download initiated: '+(value?new Date(value).toLocaleString(undefined,{timeZone:profile?.timeZone||'UTC',timeZoneName:'short'}):'Never');}catch{$('backupHistory').textContent='Backup download history is unavailable.';}}
  async function download(skipDraft=false){
    if(busy||!db)return false;
    if(!skipDraft&&dirty()){
      const answer=await choose('Backup your journal','The backup includes committed journal data. Your writing has unsaved changes.',[{value:'cancel',label:'Cancel'},{value:'save',label:'Save and download',primary:true},{value:'saved',label:'Download saved data only'}]);
      if(answer==='save'){if(!(await saveText()))return false;}else if(answer!=='saved')return false;
    }
    busy=true;controls();$('backupStatus').textContent='Preparing backup…';
    try{
      const backup=await S.encode(db),blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='psalmist-backup-'+S.dateIn(backup.payload.profile.timeZone)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      $('backupStatus').textContent="Backup download started. Check your browser's downloads.";
      try{await S.backupHistory(db,new Date().toISOString());await history();}catch{$('backupHistory').textContent='Backup download started; download history could not be saved.';}
      return true;
    }catch(e){$('backupStatus').textContent='Backup could not be prepared. '+e.message;return false;}
    finally{busy=false;controls();calendar();}
  }
  async function readBackup(file){
    if(!file||busy||!db)return;busy=true;controls();$('backupStatus').textContent='Checking backup…';
    try{
      if(file.size>25*1024*1024)throw Error('Choose a backup smaller than 25 MiB.');
      const decoded=await S.decode(await file.text());
      const snap=await S.snapshot(db);preview={...decoded,filename:file.name,token:snap.state?S.token(snap.state):null};
      const p=decoded.payload,dates=p.entries.map(e=>e.date);$('restorePreview').replaceChildren();
      const fields=[['File',file.name],['Created',decoded.exportedAt?new Date(decoded.exportedAt).toLocaleString():'Older journal file'],['Start date',p.profile.startDate],['Time zone',p.profile.timeZone],['Saved entries',String(p.entries.length)],['Saved date range',dates.length?dates[0]+' – '+dates[dates.length-1]:'No saved entries'],['Current entries replaced',String(snap.entries.length)]];
      for(const [label,value] of fields){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;$('restorePreview').append(dt,dd);}
      $('restoreDescription').textContent=decoded.legacy?'This older Psalmist journal will be converted to the current format. Original dates, highlights, and saved timestamps will be retained.':'The backup passed version, integrity, and journal validation.';
      $('restoreStatus').textContent='';$('restoreStatus').classList.remove('error');$('backupCurrent').disabled=!snap.profile||!snap.state;
      $('backupStatus').textContent='Backup checked. Review before replacing your journal.';$('restoreDialog').showModal();$('cancelRestore').focus();
    }catch(e){$('backupStatus').textContent=e.message;if(!profile)$('openingMessage').textContent=e.message+' Saved data has not been replaced.';}
    finally{busy=false;controls();}
  }
  async function confirmRestore(){
    if(!preview||busy)return;
    notice('');
    // Resolve drafts before the file chooser, so dialogs never stack.
    busy=true;controls();for(const id of ['confirmRestore','cancelRestore','backupCurrent'])$(id).disabled=true;
    $('restoreStatus').textContent='Restoring your journal…';
    try{
      state=await S.replace(db,preview.payload,preview.token);announceChange('restore');preview=null;$('restoreDialog').close();$('backupStatus').textContent='Journal restored.';
      busy=false;profile=null;await start();if(profile)notice('Journal restored.');
    }catch(e){$('restoreStatus').textContent=e.message;$('restoreStatus').classList.add('error');}
    finally{busy=false;for(const id of ['confirmRestore','cancelRestore','backupCurrent'])$(id).disabled=false;controls();}
  }
  async function selectBackup(){if(busy||!db)return;if(profile&&!(await leaveDraft()))return;$('backupFile').value='';$('backupFile').click();}
  async function externalChange(message){
    if(!profile||busy)return;
    if(message.kind==='restore'||message.date===selected){
      if(dirty()){
        stale=true;controls();notice('The journal changed in another tab. Your draft is still here. Use Review latest data before saving.',true);
        $('save').disabled=false;$('save').textContent='Review latest data';return;
      }
      if(message.kind==='restore')await start();else await openDate(selected,false,true);
    }else await calendar();
  }
  async function reviewLatest(){
    const oldDraft=clone(draft),oldDate=selected,oldGeneration=state.generationId;
    const answer=await choose('Review latest data','Your current draft remains visible. Copy it before discarding, or load the latest saved entry and keep your draft text for comparison.',[{value:'keep',label:'Keep current draft'},{value:'reload',label:'Load latest and keep draft text'}]);
    if(answer!=='reload')return;
    try{
      const snap=await S.snapshot(db);
      if(snap.state.generationId!==oldGeneration){notice('A different journal was restored. Copy your draft text before reloading; it will not be attached to a different reading.',true);return;}
      const loaded=await S.load(db,oldDate);profile=loaded.profile;state=loaded.state;entry=loaded.entry||null;pack=loaded.pack;draft={text:oldDraft.text,highlights:clone(entry?.highlights||[])};stale=false;failed=false;render();notice('Latest saved entry loaded. Your draft text is still in the writing area; review it before saving.');
    }catch(e){notice(e.message,true);}
  }
  function rollover(){
    if(!profile||busy)return;const now=today();if(now===lastToday)return;lastToday=now;pending=chosen=null;
    if(selected!==now){render();notice('A new day has begun. Highlights for this date are now read-only. Use Today\'s reading to continue.'+(marksDirty()?' Unsaved highlight changes remain in view but cannot be saved for a past date.':''));}
    controls();calendar();
  }
  $('response').oninput=()=>{draft.text=$('response').value;controls();};$('save').onclick=()=>stale?reviewLatest():saveText();
  document.querySelectorAll('.color').forEach(b=>{b.onpointerdown=e=>e.preventDefault();b.onclick=()=>highlight(b.dataset.color);});$('remove').onclick=()=>highlight(null,true);
  document.addEventListener('selectionchange',captureSelection);$('verses').addEventListener('pointerup',captureSelection);
  $('fromVerse').onchange=rangeWords;$('toVerse').onchange=rangeWords;$('rangeApply').onclick=applyRange;
  $('month').onchange=calendar;$('currentMonth').onclick=()=>{$('month').value=today().slice(0,7);calendar();};
  $('lastMonth').onclick=()=>{const [y,m]=today().split('-').map(Number);$('month').value=(m===1?y-1:y)+'-'+String(m===1?12:m-1).padStart(2,'0');calendar();};
  $('today').onclick=async()=>{if(await openDate(today(),true)){$('month').value=today().slice(0,7);calendar();}};
  $('downloadBackup').onclick=()=>download();$('restoreBackup').onclick=selectBackup;$('recoverBackup').onclick=selectBackup;
  $('backupFile').onchange=()=>readBackup($('backupFile').files[0]);$('retry').onclick=start;
  $('cancelRestore').onclick=()=>{preview=null;$('restoreDialog').close();$('backupStatus').textContent='Restore canceled. Your saved journal is unchanged.';};$('restoreDialog').oncancel=e=>{if(busy)e.preventDefault();else {preview=null;$('backupStatus').textContent='Restore canceled. Your saved journal is unchanged.';}};
  $('confirmRestore').onclick=confirmRestore;$('backupCurrent').onclick=async()=>{const b=$('backupCurrent');b.disabled=true;await download(true);b.disabled=false;};
  channel&&(channel.onmessage=e=>externalChange(e.data));
  window.addEventListener('beforeunload',e=>{if(dirty()||busy){e.preventDefault();e.returnValue='';}});
  document.addEventListener('visibilitychange',()=>{rollover();if(document.visibilityState==='visible'&&profile&&!busy)checkGeneration();});
  window.addEventListener('focus',()=>{rollover();checkGeneration();});
  async function checkGeneration(){if(!profile||busy||stale)return;try{const snap=await S.status(db,selected);if(snap.state.generationId!==state.generationId)externalChange({kind:'restore'});else if((snap.entry?.revision||0)!==(entry?.revision||0))externalChange({kind:'save',date:selected});}catch(e){notice('Storage could not be checked. '+e.message,true);}}
  setInterval(rollover,1000);start();
})();
