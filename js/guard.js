/* js/guard.js — Safe Session Guard */
(() => {
  const sid = sessionStorage.getItem("sid");
  if (!sid) {
    location.replace(PAGES.login || "auth.html");
    return;
  }
  
  // Isolate student progress storage blob per user session
  const K = "eduahead-progress-v1";
  const g = Storage.prototype.getItem;
  const s = Storage.prototype.setItem;
  Storage.prototype.getItem = function(k) { return g.call(this, k === K ? K + ":" + sid : k); };
  Storage.prototype.setItem = function(k, v) { return s.call(this, k === K ? K + ":" + sid : k, v); };
})();