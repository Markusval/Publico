
/* Motor determinista de produccion TOTEMPLAST. Sin dependencias ni conexiones. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TotemplastEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MS_HOUR = 3600000;
  const EPS = 1e-7;

  function requireWholeNumber(value, title, allowZero) {
    const n = Number(value);
    if (!Number.isSafeInteger(n) || (allowZero ? n < 0 : n <= 0)) {
      throw new Error(title + ': introduce un numero entero ' + (allowZero ? 'mayor o igual a 0.' : 'mayor que 0.'));
    }
    return n;
  }
  function requireRate(value) {
    const n = typeof value === 'string'
      ? Number(value.trim().replace(/\s/g, '').replace(',', '.')) : Number(value);
    if (!Number.isFinite(n) || n <= 0 || n > 100000) {
      throw new Error('Inyectadas por hora: introduce un ritmo positivo valido.');
    }
    return n;
  }
  // Horario permanente: lunes 06:00 -> sabado 06:00.
  function isProductionTime(date, closures) {
    const wd = date.getDay();
    const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600 + date.getMilliseconds() / 3600000;
    const withinWeekly = wd !== 0 && (wd !== 1 || hour >= 6) && (wd !== 6 || hour < 6);
    if (!withinWeekly) return false;
    if (!closures || !closures.length) return true;
    const ms = date.getTime();
    return !closures.some(c => c.startMs <= ms && ms < c.endMs);
  }
  function nextProductionTime(value) {
    let dt = new Date(value.getTime());
    const wd = dt.getDay();
    if (wd === 0) {
      dt.setDate(dt.getDate() + 1);
      dt.setHours(6, 0, 0, 0);
    } else if (wd === 1 && !isProductionTime(dt)) {
      dt.setHours(6, 0, 0, 0);
    } else if (wd === 6 && !isProductionTime(dt)) {
      dt.setDate(dt.getDate() + 2);
      dt.setHours(6, 0, 0, 0);
    }
    return dt;
  }
  function productionEndInWeek(date) {
    const dt = new Date(date.getTime());
    dt.setDate(dt.getDate() + (6 - dt.getDay()));
    dt.setHours(6, 0, 0, 0);
    return dt;
  }
  function parseLocalDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error('Fecha de festivo incorrecta.');
    const [y,m,d] = s.split('-').map(Number);
    const dt = new Date(y,m-1,d,6,0,0,0);
    if (dt.getFullYear()!==y || dt.getMonth()!==m-1 || dt.getDate()!==d)
      throw new Error('Fecha de festivo inexistente.');
    return dt;
  }
  function parseLocalDateTime(s) {
    if (typeof s!=='string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s))
      throw new Error('La parada debe indicar fecha y hora (aaaa-mm-ddThh:mm).');
    const [date,time] = s.split('T');
    const day = parseLocalDate(date);
    const [h,m] = time.split(':').map(Number);
    if (h>23 || m>59) throw new Error('Hora de parada incorrecta.');
    day.setHours(h,m,0,0);
    if (day.getHours()!==h || day.getMinutes()!==m) throw new Error('Hora de parada inexistente (cambio de horario).');
    return day;
  }
  function normalizeClosures(calendar) {
    if (!calendar) return [];
    const holidays = calendar.holidays || [];
    const pauses = calendar.pauses || [];
    if (!Array.isArray(holidays) || !Array.isArray(pauses) || holidays.length+pauses.length>1000)
      throw new Error('Calendario de paradas no valido.');
    const ranges=[];
    for (const iso of holidays) {
      const selected = parseLocalDate(iso);
      // Festivo completo: se para a las 06:00 de la vispera,
      // y se reanuda a las 06:00 del dia siguiente (si es laborable).
      const start = new Date(selected.getTime());
      start.setDate(start.getDate()-1);
      const end = new Date(selected.getTime());
      end.setDate(end.getDate()+1);
      ranges.push({startMs:start.getTime(),endMs:end.getTime()});
    }
    for (const pause of pauses) {
      if (!pause || typeof pause!=='object') throw new Error('Parada incorrecta.');
      const start=parseLocalDateTime(pause.start), end=parseLocalDateTime(pause.end);
      if (start.getTime() >= end.getTime()) throw new Error('La reanudacion debe ser posterior al inicio de la parada.');
      ranges.push({startMs:start.getTime(),endMs:end.getTime()});
    }
    ranges.sort((a,b)=>a.startMs-b.startMs || a.endMs-b.endMs);
    const merged=[];
    for (const c of ranges) {
      const previous=merged[merged.length-1];
      if (previous && c.startMs<=previous.endMs) previous.endMs=Math.max(previous.endMs,c.endMs);
      else merged.push({...c});
    }
    return merged;
  }
  function nextAllowedProductionTime(value, closures) {
    let date=nextProductionTime(value);
    for (let i=0;i<=closures.length+1;i++) {
      const conflict=closures.find(c=>c.startMs<=date.getTime() && date.getTime()<c.endMs);
      if (!conflict) return date;
      date=nextProductionTime(new Date(conflict.endMs));
    }
    throw new Error('No se pudo encontrar una jornada de produccion.');
  }
  function nextStopTime(date, closures) {
    let stop=productionEndInWeek(date).getTime();
    for (const c of closures) {
      if (c.startMs>date.getTime() && c.startMs<stop) stop=c.startMs;
    }
    return stop;
  }
  function advanceProductionTime(start, requiredMs, closures=[]) {
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) throw new Error('Fecha de lectura no valida.');
    if (!Number.isFinite(requiredMs) || requiredMs < 0) throw new Error('Horas productivas incorrectas.');
    let date = new Date(start.getTime());
    let remaining = requiredMs;
    let steps = 0;
    while (remaining > EPS) {
      if (++steps > 30000) throw new Error('Prevision demasiado larga para calcular.');
      date = nextAllowedProductionTime(date,closures);
      const end = nextStopTime(date,closures);
      const available = end - date.getTime();
      if (available <= 0) throw new Error('Error interno de calendario laboral.');
      const slice = Math.min(remaining, available);
      date = new Date(date.getTime() + slice);
      remaining -= slice;
    }
    return date;
  }
  function millisecondsInProduction(start, finish, closures=[]) {
    if (finish.getTime() <= start.getTime()) return 0;
    let date = new Date(start.getTime());
    let elapsed = 0;
    let steps = 0;
    while (date.getTime() < finish.getTime()) {
      if (++steps > 30000) throw new Error('Intervalo demasiado largo para calcular.');
      date = nextAllowedProductionTime(date,closures);
      if (date.getTime() >= finish.getTime()) break;
      const next = Math.min(nextStopTime(date,closures), finish.getTime());
      if (next <= date.getTime()) throw new Error('Error interno de intervalos.');
      elapsed += next - date.getTime();
      date = new Date(next);
    }
    return elapsed;
  }
  function palletBreakdown(pieceCount, perBox, boxesPerPallet) {
    const pieces = requireWholeNumber(pieceCount, 'Numero de piezas', true);
    const perPallet = perBox * boxesPerPallet;
    const pallets = Math.floor(pieces / perPallet);
    const left = pieces % perPallet;
    const boxes = Math.floor(left / perBox);
    const loose = left % perBox;
    const totalFullBoxes = Math.floor(pieces / perBox);
    const partialPallets = boxes > 0 || loose > 0 ? 1 : 0;
    const totalPhysicalPallets = pallets + partialPallets;
    return { pieces, pallets, boxes, loose, totalFullBoxes, totalPhysicalPallets,
      fullBoxesPerPallet: boxesPerPallet, piecesPerBox: perBox };
  }
  function forecast(input, referenceDate, calendar) {
    const ref = String(input.reference || '').trim().toUpperCase();
    if (!ref || ref.length > 90) throw new Error('Indica la referencia del molde o pieza (hasta 90 caracteres).');
    const orderPieces = requireWholeNumber(input.orderPieces, 'Piezas del pedido', false);
    const cavities = requireWholeNumber(input.cavities, 'Cavidades', false);
    const injectionsPerHour = requireRate(input.injectionsPerHour);
    const piecesPerBox = requireWholeNumber(input.piecesPerBox, 'Piezas por caja', false);
    const boxesPerPallet = requireWholeNumber(input.boxesPerPallet, 'Cajas por palet', false);
    const fullBoxes = requireWholeNumber(input.fullBoxes, 'Cajas fabricadas', true);
    const loosePieces = requireWholeNumber(input.loosePieces || 0, 'Piezas sueltas', true);
    // Piezas adicionales sin restricción de caja: también admite 6.000 piezas
    // directas y ninguna caja. El desglose se normaliza solo para mostrarlo.
    const produced = fullBoxes * piecesPerBox + loosePieces;
    if (!Number.isSafeInteger(produced)) throw new Error('Las cantidades exceden el rango numerico seguro.');
    const closures = normalizeClosures(calendar);
    const readAt = new Date(referenceDate.getTime());
    if (Number.isNaN(readAt.getTime())) throw new Error('Fecha u hora de lectura incorrecta.');

    const piecesPerHour = cavities * injectionsPerHour;
    const piecesPerPallet = boxesPerPallet * piecesPerBox;
    const piecesPending = Math.max(0, orderPieces - produced);
    const injectionsPending = Math.ceil(piecesPending / cavities);
    const productiveMsPending = (injectionsPending / injectionsPerHour) * MS_HOUR;
    const finishAt = advanceProductionTime(readAt, productiveMsPending, closures);
    const expectedOverrunAtFinish = produced + injectionsPending * cavities - orderPieces;
    const breakdownProduced = palletBreakdown(produced, piecesPerBox, boxesPerPallet);
    const breakdownPending = palletBreakdown(piecesPending, piecesPerBox, boxesPerPallet);
    const scenarios = [-2, -1, 0, 1].map((deltaDays) => {
      const at = new Date(finishAt.getFullYear(), finishAt.getMonth(), finishAt.getDate() + deltaDays, 6, 0, 0, 0);
      if (at.getTime() < readAt.getTime()) {
        return { deltaDays, at, applicable: false, reason: 'Anterior a la lectura registrada' };
      }
      const productiveMs = millisecondsInProduction(readAt, at, closures);
      // Las inyecciones terminadas son enteras, nunca se cuentan fracciones de ciclo.
      const injectedCycles = Math.floor(productiveMs / MS_HOUR * injectionsPerHour + 1e-8);
      const projectedTotal = produced + injectedCycles * cavities;
      const difference = projectedTotal - orderPieces;
      const missing = Math.max(0, -difference);
      const excess = Math.max(0, difference);
      return { deltaDays, at, applicable: true, projectedTotal, injectedCycles,
        missing, excess, difference,
        breakdownTotal: palletBreakdown(projectedTotal, piecesPerBox, boxesPerPallet),
        breakdownDifference: palletBreakdown(Math.abs(difference), piecesPerBox, boxesPerPallet),
        stopped: !isProductionTime(at, closures) };
    });
    return { reference: ref, orderPieces, cavities, injectionsPerHour, piecesPerHour,
      piecesPerBox, boxesPerPallet, piecesPerPallet,
      fullBoxes, loosePieces, produced, piecesPending, injectionsPending,
      productiveMsPending, readAt, finishAt, expectedOverrunAtFinish,
      breakdownProduced, breakdownPending, scenarios,
      closureCount: closures.length, calendar: calendar || {holidays:[],pauses:[]},
      completedPercent: 100 * Math.min(orderPieces, produced) / orderPieces,
      isAlreadyComplete: piecesPending === 0 };
  }
  return { forecast, palletBreakdown, isProductionTime, nextProductionTime,
    productionEndInWeek, advanceProductionTime, millisecondsInProduction,
    normalizeClosures, parseLocalDate, parseLocalDateTime, nextAllowedProductionTime };
});

