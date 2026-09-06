/* EduPath IQ content protection - silent, non-intrusive.
   This is a deterrent only; it cannot prevent screenshots, screen recording,
   cameras, or access to files that are publicly served by the web server. */
(function () {
  'use strict';

  const editable = (el) => {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
           tag === 'BUTTON' || el.isContentEditable;
  };

  document.addEventListener('contextmenu', function (e) {
    if (!editable(e.target)) e.preventDefault();
  }, true);

  document.addEventListener('dragstart', function (e) {
    if (!editable(e.target)) e.preventDefault();
  }, true);

  document.addEventListener('selectstart', function (e) {
    if (!editable(e.target)) e.preventDefault();
  }, true);

  document.addEventListener('copy', function (e) {
    if (!editable(e.target)) {
      e.preventDefault();
      if (e.clipboardData) e.clipboardData.clearData();
    }
  }, true);

  document.addEventListener('cut', function (e) {
    if (!editable(e.target)) e.preventDefault();
  }, true);

  document.addEventListener('keydown', function (e) {
    const key = e.key.toLowerCase();
    const blocked =
      (e.ctrlKey || e.metaKey) && ['c', 'x', 's', 'p', 'u'].includes(key) ||
      (e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key) ||
      e.key === 'F12';

    if (blocked && !editable(e.target)) e.preventDefault();
  }, true);

  // Keep images from being dragged/saved through the normal image interaction.
  document.addEventListener('mousedown', function (e) {
    if (e.target && e.target.tagName === 'IMG') e.preventDefault();
  }, true);
})();
