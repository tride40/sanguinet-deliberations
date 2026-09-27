(function(){
'use strict';
const D=SessionData,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=D.id,now=()=>Date.now()/1000;
let accessGranted=false;
let store,db,sessionId=0,pointId=0,draft=null,editing=false,dirty=false,busy=false,detail=false,modalSave=null,modalTrigger=null;
const session=()=>db?.SEANCES_CM.find(s=>s.id===sessionId),points=()=>db?db.ORDRE_DU_JOUR.filter(p=>p.Seance===sessionId).sort((a,b)=>a.Ordre_point-b.Ordre_point||a.id-b.id):[];
const point=()=>points().find(p=>p.id===pointId),delib=()=>db?.DELIBERATIONS.find(d=>d.id===point()?.Deliberation);
const parts=()=>db.PARTICIPATIONS_SEANCE.filter(p=>p.Seance===sessionId),savedVotes=()=>db.VOTES_DELIBERATIONS.filter(v=>v.Deliberation===delib()?.id);
const name=id=>db?.ELUS.find(e=>e.id===id)?.Nom_complet||'Élu #'+id;
const groupName=id=>db?.GROUPES_POLITIQUES.find(g=>g.id===id)?.Nom||'Sans groupe';
const locked=()=>point()?.Statut_suivi==='Validé'&&!editing;
const currentVoters=()=>{
 const saved=savedVotes();
 // A validated result keeps its original electorate, even after later arrivals/departures.
 return point()?.Statut_suivi==='Validé'&&saved.length?saved.filter(v=>v.Vote!=='Absent').map(D.fromSaved):D.electorate(parts());
};
function status(kind,message){$('#sessionConnectionStatus').className='connection-status '+kind;$('#sessionConnectionStatus').textContent=message;}
function option(value,label,selected){return `<option value="${esc(value)}" ${String(value)===String(selected)?'selected':''}>${esc(label)}</option>`;}
function personOptions(selected,empty='Choisir…'){return option('',empty,selected)+db.ELUS.map(e=>option(e.id,e.Nom_complet,selected)).join('');}
function operator(){const id=num($('#operatorPicker').value);if(!id)throw Error('Choisissez l’agent de saisie en haut de la page.');return id;}
function log(description,extra={}){return ['AddRecord','JOURNAL_ACTIONS',null,{Date_action:now(),Utilisateur:operator(),Type_action:'Autre',Seance:sessionId||0,Deliberation:delib()?.id||0,Point_ODJ:pointId||0,Description:description,Automatique:true,Niveau:'Information',...extra}];}
function setBusy(value){busy=value;document.body.classList.toggle('busy',value);$('.session-page').inert=value;$('#rareModal').inert=value;}
async function execute(fn){if(busy)return;setBusy(true);$('#modalError').hidden=true;try{await fn();}catch(e){status('error',e.message||String(e));if(!$('#rareModal').hidden){$('#modalError').textContent=e.message||String(e);$('#modalError').hidden=false;}}finally{setBusy(false);}}
function leave(){return !dirty||confirm('Les modifications non enregistrées seront abandonnées. Continuer ?');}
async function refresh(){db=await store.load();if(!session())sessionId=db.SEANCES_CM[0]?.id||0;if(!point())pointId=points()[0]?.id||0;editing=false;dirty=false;restore();render();status('connected','Connecté à Grist — les enregistrements sont conservés dans votre document.');}
function restore(){
 const d=delib();detail=false;
 draft={decision:d?(['Ajournée','Retirée'].includes(d.Decision_seance)?d.Decision_seance:'Vote'):'Sans vote',mode:d?.Mode_saisie_vote==='Unanimité'?'unanimity':'groups',scrutin:d?.Mode_scrutin&&d.Mode_scrutin!=='Sans vote'?d.Mode_scrutin:'Vote à main levée',tie:d?.Departage||'',groups:{},overrides:{},motives:{}};
 for(const g of db.VOTES_GROUPES.filter(g=>g.Deliberation===d?.id))draft.groups[g.Groupe]=g.Vote;
 for(const v of savedVotes()){
  const e=D.fromSaved(v);if(v.Vote==='Absent')continue;
  if(v.Exception_individuelle||draft.groups[e.group]!==v.Vote)draft.overrides[e.id]=v.Vote;
  if(v.Motif_non_participation)draft.motives[e.id]=v.Motif_non_participation;
 }
 // No default vote is assigned to a new deliberation. Unanimity requires an explicit click.
}
function render(){
 const actor=$('#operatorPicker').value;
 $('#operatorPicker').innerHTML=option('','Choisir l’agent',actor)+db.AGENTS.filter(a=>a.Actif||String(a.id)===actor).map(a=>option(a.id,a.Nom_complet,actor)).join('');
 $('#sessionPicker').innerHTML=option('','Choisir une séance',sessionId)+db.SEANCES_CM.map(s=>option(s.id,s.Libelle_seance||s.Reference_seance||'Séance #'+s.id,sessionId)).join('');
 $$('#sessionPicker,#operatorPicker,#newSessionBtn,#refreshBtn').forEach(e=>e.disabled=false);
 $('#connectedContent').hidden=!session();$('#liveHelp').textContent=session()?'Agent de saisie : choisissez votre nom. Enregistrez vos modifications avant de changer de point.':'Aucune séance sélectionnée. Commencez par « Nouvelle séance », puis renseignez les présences.';
 if(!session())return;
 const s=session(),p=parts(),present=p.filter(x=>x.Statut_presence===D.PRESENT).length;
 $('#sessionTitle').textContent=s.Libelle_seance||'Séance';$('#sessionSubtitle').textContent=s.Date_heure_seance?new Date(s.Date_heure_seance*1000).toLocaleString('fr-FR',{timeZone:'Europe/Paris'}):'';
 $('#membersCount').textContent=s.Nb_membres_exercice;$('#presentCount').textContent=present;$('#proxyCount').textContent=p.filter(x=>x.Statut_presence===D.PROXY).length;
 $('#presidentLabel').textContent=s.President_seance?name(s.President_seance):'À renseigner';$('#secretaryLabel').textContent=s.Secretaire_seance?name(s.Secretaire_seance):'À renseigner';
 const complete=!D.participantErrors(p,D.active(db)).length;$('#quorumLabel').textContent=!complete?'À vérifier':present>=Math.floor(s.Nb_membres_exercice/2)+1?'Atteint':'Non atteint';
 const events=db.JOURNAL_ACTIONS.filter(j=>j.Seance===sessionId&&['Suspension de séance','Reprise de séance'].includes(j.Description)).sort((a,b)=>b.Date_action-a.Date_action||b.id-a.id);
 $('#liveSessionStatus').textContent=events[0]?.Description==='Suspension de séance'?'Suspendue':s.Statut_seance||'Préparation';
 const list=points();$('#agendaCount').textContent=list.length+' points';$('#emptyAgenda').hidden=!!list.length;$('.session-layout').hidden=!list.length;
 $('#agendaList').innerHTML=list.map(p=>`<button class="agenda-item ${p.id===pointId?'active':''}"><span class="agenda-no">${p.Ordre_point}</span><span class="agenda-title">${esc(p.Intitule_point||db.DELIBERATIONS.find(d=>d.id===p.Deliberation)?.Objet||'Point')}</span><span class="agenda-state ${p.Statut_suivi==='Validé'?'validated':''}">${p.Statut_suivi==='Validé'?'● Validé':'À examiner'}</span></button>`).join('');
 $$('.agenda-item').forEach((b,i)=>b.onclick=()=>navigate(list[i].id));
 if(!point())return;
 const d=delib(),index=list.findIndex(p=>p.id===pointId);
 $('#progressText').textContent=`Point ${index+1} sur ${list.length}`;$('#pointNumber').textContent=point().Ordre_point;$('#pointTitle').textContent=point().Intitule_point||d?.Objet||'Point';
 $('#pointDescription').textContent=d?'Les votes et la validation sont enregistrés dans Grist.':'Point d’information sans délibération : validation du passage en séance.';
 $('#pointRapporteur').textContent=(d?.Rapporteur||point().Rapporteur)?name(d?.Rapporteur||point().Rapporteur):'—';$('#pointService').textContent=db.UNITES_ORGANISATIONNELLES.find(u=>u.id===d?.Unite_redactrice)?.Nom_service||'—';$('#pointReference').textContent=d?.Numero_deliberation||d?.Reference_projet||'Sans numéro officiel';
 $('#prevPointBtn').disabled=index===0;$('#nextPointBtn').disabled=index===list.length-1;
 renderVotes();
}
function navigate(id){if(!leave())return;pointId=id;dirty=false;editing=false;restore();render();}
function mark(){dirty=true;draft.tie='';renderVotes();}
function renderVotes(){
 const p=point();if(!p)return;const isVote=draft.decision==='Vote',isLocked=locked();
 $('.decision-card').hidden=!delib();$('#voteModeArea').hidden=!isVote;$('#scrutin').value=draft.scrutin;$('#scrutin').hidden=!isVote;
 $$('.decision-option').forEach(b=>b.classList.toggle('active',(b.dataset.decision==='Adoptée'?'Vote':b.dataset.decision)===draft.decision));
 $$('.vote-mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===draft.mode));
 $('#groupsPanel').hidden=!(isVote&&draft.mode==='groups');$('#detailPanel').hidden=!(isVote&&draft.mode==='groups'&&detail);
 $('#showExceptionsBtn').textContent=detail?'Masquer les votes individuels':'✎ Saisir les exceptions individuelles';$('#showExceptionsBtn').setAttribute('aria-expanded',String(detail));
 const voters=currentVoters(),groups=[...new Set(voters.map(v=>v.group))];
 $('#groupsGrid').innerHTML=groups.map(g=>`<div class="group-card"><div class="group-card-header"><strong>${esc(groupName(g))}</strong><span>${voters.filter(v=>v.group===g).length} voix</span></div><div class="group-votes">${D.CHOICES.map(v=>`<button data-group="${g}" data-vote="${esc(v)}" class="group-vote-btn ${draft.groups[g]===v?'active':''}">${v===D.NPPV?'NPPV':v}</button>`).join('')}</div><small>${voters.filter(v=>v.group===g&&Object.hasOwn(draft.overrides,v.id)).length} exception(s) individuelle(s)</small></div>`).join('');
 $$('.group-vote-btn').forEach(b=>b.onclick=()=>{if(locked())return;draft.groups[b.dataset.group]=b.dataset.vote;mark();});
 $('#voterTable').innerHTML=voters.map(v=>{
 const choice=Object.hasOwn(draft.overrides,v.id)?draft.overrides[v.id]:draft.groups[v.group];
 return `<div class="voter-row"><strong>${esc(name(v.id))}${v.proxy?`<small>Pouvoir exercé par ${esc(name(v.caster))}</small>`:''}</strong><span>${esc(groupName(v.group))}</span><select data-voter="${v.id}" aria-label="Vote de ${esc(name(v.id))}">${option('group','Suivre le groupe ('+(draft.groups[v.group]||'à saisir')+')',Object.hasOwn(draft.overrides,v.id)?draft.overrides[v.id]:'group')}${D.CHOICES.map(c=>option(c,c,draft.overrides[v.id])).join('')}</select>${choice===D.NPPV?`<label>Motif de non-participation<select data-motive="${v.id}">${option('','Choisir un motif',draft.motives[v.id])}${['Conflit d’intérêts','Retrait volontaire','Sortie temporaire de séance','Autre'].map(m=>option(m,m,draft.motives[v.id])).join('')}</select></label>`:''}</div>`;
 }).join('');
 $$('[data-voter]').forEach(e=>e.onchange=()=>{if(locked())return;if(e.value==='group')delete draft.overrides[e.dataset.voter];else draft.overrides[e.dataset.voter]=e.value;mark();});
 $$('[data-motive]').forEach(e=>e.onchange=()=>{if(locked())return;draft.motives[e.dataset.motive]=e.value;dirty=true;});
 const t=D.tally(voters,draft),o=D.outcome(draft,t);
 $('#voterTotal').textContent=isVote?t.for+t.against+t.abstain:'—';for(const [key,sel] of [['for','#forCount'],['against','#againstCount'],['abstain','#abstainCount'],['nppv','#nppvCount']])$(sel).textContent=isVote?t[key]:0;
 const total=t.for+t.against+t.abstain+t.nppv+t.missing;let start=0;const colors=[['for','#23a55a'],['against','#df3f4f'],['abstain','#f3a61b'],['nppv','#8d9caf'],['missing','#dce3eb']];
 $('#resultCircle').style.background=isVote&&total?'conic-gradient('+colors.map(([k,c])=>{const end=start+t[k]/total*100,segment=`${c} ${start}% ${end}%`;start=end;return segment;}).join(',')+')':'#dce3eb';$('#resultCircle').dataset.decision=o.pending?'En attente':o.decision;
 $('#resultBanner').className='result-banner '+(o.pending||!isVote?'warn':o.adopted?'ok':'danger');$('#resultBanner').innerHTML=`<strong>${esc(o.label)}</strong><span>${isVote?`${t.for} pour, ${t.against} contre, ${t.abstain} abstention(s), ${t.nppv} non-participation(s). ${t.missing?`${t.missing} voix à renseigner.`:t.abstain&&o.adopted&&!t.against?'Unanimité des suffrages exprimés.':''}`:'Aucun vote à saisir.'}</span>`;
 $('#tieOptions').hidden=!(isVote&&t.for>0&&t.for===t.against&&draft.scrutin!=='Scrutin secret');$('#tieChoice').value={'Voix prépondérante pour':'for','Voix prépondérante contre':'against','Sans voix prépondérante':'none'}[draft.tie]||'';
 $('#pointStatus').textContent=editing?'À revalider':p.Statut_suivi==='Validé'?'Validé':'En cours';$('#pointStatus').className='status-pill '+(editing?'revision':isLocked?'validated':'current');
 $('#validationNotice').hidden=p.Statut_suivi!=='Validé';$('#validationMessage').textContent=editing?'Correction en cours — validez à nouveau ou annulez.':'✓ Résultat validé — consultation en lecture seule.';$('#editValidatedBtn').hidden=!isLocked;$('#cancelEditBtn').hidden=!editing;
 $$('.decision-card button,.decision-card select,.group-vote-btn,#detailPanel select,#tieChoice,#moreActionsBtn').forEach(e=>e.disabled=isLocked);
 $('#showExceptionsBtn').disabled=false;$('#saveDraftBtn').hidden=p.Statut_suivi==='Validé';$('#validateNextBtn').hidden=isLocked;$('#validateNextBtn').disabled=!!o.pending;$('#validateNextBtn').textContent=editing?'Valider les modifications':'Valider et passer au point suivant →';
}
function openModal(title,body,save){modalTrigger=document.activeElement;$('#rareModalTitle').textContent=title;$('#rareModalBody').innerHTML=body;$('#modalError').hidden=true;$('#rareModal').hidden=false;$('#moreActionsMenu').hidden=true;$('#moreActionsBtn').setAttribute('aria-expanded','false');modalSave=save;$('#rareModalBody').querySelector('input,select,textarea')?.focus();}
function closeModal(){if(busy)return;$('#rareModal').hidden=true;modalSave=null;modalTrigger?.focus();}
function hideModal(){ $('#rareModal').hidden=true;modalSave=null; }
function field(id,label,type='text',value='',required=false){return `<label>${label}<input id="${id}" type="${type}" value="${esc(value)}" ${required?'required':''}></label>`;}
function parisTimestamp(value){const [date,time]=value.split('T');if(!date||!time)throw Error('Renseignez la date et l’heure.');const [y,m,d]=date.split('-').map(Number),[h,min]=time.split(':').map(Number);const target=Date.UTC(y,m-1,d,h,min);let guess=target;for(let n=0;n<3;n++){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(guess)).map(x=>[x.type,x.value]));const shown=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute);if(shown===target)return guess/1000;guess+=target-shown;}throw Error('Heure inexistante au changement d’heure. Choisissez une autre heure.');}
function newSession(){if(!leave())return;openModal('Créer une séance',`<div class="modal-grid">${field('newDate','Date et heure (Paris)','datetime-local','',true)}${field('newLabel','Intitulé','text','',true)}${field('newPlace','Lieu','text',db.PARAMETRES_APPLICATION[0]?.Lieu_seance_defaut||'')}${field('newMembers','Membres en exercice','number',db.PARAMETRES_APPLICATION[0]?.Nb_conseillers||D.active(db).length,true)}</div>`,async()=>{
 const actor=operator(),stamp=parisTimestamp($('#newDate').value),members=num($('#newMembers').value);if(members<1)throw Error('Nombre de membres invalide.');await store.fresh();
 const result=await store.apply([['AddRecord','SEANCES_CM',null,{Date_heure_seance:stamp,Reference_seance:'CM-'+$('#newDate').value.slice(0,10).replaceAll('-',''),Libelle_seance:$('#newLabel').value.trim(),Lieu_seance:$('#newPlace').value.trim(),Nb_membres_exercice:members,Statut_seance:'Préparation'}]]);
 sessionId=num(result.retValues?.[0]);pointId=0;hideModal();await refresh();status('connected','Séance créée. Renseignez maintenant ses présences et ses pouvoirs.');
 });}
function settings(){
 if(!leave())return;const s=session(),old=parts();const ids=[...new Set([...D.active(db).map(e=>e.id),...old.map(p=>p.Elu)])];
 openModal('Présences et paramètres de séance',`<div class="modal-grid"><label>Président<select id="president" required>${personOptions(s.President_seance)}</select></label><label>Secrétaire<select id="secretary" required>${personOptions(s.Secretaire_seance)}</select></label>${field('members','Membres en exercice','number',s.Nb_membres_exercice,true)}</div><p>Renseignez chaque élu. Les changements sont appliqués aux votes à venir ; les résultats déjà validés sont conservés.</p><div>${ids.map(id=>{const p=old.find(x=>x.Elu===id)||{},e=db.ELUS.find(e=>e.id===id);return `<div class="attendance-row" data-person="${id}"><strong>${esc(name(id))}</strong><label>Présence<select data-presence required>${option('','À renseigner',p.Statut_presence)}${[D.PRESENT,D.PROXY,'Absent excusé sans pouvoir','Absent non excusé'].map(v=>option(v,v,p.Statut_presence)).join('')}</select></label><label>Mandataire<select data-proxy>${personOptions(p.Mandataire,'Sans pouvoir')}</select></label><label>Groupe de séance<select data-membership>${option(0,'Sans groupe',p.Groupe_seance??e?.Groupe_politique)}${db.GROUPES_POLITIQUES.map(g=>option(g.id,g.Nom,p.Groupe_seance??e?.Groupe_politique)).join('')}</select></label></div>`;}).join('')}</div>`,async()=>{
 const desired=$$('[data-person]').map(row=>({Seance:sessionId,Elu:num(row.dataset.person),Statut_presence:row.querySelector('[data-presence]').value,Mandataire:num(row.querySelector('[data-proxy]').value),Groupe_seance:num(row.querySelector('[data-membership]').value)}));
 const errors=D.participantErrors(desired,D.active(db));if(errors.length)throw Error(errors.join(' '));
 const president=num($('#president').value),secretary=num($('#secretary').value),members=num($('#members').value);
 if(members<desired.length)throw Error('Le nombre de membres ne peut être inférieur au nombre de participations.');
 if(!desired.some(p=>p.Elu===president&&p.Statut_presence===D.PRESENT)||!desired.some(p=>p.Elu===secretary&&p.Statut_presence===D.PRESENT))throw Error('Le président et le secrétaire doivent être présents.');
 await store.fresh();await store.apply([['UpdateRecord','SEANCES_CM',sessionId,{President_seance:president,Secretaire_seance:secretary,Nb_membres_exercice:members}],...D.sync('PARTICIPATIONS_SEANCE',old,desired,p=>p.Elu),log('Mise à jour des présences et pouvoirs',{Ancienne_valeur:JSON.stringify(old),Nouvelle_valeur:JSON.stringify(desired)})]);hideModal();await refresh();
 });
 $$('[data-presence]').forEach(e=>e.onchange=()=>{if(e.value!==D.PROXY)e.closest('[data-person]').querySelector('[data-proxy]').value='';});
}
function addPoint(){
 if(!leave())return;
 const unattached=db.DELIBERATIONS.filter(d=>d.Seance===sessionId&&!db.ORDRE_DU_JOUR.some(p=>p.Deliberation===d.id));
 openModal('Ajouter un point à l’ordre du jour',`<div class="modal-grid"><label class="full">Type<select id="pointType"><option value="new">Nouvelle délibération</option><option value="info">Information sans vote</option>${unattached.length?'<option value="existing">Délibération existante à rattacher</option>':''}</select></label><label id="existingWrap" class="full" hidden>Délibération<select id="existingDelib">${unattached.map(d=>option(d.id,d.Objet)).join('')}</select></label><div class="full" id="titleWrap">${field('newTitle','Objet / intitulé','text','',true)}</div><label>Rapporteur<select id="newRapporteur">${personOptions(0,'Non renseigné')}</select></label><label>Service<select id="newUnit">${option(0,'Non renseigné')}${db.UNITES_ORGANISATIONNELLES.map(u=>option(u.id,u.Nom_service)).join('')}</select></label></div>`,async()=>{
 operator();await store.fresh();const type=$('#pointType').value,title=$('#newTitle').value.trim();let did=type==='existing'?num($('#existingDelib').value):0;
 if(type==='new'){
  const res=await store.apply([['AddRecord','DELIBERATIONS',null,{Seance:sessionId,Objet:title,Rapporteur:num($('#newRapporteur').value),Unite_redactrice:num($('#newUnit').value),Statut_deliberation:'Brouillon service',Decision_seance:'En attente',Mode_scrutin:'Vote à main levée'}]]);did=num(res.retValues?.[0]);if(!did)throw Error('Délibération créée, mais identifiant non reçu. Actualisez avant de poursuivre.');
 }
 try{
 const res=await store.apply([['AddRecord','ORDRE_DU_JOUR',null,{Seance:sessionId,Ordre_point:Math.max(0,...points().map(p=>p.Ordre_point||0))+1,Type_point:type==='info'?'Information au Conseil':'Délibération',Deliberation:did,Intitule_point:type==='existing'?unattached.find(d=>d.id===did)?.Objet||'':title,Statut_suivi:'À venir'}]]);pointId=num(res.retValues?.[0]);
 }catch(e){throw Error(type==='new'?'La délibération a été créée, mais son rattachement a échoué. Actualisez puis choisissez « Délibération existante à rattacher ». '+e.message:e.message);}
 hideModal();await refresh();
 });
 $('#pointType').onchange=()=>{const existing=$('#pointType').value==='existing';$('#existingWrap').hidden=!existing;$('#titleWrap').hidden=existing;$('#newTitle').required=!existing;};
}
async function saveVote(validate){
 if(validate&&$('#liveSessionStatus').textContent==='Suspendue')throw Error('Reprenez la séance avant de valider un résultat.');
 if(locked())throw Error('Utilisez « Modifier le résultat » avant de corriger un point validé.');
 const actor=operator(),voters=currentVoters(),t=D.tally(voters,draft),o=D.outcome(draft,t),d=delib(),isVote=draft.decision==='Vote';
 if(validate&&o.pending)throw Error(o.label);
 if(validate&&isVote){
  const errors=D.participantErrors(parts(),D.active(db));if(errors.length)throw Error(errors.join(' '));
  if(parts().length!==num(session().Nb_membres_exercice))throw Error('Le nombre de participations doit correspondre aux membres en exercice.');
  const quorum=Math.floor(session().Nb_membres_exercice/2)+1;
  if(parts().filter(p=>p.Statut_presence===D.PRESENT).length<quorum)throw Error('Quorum non atteint : validation impossible dans ce module.');
  if(!session().President_seance||!session().Secretaire_seance)throw Error('Renseignez le président et le secrétaire de séance.');
  if(new Set(voters.map(v=>v.id)).size!==voters.length)throw Error('Une même voix figure plusieurs fois dans le résultat.');
  for(const v of voters)if((draft.overrides[v.id]||draft.groups[v.group])===D.NPPV&&!draft.motives[v.id])throw Error('Renseignez le motif de chaque non-participation dans les exceptions individuelles.');
 }
 await store.fresh();const actions=[];
 if(d){
  const desired=isVote?voters.map(v=>({Deliberation:d.id,Elu:v.caster,Vote:Object.hasOwn(draft.overrides,v.id)?draft.overrides[v.id]:draft.groups[v.group]||'Non renseigné',Vote_par_pouvoir:v.proxy,Mandant:v.proxy?v.id:0,Groupe_vote:v.group,Exception_individuelle:Object.hasOwn(draft.overrides,v.id),Motif_non_participation:(draft.overrides[v.id]||draft.groups[v.group])===D.NPPV?draft.motives[v.id]||'':'',Commentaire:''})):[];
  const groupRows=isVote?Object.entries(draft.groups).filter(([g,v])=>num(g)&&D.CHOICES.includes(v)).map(([g,v])=>({Deliberation:d.id,Groupe:num(g),Vote:v})):[];
  actions.push(...D.sync('VOTES_DELIBERATIONS',savedVotes(),desired,v=>v.Vote_par_pouvoir?v.Mandant:v.Elu));
  actions.push(...D.sync('VOTES_GROUPES',db.VOTES_GROUPES.filter(g=>g.Deliberation===d.id),groupRows,g=>g.Groupe));
  actions.push(['UpdateRecord','DELIBERATIONS',d.id,{Decision_seance:o.decision||'En attente',Mode_scrutin:isVote?draft.scrutin:'Sans vote',Mode_saisie_vote:draft.mode==='unanimity'?'Unanimité':'Par groupes',Departage:draft.tie||''}]);
 }
 actions.push(['UpdateRecord','ORDRE_DU_JOUR',pointId,{Statut_suivi:validate?'Validé':'En cours',Date_validation_seance:validate?now():null,Valide_par:validate?actor:0}]);
 actions.push(log(validate?(editing?'Correction du résultat validée':'Résultat validé'):'Brouillon de vote enregistré',{Type_action:'Saisie vote',Ancienne_valeur:JSON.stringify({votes:savedVotes(),statut:point().Statut_suivi}),Nouvelle_valeur:JSON.stringify({draft,resultat:o.label})}));
 const wasEdit=editing,list=points(),index=list.findIndex(p=>p.id===pointId),next=list[index+1]?.id;
 await store.apply(actions);
 // A green validated badge is displayed only after the complete write succeeded.
 if(validate&&!wasEdit&&next)pointId=next;dirty=false;editing=false;await refresh();status('connected',validate?'Résultat enregistré et validé dans Grist.':'Brouillon enregistré dans Grist.');
}
function rare(type){
 if(locked())return;
 if(type==='nppv'){
  const voters=currentVoters();openModal('Déclarer une non-participation',`<label>Élu<select id="nppvPerson" required>${option('','Choisir…')}${voters.map(v=>option(v.id,name(v.id))).join('')}</select></label><label>Motif<select id="nppvMotive" required>${option('','Choisir…')}${['Conflit d’intérêts','Retrait volontaire','Sortie temporaire de séance','Autre'].map(v=>option(v,v)).join('')}</select></label>`,async()=>{
   const id=num($('#nppvPerson').value);draft.mode='groups';draft.overrides[id]=D.NPPV;draft.motives[id]=$('#nppvMotive').value;draft.tie='';dirty=true;await saveVote(false);hideModal();
  });return;
 }
 if(!leave())return;
 if(type==='attendance'||type==='proxy'){
  const proxy=type==='proxy';
  openModal(proxy?'Modifier un pouvoir':'Signaler une arrivée / un départ',`<label>${proxy?'Élu donnant pouvoir':'Élu'}<select id="eventPerson" required>${personOptions(0)}</select></label>${proxy?`<label>Mandataire<select id="eventProxy" required>${personOptions(0)}</select></label>`:'<label>Événement<select id="eventPresence"><option value="Présent">Arrivée</option><option value="Absent excusé sans pouvoir">Départ sans pouvoir</option></select></label>'}<p>La modification prendra effet pour les points non validés. Pour retirer un pouvoir ou régler plusieurs situations ensemble, utilisez les paramètres de séance.</p>`,async()=>{
   const id=num($('#eventPerson').value),old=parts().find(p=>p.Elu===id);if(!old)throw Error('Renseignez d’abord les participations dans les paramètres de séance.');
   const fields={Statut_presence:proxy?D.PROXY:$('#eventPresence').value,Mandataire:proxy?num($('#eventProxy').value):0};
   const desired=parts().map(p=>p.id===old.id?{...p,...fields}:p);const errors=D.participantErrors(desired,D.active(db));if(errors.length)throw Error(errors.join(' '));
   await store.fresh();await store.apply([['UpdateRecord','PARTICIPATIONS_SEANCE',old.id,fields],log(proxy?'Modification de pouvoir':fields.Statut_presence===D.PRESENT?'Arrivée en séance':'Départ de séance',{Elu_concerne:id,Mandataire:fields.Mandataire,Ancienne_valeur:JSON.stringify(old),Nouvelle_valeur:JSON.stringify(fields)})]);hideModal();await refresh();
  });return;
 }
 if(type==='amendment'){
  if(!delib())throw Error('Un amendement nécessite une délibération.');
  openModal('Ajouter un amendement',`<label>Auteur<select id="amendAuthor" required>${personOptions(0)}</select></label><label>Zone concernée<select id="amendZone"><option>Article</option><option>Considérant</option><option>Exposé des motifs</option><option>Autre</option></select></label><label>Texte de l’amendement<textarea id="amendText" required></textarea></label><p>L’amendement sera conservé dans Grist ; son intégration au texte définitif reste à effectuer dans le module de rédaction.</p>`,async()=>{
   await store.fresh();await store.apply([['AddRecord','AMENDEMENTS_SEANCE',null,{Deliberation:delib().id,Numero_amendement:Math.max(0,...db.AMENDEMENTS_SEANCE.filter(a=>a.Deliberation===delib().id).map(a=>a.Numero_amendement||0))+1,Zone_concernee:$('#amendZone').value,Texte_apres:$('#amendText').value.trim(),Auteur_amendement:num($('#amendAuthor').value),Integre_texte_definitif:false}],log('Amendement ajouté',{Type_action:'Amendement'})]);hideModal();await refresh();
  });return;
 }
 const suspension=type==='suspend';
 openModal(suspension?'Suspendre / reprendre la séance':'Ajouter une observation',`${suspension?'<label>Événement<select id="suspensionEvent"><option>Suspension de séance</option><option>Reprise de séance</option></select></label>':''}<label>${suspension?'Motif / observation':'Observation'}<textarea id="eventText" ${suspension?'':'required'}></textarea></label>`,async()=>{
  await store.fresh();await store.apply([log(suspension?$('#suspensionEvent').value:'Observation de séance',{Nouvelle_valeur:$('#eventText').value.trim()})]);hideModal();await refresh();
 });
}
function bind(){
 $('#newSessionBtn').onclick=()=>execute(async()=>newSession());$('#openSettingsBtn').onclick=()=>execute(async()=>settings());$('#newPointBtn').onclick=()=>execute(async()=>addPoint());
 $('#refreshBtn').onclick=()=>{if(leave())execute(refresh);};
 $('#sessionPicker').onchange=()=>{if(!leave()){$('#sessionPicker').value=sessionId;return;}sessionId=num($('#sessionPicker').value);pointId=points()[0]?.id||0;dirty=false;editing=false;restore();render();};
 $('#prevPointBtn').onclick=()=>{const ps=points(),i=ps.findIndex(p=>p.id===pointId);if(i>0)navigate(ps[i-1].id);};$('#nextPointBtn').onclick=()=>{const ps=points(),i=ps.findIndex(p=>p.id===pointId);if(i<ps.length-1)navigate(ps[i+1].id);};
 $$('.decision-option').forEach(b=>b.onclick=()=>{if(locked())return;draft.decision=b.dataset.decision==='Adoptée'?'Vote':b.dataset.decision;mark();});
 $$('.vote-mode').forEach(b=>b.onclick=()=>{if(locked())return;draft.mode=b.dataset.mode;if(draft.mode==='unanimity'){draft.groups=Object.fromEntries(currentVoters().map(v=>[v.group,'Pour']));draft.overrides={};draft.motives={};detail=false;}mark();});
 $('#scrutin').onchange=()=>{draft.scrutin=$('#scrutin').value;mark();};$('#tieChoice').onchange=()=>{draft.tie={for:'Voix prépondérante pour',against:'Voix prépondérante contre',none:'Sans voix prépondérante'}[$('#tieChoice').value]||'';dirty=true;renderVotes();};
 $('#showExceptionsBtn').onclick=()=>{detail=!detail;renderVotes();};$('#editValidatedBtn').onclick=()=>{editing=true;renderVotes();};$('#cancelEditBtn').onclick=()=>{editing=false;dirty=false;restore();renderVotes();};
 $('#saveDraftBtn').onclick=()=>execute(()=>saveVote(false));$('#validateNextBtn').onclick=()=>execute(()=>saveVote(true));
 $('#moreActionsBtn').onclick=()=>{const m=$('#moreActionsMenu');m.hidden=!m.hidden;$('#moreActionsBtn').setAttribute('aria-expanded',String(!m.hidden));};
 $$('[data-rare]').forEach(b=>b.onclick=()=>execute(async()=>rare(b.dataset.rare)));
 $('#closeRareModalBtn').onclick=closeModal;$('#cancelRareBtn').onclick=closeModal;
 $('#confirmRareBtn').onclick=()=>{if($('#modalForm').reportValidity()&&modalSave)execute(modalSave);};$('#modalForm').onsubmit=e=>{e.preventDefault();$('#confirmRareBtn').click();};
 $('#rareModal').onclick=e=>{if(e.target===$('#rareModal'))closeModal();};
 document.addEventListener('click',e=>{if(!e.target.closest('.rare-actions-wrap')){$('#moreActionsMenu').hidden=true;$('#moreActionsBtn').setAttribute('aria-expanded','false');}});
 document.addEventListener('keydown',e=>{
  if(busy)return;if(e.key==='Escape'){if(!$('#rareModal').hidden)closeModal();$('#moreActionsMenu').hidden=true;}
  if(e.key==='Tab'&&!$('#rareModal').hidden){const focusable=[...$('#rareModal').querySelectorAll('button,input,select,textarea')].filter(el=>!el.disabled&&el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 });
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
}
window.addEventListener('DOMContentLoaded',()=>{
 bind();
 if(!window.grist||window.parent===window){status('warning','Version connectée : installez cette URL dans un widget personnalisé Grist, avec accès complet.');$('#liveHelp').innerHTML='Pour tester sans Grist, ouvrez la <a href="demo-session.html">démonstration séparée</a>. Aucune donnée réelle n’est chargée ici.';return;}
 store=new D.Store({fetchTable:t=>{if(!accessGranted)throw Error('Accès complet au document requis.');return grist.docApi.fetchTable(t);},applyUserActions:a=>{if(!accessGranted)throw Error('Accès complet au document requis.');return grist.docApi.applyUserActions(a);}});let started=false;
 grist.onOptions((options,interaction)=>{
  // Current Grist API uses accessLevel; accept the legacy spelling only when absent.
  accessGranted=(interaction?.accessLevel ?? interaction?.access_level)==='full';
  if(!accessGranted){$('#connectedContent').hidden=true;$$('#sessionPicker,#operatorPicker,#newSessionBtn,#refreshBtn').forEach(e=>e.disabled=true);status('warning','Autorisez l’accès complet au document dans les options du widget Grist.');return;}
  $('#refreshBtn').disabled=false;
  if(!started){started=true;execute(refresh);}else if(db)render();
 });
 grist.ready({requiredAccess:'full'});
});
})();
