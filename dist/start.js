// Local HTML files cannot fetch modules or binary assets. Classic scripts can
// load their sibling files without a server or relaxed browser permissions.
(async function start() {
  function script(src, module = false) {
    return new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      if (module) tag.type = 'module';
      tag.onload = resolve;
      tag.onerror = () => reject(new Error(src));
      tag.src = src;
      document.body.append(tag);
    });
  }
  try {
    if (location.protocol === 'file:') {
      window.spotLocalParts = [];
      await script('./local/files.js');
      await Promise.all(window.spotLocalFiles.map(src => script(src)));
      if (!window.spotLocalFiles.every((_, i) => typeof window.spotLocalParts[i] === 'string')) {
        throw new Error('Incomplete local worker');
      }
    }
    await script('./ui.js', location.protocol !== 'file:');
  } catch (err) {
    document.querySelector('#startup').textContent =
      'Barcha fayllarni ZIP arxividan chiqaring va qayta oching. / Распакуйте весь ZIP и откройте страницу снова. (' + err.message + ')';
  }
})();
