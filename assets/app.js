
    const firebaseConfig = {
      apiKey: "AIzaSyDS1YA0FRvCIryjreFVzRMZyaHhYtm-pUU",
      authDomain: "euteamoanaclaraks.firebaseapp.com",
      databaseURL: "https://euteamoanaclaraks-default-rtdb.firebaseio.com",
      projectId: "euteamoanaclaraks",
      storageBucket: "euteamoanaclaraks.firebasestorage.app",
      messagingSenderId: "972847187116",
      appId: "1:972847187116:web:016a7b8a3dd7a688320b09",
      measurementId: "G-7LN9PKSCW3"
    };

    let db = null;
    try{
      firebase.initializeApp(firebaseConfig);
      db = firebase.database();
      console.log("Firebase inicializado (Realtime DB).");
    }catch(e){
      console.warn("Firebase não inicializou, mas o site continua funcionando.", e);
    }
    const coupleId = "pablo-ana";

    /* Corações de fundo */
    const heartsLayer = document.getElementById('heartsLayer');
    function spawnHeart(x){
      const el = document.createElement('span');
      el.className = 'heart';
      el.innerText = '❤';
      const size = Math.random()*18 + 14;
      el.style.left = (x != null ? x : Math.random()*100) + 'vw';
      el.style.fontSize = size + 'px';
      const dur = Math.random()*5 + 5;
      el.style.animation = `fall ${dur}s linear forwards`;
      el.style.opacity = (Math.random()*0.4)+0.6;
      heartsLayer.appendChild(el);
      setTimeout(()=> el.remove(), (dur+0.6)*1000);
    }
    function initialRain(count=22){
      for(let i=0;i<count;i++){
        setTimeout(()=>spawnHeart(), i*120);
      }
    }
    initialRain(26);
    setInterval(()=>{ spawnHeart(Math.random()*100); }, 8000);

    /* Slider amor */
    const loveRange = document.getElementById('loveRange');
    const loveVal = document.getElementById('loveVal');
    loveRange.addEventListener('input', function(){
      const v = Number(this.value);
      loveVal.innerText = v;
      if(window._loveRevertTimeout) clearTimeout(window._loveRevertTimeout);
      if(v < 10){
        window._loveRevertTimeout = setTimeout(()=>{
          loveRange.value = 10;
          loveVal.innerText = 10;
          popupHeartsBurst();
          showTinyNote('Pra sempre 10/10 ✨');
          window._loveRevertTimeout = null;
        }, 1000);
      } else {
        if(window._loveRevertTimeout){
          clearTimeout(window._loveRevertTimeout);
          window._loveRevertTimeout = null;
        }
      }
    });

    /* Perdoa Pablo */
    const btnSim = document.getElementById('btnSim');
    const btnNao = document.getElementById('btnNao');
    btnSim.onclick = ()=>{
      btnSim.innerText = 'SIM ❤';
      btnNao.innerText = 'NÃO';
      popupHeartsBurst();
    };
    btnNao.onclick = ()=>{
      btnSim.innerText = 'SIM ❤';
      btnNao.innerText = 'NÃO ➜ agora é SIM';
      popupHeartsBurst();
      setTimeout(()=>{ btnNao.innerText = 'NÃO'; }, 900);
    };

    /* Galeria + carrossel com +N */
    const gallery = document.getElementById('gallery');
    const heroImg = document.getElementById('heroImg');
    const heroPrev = document.getElementById('heroPrev');
    const heroNext = document.getElementById('heroNext');
    const fullGallery = document.getElementById('fullGallery');
    const galleryOverlay = document.getElementById('galleryOverlay');
    const closeGalleryOverlay = document.getElementById('closeGalleryOverlay');

    let heroSources = [];
    let currentHeroIndex = 0;
    let heroTimer = null;

    let basePhotos = [
      'images/ana_e_eu_zoo.jpg',
      'images/us_beach.jpg',
      'images/us_zoo.jpg',
      'images/wedding.jpg'
    ];
    let dynamicPhotos = []; // {id, src}
    let allPhotos = [];     // base + dynamic

    function registerHeroSrc(src){
      if(!src) return;
      if(!heroSources.includes(src)){
        heroSources.push(src);
      }
    }

    function setHeroFromSrc(src, fromCarousel=false){
      if(!src) return;
      registerHeroSrc(src);
      const img = heroImg;
      img.classList.remove('fade-in');
      img.classList.add('fade-out');
      setTimeout(()=>{
        img.src = src;
        img.classList.remove('fade-out');
        img.classList.add('fade-in');
      }, 220);
      if(!fromCarousel){
        const idx = heroSources.indexOf(src);
        if(idx >= 0) currentHeroIndex = idx;
      }
    }

    function goHero(delta){
      if(heroSources.length === 0) return;
      currentHeroIndex = (currentHeroIndex + delta + heroSources.length) % heroSources.length;
      const nextSrc = heroSources[currentHeroIndex];
      setHeroFromSrc(nextSrc, true);
      startHeroCarousel();
    }

    function startHeroCarousel(){
      if(heroTimer) clearInterval(heroTimer);
      heroTimer = setInterval(()=>{
        if(heroSources.length <= 1) return;
        currentHeroIndex = (currentHeroIndex + 1) % heroSources.length;
        const nextSrc = heroSources[currentHeroIndex];
        setHeroFromSrc(nextSrc, true);
      }, 6000);
    }

    function rebuildAllPhotos(){
      allPhotos = [];
      basePhotos.forEach(src => allPhotos.push({id:null, src, dynamic:false}));
      dynamicPhotos.forEach(p => allPhotos.push({id:p.id, src:p.src, dynamic:true}));
      renderGallery();
      renderFullGallery();
    }

    function createThumbElement(photo, allowRemove){
      const wrap = document.createElement('div');
      wrap.className = 'thumb-wrapper';
      const img = document.createElement('img');
      img.src = photo.src;
      img.className = 'thumb';
      img.addEventListener('click', ()=> setHeroFromSrc(photo.src));
      wrap.appendChild(img);

      if(photo.dynamic && allowRemove && photo.id){
        const btn = document.createElement('button');
        btn.className = 'thumb-remove';
        btn.innerText = '×';
        btn.title = 'Remover esta foto';
        btn.addEventListener('click', (ev)=>{
          ev.stopPropagation();
          if(!confirm('Tem certeza que quer remover esta foto da galeria?')) return;
          if(db){
            firebase.database().ref('gallery/' + coupleId + '/' + photo.id).remove()
              .then(()=>{
                showTinyNote('Foto removida 🗑️');
              })
              .catch(err=>{
                console.warn('Erro ao remover foto:', err);
                showTinyNote('Não consegui remover 😢');
              });
          } else {
            // remove localmente
            dynamicPhotos = dynamicPhotos.filter(p => p.id !== photo.id);
            rebuildAllPhotos();
          }
        });
        wrap.appendChild(btn);
      }

      registerHeroSrc(photo.src);
      return wrap;
    }

    function renderGallery(){
      gallery.innerHTML = '';
      const maxVisible = 12;
      const visible = allPhotos.slice(0, maxVisible);
      visible.forEach(photo=>{
        gallery.appendChild(createThumbElement(photo, true));
      });
      const hiddenCount = allPhotos.length - visible.length;
      if(hiddenCount > 0){
        const extra = document.createElement('div');
        extra.className = 'thumb-extra';
        extra.innerText = '+' + hiddenCount;
        extra.title = 'Ver todas as fotos';
        extra.addEventListener('click', ()=>{
          galleryOverlay.classList.add('show');
        });
        gallery.appendChild(extra);
      }
    }

    function renderFullGallery(){
      fullGallery.innerHTML = '';
      allPhotos.forEach(photo=>{
        fullGallery.appendChild(createThumbElement(photo, true));
      });
    }

    closeGalleryOverlay.addEventListener('click', ()=>{
      galleryOverlay.classList.remove('show');
    });

    if(heroPrev){
      heroPrev.addEventListener('click', ()=> goHero(-1));
    }
    if(heroNext){
      heroNext.addEventListener('click', ()=> goHero(1));
    }

    // Carrega fotos base
    basePhotos.forEach(src => registerHeroSrc(src));
    setHeroFromSrc(basePhotos[basePhotos.length-1]);
    startHeroCarousel();

    // Upload fotos -> Realtime DB
    const fileInput = document.getElementById('fileInput');
    const savePhotosBtn = document.getElementById('savePhotosBtn');

    savePhotosBtn.addEventListener('click', () => {
      const files = Array.from(fileInput.files || []);
      if(!files.length){
        alert('Escolha pelo menos uma foto primeiro 🙂');
        return;
      }
      if(!db){
        showTinyNote('Firebase não disponível, não consegui salvar 😢');
        return;
      }
      files.forEach(file => {
        if(!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = function(ev){
          const dataUrl = ev.target.result;
          firebase.database().ref('gallery/' + coupleId).push({
            dataUrl,
            name: file.name || null,
            createdAt: Date.now()
          }).then(()=>{
            showTinyNote('Foto salva na galeria 💖');
          }).catch(err => {
            console.warn('Erro ao salvar foto:', err);
            showTinyNote('Não consegui salvar uma das fotos 😢');
          });
        };
        reader.readAsDataURL(file);
      });
      fileInput.value = '';
    });

    if(db){
      firebase.database()
        .ref('gallery/' + coupleId)
        .orderByChild('createdAt')
        .limitToLast(60)
        .on('value', snapshot => {
          const data = snapshot.val();
          dynamicPhotos = [];
          if(data){
            const entries = Object.entries(data).sort((a,b)=>{
              const va = (a[1] && a[1].createdAt) || 0;
              const vb = (b[1] && b[1].createdAt) || 0;
              return va - vb;
            });
            entries.forEach(([id,item])=>{
              if(item && item.dataUrl){
                dynamicPhotos.push({id, src:item.dataUrl, dynamic:true});
              }
            });
          }
          rebuildAllPhotos();
        }, err => {
          console.warn('Erro ao ler galeria do Firebase:', err);
        });
    } else {
      rebuildAllPhotos();
    }

    /* Overlays mensagem e proposta */
    const overlay = document.getElementById('overlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayText = document.getElementById('overlayText');
    const showMsg = document.getElementById('showMsg');
    const closeOverlay = document.getElementById('closeOverlay');
    showMsg.onclick = ()=>{
      overlayTitle.innerText = 'Ana Clara, eu te amo ❤';
      overlayText.innerText = document.getElementById('loveMsg').value;
      overlay.classList.add('show');
      initialRain(40);
    };
    closeOverlay.onclick = ()=> overlay.classList.remove('show');

    const proposalBtn = document.getElementById('proposalBtn');
    const proposalOverlay = document.getElementById('proposalOverlay');
    const closeProposal = document.getElementById('closeProposal');
    proposalBtn.onclick = ()=>{
      proposalOverlay.classList.add('show');
      initialRain(35);
    };
    closeProposal.onclick = ()=> proposalOverlay.classList.remove('show');

    document.getElementById('surprise').onclick = ()=>{ initialRain(36); popupHeartsBurst(); };
    document.getElementById('popupLove').onclick = ()=>{ initialRain(30); popupHeartsBurst(); };

    function popupHeartsBurst(){
      const burst = document.createElement('div');
      burst.className='burst';
      document.body.appendChild(burst);
      for(let i=0;i<18;i++){
        const b = document.createElement('div');
        b.className='bheart';
        b.innerText='❤';
        const angle = Math.random()*Math.PI*2;
        const radius = Math.random()*140+20;
        b.style.left = (50 + Math.cos(angle)*radius) + 'vw';
        b.style.top = (40 + Math.sin(angle)*radius) + 'vh';
        b.style.opacity = 1;
        b.style.transform = 'scale(0.9)';
        b.style.transition = 'transform 900ms cubic-bezier(.2,1,.3,1), opacity 900ms';
        burst.appendChild(b);
        setTimeout(()=>{
          b.style.transform='translateY(-40vh) scale(1.2)';
          b.style.opacity=0;
        }, 40+i*20);
      }
      setTimeout(()=> burst.remove(), 1200);
    }

    function popupEmojiBurst(emoji){
      const burst = document.createElement('div');
      burst.className='burst';
      document.body.appendChild(burst);
      for(let i=0;i<14;i++){
        const b = document.createElement('div');
        b.className='bheart';
        b.innerText=emoji;
        const angle = Math.random()*Math.PI*2;
        const radius = Math.random()*140+20;
        b.style.left = (50 + Math.cos(angle)*radius) + 'vw';
        b.style.top = (45 + Math.sin(angle)*radius) + 'vh';
        b.style.opacity = 1;
        b.style.transform = 'scale(0.9)';
        b.style.transition = 'transform 900ms cubic-bezier(.2,1,.3,1), opacity 900ms';
        burst.appendChild(b);
        setTimeout(()=>{
          b.style.transform='translateY(-40vh) scale(1.2)';
          b.style.opacity=0;
        }, 40+i*20);
      }
      setTimeout(()=> burst.remove(), 1200);
    }

    function iceRain(){
      const container = document.createElement('div');
      container.className = 'burst';
      document.body.appendChild(container);
      for(let i=0;i<18;i++){
        const ice = document.createElement('div');
        ice.className = 'bheart';
        ice.innerText = '🧊';
        const startX = Math.random()*100;
        ice.style.left = startX + 'vw';
        ice.style.top = '-10vh';
        ice.style.opacity = 1;
        ice.style.transform = 'scale(1)';
        ice.style.transition = 'transform 1300ms ease-out, top 1300ms linear, opacity 1300ms ease-out';
        container.appendChild(ice);
        setTimeout(()=>{
          ice.style.top = '100vh';
          ice.style.transform = 'scale(0.4)';
          ice.style.opacity = 0;
        }, 30 + i*35);
      }
      setTimeout(()=> container.remove(), 1500);
    }

    function showTinyNote(text){
      const t = document.createElement('div');
      t.style.position='fixed';
      t.style.right='18px';
      t.style.bottom='18px';
      t.style.padding='10px 14px';
      t.style.background='linear-gradient(90deg,#ff9fc9,#ff4da6)';
      t.style.color='white';
      t.style.borderRadius='12px';
      t.style.boxShadow='0 6px 20px rgba(0,0,0,0.18)';
      t.style.zIndex=999;
      t.innerText=text;
      document.body.appendChild(t);
      setTimeout(()=> t.style.opacity=0, 1600);
      setTimeout(()=> t.remove(), 2100);
    }

    /* Contagem regressiva 19/11/2025 18h */
    (function(){
      var countdownTimeEl = document.getElementById('countdownTime');
      var countdownMsgEl  = document.getElementById('countdownMsg');
      if(!countdownTimeEl || !countdownMsgEl) return;
      var targetDate = new Date('2025-12-24T05:00:00-03:00'); // encontro em 24/12/2025 �s 05h (Bras�lia)

      function pad2(n){ return (n<10?'0':'') + n; }

      function updateCountdown(){
        var now  = new Date();
        var diff = targetDate.getTime() - now.getTime();
        if(diff <= 0){
          countdownTimeEl.innerHTML =
            '<span>00d</span> <span>00h</span> <span>00m</span> <span>00s</span>';
          countdownMsgEl.textContent =
            'Já é o dia do encontro! Espero que vocês estejam juntinhos agora 💖';
          return;
        }
        var totalSeconds = Math.floor(diff / 1000);
        var days    = Math.floor(totalSeconds / 86400);
        var hours   = Math.floor((totalSeconds % 86400) / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = totalSeconds % 60;

        var htmlTime =
          '<span>' + pad2(days)    + 'd</span> ' +
          '<span>' + pad2(hours)   + 'h</span> ' +
          '<span>' + pad2(minutes) + 'm</span> ' +
          '<span>' + pad2(seconds) + 's</span>';
        countdownTimeEl.innerHTML = htmlTime;

        var msg;
        if(days > 1){
          msg = 'Faltam ' + days + ' dias pro próximo encontro. Aguenta coraçãozinho 💘';
        }else if(days === 1){
          msg = 'Falta 1 dia pro encontro! Já pode começar a surtar de ansiedade 🥹';
        }else{
          msg = 'É hoje! Daqui a pouquinho vocês vão se abraçar 💞';
        }
        countdownMsgEl.textContent = msg;
      }
      updateCountdown();
      setInterval(updateCountdown, 1000);
    })();

    /* Painel de satisfação */
    const satButtons = document.querySelectorAll('.sat-user-btn');
    const satCurrentUserLabel = document.getElementById('satCurrentUser');
    const satRows = document.querySelectorAll('.sat-row');
    const markerPablo = document.querySelector('.sat-marker-pablo');
    const markerAna   = document.querySelector('.sat-marker-ana');
    const satCard = document.querySelector('.satisfaction-card');

    const levelEmoji = {
      perfect: '💘',
      good: '⭐',
      chill: '😎',
      ice: '🧊',
      jail: '⛓️'
    };

    let currentUser = localStorage.getItem('satCurrentUser') || null;
    const jailExtra = document.getElementById('jailExtra');
    const jailLabel = document.getElementById('jailLabel');
    const jailText = document.getElementById('jailText');
    const jailSaveBtn = document.getElementById('jailSaveBtn');
    let jailStatus = {pablo:false, ana:false};
    let jailFor = null;

    function updateCurrentUserUI(){
      satButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.user === currentUser);
      });
      satCurrentUserLabel.textContent = currentUser ?
        (currentUser === 'pablo' ? 'Pablo (namorado)' : 'Ana Clara (namorada)') :
        'ninguém';
    }

    satButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        currentUser = btn.dataset.user;
        localStorage.setItem('satCurrentUser', currentUser);
        updateCurrentUserUI();
      });
    });
    updateCurrentUserUI();

    const levelMap = {};
    satRows.forEach(row => {
      levelMap[row.dataset.level] = row;
      row.addEventListener('click', () => {
        if(!currentUser){
          alert('Escolhe se você é o Pablo ou a Ana primeiro 😉');
          return;
        }
        const levelKey = row.dataset.level;
        const targetUser = currentUser === 'pablo' ? 'ana' : 'pablo';
        placeMarker(targetUser, levelKey);
        localStorage.setItem('satLevel_' + targetUser, levelKey);

        if(levelKey === 'perfect'){
          initialRain(24);
          popupHeartsBurst();
          popupEmojiBurst('💘');
          popupEmojiBurst('🔥');
          showTinyNote((targetUser === 'pablo' ? 'Pablo' : 'Ana') + ' é amorzinho perfeito(a)!');
        } else if(levelKey === 'good'){
          popupEmojiBurst('⭐');
          showTinyNote((targetUser === 'pablo' ? 'Pablo' : 'Ana') + ' está muito bonzinho(a) ⭐');
        } else if(levelKey === 'chill'){
          popupEmojiBurst('😎');
          showTinyNote((targetUser === 'pablo' ? 'Pablo' : 'Ana') + ' está de boa / chill 😎');
        } else if(levelKey === 'ice'){
          iceRain();
          showTinyNote((targetUser === 'pablo' ? 'Pablo' : 'Ana') + ' está em gelo fino 🧊');
        } else if(levelKey === 'jail'){
          showJailAnimation(targetUser);
          popupEmojiBurst('⛓️');
          showTinyNote((targetUser === 'pablo' ? 'Pablo' : 'Ana') + ' foi pra cadeia 😬');
        }

        if(db){
          firebase.database().ref('satisfaction/' + coupleId + '/' + targetUser).set(levelKey)
            .catch(err => console.warn('Erro ao salvar no Firebase:', err));
        }
      });
    });

    function placeMarker(user, levelKey){
      const row = levelMap[levelKey];
      if(!row) return;
      const container = row.querySelector('.sat-markers');
      const emoji = levelEmoji[levelKey] || '❤';
      const marker = (user === 'pablo') ? markerPablo : markerAna;
      const letra = (user === 'pablo') ? 'P ' : 'A ';
      marker.textContent = letra + emoji;
      container.appendChild(marker);

      jailStatus[user] = (levelKey === 'jail');
      updateJailUIFromStatus();
    }

    function updateJailUIFromStatus(){
      const someone = jailStatus.pablo ? 'pablo' : (jailStatus.ana ? 'ana' : null);
      jailFor = someone;
      if(!jailFor){
        jailExtra.style.display = 'none';
        return;
      }
      jailExtra.style.display = 'block';
      const alvoNome = jailFor === 'pablo' ? 'Pablo' : 'Ana';
      jailLabel.textContent = `O que o ${alvoNome} pode fazer para sair da cadeia?`;
      const noteKey = 'jailNote_' + jailFor;
      const note = localStorage.getItem(noteKey) || '';
      jailText.value = note;
    }

    function showJailAnimation(){
      if(!satCard) return;
      const wrap = document.createElement('div');
      wrap.className = 'jail-anim';
      const bars = document.createElement('div');
      bars.className = 'jail-bars';
      for(let i=0;i<5;i++){
        const s = document.createElement('span');
        bars.appendChild(s);
      }
      wrap.appendChild(bars);
      satCard.appendChild(wrap);
      setTimeout(()=>{ wrap.style.opacity='0'; }, 900);
      setTimeout(()=> wrap.remove(), 1300);
    }

    jailSaveBtn.addEventListener('click', () => {
      if(!jailFor){
        alert('Ninguém está na cadeia agora 😂');
        return;
      }
      const text = jailText.value.trim();
      const key = 'jailNote_' + jailFor;
      localStorage.setItem(key, text);
      if(db){
        firebase.database().ref('satisfaction/' + coupleId + '/note_' + jailFor).set(text)
          .catch(err => console.warn('Erro ao salvar nota da cadeia:', err));
      }
      showTinyNote('Plano para sair da cadeia salvo 📝');
    });

    const localPablo = localStorage.getItem('satLevel_pablo');
    const localAna = localStorage.getItem('satLevel_ana');
    if(localPablo) placeMarker('pablo', localPablo);
    if(localAna)   placeMarker('ana', localAna);

    if(db){
      firebase.database().ref('satisfaction/' + coupleId).on('value', snapshot => {
        const data = snapshot.val() || {};
        if(data.pablo){
          localStorage.setItem('satLevel_pablo', data.pablo);
          placeMarker('pablo', data.pablo);
        }
        if(data.ana){
          localStorage.setItem('satLevel_ana', data.ana);
          placeMarker('ana', data.ana);
        }
        if(data.note_pablo){
          localStorage.setItem('jailNote_pablo', data.note_pablo);
          if(jailFor === 'pablo') jailText.value = data.note_pablo;
        }
        if(data.note_ana){
          localStorage.setItem('jailNote_ana', data.note_ana);
          if(jailFor === 'ana') jailText.value = data.note_ana;
        }
      });
    }

    /* ENQUETE "SEXO HOJE" */
    const pollSexoBtns = document.querySelectorAll('.poll-btn[data-poll="sexo"]');
    const pollSexoStatus = document.getElementById('pollSexoStatus');

    function setSexoUI(choice){
      pollSexoBtns.forEach(btn => {
        btn.classList.toggle('selected', btn.getAttribute('data-value') === choice);
      });
      if(choice === 'sim'){
        pollSexoStatus.textContent = 'Última resposta: Sim 😈';
      }else if(choice === 'nao'){
        pollSexoStatus.textContent = 'Última resposta: Não 🙅‍♀️';
      }else{
        pollSexoStatus.textContent = 'Ainda sem resposta hoje.';
      }
    }

    pollSexoBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.getAttribute('data-value');
        setSexoUI(choice);
        if(db){
          firebase.database().ref('polls/' + coupleId + '/sexoHoje').set({
            value: choice,
            updatedAt: Date.now()
          }).catch(err => console.warn('Erro ao salvar enquete sexoHoje:', err));
        }
      });
    });

    if(db){
      firebase.database().ref('polls/' + coupleId + '/sexoHoje').on('value', snap => {
        const data = snap.val();
        if(!data || !data.value){
          setSexoUI(null);
          return;
        }
        setSexoUI(data.value);
      });
    }

    /* CARDÁPIO DO DIA */
    const menuInput  = document.getElementById('menuInput');
    const menuSaveBtn = document.getElementById('menuSaveBtn');
    const menuStatus = document.getElementById('menuStatus');

    menuSaveBtn.addEventListener('click', () => {
      const text = (menuInput.value || '').trim();
      if(!text){
        alert('Escreve alguma coisa pro cardápio 😋');
        return;
      }
      if(db){
        firebase.database().ref('polls/' + coupleId + '/cardapioHoje').set({
          text,
          updatedAt: Date.now()
        }).then(() => {
          showTinyNote('Cardápio atualizado 🍽️');
        }).catch(err => console.warn('Erro ao salvar cardápio:', err));
      }else{
        menuStatus.textContent = 'Sugestão atual: ' + text;
      }
    });

    if(db){
      firebase.database().ref('polls/' + coupleId + '/cardapioHoje').on('value', snap => {
        const data = snap.val();
        if(!data || !data.text){
          menuStatus.textContent = 'Sem sugestão ainda. Escrevam algo gostoso pra hoje 😋';
          return;
        }
        menuInput.value = data.text;
        menuStatus.textContent = 'Sugestão atual: ' + data.text;
      });
    }

    /* MURAL DE RECADOS */
    const muralText = document.getElementById('muralText');
    const muralIsTask = document.getElementById('muralIsTask');
    const muralAddBtn = document.getElementById('muralAddBtn');
    const muralList = document.getElementById('muralList');

    function renderMural(items){
      muralList.innerHTML = '';
      items.forEach(([id, item])=>{
        if(!item || !item.text) return;
        const li = document.createElement('li');
        li.className = 'mural-item' + (item.isTask ? ' mural-task' : '');
        li.dataset.id = id;

        const wrap = document.createElement('div');
        wrap.className = 'mural-text-wrap';

        const p = document.createElement('p');
        p.className = 'mural-text';
        p.textContent = item.text;
        if(item.isTask && item.done){
          p.classList.add('done');
        }
        wrap.appendChild(p);

        const meta = document.createElement('div');
        meta.className = 'mural-meta';
        const date = item.createdAt ? new Date(item.createdAt) : null;
        meta.textContent = (item.isTask ? 'Missão' : 'Recado') +
          (date ? ' • ' + date.toLocaleString('pt-BR',{dateStyle:'short', timeStyle:'short'}) : '');
        wrap.appendChild(meta);

        li.appendChild(wrap);

        const actions = document.createElement('div');
        actions.className = 'mural-actions';

        if(item.isTask){
          const btnDone = document.createElement('button');
          btnDone.className = 'btn-mini btn-mini-primary';
          btnDone.textContent = item.done ? 'Desmarcar' : 'Feito';
          btnDone.addEventListener('click', ()=>{
            if(db){
              firebase.database().ref('mural/' + coupleId + '/' + id + '/done').set(!item.done);
            }
          });
          actions.appendChild(btnDone);
        }

        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-mini btn-mini-danger';
        btnDelete.textContent = 'Apagar';
        btnDelete.addEventListener('click', ()=>{
          if(!confirm('Apagar este recadinho?')) return;
          if(db){
            firebase.database().ref('mural/' + coupleId + '/' + id).remove();
          }else{
            li.remove();
          }
        });
        actions.appendChild(btnDelete);

        li.appendChild(actions);
        muralList.appendChild(li);
      });
    }

    muralAddBtn.addEventListener('click', ()=>{
      const text = (muralText.value || '').trim();
      const isTask = muralIsTask.checked;
      if(!text){
        alert('Escreve alguma coisa antes de adicionar o recado 😊');
        return;
      }
      const data = {
        text,
        isTask,
        done:false,
        createdAt: Date.now()
      };
      if(db){
        firebase.database().ref('mural/' + coupleId).push(data)
          .then(()=> showTinyNote('Recado adicionado no mural 💌'))
          .catch(err=> console.warn('Erro ao salvar recado:', err));
      }
      muralText.value = '';
      muralIsTask.checked = false;
    });

    if(db){
      firebase.database().ref('mural/' + coupleId).on('value', snap=>{
        const data = snap.val() || {};
        const entries = Object.entries(data).sort((a,b)=>{
          const va = (a[1] && a[1].createdAt) || 0;
          const vb = (b[1] && b[1].createdAt) || 0;
          return va - vb;
        });
        renderMural(entries);
      });
    }

    /* SPOTIFY WEB PLAYBACK (implicit grant) */
    const SPOTIFY_CLIENT_ID = 'd87db58ea9434615bb2c2603e7ff4326';
    const SPOTIFY_REDIRECT_URI = window.location.origin + window.location.pathname;
    const SPOTIFY_PLAYLIST_URI = 'spotify:playlist:3RitDlOniO6hRIQxmLWrMw';

    // Detecção simples de mobile (pra limitar o player Premium ao desktop)
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent || '');

    const spotifyLoginBtn = document.getElementById('spotifyLoginBtn');
    const spotifyPlayBtn  = document.getElementById('spotifyPlayBtn');
    const spotifyStatusEl = document.getElementById('spotifyStatus');
    const spotifyLogEl    = document.getElementById('spotifyLog');

    function logSpotify(msg){
      if(!spotifyLogEl) return;
      const now = new Date().toLocaleTimeString('pt-BR',{hour12:false});
      spotifyLogEl.textContent += '[' + now + '] ' + msg + '\n';
      spotifyLogEl.scrollTop = spotifyLogEl.scrollHeight;
      console.log('[Spotify]', msg);
    }

    function updateSpotifyStatus(text){
      if(spotifyStatusEl){
        spotifyStatusEl.textContent = text;
      }
      logSpotify(text);
    }

    function getStoredSpotifyToken(){
      const raw = localStorage.getItem('spotifyAuth');
      if(!raw) return null;
      try{
        const data = JSON.parse(raw);
        if(!data.access_token || !data.expires_at) return null;
        if(Date.now() > data.expires_at){
          logSpotify('Token expirado, removendo.');
          localStorage.removeItem('spotifyAuth');
          return null;
        }
        return data.access_token;
      }catch(e){
        console.warn('Erro ao ler token Spotify:', e);
        return null;
      }
    }

    function storeSpotifyToken(accessToken, expiresInSec){
      const expiresAt = Date.now() + (expiresInSec*1000 - 60000);
      const payload = {access_token: accessToken, expires_at: expiresAt};
      localStorage.setItem('spotifyAuth', JSON.stringify(payload));
      logSpotify('Token Spotify salvo com sucesso.');
    }

    function parseTokenFromHash(){
      if(!window.location.hash || window.location.hash.indexOf('access_token=') === -1){
        return null;
      }
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const tokenType   = params.get('token_type');
      const expiresIn   = parseInt(params.get('expires_in') || '3600', 10);
      if(!accessToken) return null;
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      logSpotify('Token recebido via fragmento (implicit grant).');
      storeSpotifyToken(accessToken, expiresIn);
      return accessToken;
    }

    function ensureSpotifyToken(){
      let token = getStoredSpotifyToken();
      if(token){
        updateSpotifyStatus('Conectado ao Spotify ✅');
        return token;
      }
      token = parseTokenFromHash();
      if(token){
        updateSpotifyStatus('Conectado ao Spotify ✅');
        return token;
      }
      return null;
    }

    function startSpotifyLogin(){
      const scopes = [
        'streaming',
        'user-read-email',
        'user-read-private',
        'user-modify-playback-state'
      ];
      const authUrl = 'https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
          client_id: SPOTIFY_CLIENT_ID,
          response_type: 'token',
          redirect_uri: SPOTIFY_REDIRECT_URI,
          scope: scopes.join(' '),
          show_dialog: 'true'
        }).toString();
      logSpotify('Redirecionando para login Spotify...');
      window.location.href = authUrl;
    }

    let spotifyPlayer = null;
    let spotifyDeviceId = null;
    let spotifySDKReady = false;
    let spotifyPlayerReady = false;

    window.onSpotifyWebPlaybackSDKReady = () => {
      spotifySDKReady = true;
      logSpotify('Spotify Web Playback SDK pronto.');
      const token = ensureSpotifyToken();
      if(token){
        createSpotifyPlayer(token);
      }else{
        updateSpotifyStatus('Clique em "Entrar com Spotify" para conectar sua conta.');
      }
    };

    function createSpotifyPlayer(token){
      if(!window.Spotify || !spotifySDKReady){
        logSpotify('SDK Spotify ainda não está disponível.');
        return;
      }
      if(spotifyPlayer){
        spotifyPlayer.disconnect();
      }
      spotifyPlayer = new Spotify.Player({
        name: 'Player do Pablo & Ana Clara 💖',
        getOAuthToken: cb => { cb(token); },
        volume: 0.8
      });

      spotifyPlayer.addListener('ready', ({ device_id }) => {
        spotifyDeviceId = device_id;
        spotifyPlayerReady = true;
        updateSpotifyStatus('Player conectado! Device ID: ' + device_id);
      });

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        spotifyDeviceId = null;
        spotifyPlayerReady = false;
        updateSpotifyStatus('Player Spotify não está pronto (device ' + device_id + ').');
      });

      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        logSpotify('Erro de inicialização: ' + message);
      });
      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        logSpotify('Erro de autenticação: ' + message);
        localStorage.removeItem('spotifyAuth');
        updateSpotifyStatus('Problema na autenticação. Tente fazer login de novo.');
      });
      spotifyPlayer.addListener('account_error', ({ message }) => {
        logSpotify('Erro de conta: ' + message);
        updateSpotifyStatus('Sua conta precisa ser Premium pra tocar aqui 💚');
      });
      spotifyPlayer.addListener('playback_error', ({ message }) => {
        logSpotify('Erro de reprodução: ' + message);
      });

      spotifyPlayer.connect().then(success => {
        if(success){
          logSpotify('Conexão com player solicitada.');
        }else{
          logSpotify('Não consegui conectar o player.');
        }
      });
    }

    if(!isMobile){
      spotifyLoginBtn && spotifyLoginBtn.addEventListener('click', ()=>{
        startSpotifyLogin();
      });

      spotifyPlayBtn && spotifyPlayBtn.addEventListener('click', async ()=>{
        const token = ensureSpotifyToken();
        if(!token){
          alert('Antes clique em "Entrar com Spotify" pra fazer login. 💚');
          return;
        }
        if(!spotifyPlayer || !spotifySDKReady){
          logSpotify('Criando player Spotify...');
          createSpotifyPlayer(token);
          setTimeout(()=> playSpotifyPlaylist(token), 1800);
        }else{
          playSpotifyPlaylist(token);
        }
      });
    }else{
      // No celular, esconder os botões do player Premium e mostrar uma mensagem amigável
      if(spotifyLoginBtn) spotifyLoginBtn.style.display = 'none';
      if(spotifyPlayBtn) spotifyPlayBtn.style.display  = 'none';
      const logDetails = document.querySelector('.music-log-details');
      if(logDetails) logDetails.style.display = 'none';
      if(spotifyStatusEl){
        spotifyStatusEl.textContent = 'No celular, use a música do site ou o player de prévia/Spotify app 💚. No computador, dá pra entrar com Spotify Premium e ouvir tudo aqui.';
      }
    }

    async function playSpotifyPlaylist(token){
      if(!spotifyDeviceId){
        updateSpotifyStatus('Player ainda não pronto, tentando conectar...');
        return;
      }
      try{
        updateSpotifyStatus('Enviando comando pra tocar a playlist...');
        const resp = await fetch('https://api.spotify.com/v1/me/player/play?device_id=' + encodeURIComponent(spotifyDeviceId), {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            context_uri: SPOTIFY_PLAYLIST_URI,
            offset: { position: 0 }
          })
        });
        if(resp.status === 204){
          updateSpotifyStatus('Playlist tocando! Se não ouvir, abre o app do Spotify e escolhe o player "Pablo & Ana Clara".');
        }else{
          const txt = await resp.text();
          logSpotify('Resposta diferente de 204: ' + resp.status + ' ' + txt);
          updateSpotifyStatus('Tente abrir o app do Spotify e ver se o dispositivo aparece.');
        }
      }catch(e){
        logSpotify('Erro ao chamar /play: ' + e);
        updateSpotifyStatus('Deu algum erro ao mandar tocar 😢');
      }
    }

    // Ao carregar a página:
    // - no desktop: tenta recuperar token do Spotify pra já mostrar conectado
    // - no celular: só mantém a mensagem de uso via app/preview
    document.addEventListener('DOMContentLoaded', ()=>{
      if(isMobile){
        if(spotifyStatusEl && !spotifyStatusEl.textContent){
          spotifyStatusEl.textContent = 'No celular, use a música do site ou o player de prévia/Spotify app 💚.';
        }
        return;
      }
      const token = ensureSpotifyToken();
      if(token){
        updateSpotifyStatus('Conectado ao Spotify ✅ (cliquem em "Tocar playlist aqui")');
      }
    });
  
    
    // =======================
    // Seções extras do casal
    // =======================
    (function(){
      const LS_PREFIX = 'acLove_';

      function saveLS(key, value){
        try{
          localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
        }catch(e){}
      }
      function loadLS(key, def){
        try{
          const raw = localStorage.getItem(LS_PREFIX + key);
          if(!raw) return def;
          return JSON.parse(raw);
        }catch(e){
          return def;
        }
      }
      function uid(){
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
      }

      function hasFirebase(){
        try{
          return typeof db !== 'undefined' && !!db && typeof coupleId !== 'undefined';
        }catch(e){
          return false;
        }
      }
      function syncToFirebase(sectionKey, data){
        if(!hasFirebase()) return;
        try{
          db.ref('extras/' + coupleId + '/' + sectionKey).set(data);
        }catch(e){
          console.warn('Erro ao salvar seção extra no Firebase:', sectionKey, e);
        }
      }
      function listenFromFirebase(sectionKey, setter){
        if(!hasFirebase()) return;
        try{
          db.ref('extras/' + coupleId + '/' + sectionKey).on('value', function(snap){
            const val = snap.val();
            let arr;
            if(val == null){
              arr = [];
            }else if(Array.isArray(val)){
              arr = val;
            }else if(typeof val === 'object'){
              arr = Object.values(val);
            }else{
              arr = [];
            }
            setter(arr);
          });
        }catch(e){
          console.warn('Erro ao ler seção extra do Firebase:', sectionKey, e);
        }
      }

      // ---- Linha do tempo ----
      const tlDate = document.getElementById('timelineDate');
      const tlTitle = document.getElementById('timelineTitle');
      const tlDesc = document.getElementById('timelineDesc');
      const tlBtn = document.getElementById('timelineAddBtn');
      const tlList = document.getElementById('timelineList');
      let tlData = loadLS('timeline', []);

      function setTimelineData(arr){
        tlData = Array.isArray(arr) ? arr : [];
        saveLS('timeline', tlData);
        renderTimeline();
      }
      function renderTimeline(){
        if(!tlList) return;
        tlList.innerHTML = '';
        const sorted = [].concat(tlData).sort(function(a,b){
          return (a.date || '').localeCompare(b.date || '');
        });
        sorted.forEach(function(item){
          const li = document.createElement('li');
          const title = document.createElement('div');
          title.textContent = (item.date || '') + (item.title ? ' — ' + item.title : '');
          const desc = document.createElement('div');
          desc.textContent = item.desc || '';
          desc.className = 'extra-meta';
          li.appendChild(title);
          if(item.desc){
            li.appendChild(desc);
          }
          tlList.appendChild(li);
        });
      }
      if(tlBtn && tlList){
        tlBtn.addEventListener('click', function(){
          const d = tlDate.value || '';
          const t = (tlTitle.value || '').trim();
          const desc = (tlDesc.value || '').trim();
          if(!d && !t && !desc) return;
          tlData.push({id:uid(), date:d, title:t, desc:desc});
          saveLS('timeline', tlData);
          syncToFirebase('timeline', tlData);
          tlTitle.value = '';
          tlDesc.value = '';
          renderTimeline();
        });
        renderTimeline();
        listenFromFirebase('timeline', setTimelineData);
      }

      // ---- Lugares especiais ----
      const plName = document.getElementById('placeName');
      const plAddr = document.getElementById('placeAddress');
      const plBtn = document.getElementById('placeAddBtn');
      const plList = document.getElementById('placesList');
      let plData = loadLS('places', []);

      function setPlacesData(arr){
        plData = Array.isArray(arr) ? arr : [];
        saveLS('places', plData);
        renderPlaces();
      }
      function renderPlaces(){
        if(!plList) return;
        plList.innerHTML = '';
        plData.forEach(function(item){
          const li = document.createElement('li');
          const title = document.createElement('div');
          title.textContent = item.name || item.address || 'Lugar';
          const meta = document.createElement('div');
          meta.className = 'extra-meta';
          meta.textContent = item.address || '';
          const a = document.createElement('a');
          a.href = item.mapUrl;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = 'Abrir no mapa';
          li.appendChild(title);
          if(item.address){
            li.appendChild(meta);
          }
          li.appendChild(a);
          plList.appendChild(li);
        });
      }
      if(plBtn && plList){
        plBtn.addEventListener('click', function(){
          const name = (plName.value || '').trim();
          const address = (plAddr.value || '').trim();
          if(!name && !address) return;
          const query = address || name;
          const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
          plData.push({id:uid(), name:name, address:address, mapUrl:mapUrl});
          saveLS('places', plData);
          syncToFirebase('places', plData);
          plName.value = '';
          plAddr.value = '';
          renderPlaces();
        });
        renderPlaces();
        listenFromFirebase('places', setPlacesData);
      }

      // ---- Bucket list ----
      const bkInput = document.getElementById('bucketInput');
      const bkBtn = document.getElementById('bucketAddBtn');
      const bkList = document.getElementById('bucketList');
      const bkProgress = document.getElementById('bucketProgress');
      let bkData = loadLS('bucket', []);

      function setBucketData(arr){
        bkData = Array.isArray(arr) ? arr : [];
        saveLS('bucket', bkData);
        renderBucket();
      }
      function updateBucketProgress(){
        if(!bkProgress) return;
        const total = bkData.length;
        const done = bkData.filter(function(i){return i.done;}).length;
        if(!total){
          bkProgress.textContent = 'Nenhum sonho marcado ainda.';
        }else{
          const pct = Math.round((done/total)*100);
          bkProgress.textContent = done + ' de ' + total + ' sonhos concluídos (' + pct + '%).';
        }
      }
      function renderBucket(){
        if(!bkList) return;
        bkList.innerHTML = '';
        bkData.forEach(function(item){
          const li = document.createElement('li');
          const label = document.createElement('label');
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.checked = !!item.done;
          cb.addEventListener('change', function(){
            item.done = cb.checked;
            saveLS('bucket', bkData);
            syncToFirebase('bucket', bkData);
            updateBucketProgress();
          });
          const text = document.createElement('span');
          text.textContent = item.text;
          label.appendChild(cb);
          label.appendChild(text);
          li.appendChild(label);
          bkList.appendChild(li);
        });
        updateBucketProgress();
      }
      if(bkBtn && bkList){
        bkBtn.addEventListener('click', function(){
          const txt = (bkInput.value || '').trim();
          if(!txt) return;
          bkData.push({id:uid(), text:txt, done:false});
          saveLS('bucket', bkData);
          syncToFirebase('bucket', bkData);
          bkInput.value = '';
          renderBucket();
        });
        renderBucket();
        listenFromFirebase('bucket', setBucketData);
      }

      // ---- Pote do amor ----
      const ljInput = document.getElementById('loveJarInput');
      const ljAddBtn = document.getElementById('loveJarAddBtn');
      const ljRandomBtn = document.getElementById('loveJarRandomBtn');
      const ljRandomText = document.getElementById('loveJarRandomText');
      const ljList = document.getElementById('loveJarList');
      let ljData = loadLS('loveJar', []);

      function setLoveJarData(arr){
        ljData = Array.isArray(arr) ? arr : [];
        saveLS('loveJar', ljData);
        renderLoveJar();
      }
      function renderLoveJar(){
        if(!ljList) return;
        ljList.innerHTML = '';
        ljData.forEach(function(item){
          const li = document.createElement('li');
          const txt = document.createElement('div');
          txt.textContent = item.text;
          const meta = document.createElement('div');
          meta.className = 'extra-meta';
          meta.textContent = item.date || '';
          li.appendChild(txt);
          if(item.date){
            li.appendChild(meta);
          }
          ljList.appendChild(li);
        });
      }
      function randomLoveNote(){
        if(!ljData.length){
          if(ljRandomText) ljRandomText.textContent = 'Ainda não tem nenhum bilhete salvo.';
          return;
        }
        const item = ljData[Math.floor(Math.random()*ljData.length)];
        if(ljRandomText){
          ljRandomText.textContent = item.text + (item.date ? ' (' + item.date + ')' : '');
        }
      }
      if(ljAddBtn){
        ljAddBtn.addEventListener('click', function(){
          const txt = (ljInput.value || '').trim();
          if(!txt) return;
          const today = new Date();
          const dateStr = today.toLocaleDateString('pt-BR');
          ljData.push({id:uid(), text:txt, date:dateStr});
          saveLS('loveJar', ljData);
          syncToFirebase('loveJar', ljData);
          ljInput.value = '';
          renderLoveJar();
        });
      }
      if(ljRandomBtn){
        ljRandomBtn.addEventListener('click', randomLoveNote);
      }
      if(ljList){
        renderLoveJar();
        listenFromFirebase('loveJar', setLoveJarData);
      }

      // ---- Quiz do casal ----
      const quizContainer = document.getElementById('quizContainer');
      const quizResult = document.getElementById('quizResult');
      const quizData = [
        {
          q: 'Quando a gente mais sente falta um do outro?',
          options: ['De manhã', 'No meio do dia', 'À noite', 'Nunca sentimos falta'],
          correct: 2
        },
        {
          q: 'Qual é o melhor programa pra nós dois?',
          options: ['Ver filme abraçados', 'Sair pra comer', 'Viajar juntos', 'Qualquer coisa, se for contigo'],
          correct: 3
        },
        {
          q: 'Se o nosso amor fosse um emoji, qual seria?',
          options: ['💔', '🙂', '🔥', '💖'],
          correct: 3
        }
      ];
      let quizAnswers = {};

      function updateQuizResult(){
        if(!quizResult) return;
        const total = quizData.length;
        let correct = 0;
        quizData.forEach(function(item, idx){
          if(quizAnswers[idx] === item.correct) correct++;
        });
        if(Object.keys(quizAnswers).length === 0){
          quizResult.textContent = '';
          return;
        }
        if(correct === total){
          quizResult.textContent = 'Vocês são 100% almas gêmeas, tá decidido. 💖';
        }else{
          quizResult.textContent = correct + ' de ' + total + ' respostas combinando. O importante é rir juntos!';
        }
      }
      function renderQuiz(){
        if(!quizContainer) return;
        quizContainer.innerHTML = '';
        quizData.forEach(function(item, qi){
          const wrap = document.createElement('div');
          wrap.className = 'quiz-question';
          const q = document.createElement('div');
          q.textContent = item.q;
          wrap.appendChild(q);
          const optsWrap = document.createElement('div');
          optsWrap.className = 'quiz-options';
          item.options.forEach(function(opt, oi){
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quiz-option-btn';
            btn.textContent = opt;
            btn.addEventListener('click', function(){
              quizAnswers[qi] = oi;
              Array.prototype.forEach.call(optsWrap.children, function(ch){
                ch.classList.remove('selected-correct', 'selected-wrong');
              });
              if(oi === item.correct){
                btn.classList.add('selected-correct');
              }else{
                btn.classList.add('selected-wrong');
              }
              updateQuizResult();
            });
            optsWrap.appendChild(btn);
          });
          wrap.appendChild(optsWrap);
          quizContainer.appendChild(wrap);
        });
      }
      if(quizContainer){
        renderQuiz();
      }

      // ---- Vídeos ----
      const vdTitle = document.getElementById('videoTitle');
      const vdUrl = document.getElementById('videoUrl');
      const vdBtn = document.getElementById('videoAddBtn');
      const vdList = document.getElementById('videosList');
      let vdData = loadLS('videos', []);

      function setVideosData(arr){
        vdData = Array.isArray(arr) ? arr : [];
        saveLS('videos', vdData);
        renderVideos();
      }
      function renderVideos(){
        if(!vdList) return;
        vdList.innerHTML = '';
        vdData.forEach(function(item){
          const li = document.createElement('li');
          const title = document.createElement('div');
          title.textContent = item.title || 'Vídeo';
          const a = document.createElement('a');
          a.href = item.url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = item.url;
          li.appendChild(title);
          li.appendChild(a);
          vdList.appendChild(li);
        });
      }
      if(vdBtn && vdList){
        vdBtn.addEventListener('click', function(){
          const t = (vdTitle.value || '').trim();
          const u = (vdUrl.value || '').trim();
          if(!u) return;
          vdData.push({id:uid(), title:t, url:u});
          saveLS('videos', vdData);
          syncToFirebase('videos', vdData);
          vdTitle.value = '';
          vdUrl.value = '';
          renderVideos();
        });
        renderVideos();
        listenFromFirebase('videos', setVideosData);
      }

      // ---- Calendário ----
      const evDate = document.getElementById('eventDate');
      const evTime = document.getElementById('eventTime');
      const evTitle = document.getElementById('eventTitle');
      const evBtn = document.getElementById('eventAddBtn');
      const evList = document.getElementById('eventsList');
      let evData = loadLS('events', []);

      function setEventsData(arr){
        evData = Array.isArray(arr) ? arr : [];
        saveLS('events', evData);
        renderEvents();
      }
      function renderEvents(){
        if(!evList) return;
        evList.innerHTML = '';
        const sorted = [].concat(evData).sort(function(a,b){
          const da = (a.date || '') + ' ' + (a.time || '');
          const db = (b.date || '') + ' ' + (b.time || '');
          return da.localeCompare(db);
        });
        sorted.forEach(function(item){
          const li = document.createElement('li');
          const title = document.createElement('div');
          const dt = (item.date || '') + (item.time ? ' às ' + item.time : '');
          title.textContent = item.title || 'Evento';
          const meta = document.createElement('div');
          meta.className = 'extra-meta';
          meta.textContent = dt;
          li.appendChild(title);
          if(dt.trim()){
            li.appendChild(meta);
          }
          evList.appendChild(li);
        });
      }
      if(evBtn && evList){
        evBtn.addEventListener('click', function(){
          const d = evDate.value || '';
          const t = evTime.value || '';
          const title = (evTitle.value || '').trim();
          if(!d && !title) return;
          evData.push({id:uid(), date:d, time:t, title:title});
          saveLS('events', evData);
          syncToFirebase('events', evData);
          evTitle.value = '';
          renderEvents();
        });
        renderEvents();
        listenFromFirebase('events', setEventsData);
      }

      // ---- Inspirações ----
      const idInput = document.getElementById('ideaText');
      const idBtn = document.getElementById('ideaAddBtn');
      const idList = document.getElementById('ideasList');
      let idData = loadLS('ideas', []);

      function setIdeasData(arr){
        idData = Array.isArray(arr) ? arr : [];
        saveLS('ideas', idData);
        renderIdeas();
      }
      function renderIdeas(){
        if(!idList) return;
        idList.innerHTML = '';
        idData.forEach(function(item){
          const li = document.createElement('li');
          li.textContent = item.text;
          idList.appendChild(li);
        });
      }
      if(idBtn && idList){
        idBtn.addEventListener('click', function(){
          const txt = (idInput.value || '').trim();
          if(!txt) return;
          idData.push({id:uid(), text:txt});
          saveLS('ideas', idData);
          syncToFirebase('ideas', idData);
          idInput.value = '';
          renderIdeas();
        });
        renderIdeas();
        listenFromFirebase('ideas', setIdeasData);
      }

      // ---- Histórico de humor (gráfico) ----
      const moodCanvas = document.getElementById('moodChart');
      const moodStatus = document.getElementById('moodChartStatus');
      let moodData = loadLS('moodHistory', []);

      function setMoodData(arr){
        moodData = Array.isArray(arr) ? arr : [];
        saveLS('moodHistory', moodData);
        drawMoodChart();
      }
      function moodLevelValue(level){
        switch(level){
          case 'perfect': return 5;
          case 'good': return 4;
          case 'chill': return 3;
          case 'ice': return 2;
          case 'jail': return 1;
          default: return 3;
        }
      }
      function drawMoodChart(){
        if(!moodCanvas){
          return;
        }
        const ctx = moodCanvas.getContext('2d');
        const w = moodCanvas.width;
        const h = moodCanvas.height;
        ctx.clearRect(0,0,w,h);
        if(!moodData.length){
          if(moodStatus){
            moodStatus.textContent = 'Ainda não há votos suficientes pra mostrar o gráfico. Use o painel "Nível de satisfação com o mozão".';
          }
          return;
        }
        if(moodStatus){
          moodStatus.textContent = 'Mostrando até ' + moodData.length + ' votos recentes.';
        }
        const minV = 1;
        const maxV = 5;
        const margin = 20;
        const innerW = w - margin*2;
        const innerH = h - margin*2;
        const stepX = innerW / Math.max(1, moodData.length-1);

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#cccccc';
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, h - margin);
        ctx.lineTo(w - margin, h - margin);
        ctx.stroke();

        ctx.strokeStyle = '#ff4da6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        moodData.forEach(function(item, idx){
          const x = margin + stepX*idx;
          const norm = (item.v - minV) / (maxV - minV || 1);
          const y = (h - margin) - norm * innerH;
          if(idx === 0) ctx.moveTo(x,y);
          else ctx.lineTo(x,y);
        });
        ctx.stroke();

        ctx.fillStyle = '#ff4da6';
        moodData.forEach(function(item, idx){
          const x = margin + stepX*idx;
          const norm = (item.v - minV) / (maxV - minV || 1);
          const y = (h - margin) - norm * innerH;
          ctx.beginPath();
          ctx.arc(x,y,3,0,Math.PI*2);
          ctx.fill();
        });
      }
      function registerMood(level){
        const who = localStorage.getItem('satCurrentUser') || 'desconhecido';
        const now = new Date();
        moodData.push({
          t: now.toISOString(),
          level: level,
          who: who,
          v: moodLevelValue(level)
        });
        if(moodData.length > 50){
          moodData = moodData.slice(moodData.length - 50);
        }
        saveLS('moodHistory', moodData);
        syncToFirebase('moodHistory', moodData);
        drawMoodChart();
      }
      if(moodCanvas){
        drawMoodChart();
        listenFromFirebase('moodHistory', setMoodData);
        const satRows = document.querySelectorAll('.sat-row');
        satRows.forEach(function(row){
          row.addEventListener('click', function(){
            const levelKey = row.dataset.level;
            if(levelKey){
              registerMood(levelKey);
            }
          });
        });
      }

      // ---- Notificações ----
      const notifRequestBtn = document.getElementById('notifRequestBtn');
      const notifTestBtn = document.getElementById('notifTestBtn');
      const notifStatus = document.getElementById('notifStatus');

      function updateNotifStatus(msg){
        if(notifStatus){
          notifStatus.textContent = msg;
        }
      }
      if('Notification' in window){
        updateNotifStatus('As notificações estão disponíveis neste navegador.');
      }else if(notifStatus){
        updateNotifStatus('Esse navegador não suporta notificações, mas o resto do site funciona normal 🙂.');
      }

      if(notifRequestBtn){
        notifRequestBtn.addEventListener('click', function(){
          if(!('Notification' in window)){
            updateNotifStatus('Notificações não suportadas aqui.');
            return;
          }
          Notification.requestPermission().then(function(permission){
            if(permission === 'granted'){
              updateNotifStatus('Notificações ativadas! Você pode receber lembretes fofos.');
            }else if(permission === 'denied'){
              updateNotifStatus('Notificações bloqueadas. Se quiser, você pode reativar nas configurações do navegador.');
            }else{
              updateNotifStatus('Permissão de notificação pendente.');
            }
          }).catch(function(){
            updateNotifStatus('Não foi possível pedir permissão de notificação.');
          });
        });
      }

      if(notifTestBtn){
        notifTestBtn.addEventListener('click', function(){
          if(!('Notification' in window)){
            updateNotifStatus('Notificações não suportadas aqui.');
            return;
          }
          if(Notification.permission !== 'granted'){
            updateNotifStatus('Ative as notificações primeiro para testar.');
            return;
          }
          try{
            new Notification('Lembrete fofinho 💕', {
              body: 'Passando só pra lembrar que vocês se amam muito.'
            });
            updateNotifStatus('Notificação de teste enviada.');
          }catch(e){
            updateNotifStatus('Não deu pra enviar a notificação de teste.');
          }
        });
      }
    })();








