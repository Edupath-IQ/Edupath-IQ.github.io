/* EduPath IQ — Safe Class 10 Resources Loader v3
   Always renders a visible fallback if the HTML/CSS file cannot be fetched.
*/
(function(){
  var fallback = '<section class="ep10-resources" aria-label="Class 10 Science Chapter-wise Resources">' +
    '<h2 class="ep10-resources-title">Class 10 Science — Chapter-wise Resources</h2>' +
    '<p class="ep10-resources-subtitle">📘 Creative Class Notes &nbsp; • &nbsp; 📝 Exercise Solutions &nbsp; • &nbsp; 🧪 Activity Explanation &amp; Activity Based Questions</p>' +
    '<div class="ep10-bottom-note">Resources are being prepared. Available chapter resources will appear here; unavailable resources will be marked <strong>Coming Soon</strong>. Activity content remains inside the existing chapter content — no separate Activity page is required.</div>' +
    '</section>';
  function load(){
    var mount=document.getElementById('ep10-resources-mount'); if(!mount) return;
    var main=document.querySelector('.main'), boxes=document.querySelector('.boxes');
    if(main && boxes && boxes.parentElement===main) main.insertBefore(mount,boxes); else if(main) main.appendChild(mount);
    if(!document.querySelector('link[data-ep10-resources-css]')){
      var css=document.createElement('link'); css.rel='stylesheet'; css.href='class10-resources-safe.css'; css.setAttribute('data-ep10-resources-css','1'); document.head.appendChild(css);
    }
    fetch('class10-resources-safe.html',{cache:'no-store'}).then(function(r){if(!r.ok) throw new Error('HTTP '+r.status);return r.text()}).then(function(html){
      mount.innerHTML=html;
      if(!mount.querySelector('.ep10-resources')) mount.innerHTML=fallback;
    }).catch(function(){ mount.innerHTML=fallback; });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load); else load();
})();
