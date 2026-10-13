/* Browser-local Psalmist repository. Every mutation commits atomically. */
(() => {
  'use strict';
  const NAME = 'psalmist', VERSION = 2, FORMAT = 'psalmist-backup';
  const colors = new Set(['gold', 'sage', 'rose', 'blue']);
  const corpus = JSON.parse(document.getElementById('bible').textContent).chapters;
  const sequence = [];
  for (let chapter = 1; chapter <= 150; chapter++) {
    const count = chapter === 119 ? 22 : 1;
    for (let i = 1; i <= count; i++) sequence.push({
      chapter, part: chapter === 119 ? i : null,
      first: chapter === 119 ? (i - 1) * 8 + 1 : 1,
      last: chapter === 119 ? i * 8 : corpus[chapter - 1].verses.length,
      id: chapter === 119 ? `p119-s${String(i).padStart(2, '0')}` : `p${String(chapter).padStart(3, '0')}`
    });
  }
  const clone = x => structuredClone(x);
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = o => !!o && typeof o === 'object' && !Array.isArray(o);
  function assert(condition, message) { if (!condition) throw Error(message); }
  function dateIn(zone, instant = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(instant);
    return ['year', 'month', 'day'].map(k => parts.find(p => p.type === k).value).join('-');
  }
  const day = d => Date.parse(d + 'T00:00:00Z') / 86400000;
  function validDate(d) {
    return typeof d === 'string' && /^[1-9]\d{3}-\d{2}-\d{2}$/.test(d) && Number.isFinite(day(d)) && new Date(day(d)*86400000).toISOString().slice(0,10) === d;
  }
  function reading(profile, date) {
    assert(validDate(date) && date >= profile.startDate, 'This date is before your journal began.');
    return sequence[(day(date) - day(profile.startDate)) % 171];
  }
  function token(s) { return s.generationId + ':' + s.changeSeq; }
  function summary(e) { return {date:e.date, readingId:e.readingId, hasText:!!e.text.trim(), highlightCount:e.highlights.length, modified:e.modified}; }
  function canonical(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    return '{' + Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',') + '}';
  }
  async function digest(value) {
    const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)));
    return Array.from(new Uint8Array(result)).map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  function transaction(db, names, mode, body) {
    return new Promise((resolve, reject) => {
      let tx;
      try { tx = db.transaction(names, mode); } catch (e) { reject(e); return; }
      let result, failure;
      const guard = fn => (...args) => { try { fn(...args); } catch(e) { failure=e; tx.abort(); } };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure || tx.error || Error('The storage operation was interrupted.'));
      guard(() => body(tx, guard, value => { result=value; }))();
    });
  }
  function readAll(tx, guard, requests, finish) {
    const values={}; let remaining=Object.keys(requests).length;
    for (const [key, req] of Object.entries(requests)) req.onsuccess=guard(()=>{
      values[key]=req.result; if (--remaining===0) finish(values);
    });
  }
  function open({blocked=()=>{}, changed=()=>{}}={}) {
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(NAME,VERSION); let migrationError;
      req.onupgradeneeded=event=>{
        const db=req.result, tx=req.transaction;
        try {
          if(event.oldVersion<1) {
            for(const [name,keyPath] of [['profiles','id'],['entries','date'],['textPacks','id'],['meta','key']]) db.createObjectStore(name,{keyPath});
          }
          if(event.oldVersion<2) {
            const calendar=db.createObjectStore('calendar',{keyPath:'date'}), entries=tx.objectStore('entries');
            entries.createIndex('byReading',['readingId','date']);
            entries.createIndex('byModified',['modified','date']);
            const cursor=entries.openCursor();
            cursor.onsuccess=()=>{try{const c=cursor.result;if(!c)return;calendar.put(summary(c.value));c.continue();}catch(e){migrationError=e;tx.abort();}};
          }
        } catch(e) { migrationError=e;tx.abort(); }
      };
      req.onblocked=blocked;
      req.onerror=()=>reject(migrationError||req.error);
      req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();changed();};db.onclose=changed;resolve(db);};
    });
  }
  async function bundledPack() {
    const pack={id:'aruljohn-kjv-2026-09-24',translation:'KJV',canonicalization:'verse-text-v1',chapters:clone(corpus)};
    return {...pack,contentHash:await digest(pack)};
  }
  async function initialize(db) {
    // Detection and hashing occur before the transaction; existence is checked again inside it.
    const existing=await transaction(db,['profiles','meta'],'readonly',(tx,g,set)=>readAll(tx,g,{profile:tx.objectStore('profiles').get('local'),state:tx.objectStore('meta').get('state')},set));
    if(existing.profile) {assert(existing.state,'Your journal settings need recovery.');return existing;}
    assert(!existing.state,'Your existing journal settings could not be loaded. Restore a backup.');
    const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;
    assert(typeof zone==='string' && zone,'Your browser time zone could not be detected.');
    const pack=await bundledPack();
    const profile={id:'local',startDate:dateIn(zone),timeZone:zone,sequenceId:'psalms-171-v1',textPackId:pack.id,preferences:{}};
    return transaction(db,['profiles','meta','entries','textPacks'],'readwrite',(tx,g,set)=>readAll(tx,g,{
      profile:tx.objectStore('profiles').get('local'),state:tx.objectStore('meta').get('state'),count:tx.objectStore('entries').count(),packCount:tx.objectStore('textPacks').count()
    },v=>{
      if(v.profile){assert(v.state,'Your journal settings need recovery.');set(v);return;}
      assert(!v.state && v.count===0 && v.packCount===0,'Existing journal data needs recovery; it has not been replaced.');
      const state={key:'state',generationId:crypto.randomUUID(),changeSeq:0};
      tx.objectStore('profiles').put(profile);tx.objectStore('textPacks').put(pack);tx.objectStore('meta').put(state);
      set({profile,state});
    }));
  }
  function load(db,date) {
    return transaction(db,['profiles','meta','entries','textPacks'],'readonly',(tx,g,set)=>readAll(tx,g,{
      profile:tx.objectStore('profiles').get('local'),state:tx.objectStore('meta').get('state'),entry:tx.objectStore('entries').get(date)
    },v=>{
      assert(v.profile&&v.state,'Your journal could not be loaded.');
      const now=dateIn(v.profile.timeZone);
      assert(date<=now && date>=v.profile.startDate && (date===now||v.entry),'This date is unavailable.');
      const r=reading(v.profile,date);
      assert(!v.entry||v.entry.readingId===r.id,'The saved reading does not match its date.');
      const req=tx.objectStore('textPacks').get(v.entry?.textPackId||v.profile.textPackId);
      req.onsuccess=g(()=>{assert(req.result,'The reading text is unavailable. Restore a complete backup.');set({...v,pack:req.result,reading:r});});
    }));
  }
  function month(db,value) {
    assert(/^\d{4}-(0[1-9]|1[0-2])$/.test(value),'Choose a valid month.');
    return transaction(db,['calendar'],'readonly',(tx,g,set)=>{
      const req=tx.objectStore('calendar').getAll(IDBKeyRange.bound(value+'-01',value+'-31'));
      req.onsuccess=g(()=>set(req.result));
    });
  }
  function highlights(values,r,pack) {
    assert(Array.isArray(values)&&values.length<=2000,'Too many highlights.');
    const result=[],ids=new Set(),ranges=[];
    for(const h of values) {
      assert(object(h)&&typeof h.id==='string'&&h.id.length>0&&h.id.length<=100&&!ids.has(h.id)&&colors.has(h.color)&&Array.isArray(h.segments)&&h.segments.length>0&&h.segments.length<=176,'A highlight is invalid.');
      ids.add(h.id);
      const segments=h.segments.map(s=>{
        assert(object(s)&&Number.isInteger(s.verse)&&s.verse>=r.first&&s.verse<=r.last,'A highlight is outside this reading.');
        const text=pack.chapters[r.chapter-1].verses[s.verse-1].text;
        assert(Number.isInteger(s.start)&&Number.isInteger(s.end)&&s.start>=0&&s.end>s.start&&s.end<=text.length,'A highlight has invalid text offsets.');
        assert(s.quote===text.slice(s.start,s.end),'A highlight does not match its original text.');
        if(Intl.Segmenter){const boundaries=new Set([0,text.length,...Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(text),x=>x.index)]);assert(boundaries.has(s.start)&&boundaries.has(s.end),'Select complete characters for a highlight.');}
        const segment={verse:s.verse,start:s.start,end:s.end,quote:s.quote};ranges.push(segment);return segment;
      });
      result.push({id:h.id,color:h.color,segments});
    }
    ranges.sort((a,b)=>a.verse-b.verse||a.start-b.start);
    for(let i=1;i<ranges.length;i++)assert(ranges[i].verse!==ranges[i-1].verse||ranges[i].start>=ranges[i-1].end,'This selection overlaps an existing highlight.');
    return result;
  }
  function save(db,{date,generation,revision,command}) {
    return transaction(db,['profiles','meta','entries','calendar','textPacks'],'readwrite',(tx,g,set)=>readAll(tx,g,{
      profile:tx.objectStore('profiles').get('local'),state:tx.objectStore('meta').get('state'),entry:tx.objectStore('entries').get(date)
    },v=>{
      assert(v.profile&&v.state,'Your journal could not be loaded.');
      assert(v.state.generationId===generation,'The journal was restored in another tab. Your draft is still here. Reload before saving.');
      assert((v.entry?.revision||0)===revision,'This entry changed in another tab. Your draft is still here.');
      const r=reading(v.profile,date),packId=v.entry?.textPackId||v.profile.textPackId;
      const req=tx.objectStore('textPacks').get(packId);
      req.onsuccess=g(()=>{
        const now=dateIn(v.profile.timeZone);
        assert(date<=now&&(date===now||v.entry),'Missed and future dates cannot be saved.');
        assert(!v.entry||v.entry.readingId===r.id,'The entry has a different scheduled reading.');
        assert(req.result,'The original reading text is missing.');
        const stamp=new Date().toISOString();
        const next=clone(v.entry||{date,text:'',highlights:[],reading:{chapter:r.chapter,part:r.part},readingId:r.id,textPackId:packId,revision:0,createdAt:stamp});
        if(command.type==='text'){assert(typeof command.text==='string'&&command.text.length<=1000000,'The response is too large.');next.text=command.text;}
        else if(command.type==='highlights'){assert(date===now,'Past highlights are read-only.');next.highlights=highlights(command.highlights,r,req.result);}
        else throw Error('Unknown save operation.');
        if(!v.entry&&!next.text.trim()&&!next.highlights.length){set({entry:null,state:v.state});return;}
        if(v.entry&&next.text===v.entry.text&&canonical(next.highlights)===canonical(v.entry.highlights)){set({entry:v.entry,state:v.state});return;}
        next.modified=stamp;next.revision++;
        const state={...v.state,changeSeq:v.state.changeSeq+1};
        tx.objectStore('entries').put(next);tx.objectStore('calendar').put(summary(next));tx.objectStore('meta').put(state);
        set({entry:next,state});
      });
    }));
  }
  function snapshot(db) {
    return transaction(db,['profiles','meta','entries','textPacks'],'readonly',(tx,g,set)=>readAll(tx,g,{
      profile:tx.objectStore('profiles').get('local'),state:tx.objectStore('meta').get('state'),entries:tx.objectStore('entries').getAll(),textPacks:tx.objectStore('textPacks').getAll()
    },set));
  }
  function status(db,date) {
    return transaction(db,['meta','entries'],'readonly',(tx,g,set)=>readAll(tx,g,{state:tx.objectStore('meta').get('state'),entry:tx.objectStore('entries').get(date)},set));
  }
  function validStamp(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(Date.parse(s)).toISOString().slice(0,10)===s.slice(0,10);}
  async function validatePayload(payload) {
    assert(object(payload)&&object(payload.profile)&&Array.isArray(payload.entries)&&payload.entries.length<=20000&&Array.isArray(payload.textPacks)&&payload.textPacks.length>0&&payload.textPacks.length<=20,'The backup has an invalid journal structure.');
    const p=payload.profile;
    assert(p.id==='local'&&validDate(p.startDate)&&p.sequenceId==='psalms-171-v1'&&typeof p.timeZone==='string'&&p.timeZone&&typeof p.textPackId==='string','The backup has invalid journal settings.');
    try{new Intl.DateTimeFormat('en',{timeZone:p.timeZone}).format();}catch{throw Error('The backup has an invalid time zone.');}
    assert(object(p.preferences)&&canonical(p.preferences).length<=10000,'The backup has invalid preferences.');
    const profile={id:'local',startDate:p.startDate,timeZone:p.timeZone,sequenceId:p.sequenceId,textPackId:p.textPackId,preferences:JSON.parse(JSON.stringify(p.preferences))};
    const packs=[],ids=new Set();
    for(const raw of payload.textPacks){
      assert(object(raw)&&typeof raw.id==='string'&&raw.id.length>0&&raw.id.length<150&&!ids.has(raw.id)&&raw.translation==='KJV'&&raw.canonicalization==='verse-text-v1'&&Array.isArray(raw.chapters)&&raw.chapters.length===150,'A reading text version is unsupported.');
      ids.add(raw.id);
      const chapters=raw.chapters.map((c,i)=>{
        assert(object(c)&&String(c.chapter)===String(i+1)&&Array.isArray(c.verses)&&c.verses.length===corpus[i].verses.length,'The reading text has invalid chapter or verse counts.');
        return {chapter:String(i+1),verses:c.verses.map((v,j)=>{assert(object(v)&&String(v.verse)===String(j+1)&&typeof v.text==='string'&&v.text.length>0&&v.text.length<=10000,'The reading text contains an invalid verse.');return {verse:String(j+1),text:v.text};})};
      });
      const pack={id:raw.id,translation:raw.translation,canonicalization:raw.canonicalization,chapters};
      assert(raw.contentHash===await digest(pack),'The backup reading text failed its integrity check.');
      packs.push({...pack,contentHash:raw.contentHash});
    }
    assert(ids.has(profile.textPackId),'The backup is missing its journal text version.');
    const dates=new Set(),entries=[];
    for(const e of payload.entries){
      assert(object(e)&&validDate(e.date)&&e.date>=profile.startDate&&!dates.has(e.date)&&typeof e.text==='string'&&e.text.length<=1000000&&ids.has(e.textPackId)&&validStamp(e.modified)&&validStamp(e.createdAt),'The backup contains an invalid or duplicate entry.');
      dates.add(e.date);const r=reading(profile,e.date),pack=packs.find(x=>x.id===e.textPackId);
      assert(e.readingId===r.id&&e.reading?.chapter===r.chapter&&e.reading?.part===r.part,'An entry does not match its scheduled reading.');
      assert(Date.parse(e.createdAt)<=Date.parse(e.modified),'An entry has inconsistent timestamps.');
      entries.push({date:e.date,text:e.text,readingId:r.id,reading:{chapter:r.chapter,part:r.part},textPackId:pack.id,highlights:highlights(e.highlights,r,pack),createdAt:e.createdAt,modified:e.modified,revision:1});
    }
    return {profile,entries:entries.sort((a,b)=>a.date.localeCompare(b.date)),textPacks:packs.sort((a,b)=>a.id.localeCompare(b.id))};
  }
  async function encode(db) {
    const snap=await snapshot(db);assert(snap.profile&&snap.state,'No saved journal is available.');
    const entries=snap.entries.map(({revision,...e})=>e),payload={profile:snap.profile,entries,textPacks:snap.textPacks.sort((a,b)=>a.id.localeCompare(b.id))};
    const unsigned={format:FORMAT,formatVersion:1,exportedAt:new Date().toISOString(),payload};
    return {...unsigned,integrity:{algorithm:'SHA-256',canonicalization:'sorted-object-keys-v1',digest:await digest(unsigned)}};
  }
  async function decode(text) {
    assert(new TextEncoder().encode(text).byteLength<=25*1024*1024,'Choose a backup smaller than 25 MiB.');
    let d;try{d=JSON.parse(text);}catch{throw Error('This file is not valid JSON.');}
    assert(object(d),'This file is not a Psalmist backup.');
    if(d.format==='psalmist'&&d.version===1){
      assert(d.translation==='KJV'&&d.textVersion==='aruljohn-kjv-2026-09-24'&&object(d.entries),'This older journal text version is unsupported.');
      const pack=await bundledPack();
      const profile={id:'local',startDate:d.startDate,timeZone:d.timeZone,sequenceId:'psalms-171-v1',textPackId:pack.id,preferences:d.preferences||{}};
      const entries=Object.entries(d.entries).map(([date,e])=>{
        assert(object(e)&&Array.isArray(e.highlights),'This older journal has an invalid entry.');const r=reading(profile,date);
        return {date,text:e.text,reading:e.reading,readingId:r.id,textPackId:pack.id,createdAt:e.modified,modified:e.modified,
          highlights:e.highlights.map(h=>{assert(object(h)&&Array.isArray(h.segments),'This older journal has an invalid highlight.');return {...h,segments:h.segments.map(s=>({...s,quote:pack.chapters[r.chapter-1]?.verses[s.verse-1]?.text.slice(s.start,s.end)}))};})};
      });
      return {payload:await validatePayload({profile,entries,textPacks:[pack]}),legacy:true,exportedAt:null};
    }
    assert(d.format===FORMAT,'This file is not a supported Psalmist backup.');
    assert(d.formatVersion===1,'This backup version is unsupported. Use a compatible Psalmist application or choose another file.');
    assert(validStamp(d.exportedAt)&&d.integrity?.algorithm==='SHA-256'&&d.integrity?.canonicalization==='sorted-object-keys-v1','The backup integrity information is invalid.');
    const unsigned={format:d.format,formatVersion:d.formatVersion,exportedAt:d.exportedAt,payload:d.payload};
    assert(d.integrity.digest===await digest(unsigned),'This backup failed its integrity check. It has not been restored.');
    return {payload:await validatePayload(d.payload),legacy:false,exportedAt:d.exportedAt};
  }
  function replace(db,payload,expectedToken) {
    const generationId=crypto.randomUUID();
    return transaction(db,['profiles','entries','calendar','textPacks','meta'],'readwrite',(tx,g,set)=>{
      const req=tx.objectStore('meta').get('state');req.onsuccess=g(()=>{
        assert((req.result?token(req.result):null)===expectedToken,'Your journal changed after the preview. Choose the backup again to review the latest replacement.');
        for(const n of ['profiles','entries','calendar','textPacks','meta'])tx.objectStore(n).clear();
        tx.objectStore('profiles').put(payload.profile);
        payload.textPacks.forEach(p=>tx.objectStore('textPacks').put(p));
        payload.entries.forEach(e=>{const next={...e,revision:1};tx.objectStore('entries').put(next);tx.objectStore('calendar').put(summary(next));});
        const state={key:'state',generationId,changeSeq:0};tx.objectStore('meta').put(state);set(state);
      });
    });
  }
  function backupHistory(db,value) {
    return transaction(db,['meta'],value?'readwrite':'readonly',(tx,g,set)=>{
      if(value){tx.objectStore('meta').put({key:'backupDownload',value});set(value);}
      else {const req=tx.objectStore('meta').get('backupDownload');req.onsuccess=g(()=>set(req.result?.value));}
    });
  }
  window.PsalmistStorage=Object.freeze({open,initialize,load,month,save,snapshot,status,encode,decode,replace,backupHistory,reading,dateIn,day,validDate,token,highlights,sequence,colors,canonical,digest});
})();
