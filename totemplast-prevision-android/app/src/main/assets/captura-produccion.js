/* TOTEMPLAST v1.6: ritmo por inyectada de máquina y captura flexible de piezas. */
(function (root, factory) {
 const api=factory();
 if (typeof module === 'object' && module.exports) module.exports=api;
 root.TotemplastCapture=api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
 'use strict';
 function whole(value,label,optional=false) {
   if (optional && (value === null || value === undefined || String(value).trim()==='')) return 0;
   if (value === null || value === undefined || String(value).trim()==='')
     throw new Error('Indica '+label+'.');
   const n=Number(value);
   if (!Number.isSafeInteger(n) || n<0) throw new Error(label+': introduce un entero mayor o igual a 0.');
   return n;
 }
 function positive(value,label) {
   const n=whole(value,label);
   if (!n) throw new Error(label+' debe ser mayor que 0.');
   return n;
 }
 function safeProduct(a,b) {
   const n=a*b;
   if (!Number.isSafeInteger(n)) throw new Error('La cantidad excede el rango numérico seguro.');
   return n;
 }
 function parseProduction(input) {
   const perBox=positive(input.piecesPerBox,'Piezas por caja');
   const perPal=positive(input.boxesPerPallet,'Cajas por palet');
   const mode=input.mode;
   let fullBoxes=0,loosePieces=0;
   if (mode==='pieces') {
     loosePieces=whole(input.producedPieces,'Total de piezas fabricadas');
   } else if (mode==='boxes') {
     fullBoxes=whole(input.producedBoxes,'Cajas completas fabricadas');
     loosePieces=whole(input.producedLoosePieces,'Piezas adicionales',true);
   } else if (mode==='pallets') {
     const pallets=whole(input.producedPallets,'Palets completos');
     const extraBoxes=whole(input.producedExtraBoxes,'Cajas adicionales',true);
     fullBoxes=safeProduct(pallets,perPal)+extraBoxes;
     if (!Number.isSafeInteger(fullBoxes)) throw new Error('Hay demasiadas cajas para calcular.');
     loosePieces=whole(input.producedLoosePieces,'Piezas adicionales',true);
   } else throw new Error('Modo de producción incorrecto.');
   const produced=safeProduct(fullBoxes,perBox)+loosePieces;
   if (!Number.isSafeInteger(produced)) throw new Error('Hay demasiadas piezas para calcular.');
   return {fullBoxes,loosePieces,produced};
 }
 function distributePieces(pieces,piecesPerBox,boxesPerPallet) {
   const total=whole(pieces,'Piezas fabricadas');
   const perBox=positive(piecesPerBox,'Piezas por caja');
   const perPal=positive(boxesPerPallet,'Cajas por palet');
   const palletPieces=safeProduct(perBox,perPal);
   const producedBoxes=Math.floor(total/perBox);
   return {
     producedPieces:total,
     producedBoxes,
     producedPallets:Math.floor(total/palletPieces),
     producedExtraBoxes:Math.floor((total%palletPieces)/perBox),
     producedLoosePieces:total%perBox
   };
 }
 function machineRate(rate,unit,cavities) {
   const c=positive(cavities,'Cavidades activas');
   const numerical=typeof rate==='string'?Number(rate.trim().replace(',','.')):Number(rate);
   if(!Number.isFinite(numerical)||numerical<=0)
     throw new Error('Introduce un ritmo de máquina positivo.');
   let injectionsPerHour;
   if(unit==='per_hour') injectionsPerHour=numerical;
   else if(unit==='seconds') injectionsPerHour=3600/numerical;
   else throw new Error('Unidad de ritmo no válida.');
   const piecesPerHour=injectionsPerHour*c;
   if(!Number.isFinite(piecesPerHour)||piecesPerHour<=0)
     throw new Error('El ritmo calculado no es válido.');
   return {injectionsPerHour,piecesPerHour,cavities:c};
 }
 return {parseProduction,distributePieces,machineRate};
});
