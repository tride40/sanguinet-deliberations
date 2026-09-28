(function(){

 'use strict';const P=PlanningData,$=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 let downloadUrls=[];
 let db,id=0,desired=[],baseAgenda='',baseForm='',access=false,busy=false,needsReload=false;

 const fields=()=>({date:$('#sessionDate').value,place:$('#sessionPlace').value,convocation:$('#convocation').value,members:$('#members').value});

 const formDirty=()=>!!db&&JSON.stringify(fields())!==baseForm,agendaDirty=()=>JSON.stringify(desired)!==baseAgenda,dirty=()=>formDirty()||agendaDirty();

 const rows=t=>(t.id||[]).map((id,i)=>Object.fromEntries(Object.keys(t).map(k=>[k,t[k][i]])));

 function status(type,message){$('#status').className='connection-status '+type;$('#status').textContent=message;}

 async function fetchDB(){const result=await Promise.allSettled([...P.tables,'DOCUMENTS_GENERES'].map(t=>grist.docApi.fetchTable(t)));const errors=result.flatMap((r,i)=>r.status==='rejected'?[[...P.tables,'DOCUMENTS_GENERES'][i]+': '+(r.reason?.message||r.reason)]:[]);if(errors.length)throw Error(errors.join(' ; '));if(!access)throw Error('Accès complet au document requis.');return Object.fromEntries(result.map((r,i)=>[[...P.tables,'DOCUMENTS_GENERES'][i],rows(r.value)]));}

 function controls(){

  $('#planner').inert=busy||!access||!db;

  if(!db)return;exportControls();const editable=!id||P.open(db,id);

  $('#sessionForm').disabled=!id||!editable||needsReload;$('#sessionDate').disabled=true;$('#saveAgenda').disabled=!editable||needsReload||!agendaDirty();

  $('#toggleLock').disabled=needsReload||!P.editable(db,id)||dirty();

  $('#agendaHint').textContent=agendaDirty()?'● Modifications de l’ordre du jour non enregistrées.':P.open(db,id)?'Les flèches permettent de classer les points. Retirer un projet le conserve parmi les brouillons sans séance.':'Ordre du jour en lecture seule.';

  $('#agendaHint').classList.toggle('dirty',agendaDirty());

 }

 function renderAgenda(){

  if(!db)return;const open=id&&P.open(db,id)&&!needsReload,q=$('#search').value.toLocaleLowerCase('fr');

  const selected=new Set(desired.map(p=>p.Deliberation));

  const candidates=db.DELIBERATIONS.filter(d=>(!d.Seance||d.Seance===id)&&!selected.has(d.id)&&!db.ORDRE_DU_JOUR.some(p=>p.Deliberation===d.id)&&['','Brouillon service','Corrections demandées','Validé par la DGS','Inscrit à l’ordre du jour'].includes(d.Statut_deliberation||'')&&(d.Objet||'').toLocaleLowerCase('fr').includes(q));

  $('#available').innerHTML=candidates.map(d=>`<div class="project-row"><div><strong>${esc(d.Objet||'Sans objet')}</strong><small>${d.Seance===id?'Fléché vers cette séance':'Sans séance'} · ${esc(d.Statut_deliberation==='Brouillon service'?'Brouillon DGS':(d.Statut_deliberation||'Brouillon'))}</small></div><div class="project-tools"><button data-add="${d.id}" class="secondary-btn" ${open?'':'disabled'}>Ajouter à l’ordre du jour</button>${d.Seance===id?`<button data-unassign="${d.id}" class="ghost-btn" ${open?'':'disabled'}>Libérer</button>`:''}</div></div>`).join('')||'<p class="hint">Aucun projet disponible. Vous pouvez en créer dans le widget de rédaction.</p>';

  $('#agenda').innerHTML=desired.map((p,i)=>`<li class="project-row"><div><strong>${esc(db.DELIBERATIONS.find(d=>d.id===p.Deliberation)?.Objet||p.Intitule_point||'Point sans titre')}</strong><small>${p.Deliberation?'Délibération':esc(p.Type_point||'Information')}</small></div><div class="project-tools"><button class="ghost-btn" data-up="${i}" aria-label="Monter le point ${i+1}" ${open&&i>0?'':'disabled'}>↑</button><button class="ghost-btn" data-down="${i}" aria-label="Descendre le point ${i+1}" ${open&&i<desired.length-1?'':'disabled'}>↓</button>${p.Deliberation?`<button class="ghost-btn" data-remove="${i}" ${open?'':'disabled'}>Retirer</button>`:''}</div></li>`).join('')||'<p class="hint">Ajoutez les délibérations à examiner lors de ce conseil.</p>';

  $('#pointCount').textContent=desired.length+' point'+(desired.length>1?'s':'');controls();

 }

 function show(next){

  clearDownloads();id=next;const s=db.SEANCES_CM.find(s=>s.id===id),params=db.PARAMETRES_APPLICATION[0]||{};

  $('#sessions').innerHTML='<option value="0">Choisir un conseil</option>'+db.SEANCES_CM.filter(s=>s.Statut_seance!=='Terminée').slice().sort((a,b)=>b.Date_heure_seance-a.Date_heure_seance).map(s=>`<option value="${s.id}">${esc(s.Libelle_seance||s.Reference_seance||'Séance '+s.id)}</option>`).join('');$('#sessions').value=String(id);

  $('#sessionDate').value=P.localDate(s?.Date_heure_seance);$('#sessionPlace').value=s?.Lieu_seance||params.Lieu_seance_defaut||'';$('#members').value=s?.Nb_membres_exercice||params.Nb_conseillers||db.ELUS.filter(e=>e.Actif).length||'';$('#convocation').value=s?.Date_convocation?new Date(s.Date_convocation*1000).toISOString().slice(0,10):'';

  $('#sessionHeading').textContent=s?'Informations de la séance':'Choisissez un conseil';$('#sessionState').textContent=s?.Ordre_du_jour_valide?'● Ordre du jour verrouillé':s?.Statut_seance||'';$('#saveSession').textContent='Enregistrer les informations';

  $('#agendaArea').hidden=!s;$('#toggleLock').hidden=!s;$('#toggleLock').textContent=s?.Ordre_du_jour_valide?'Rouvrir la préparation':'Verrouiller l’ordre du jour';$('#instructions').textContent=!s?'Créez d’abord une séance dans la page Planification des conseils.':P.open(db,id)?'Ajoutez vos projets à l’ordre du jour puis classez-les. Les textes restent modifiables dans la rédaction tant que la préparation est ouverte.':'La préparation est verrouillée. Vous pouvez la rouvrir explicitement tant que le conseil n’a pas été envoyé aux élus ou commencé.';

  const defaults=CouncilExports.options(db,id);$('#exportDate').value=defaults.letterDate;$('#exportSigner').value=defaults.signer;$('#exportQuality').value=defaults.quality;$('#annexAcknowledged').checked=false;
  desired=structuredClone(P.points(db,id));baseAgenda=JSON.stringify(desired);baseForm=JSON.stringify(fields());renderAgenda();

 }

 function leave(){return !db||!dirty()||confirm('Abandonner les modifications non enregistrées ?');}

 async function run(fn){if(busy)return;busy=true;controls();try{await fn();}catch(e){status('error',e.message);}finally{busy=false;controls();}}

 async function refresh(){if(!leave())return;await run(async()=>{db=await fetchDB();needsReload=false;show(db.SEANCES_CM.filter(s=>s.Statut_seance!=='Terminée').some(s=>s.id===id)?id:db.SEANCES_CM.filter(s=>s.Statut_seance!=='Terminée'&&s.Date_heure_seance>=Date.now()/1000).sort((a,b)=>a.Date_heure_seance-b.Date_heure_seance)[0]?.id||db.SEANCES_CM.find(s=>s.Statut_seance!=='Terminée')?.id||0);status('connected','Connecté à Grist — préparation du conseil municipal.');});}

 async function save(build){if(needsReload||!access)return;await run(async()=>{const fresh=await fetchDB();if(JSON.stringify(fresh)!==JSON.stringify(db))throw Error('Les données ont changé dans Grist. Actualisez avant d’enregistrer ; vos modifications restent à l’écran.');const plan=build(fresh);if(!access)throw Error('Accès complet requis.');await grist.docApi.applyUserActions(plan.actions);id=plan.id;needsReload=true;baseAgenda=JSON.stringify(desired);baseForm=JSON.stringify(fields());try{db=await fetchDB();needsReload=false;show(id);status('connected','✓ Enregistré dans Grist.');}catch(e){status('error','Enregistrement effectué, mais relecture impossible. Cliquez sur Actualiser.');}});}

 $('#sessions').onchange=()=>{const next=Number($('#sessions').value);if(leave())show(next);else $('#sessions').value=String(id);};$('#refresh').onclick=refresh;$('#search').oninput=renderAgenda;

 $('#saveSession').onclick=()=>{if(!id)return;if(agendaDirty()){status('warning','Enregistrez d’abord les modifications de l’ordre du jour.');return;}save(db=>P.sessionPlan(db,id,fields()));};

 $('#saveAgenda').onclick=()=>{if(formDirty()){status('warning','Enregistrez d’abord les informations de la séance.');return;}save(db=>P.agendaPlan(db,id,desired));};

 $('#toggleLock').onclick=()=>{const lock=!db.SEANCES_CM.find(s=>s.id===id).Ordre_du_jour_valide;if(confirm(lock?'Verrouiller cet ordre du jour et la rédaction des projets associés ?':'Rouvrir la préparation et autoriser de nouveau la rédaction des projets associés ?'))save(db=>P.lockPlan(db,id,lock));};

 $('#sessionForm').oninput=controls;

 $('#agendaArea').onclick=e=>{

  const b=e.target.closest('button');if(!b||b.disabled||!P.open(db,id)||needsReload)return;

  if(b.dataset.add){desired.push({Deliberation:Number(b.dataset.add)});renderAgenda();}

  if(b.dataset.remove!==undefined){desired.splice(Number(b.dataset.remove),1);renderAgenda();}

  for(const [key,delta] of [['up',-1],['down',1]])if(b.dataset[key]!==undefined){const i=Number(b.dataset[key]);[desired[i],desired[i+delta]]=[desired[i+delta],desired[i]];renderAgenda();}

  if(b.dataset.unassign){if(dirty()){status('warning','Enregistrez les modifications en cours avant de libérer un projet.');return;}const did=Number(b.dataset.unassign);save(db=>{if(!P.open(db,id)||db.ORDRE_DU_JOUR.some(p=>p.Deliberation===did))throw Error('Ce projet ne peut plus être libéré.');return {id,actions:[['UpdateRecord','DELIBERATIONS',did,{Seance:0}],['AddRecord','JOURNAL_ACTIONS',null,{Date_action:Date.now()/1000,Seance:id,Deliberation:did,Utilisateur:0,Type_action:'Modification',Description:'Retrait du fléchage vers la séance',Niveau:'Information'}]]};});}

 };


 function clearDownloads(){downloadUrls.forEach(url=>URL.revokeObjectURL(url));downloadUrls=[];$('#exportResult').replaceChildren();}
 function exportControls(){
  if(dirty()||needsReload||!access)clearDownloads();
  const locked=!!db.SEANCES_CM.find(s=>s.id===id)?.Ordre_du_jour_valide;$('#beforeDocuments').hidden=!locked;if(!locked)clearDownloads();const signed=DocumentStore.latest(db,id);$('#signedLetterStatus').textContent=signed?(signed.Empreinte_source===DocumentStore.source(db,id)?'Signée archivée — version '+signed.Version+' utilisée dans le dossier.':'La convocation signée est à remplacer : la séance ou son ordre du jour a changé.'):'Aucune convocation signée archivée : le dossier utilisera la convocation générée, non signée.';$('#downloadSignedLetter').hidden=!signed;$('#uploadSignedLetter').disabled=busy||dirty()||!access;$('#freshLetterLabel').hidden=$('#exportKind').value!=='convocation';const hasLetter=$('#exportKind').value!=='projects'&&(!signed||($('#exportKind').value==='convocation'&&$('#freshLetter').checked));$('#letterFields').hidden=!hasLetter;
  $('#generateDocuments').disabled=!id||busy||needsReload||dirty()||!access||!locked;
  $('#exportHint').textContent=!id?'Sélectionnez un conseil.':dirty()?'Enregistrez vos modifications avant de générer les fichiers.':db.SEANCES_CM.find(s=>s.id===id)?.Ordre_du_jour_valide?'L’ordre du jour est verrouillé. Les exports reprennent les données enregistrées.':'La préparation est encore ouverte. Les fichiers sont des versions de travail et devront être régénérés après toute modification.';
 }
 $('#exportKind').onchange=()=>{clearDownloads();$('#annexWarning').hidden=true;$('#annexConfirm').hidden=true;$('#annexAcknowledged').checked=false;exportControls();};
 $('#freshLetter').onchange=()=>{clearDownloads();exportControls();};
 for(const selector of ['#exportColor','#exportPdf','#exportWord','#exportDate','#exportSigner','#exportQuality'])$(selector).onchange=clearDownloads;
 $('#generateDocuments').onclick=()=>run(async()=>{
  if(dirty()||needsReload||!id||!access)throw Error('Enregistrez vos modifications puis actualisez la séance.');
  clearDownloads();status('loading','Préparation des documents…');
  const result=await Promise.allSettled(CouncilExports.tables.map(t=>grist.docApi.fetchTable(t)));
  const errors=result.flatMap((r,i)=>r.status==='rejected'?[CouncilExports.tables[i]+': '+(r.reason?.message||r.reason)]:[]);
  if(errors.length)throw Error('Lecture des documents impossible : '+errors.join(' ; '));
  if(!access)throw Error('Accès complet au document requis.');
  const fresh=Object.fromEntries(result.map((r,i)=>[CouncilExports.tables[i],rows(r.value)]));
  if(JSON.stringify(fresh.SEANCES_CM)!==JSON.stringify(db.SEANCES_CM)||JSON.stringify(fresh.ORDRE_DU_JOUR)!==JSON.stringify(db.ORDRE_DU_JOUR)||JSON.stringify(fresh.DELIBERATIONS)!==JSON.stringify(db.DELIBERATIONS))throw Error('La séance ou ses projets ont changé. Cliquez sur Actualiser avant de générer.');
  $('#annexWarning').hidden=true;$('#annexConfirm').hidden=true;
  const opt={api:grist.docApi,freshLetter:$('#exportKind').value==='convocation'&&$('#freshLetter').checked,kind:$('#exportKind').value,bw:$('#exportColor').value==='bw',pdf:$('#exportPdf').checked,word:$('#exportWord').checked,letterDate:$('#exportDate').value,signer:$('#exportSigner').value.trim(),quality:$('#exportQuality').value.trim(),annexesAcknowledged:$('#annexAcknowledged').checked};
  const output=await CouncilExports.generate(fresh,id,opt);
  if(!access)throw Error('L’accès au document a été retiré.');const after=await fullDB();if(DocumentStore.fingerprint(after)!==DocumentStore.fingerprint(fresh))throw Error('Les données ont changé pendant la génération. Actualisez et recommencez.');
  const message=document.createElement('p');message.textContent='Fichiers prêts. Cliquez sur chaque lien pour les télécharger.';$('#exportResult').append(message);
  for(const file of output.files){const link=document.createElement('a'),url=URL.createObjectURL(file.blob);downloadUrls.push(url);link.href=url;link.download=file.name;link.className='secondary-btn';link.textContent=file.name;$('#exportResult').append(link);}
  status('connected','✓ Documents générés à partir des données enregistrées. Aucun envoi effectué.');
 });

 async function fullDB(){const values=await Promise.all(CouncilExports.tables.map(t=>grist.docApi.fetchTable(t)));return Object.fromEntries(values.map((v,i)=>[CouncilExports.tables[i],rows(v)]));}
 $('#uploadSignedLetter').onclick=()=>run(async()=>{if(dirty()||!access||!db.SEANCES_CM.find(s=>s.id===id)?.Ordre_du_jour_valide)throw Error('Enregistrez et verrouillez l’ordre du jour.');const file=$('#signedLetterFile').files[0];const check=()=>{if(!access)throw Error('Accès retiré.');};await DocumentStore.archive(grist.docApi,db,id,0,file,fullDB,check);$('#signedLetterFile').value='';db=await fetchDB();show(id);status('connected','Convocation signée archivée. Les versions précédentes sont conservées.');});
 $('#downloadSignedLetter').onclick=()=>run(async()=>{const signed=DocumentStore.latest(db,id),aid=DocumentStore.ids(signed?.Fichier)[0];const bytes=await DocumentStore.download(grist.docApi,aid);if(!access)throw Error('Accès retiré.');const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));downloadUrls.push(url);const link=document.createElement('a');link.href=url;link.download=signed.Nom_original||'Convocation signée.pdf';link.textContent='Télécharger la convocation signée';$('#exportResult').append(link);});
 window.addEventListener('beforeunload',e=>{if(db&&dirty()){e.preventDefault();e.returnValue='';}});

 if(!window.grist||parent===window){status('warning','Installez preparation.html dans un widget Grist avec accès complet pour planifier vos conseils.');return;}

 grist.onOptions((o,i)=>{access=(i?.accessLevel??i?.access_level)==='full';controls();if(!access){clearDownloads();status('warning','Autorisez l’accès complet au document.');return;}if(!db)refresh();});grist.ready({requiredAccess:'full'});

})();

