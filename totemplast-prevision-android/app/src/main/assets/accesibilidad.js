/* Accesibilidad de la captura de datos de TOTEMPLAST v1.4. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TotemplastAccessibility = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SIZES = Object.freeze([18,20,22,24,26]);
  const DEFAULT = Object.freeze({size:20,bold:true});
  function normalize(value) {
    const source = value && typeof value === 'object' ? value : DEFAULT;
    const proposed = Number(source.size);
    const size = SIZES.includes(proposed) ? proposed : DEFAULT.size;
    const bold = typeof source.bold === 'boolean' ? source.bold : DEFAULT.bold;
    return {size,bold};
  }
  function apply(rootElement, value) {
    if (!rootElement || !rootElement.style || typeof rootElement.style.setProperty !== 'function')
      throw new Error('Documento no disponible para aplicar accesibilidad.');
    const prefs = normalize(value);
    rootElement.style.setProperty('--totemplast-data-size', prefs.size+'px');
    rootElement.style.setProperty('--totemplast-data-weight', prefs.bold ? '750':'400');
    return prefs;
  }
  return {SIZES,DEFAULT,normalize,apply};
});
