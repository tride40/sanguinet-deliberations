(function(){
  const DEMO = {
    session:{id:1,title:'Conseil municipal du 28 septembre 2026',subtitle:'Lundi 28 septembre 2026 — 20h00',members:27,present:22,proxies:3,absent:2,president:'M. le Maire',secretary:'Mme Claire Martin'},
    elus:['M. le Maire','Mme Claire Martin','M. Jean Dupont','Mme Sophie Bernard','M. Julien Moreau','Mme Nathalie Petit','M. Thierry Blanc'],
    groups:[
      {id:'majority',name:'Groupe majoritaire',size:21,vote:'Pour'},
      {id:'minority1',name:'Groupe minoritaire 1',size:3,vote:'Pour'},
      {id:'minority2',name:'Groupe minoritaire 2',size:3,vote:'Pour'}
    ],
    points:[
      {n:1,title:'Approbation du procès-verbal',state:'done',reference:'',rapporteur:'M. le Maire',service:'DGS',description:'Approbation du procès-verbal de la séance précédente.'},
      {n:2,title:'Compte rendu des décisions du Maire',state:'done',reference:'',rapporteur:'M. le Maire',service:'DGS',description:'Présentation du compte rendu des décisions prises par délégation.'},
      {n:3,title:'Décision modificative n°2',state:'done',reference:'2026-70',rapporteur:'M. le Maire',service:'Finances',description:'Ajustement des crédits budgétaires de l’exercice.'},
      {n:4,title:'Subvention aux associations 2026',state:'done',reference:'2026-71',rapporteur:'Mme Claire Martin',service:'Culture et vie associative',description:'Attribution des subventions annuelles aux associations communales.'},
      {n:5,title:'Création d’un emploi permanent',state:'done',reference:'2026-72',rapporteur:'M. le Maire',service:'Ressources humaines',description:'Création d’un emploi permanent au sein des services techniques.'},
      {n:6,title:'Convention de mise à disposition d’un terrain',state:'current',reference:'2026-73',rapporteur:'M. Jean Dupont',service:'Urbanisme et aménagement',description:'Il est proposé au conseil municipal d’approuver la convention de mise à disposition d’un terrain communal.'},
      {n:7,title:'Tarifs municipaux 2027',state:'upcoming',reference:'2026-74',rapporteur:'Mme Claire Martin',service:'Finances',description:'Actualisation des tarifs municipaux applicables à compter du 1er janvier 2027.'},
      {n:8,title:'Convention de partenariat avec le Parc naturel régional',state:'upcoming',reference:'2026-75',rapporteur:'M. Jean Dupont',service:'Environnement',description:'Autorisation de signature d’une convention de partenariat.'},
      {n:9,title:'Acquisition foncière – parcelle AC n°128',state:'upcoming',reference:'2026-76',rapporteur:'M. le Maire',service:'Urbanisme et aménagement',description:'Acquisition d’une parcelle nécessaire à un projet communal.'},
      {n:10,title:'Plan communal de sauvegarde : mise à jour',state:'upcoming',reference:'2026-77',rapporteur:'M. le Maire',service:'Police et sécurité',description:'Approbation de la mise à jour du plan communal de sauvegarde.'},
      {n:11,title:'Questions diverses',state:'upcoming',reference:'',rapporteur:'',service:'',description:'Questions diverses.'},
      {n:12,title:'Informations du Maire',state:'upcoming',reference:'',rapporteur:'M. le Maire',service:'',description:'Informations communiquées au Conseil municipal.'},
      {n:13,title:'Point d’information travaux',state:'upcoming',reference:'',rapporteur:'',service:'Technique',description:'Point d’information sur les travaux communaux.'},
      {n:14,title:'Clôture de la séance',state:'upcoming',reference:'',rapporteur:'',service:'',description:'Clôture de la séance.'}
    ]
  };

  const state = {session:structuredClone(DEMO.session),points:structuredClone(DEMO.points),groups:structuredClone(DEMO.groups),elus:[...DEMO.elus],currentIndex:5,decision:'Adoptée',mode:'unanimity',votes:{for:25,against:0,abstain:0,nppv:0},connected:false};
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  let editingValidated=false;
  function snapshot(){return structuredClone({decision:state.decision,mode:state.mode,votes:state.votes,groups:state.groups,overrides:state.overrides||{},detailOpen:state.detailOpen||false,tieChoice:state.tieChoice||''});}
  state.points.forEach(p=>{p.result=snapshot();});
  function currentPoint(){return state.points[state.currentIndex];}
  function isLocked(){return currentPoint().state==='done'&&!editingValidated;}
  function restorePoint(){Object.assign(state,structuredClone(currentPoint().result));}
  function renderLock(){
    const locked=isLocked(),validated=currentPoint().state==='done';
    $('#validationNotice').hidden=!validated;
    $('#validationNotice').classList.toggle('editing',editingValidated);
    $('#validationMessage').textContent=editingValidated?'Modification en cours — validez à nouveau pour appliquer les changements.':'✓ Résultat validé — consultation en lecture seule.';
    $('#editValidatedBtn').hidden=!locked;$('#cancelEditBtn').hidden=!editingValidated;
    $('#pointStatus').textContent=editingValidated?'À revalider':validated?'Validé':'En cours';
    $('#pointStatus').className='status-pill '+(editingValidated?'revision':validated?'validated':'current');
    $$('.decision-card button,#groupsPanel button,#groupsPanel select,#detailPanel select,#moreActionsBtn,#saveDraftBtn,#validateNextBtn').forEach(el=>el.disabled=locked);
    $('#showExceptionsBtn').disabled=false;
    $('#tieChoice').disabled=locked;
    $('#validateNextBtn').disabled=locked||voteOutcome().pending;
    $('#saveDraftBtn').hidden=validated;
    $('#validateNextBtn').hidden=locked;
    $('#validateNextBtn').textContent=editingValidated?'Valider les modifications':state.currentIndex===state.points.length-1?'Valider le résultat':'Valider le résultat et passer au point suivant →';
  }
  function renderRing(){
    const circle=$('#resultCircle'),v=state.votes;
    const hasVote=['Adoptée','Rejetée'].includes(state.decision);
    const total=v.for+v.against+v.abstain+v.nppv;
    let start=0;
    const segments=[['for','#23a55a'],['against','#df3f4f'],['abstain','#f3a61b'],['nppv','#8d9caf']].map(([key,color])=>{
      const end=start+(total?v[key]/total*100:0);const segment=`${color} ${start}% ${end}%`;start=end;return segment;
    });
    circle.style.background=hasVote&&total?`conic-gradient(${segments.join(',')})`:'#dce3eb';
    circle.dataset.decision=hasVote?(voteOutcome().pending?'En attente':voteOutcome().adopted?'Adoptée':'Rejetée'):state.decision;
    circle.setAttribute('aria-label',hasVote?`${v.for} pour, ${v.against} contre, ${v.abstain} abstentions, ${v.nppv} non-participations`:state.decision+' — sans vote');
  }
  function setStatus(type,msg){const el=$('#sessionConnectionStatus'); if(!el)return; el.className=`connection-status ${type}`; el.textContent=msg;}
  function quorumRequired(){return Math.floor(state.session.members/2)+1}
  function calcQuorum(){return state.session.present>=quorumRequired()}
  function renderSession(){
    $('#sessionTitle').textContent=state.session.title; $('#sessionSubtitle').textContent=state.session.subtitle;
    $('#membersCount').textContent=state.session.members; $('#presentCount').textContent=state.session.present; $('#proxyCount').textContent=state.session.proxies;
    $('#presidentLabel').textContent=state.session.president; $('#secretaryLabel').textContent=state.session.secretary;
    $('#quorumLabel').textContent=calcQuorum()?'Atteint':'Non atteint';
  }
  function renderAgenda(){
    $('#agendaCount').textContent=`${state.points.length} points`;
    $('#agendaList').innerHTML=state.points.map((p,i)=>`<button class="agenda-item ${i===state.currentIndex?'active':''} ${p.state==='done'?'done':''}" data-index="${i}"><span class="agenda-no">${String(p.n).padStart(2,'0')}</span><span class="agenda-title">${escapeHtml(p.title)}</span><span class="agenda-state ${p.state==='done'?'validated':''}">${p.state==='done'?'● Validé':i===state.currentIndex?'● En cours':'À venir'}</span></button>`).join('');
    $$('.agenda-item').forEach(btn=>btn.addEventListener('click',()=>goToPoint(Number(btn.dataset.index))));
  }
  function renderPoint(){
    const p=state.points[state.currentIndex]; if(!p)return;
    $('#progressText').textContent=`Point ${p.n} sur ${state.points.length}`; $('#pointNumber').textContent=String(p.n).padStart(2,'0');
    $('#pointTitle').textContent=p.title; $('#pointDescription').textContent=p.description||''; $('#pointRapporteur').textContent=p.rapporteur||'—'; $('#pointService').textContent=p.service||'—'; $('#pointReference').textContent=p.reference||'Sans délibération';
    renderAgenda(); renderDecision(); renderResult(); renderLock();
  }
  function renderDecision(){
    $$('.decision-option').forEach(b=>b.classList.toggle('active',b.dataset.decision===(['Adoptée','Rejetée'].includes(state.decision)?'Adoptée':state.decision)));
    const hasVote=['Adoptée','Rejetée'].includes(state.decision); $('#voteModeArea').hidden=!hasVote; $('#groupsPanel').hidden=!(hasVote&&state.mode==='groups'); $('#detailPanel').hidden=!(hasVote&&state.mode==='groups'&&state.detailOpen);
    $$('.vote-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
    if(state.mode==='groups'){renderGroups();if(state.detailOpen)renderDetailedVotes();}
    $('#showExceptionsBtn').textContent=state.detailOpen?'Masquer les votes individuels':'✎ Saisir les exceptions individuelles';
    $('#showExceptionsBtn').setAttribute('aria-expanded',String(!!state.detailOpen));
  }
  function votersForPoint(){
    const count=Math.max(0,Math.min(state.session.present+state.session.proxies,state.session.members));
    return Array.from({length:count},(_,i)=>{
      let limit=0;
      const group=state.groups.find(g=>{limit+=g.size;return i<limit;})||state.groups[state.groups.length-1];
      return {name:state.elus[i%state.elus.length]+(i>=state.elus.length?` ${i+1}`:''),group,vote:state.overrides?.[i]||group.vote};
    });
  }
  function renderGroups(){
    const voters=votersForPoint();
    $('#groupsGrid').innerHTML=state.groups.map(g=>{
      const members=voters.filter(v=>v.group.id===g.id),exceptions=members.filter(v=>v.vote!==g.vote).length;
      return `<div class="group-card"><div class="group-card-header"><strong>${escapeHtml(g.name)}</strong><span>${members.length} votants</span></div><div class="group-votes">${['Pour','Contre','Abstention','NPPV'].map(v=>`<button class="group-vote-btn ${g.vote===v?'active':''}" data-group="${g.id}" data-vote="${v}">${v}</button>`).join('')}</div><small>${exceptions?`${exceptions} exception(s) individuelle(s)`: 'Aucune exception individuelle'}</small></div>`;
    }).join('');
    $$('.group-vote-btn').forEach(b=>b.addEventListener('click',()=>{
      if(isLocked())return;
      state.groups.find(g=>g.id===b.dataset.group).vote=b.dataset.vote;
      calcGroupVotes();renderDecision();renderResult();renderLock();
    }));
  }
  function calcGroupVotes(){
    state.tieChoice='';
    const v={for:0,against:0,abstain:0,nppv:0};
    votersForPoint().forEach(({vote})=>v[vote==='Pour'?'for':vote==='Contre'?'against':vote==='Abstention'?'abstain':'nppv']++);
    state.votes=v;
  }
  function renderDetailedVotes(){
    const choices=['Pour','Contre','Abstention','NPPV'];
    $('#voterTable').innerHTML=`<div class="voter-header"><span>Élu</span><span>Groupe</span><span>Vote</span></div>${votersForPoint().map((v,i)=>`<div class="voter-row"><strong>${escapeHtml(v.name)}</strong><span>${escapeHtml(v.group.name)}<small>Vote du groupe : ${v.group.vote}</small></span><select aria-label="Vote de ${escapeHtml(v.name)}" data-voter="${i}"><option value="group" ${state.overrides?.[i]===undefined?'selected':''}>Suivre le groupe (${v.group.vote})</option>${choices.map(c=>`<option value="${c}" ${state.overrides?.[i]===c?'selected':''}>${c}</option>`).join('')}</select></div>`).join('')}`;
  }
  function voteOutcome(){
    if(!['Adoptée','Rejetée'].includes(state.decision))return {pending:false};
    const v=state.votes;
    if(v.for+v.against===0)return {pending:true,label:'Aucun suffrage exprimé'};
    if(v.for===v.against){
      if(!state.tieChoice)return {pending:true,label:'Égalité des voix — départage à préciser'};
      return {adopted:state.tieChoice==='for',label:state.tieChoice==='for'?'Adopté à la majorité':'Rejeté',tie:true};
    }
    const adopted=v.for>v.against;
    return {adopted,label:adopted?(v.against===0?'Adopté à l’unanimité':'Adopté à la majorité'):'Rejeté'};
  }
  function renderResult(){
    const hasVote=['Adoptée','Rejetée'].includes(state.decision),v=state.votes,outcome=voteOutcome();
    $('#tieOptions').hidden=!(hasVote&&v.for>0&&v.for===v.against);
    $('#tieChoice').value=state.tieChoice||'';
    if(hasVote&&!outcome.pending)state.decision=outcome.adopted?'Adoptée':'Rejetée';
    renderRing();
    if(!hasVote){
      $('#voterTotal').textContent='—';['#forCount','#againstCount','#abstainCount','#nppvCount'].forEach(s=>$(s).textContent='0');
      $('#resultBanner').className='result-banner warn';$('#resultBanner').innerHTML=`<strong>${state.decision}</strong><span>Aucun résultat de vote à saisir pour cette décision.</span>`;
    }else{
      $('#voterTotal').textContent=v.for+v.against+v.abstain;$('#forCount').textContent=v.for;$('#againstCount').textContent=v.against;$('#abstainCount').textContent=v.abstain;$('#nppvCount').textContent=v.nppv;
      $('#resultBanner').className=`result-banner ${outcome.pending?'warn':outcome.adopted?'ok':'danger'}`;
      const detail=outcome.pending?'Complétez la saisie avant de valider.':outcome.tie?'Départage appliqué sans ajouter de voix au décompte.':v.against===0&&v.for>0&&(v.abstain||v.nppv)?'Unanimité des suffrages exprimés.':'';
      $('#resultBanner').innerHTML=`<strong>${outcome.label}</strong><span>${v.for} pour, ${v.against} contre, ${v.abstain} abstention(s), ${v.nppv} non-participation(s). ${detail}</span>`;
    }
    renderLock();
  }
  function applyMode(mode){
    if(isLocked())return;state.mode=mode;
    if(mode==='unanimity'){
      state.tieChoice='';state.overrides={};state.detailOpen=false;state.groups.forEach(g=>g.vote='Pour');
      state.votes={for:votersForPoint().length,against:0,abstain:0,nppv:0};
    }else calcGroupVotes();
    renderDecision();renderResult();renderLock();
  }
  function goToPoint(index){
    if(index<0||index>=state.points.length)return;
    // Drafts are kept per point; unconfirmed revisions never replace a validated result.
    if(currentPoint().state!=='done')currentPoint().result=snapshot();
    editingValidated=false;state.currentIndex=index;restorePoint();setRareMenu(false);renderPoint();
  }
  function openSettings(){
    fillSelect('#settingPresident',state.elus,state.session.president);fillSelect('#settingSecretary',state.elus,state.session.secretary);$('#settingMembers').value=state.session.members;$('#settingPresent').value=state.session.present;$('#settingProxies').value=state.session.proxies;$('#settingAbsent').value=state.session.absent;updateDrawerQuorum();
    $('#settingsBackdrop').hidden=false;$('#settingsDrawer').classList.add('open');$('#settingsDrawer').setAttribute('aria-hidden','false');
  }
  function closeSettings(){ $('#settingsBackdrop').hidden=true;$('#settingsDrawer').classList.remove('open');$('#settingsDrawer').setAttribute('aria-hidden','true');}
  function updateDrawerQuorum(){const m=Number($('#settingMembers').value||0),p=Number($('#settingPresent').value||0),need=Math.floor(m/2)+1,ok=p>=need;const q=$('#drawerQuorum');q.className=`quorum-box ${ok?'ok':'danger'}`;q.textContent=`${ok?'✓':'!'} Quorum ${ok?'atteint':'non atteint'} — ${p} présents, ${need} requis`;}
  function saveSettings(){state.session.president=$('#settingPresident').value;state.session.secretary=$('#settingSecretary').value;state.session.members=Number($('#settingMembers').value||0);state.session.present=Number($('#settingPresent').value||0);state.session.proxies=Number($('#settingProxies').value||0);state.session.absent=Number($('#settingAbsent').value||0);if(!isLocked()&&state.mode==='unanimity')state.votes={for:state.session.present+state.session.proxies,against:0,abstain:0,nppv:0};renderSession();renderResult();closeSettings();}
  function fillSelect(sel,items,value){const el=$(sel);el.innerHTML=items.map(x=>`<option ${x===value?'selected':''}>${escapeHtml(x)}</option>`).join('')}
  function setRareMenu(open){
    $('#moreActionsMenu').hidden=!open;
    $('#moreActionsBtn').setAttribute('aria-expanded',String(open));
  }
  function openRare(type){
    if(isLocked())return;
    if(!['amendment','attendance','proxy','nppv','note','suspend'].includes(type))return;
    const titleMap={amendment:'Ajouter un amendement',attendance:'Signaler une arrivée / un départ',proxy:'Modifier un pouvoir',nppv:'Déclarer une non-participation au vote',note:'Ajouter une observation de séance',suspend:'Suspendre la séance'};$('#rareModalTitle').textContent=titleMap[type]||'Action';
    const forms={
      amendment:`<div class="rare-form-grid"><label class="full">Zone concernée<select><option>Article</option><option>Considérant</option><option>Exposé des motifs</option><option>Autre</option></select></label><label class="full">Texte de l’amendement<textarea placeholder="Saisir la modification adoptée ou proposée…"></textarea></label></div>`,
      attendance:`<div class="rare-form-grid"><label>Élu<select>${state.elus.map(x=>`<option>${escapeHtml(x)}</option>`).join('')}</select></label><label>Événement<select><option>Arrivée</option><option>Départ</option></select></label><label class="full">Heure<input type="time" /></label></div>`,
      proxy:`<div class="rare-form-grid"><label>Mandant<select>${state.elus.map(x=>`<option>${escapeHtml(x)}</option>`).join('')}</select></label><label>Mandataire<select>${state.elus.map(x=>`<option>${escapeHtml(x)}</option>`).join('')}</select></label></div>`,
      nppv:`<div class="rare-form-grid"><label>Élu<select>${state.elus.map(x=>`<option>${escapeHtml(x)}</option>`).join('')}</select></label><label>Motif<select><option>Conflit d’intérêts</option><option>Retrait volontaire</option><option>Sortie temporaire</option><option>Autre</option></select></label></div>`,
      note:`<label>Observation<textarea placeholder="Observation utile au procès-verbal ou à l’acte définitif…"></textarea></label>`,
      suspend:`<div class="rare-form-grid"><label>Heure de suspension<input type="time" /></label><label>Motif<input placeholder="Motif éventuel" /></label></div>`
    };$('#rareModalBody').innerHTML=forms[type]||'';$('#rareModal').hidden=false;setRareMenu(false);
    $('#rareModalBody').querySelector('input,select,textarea')?.focus();
  }
  function closeRare(){$('#rareModal').hidden=true;$('#rareModalBody').innerHTML='';$('#moreActionsBtn').focus()}
  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}

  async function tryGrist(){
    if(!window.grist){setStatus('demo','Mode démonstration — données fictives.');return;}
    try{
      grist.ready({requiredAccess:'full'});state.connected=true;setStatus('connected','Connecté à Grist — prototype du suivi de séance.');
      // La connexion complète sera activée après ajout des champs/table de groupes nécessaires.
      // Pour éviter toute écriture accidentelle pendant cette première version, l'écran reste en lecture/démo côté séance.
    }catch(e){console.error(e);setStatus('warning','Grist détecté, mais le prototype de séance reste en mode démonstration.');}
  }

  function bind(){
    $('#tieChoice').addEventListener('change',()=>{if(isLocked())return;state.tieChoice=$('#tieChoice').value;renderResult();});
    $('#voterTable').addEventListener('change',e=>{
      if(isLocked()||!e.target.matches('[data-voter]'))return;
      state.overrides=state.overrides||{};
      const id=Number(e.target.dataset.voter);
      if(e.target.value==='group')delete state.overrides[id];else state.overrides[id]=e.target.value;
      calcGroupVotes();renderGroups();renderResult();renderLock();
    });
    $('#rareModal').hidden=true;setRareMenu(false);
    $('#rareModal').addEventListener('click',e=>{if(e.target===$('#rareModal'))closeRare();});
    document.addEventListener('keydown',e=>{
      if(!$('#rareModal').hidden){
        if(e.key==='Escape'){e.preventDefault();closeRare();}
        if(e.key==='Tab'){
          const controls=[...$('#rareModal').querySelectorAll('button,input,select,textarea')];
          const first=controls[0],last=controls[controls.length-1];
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
          else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
        }
      }else if(e.key==='Escape'&&!$('#moreActionsMenu').hidden){setRareMenu(false);$('#moreActionsBtn').focus();}
    });
    $$('.decision-option').forEach(b=>b.addEventListener('click',()=>{if(isLocked())return;state.decision=b.dataset.decision;if(!['Adoptée','Rejetée'].includes(state.decision))state.mode='unanimity';renderDecision();renderResult();}));
    $$('.vote-mode').forEach(b=>b.addEventListener('click',()=>applyMode(b.dataset.mode)));
    $('#prevPointBtn').addEventListener('click',()=>goToPoint(state.currentIndex-1));$('#nextPointBtn').addEventListener('click',()=>goToPoint(state.currentIndex+1));
    $('#moreActionsBtn').addEventListener('click',()=>setRareMenu($('#moreActionsMenu').hidden));$$('[data-rare]').forEach(b=>b.addEventListener('click',()=>openRare(b.dataset.rare)));
    $('#openSettingsBtn').addEventListener('click',openSettings);$('#closeSettingsBtn').addEventListener('click',closeSettings);$('#settingsBackdrop').addEventListener('click',closeSettings);$('#openSessionBtn').addEventListener('click',saveSettings);
    ['#settingMembers','#settingPresent','#settingProxies','#settingAbsent'].forEach(s=>$(s).addEventListener('input',updateDrawerQuorum));
    $('#showExceptionsBtn').addEventListener('click',()=>{
      state.detailOpen=!state.detailOpen;renderDecision();renderLock();
    });
    $('#closeRareModalBtn').addEventListener('click',closeRare);$('#cancelRareBtn').addEventListener('click',closeRare);$('#confirmRareBtn').addEventListener('click',()=>{closeRare();setStatus('connected','Action exceptionnelle enregistrée dans le prototype.');setTimeout(()=>setStatus(state.connected?'connected':'demo',state.connected?'Connecté à Grist — prototype du suivi de séance.':'Mode démonstration — données fictives.'),1800)});
    $('#editValidatedBtn').addEventListener('click',()=>{editingValidated=true;renderLock();});
    $('#cancelEditBtn').addEventListener('click',()=>{editingValidated=false;restorePoint();renderPoint();});
    $('#validateNextBtn').addEventListener('click',()=>{
      if(isLocked()||voteOutcome().pending)return;
      const wasRevision=editingValidated;
      currentPoint().result=snapshot();currentPoint().state='done';editingValidated=false;
      if(wasRevision||state.currentIndex===state.points.length-1)renderPoint();
      else goToPoint(state.currentIndex+1);
    });
    $('#saveDraftBtn').addEventListener('click',()=>{
      if(isLocked())return;currentPoint().result=snapshot();
      setStatus('demo','Brouillon conservé pour ce point pendant cette démonstration.');
    });
    document.addEventListener('click',e=>{if(!e.target.closest('.rare-actions-wrap'))setRareMenu(false);});
  }
  document.addEventListener('DOMContentLoaded',async()=>{renderSession();renderAgenda();renderPoint();bind();await tryGrist();});
})();
