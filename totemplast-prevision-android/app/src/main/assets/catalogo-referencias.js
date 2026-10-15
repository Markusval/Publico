/* Catalogo inicial de referencias TOTEMPLAST.
 * Se guarda en el dispositivo una sola vez, sin sobrescribir fichas existentes.
 * Las cantidades comunicadas son informativas: NO se asignan automaticamente
 * ni al pedido total ni a la produccion ya realizada.
 */
(function (root) {
  'use strict';
  root.TotemplastReferenceCatalog = Object.freeze([
    Object.freeze({
      reference: 'CHH-04',
      piecesPerBox: 240,
      boxesPerPallet: 24,
      informedPallets: 16,
      informedExtraBoxes: 11
    }),
    Object.freeze({
      reference: 'DSM-117',
      piecesPerBox: 18,
      boxesPerPallet: 18,
      informedPallets: 10,
      informedExtraBoxes: 0
    })
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
