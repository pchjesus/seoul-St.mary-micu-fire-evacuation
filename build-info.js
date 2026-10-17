/* A direct source checkout does not claim a release revision.
   The packaged ZIP substitutes exactly the constant below. */
(function(root){
  'use strict';
  const revision = 'da864bffa1a7b118c57581e8d09420881b77c80c';
  const known = typeof revision === 'string' && /^[0-9a-f]{40}$/.test(revision);
  root.MICU_BUILD_COMMIT = known ? revision : null;
  const el = root.document && root.document.getElementById('buildCommit');
  if(el) el.textContent = known ? ' · Git '+revision.slice(0,12) : ' · 커밋 미확인(직접 실행)';
})(globalThis);
