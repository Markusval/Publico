/* TOTEMPLAST v2.0. Copia de seguridad local portable: JSON, esquema 1. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TotemplastBackup = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'totemplast-production-backup';
  const VERSION = 1;
  const MAX_CHARS = 3000000;
  const MAX_REFERENCES = 3000;
  const STORAGE_KEYS = Object.freeze({
    references:'totemplast_previsiones_v1',
    calendar:'totemplast_calendario_v2',
    accessibility:'totemplast_accesibilidad_v14',
    migration:'totemplast_datos_v3_aplicados',
    catalog:'totemplast_catalogo_embalajes_20261015',
    moldCorrections:'totemplast_moldes_config_v23'
  });
  const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  function insist(condition, message) {
    if (!condition) throw new Error(message);
  }
  function scrub(value, depth) {
    insist(depth <= 12, 'El archivo contiene demasiados niveles.');
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      insist(Number.isFinite(value), 'Hay un número no válido en la copia.');
      return value;
    }
    if (Array.isArray(value)) {
      insist(value.length <= 3000, 'La copia contiene demasiados elementos.');
      return value.map(item=>scrub(item,depth+1));
    }
    insist(isObject(value), 'La copia contiene un dato no compatible.');
    const out=Object.create(null);
    const keys=Object.keys(value);
    insist(keys.length <= 4000, 'La copia contiene demasiados campos.');
    for (const key of keys) {
      insist(!['__proto__','constructor','prototype'].includes(key),
        'La copia contiene un campo no permitido.');
      insist(key.length <= 120, 'La copia tiene un nombre de campo demasiado largo.');
      out[key]=scrub(value[key],depth+1);
    }
    return out;
  }
  function numericIfSet(row,name,integer,allowZero) {
    const v=row[name];
    if (v === null || v === undefined || v === '') return;
    const n=Number(v);
    insist(Number.isFinite(n) && n >= (allowZero?0:Number.MIN_VALUE) &&
      (!integer || Number.isSafeInteger(n)),
      'Dato incorrecto en '+name+'.');
  }
  function normalizedReferences(source) {
    insist(isObject(source), 'La copia no contiene referencias válidas.');
    const entries=Object.entries(source);
    insist(entries.length <= MAX_REFERENCES, 'La copia contiene demasiadas referencias.');
    const normalized=Object.create(null);
    for (const [key,value] of entries) {
      insist(key.length>0 && key.length<=90 && key.trim()===key &&
        !['__proto__','constructor','prototype'].includes(key),
        'Hay un código de referencia incorrecto.');
      insist(isObject(value), 'Ficha no válida para '+key+'.');
      const row=scrub(value,0);
      insist(typeof row.reference==='string' && row.reference === key,
        'La referencia '+key+' no coincide con su ficha.');
      for (const k of ['orderPieces','cavities','piecesPerBox','boxesPerPallet'])
        numericIfSet(row,k,true,false);
      for (const k of ['fullBoxes','loosePieces','informedPallets','informedExtraBoxes'])
        numericIfSet(row,k,true,true);
      for (const k of ['injectionsPerHour','measuredRateValue'])
        numericIfSet(row,k,false,false);
      if (row.mode !== undefined && row.mode !== null)
        insist(['boxes','pallets','pieces'].includes(row.mode),'Modo de ficha no válido: '+key);
      if (row.readAt !== undefined && row.readAt !== null && row.readAt !== '')
        insist(typeof row.readAt==='string' && Number.isFinite(Date.parse(row.readAt)),
          'Fecha incorrecta de la referencia '+key);
      normalized[key]=row;
    }
    return normalized;
  }
  function normalizedCalendar(source) {
    insist(isObject(source), 'El calendario de la copia no es válido.');
    insist(Array.isArray(source.holidays) && Array.isArray(source.pauses),
      'Faltan los festivos o las paradas.');
    insist(source.holidays.length+source.pauses.length <= 1000,
      'La copia incluye demasiadas paradas.');
    const validDay=s=>typeof s==='string' && /^\d{4}-\d\d-\d\d$/.test(s) &&
      Number.isFinite(Date.parse(s+'T12:00:00Z')) &&
      new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
    const holidays=[...new Set(source.holidays.map(s=>{
      insist(validDay(s),'La copia contiene un festivo con fecha no válida.');
      return s;
    }))].sort();
    const pauses=source.pauses.map(p=>{
      insist(isObject(p) && typeof p.start==='string' && typeof p.end==='string',
        'La copia tiene una parada no válida.');
      insist(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(p.start) &&
        /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(p.end) &&
        validDay(p.start.slice(0,10)) && validDay(p.end.slice(0,10)),
        'Formato incorrecto de parada.');
      const a=Date.parse(p.start),b=Date.parse(p.end);
      insist(Number.isFinite(a) && Number.isFinite(b) && b>a,
        'La reanudación debe ser posterior al inicio de la parada.');
      insist(p.label === undefined || (typeof p.label === 'string' && p.label.length<=80),
        'Motivo de parada demasiado largo.');
      return {start:p.start,end:p.end,label:p.label||''};
    });
    return {holidays,pauses};
  }
  function normalizedAccessibility(source) {
    if (source === null || source === undefined) return null;
    insist(isObject(source) && [18,20,22,24,26].includes(source.size) &&
      typeof source.bold==='boolean','El ajuste de accesibilidad es inválido.');
    return {size:source.size,bold:source.bold};
  }
  function normalizeMoldCorrections(value){
    if(value===undefined||value===null)return Object.create(null);
    insist(isObject(value),'Correcciones de moldes inválidas.');
    const out=Object.create(null),keys=Object.keys(value);
    insist(keys.length<=1000,'Hay demasiados ajustes de moldes.');
    for(const key of keys){
      insist(key.length>0&&key.length<=180&&!['__proto__','constructor','prototype'].includes(key)&&
        (key.startsWith('MOLDE|')||key.startsWith('SIN NUMERO|')),'Clave de molde incorrecta.');
      const x=value[key];
      insist(isObject(x)&&Number.isSafeInteger(x.cavities)&&x.cavities>0&&
        typeof x.base==='number'&&Number.isFinite(x.base)&&x.base>0,
        'Ajuste de molde incorrecto: '+key);
      out[key]={cavities:x.cavities,base:x.base};
    }
    return out;
  }
  function normalizeData(raw) {
    insist(isObject(raw),'La copia no contiene datos.');
    return {
      references:normalizedReferences(raw.references),
      calendar:normalizedCalendar(raw.calendar),
      accessibility:normalizedAccessibility(raw.accessibility),
      moldCorrections:normalizeMoldCorrections(raw.moldCorrections)
    };
  }
  function exportText(data, date) {
    const now=date instanceof Date?date:new Date();
    insist(Number.isFinite(now.getTime()),'Fecha de copia de seguridad incorrecta.');
    const safe=normalizeData(data);
    const text=JSON.stringify({
      format:FORMAT, schemaVersion:VERSION, appVersion:'2.3',
      createdAt:now.toISOString(), data:safe
    },null,2);
    insist(text.length<=MAX_CHARS,'La copia supera el tamaño admitido.');
    return text;
  }
  function readText(text) {
    insist(typeof text==='string' && text.length>0 && text.length<=MAX_CHARS,
      'El archivo no es un JSON de copia de seguridad válido o supera el tamaño permitido.');
    let backup;
    try {backup=JSON.parse(text.replace(/^\uFEFF/,''));}
    catch (_) {throw new Error('El archivo no contiene un JSON válido.');}
    insist(isObject(backup) && backup.format===FORMAT,
      'El archivo seleccionado no es una copia de TOTEMPLAST.');
    insist(backup.schemaVersion===VERSION,
      'Versión de copia no admitida; se requiere el esquema 1.');
    insist(typeof backup.createdAt==='string' && Number.isFinite(Date.parse(backup.createdAt)),
      'La copia no indica una fecha de creación válida.');
    return {createdAt:backup.createdAt,appVersion:backup.appVersion||'?',
      data:normalizeData(backup.data)};
  }
  function combine(current,fromFile,strategy) {
    insist(strategy==='merge' || strategy==='replace',
      'Selecciona fusionar o sustituir.');
    const local=normalizeData(current), incoming=normalizeData(fromFile);
    const localNames=Object.keys(local.references);
    const fromNames=Object.keys(incoming.references);
    const conflicts=fromNames.filter(name=>Object.prototype.hasOwnProperty.call(local.references,name)).length;
    if (strategy==='replace') return {data:incoming,conflicts,
      newReferences:fromNames.length,previousReferences:localNames.length};
    const references=Object.create(null);
    Object.assign(references,local.references,incoming.references);
    const holidays=[...new Set([...local.calendar.holidays,...incoming.calendar.holidays])].sort();
    const pauses=[...local.calendar.pauses,...incoming.calendar.pauses];
    const unique=new Set();
    const mergedPauses=pauses.filter(p=>{
      const fingerprint=JSON.stringify([p.start,p.end,p.label||'']);
      if(unique.has(fingerprint))return false;
      unique.add(fingerprint);return true;
    }).sort((a,b)=>a.start.localeCompare(b.start));
    return {data:{references,calendar:{holidays,pauses:mergedPauses},
        accessibility:incoming.accessibility===null?local.accessibility:incoming.accessibility,
        moldCorrections:Object.assign(Object.create(null),local.moldCorrections,incoming.moldCorrections)},
      conflicts,newReferences:fromNames.length,previousReferences:localNames.length};
  }
  function writeStorage(storage,data) {
    const safe=normalizeData(data);
    const updates=[
      [STORAGE_KEYS.references,JSON.stringify(safe.references)],
      [STORAGE_KEYS.calendar,JSON.stringify(safe.calendar)],
      [STORAGE_KEYS.accessibility,safe.accessibility?JSON.stringify(safe.accessibility):null],
      [STORAGE_KEYS.migration,'1'],
      [STORAGE_KEYS.catalog,'1'],
      [STORAGE_KEYS.moldCorrections,JSON.stringify(safe.moldCorrections)]
    ];
    const old=updates.map(([k])=>[k,storage.getItem(k)]);
    try {
      for(const [k,v] of updates) {
        if(v===null)storage.removeItem(k);else storage.setItem(k,v);
      }
    } catch(err) {
      for(const [k,v] of old) {
        try {if(v===null)storage.removeItem(k);else storage.setItem(k,v);}catch(_){}
      }
      throw new Error('No se ha podido guardar la copia; se ha intentado restaurar el estado anterior: '+err.message);
    }
  }
  return {FORMAT,VERSION,STORAGE_KEYS,MAX_CHARS,exportText,readText,combine,writeStorage,
    normalizeData};
});
