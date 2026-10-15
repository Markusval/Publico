/* v1.2 - Validación de campos obligatorios, sin dependencias.
 * Los datos de embalaje o producción en 0 son valores presentes;
 * solo una casilla realmente vacía se señala en rojo.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TotemplastValidation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const BASE_IDS = Object.freeze([
    'reference', 'orderPieces', 'cavities', 'injectionsPerHour',
    'piecesPerBox', 'boxesPerPallet'
  ]);
  const ALL_REQUIRED_IDS = Object.freeze([
    ...BASE_IDS, 'producedBoxes', 'producedPallets', 'readingDateTime'
  ]);
  function getRequiredIds(mode, historical) {
    if (mode !== 'boxes' && mode !== 'pallets')
      throw new Error('Modo de producción no válido.');
    return [
      ...BASE_IDS,
      mode === 'boxes' ? 'producedBoxes' : 'producedPallets',
      ...(historical ? ['readingDateTime'] : [])
    ];
  }
  function isMissing(value) {
    return value === null || value === undefined || String(value).trim() === '';
  }
  function getMissingIds(requiredIds, values) {
    return requiredIds.filter(id => isMissing(values[id]));
  }
  return { BASE_IDS, ALL_REQUIRED_IDS, getRequiredIds, isMissing, getMissingIds };
});
