(function(){
 'use strict';
 let originId=0,originSnapshot='',routePending=true;const route=new URLSearchParams(location.search);
 const D=window.DraftingData,E=window.DeliberationEditor,$=s=>document.querySelector(s);
 let db=Object.fromEntries(D.tables.map(t=>[t,[]])),id=0,baseline='',originalScope='',access=false,busy=false,initialized=false,loadFailed=false;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fingerprint=()=>JSON.stringify(E.payload());
 const dirty=()=>baseline!==fingerprint();
 const readOnly=()=>D.locked(db,id);
 function status(type,message){window.dispatchEvent(new CustomEvent('grist-status',{detail:{type,message}}));}
 function controls(){
  $('#draftFields').disabled=busy||loadFailed;
  $('#draftFields').querySelectorAll('input,select,textarea,button').forEach(e=>{e.disabled=readOnly()&&e.id!=='previewDraft';});
  $('#seance').disabled=readOnly()||!!(id&&db.ORDRE_DU_JOUR.some(p=>p.Deliberation===id));
  $('#saveBtn').disabled=!access||busy||readOnly()||loadFailed;
  $('#projectPicker').inert=busy||!access;$('#newDraft').disabled=busy||!access;$('#reloadDraft').disabled=busy||!access;
  $('#draftMessage').textContent=readOnly()?'Lecture seule : séance verrouillée ou engagée, projet validé ou contenus structurés à préserver.':dirty()?'● Modifications non enregistrées':id?'✓ Projet enregistré dans Grist':'Nouveau brouillon — saisissez son objet pour pouvoir l’enregistrer.';
 }
 let libraryLimit=12;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
 function councilOf(d){return db.SEANCES_CM.find(s=>s.id===(d.Seance||db.ORDRE_DU_JOUR.find(p=>p.Deliberation===d.id)?.Seance));}
 function archived(d){return councilOf(d)?.Statut_seance==='Terminée';}
 function councilLabel(s){return s?(s.Date_heure_seance?new Date(s.Date_heure_seance*1000).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Paris'}):s.Libelle_seance||'Date à préciser'):'Sans conseil prévu';}
 function list(){
  const filter=$('#projectCouncil'),saved=filter.value;
  filter.innerHTML='<option value="all">Tous les conseils</option><option value="none">Sans conseil</option>'+db.SEANCES_CM.filter(s=>s.Statut_seance!=='Terminée').slice().sort((a,b)=>(a.Date_heure_seance||Infinity)-(b.Date_heure_seance||Infinity)).map(s=>`<option value="${s.id}">${esc(councilLabel(s))}</option>`).join('');filter.value=[...filter.options].some(o=>o.value===saved)?saved:'all';
  const q=norm($('#projectSearch').value),state=$('#projectState').value,sort=$('#projectSort').value;
  const projects=db.DELIBERATIONS.filter(d=>!archived(d)).filter(d=>{
   const session=councilOf(d),locked=D.locked(db,d.id);
   return (filter.value==='all'||(filter.value==='none'?!session:String(session?.id)===filter.value))&&(state==='all'||(state==='locked'?locked:!locked))&&norm([d.Objet,d.Domaine,councilLabel(session)].join(' ')).includes(q);
  }).sort((a,b)=>sort==='title'?(a.Objet||'').localeCompare(b.Objet||'','fr'):sort==='domain'?(a.Domaine||'').localeCompare(b.Domaine||'','fr')||(a.Objet||'').localeCompare(b.Objet||'','fr'):sort==='council'?(councilOf(a)?.Date_heure_seance||Infinity)-(councilOf(b)?.Date_heure_seance||Infinity)||b.id-a.id:b.id-a.id);
  $('#projectCount').textContent=projects.length+' projet'+(projects.length>1?'s':'')+' · '+Math.min(libraryLimit,projects.length)+' affiché'+(Math.min(libraryLimit,projects.length)>1?'s':'');
  $('#projectPicker').innerHTML=projects.slice(0,libraryLimit).map(d=>{const locked=D.locked(db,d.id),session=councilOf(d);return `<button type="button" class="draft-card ${d.id===id?'selected':''}" data-draft="${d.id}" aria-pressed="${d.id===id}"><span class="draft-card-state">${locked?'Lecture seule':'Modifiable'}${d.id===id?' · Projet ouvert':''}</span><strong>${esc(d.Objet||'Sans objet')}</strong><span class="draft-card-council ${session?'':'unassigned'}">${session?'Conseil du ':''}${esc(councilLabel(session))}</span><span class="draft-card-meta">${esc(d.Domaine||'Domaine non renseigné')} · ${esc(d.Statut_deliberation==='Brouillon service'?'Brouillon DGS':d.Statut_deliberation||'Brouillon')}</span><span class="draft-card-open">${locked?'Consulter':'Reprendre la rédaction'} →</span></button>`;}).join('')||'<p class="library-empty">Aucun projet ne correspond à ces critères. Modifiez les filtres ou créez un nouveau projet.</p>';
  $('#moreProjects').hidden=projects.length<=libraryLimit;
 }
 function show(next){
  originId=0;originSnapshot='';id=next;const loaded=D.load(db,id);if(!id){const units=db.UNITES_ORGANISATIONNELLES.filter(u=>['dgs','direction generale des services'].includes((u.Nom_service||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()));if(units.length===1)loaded.fields.Unite_redactrice=units[0].id;}E.load(loaded);baseline=fingerprint();originalScope=JSON.stringify(D.scope(db,id));list();controls();
 }
 async function fetchDB(){
  const fetchTables=route.has('subject')?[...D.tables,'SUJETS_PREVISIONNELS']:D.tables;
  const results=await Promise.allSettled(fetchTables.map(t=>grist.docApi.fetchTable(t)));
  const errors=results.flatMap((r,i)=>r.status==='rejected'?[`${fetchTables[i]} : ${r.reason?.message||r.reason}`]:[]);
  if(errors.length)throw Error('Lecture Grist impossible. '+errors.join(' ; '));
  if(!access)throw Error('L’accès complet au document est requis.');
  return Object.fromEntries(results.map((r,i)=>[fetchTables[i],D.rows(r.value)]));
 }
 async function run(fn){if(busy)return;busy=true;controls();try{await fn();}catch(e){status('error',e.message);}finally{busy=false;controls();}}
 function mayLeave(){return !dirty()||window.confirm('Abandonner les modifications non enregistrées ?');}
 async function refresh(){if(!mayLeave())return;await run(async()=>{
  const pendingOrigin=originId;db=await fetchDB();loadFailed=false;let target=db.DELIBERATIONS.some(d=>d.id===id)?id:0,source=null;
  if(routePending&&route.has('draft')){target=Number(route.get('draft'));if(!db.DELIBERATIONS.some(d=>d.id===target))throw Error('Le projet demandé est introuvable.');}
  if((routePending&&route.has('subject'))||(!id&&pendingOrigin)){
   const sid=pendingOrigin||Number(route.get('subject'));source=db.SUJETS_PREVISIONNELS.find(s=>s.id===sid);if(!source)throw Error('Le sujet demandé est introuvable.');
   target=source.Deliberation||0;if(target&&!db.DELIBERATIONS.some(d=>d.id===target))throw Error('Le projet lié au sujet est introuvable.');
  }
  show(target);
  if(source&&!target){originId=source.id;originSnapshot=JSON.stringify(source);$('#objet').value=source.Intitule||'';$('#preparationNote').value=source.Note||'';$('#seance').value=String(source.Seance||'');E.renderAll();baseline=fingerprint();controls();}
  else if(routePending&&!target&&route.has('session')){const sid=Number(route.get('session'));if(!db.SEANCES_CM.some(s=>s.id===sid))throw Error('La séance demandée est introuvable.');$('#seance').value=String(sid);baseline=fingerprint();controls();}
  routePending=false;initialized=true;status('connected',originId?'Sujet prérempli — le brouillon sera créé uniquement au clic sur Enregistrer.':'Connecté à Grist — rédaction des projets de délibérations.');
 });}
 async function save(){
  if(!access||readOnly()||loadFailed)return;
  await run(async()=>{
   const p=structuredClone(E.payload());
   if(!p.general.objet.trim())throw Error('Renseignez l’objet de la délibération avant d’enregistrer.');
   const fresh=await fetchDB();
   if(id&&JSON.stringify(D.scope(fresh,id))!==originalScope)throw Error('Ce projet a été modifié dans Grist depuis son ouverture. Votre saisie est conservée à l’écran. Copiez les passages à garder avant d’actualiser.');
   if(originId&&JSON.stringify(fresh.SUJETS_PREVISIONNELS.find(s=>s.id===originId))!==originSnapshot)throw Error('Ce sujet a été modifié ou déjà utilisé depuis son ouverture. Actualisez avant de poursuivre.');
   if(p.articles.some(a=>a.customPrefix)){await DocumentStore.ensure(grist.docApi,'ARTICLES',[{id:'Prefixe_personnalise',type:'Text'}]);}
   const batch=D.plan(fresh,id,p,originId);
   if(!access)throw Error('L’accès complet au document est requis.');
   if(batch.actions.length)await grist.docApi.applyUserActions(batch.actions);
   // Commit acknowledged: never replay a create if subsequent reloading fails.
   id=batch.id;originId=0;originSnapshot='';baseline=fingerprint();loadFailed=true;
   try{db=await fetchDB();loadFailed=false;show(id);status('connected','✓ Projet enregistré dans Grist.');}
   catch(e){status('error','Enregistrement effectué, mais la relecture a échoué. Cliquez sur Actualiser avant de poursuivre. '+e.message);}
  });
 }
 function preview(){
  if(id&&D.scope(db,id).CONTENUS_ARTICLES.length){status('warning','Ce projet comporte des contenus structurés supplémentaires. Consultez-les dans Grist : l’aperçu de cette version ne les prend pas encore en charge.');return;}
  const p=E.payload(), selected=s=>$(s).selectedOptions?.[0]?.textContent||'Non renseigné';
  let modal=$('#draftPreview');if(!modal){modal=document.createElement('dialog');modal.id='draftPreview';modal.innerHTML='<div class="preview-tools"><strong>Aperçu du projet</strong><button id="closePreview" class="secondary-btn">Fermer ×</button></div><div id="previewPaper"></div>';document.body.append(modal);$('#closePreview').onclick=()=>modal.close();modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});}
  const para=(text,tag='p')=>`<${tag}>${esc(text)}</${tag}>`;
  const cell=(c,col)=>{if(col.format==='Date')return c.date?new Date(c.date+'T00:00:00Z').toLocaleDateString('fr-FR',{timeZone:'UTC'}):'';if(['Nombre entier','Nombre décimal','Montant en euros','Pourcentage','Surface'].includes(col.format)){if(c.number==null||c.number==='')return '';return Number(c.number).toLocaleString('fr-FR')+({'Montant en euros':' €','Pourcentage':' %','Surface':' m²'}[col.format]||'');}return c.text||'';};
  const table=t=>`<div class="preview-table">${t.showTitle?para(t.title,'h4'):''}<table>${t.showHeader!==false?'<thead><tr>'+t.columns.map(c=>`<th>${esc(c.title)}</th>`).join('')+'</tr></thead>':''}<tbody>${t.rows.map(r=>'<tr>'+t.columns.map((c,i)=>`<td>${esc(cell(r.cells[i]||{},c))}</td>`).join('')+'</tr>').join('')}</tbody></table>${para(t.note||'','small')}</div>`;
  $('#previewPaper').innerHTML=`<div class="paper-brand">SANGUINET <small>Conseil municipal · Projet de délibération</small></div><h1>${esc(p.general.objet||'Objet à renseigner')}</h1><p class="paper-meta">Séance : ${p.general.seance?esc(selected('#seance')):'À déterminer'}<br>Service rédacteur : ${p.general.unite?esc(selected('#unite')):'À déterminer'}<br>Rapporteur : ${p.general.rapporteur?esc(selected('#rapporteur')):'À déterminer'}</p><h2>Exposé des motifs</h2>${p.expose.map(x=>x.format==='Sous-titre'?para(x.text,'h3'):['Liste à puces','Liste numérotée'].includes(x.format)?`<${x.format==='Liste à puces'?'ul':'ol'}>${x.text.split('\n').filter(Boolean).map(line=>para(line,'li')).join('')}</${x.format==='Liste à puces'?'ul':'ol'}>`:para(x.text)).join('')}${p.visas.map(x=>para('Vu '+x.text)).join('')}${p.considerants.map(x=>para('Considérant '+x.text)).join('')}<p><strong>Il est proposé au Conseil municipal :</strong></p>${p.articles.map((a,i)=>`<h3>Article ${i+1}${a.title?' — '+esc(a.title):''}</h3>${para(a.text)}${(a.tables||[]).map(table).join('')}`).join('')}${E.state.annexes.length?'<h2>Annexes</h2>'+E.state.annexes.map(a=>para(a.Titre_annexe||'Annexe')).join(''):''}<footer>Aperçu de travail — la mise en page des documents Word et PDF sera traitée dans le module de génération.</footer>`;
  modal.showModal();
 }
 $('#saveBtn').onclick=save;$('#previewDraft').onclick=preview;

 $('#rapporteurSearch').oninput=()=>{const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const q=norm($('#rapporteurSearch').value);const selected=$('#rapporteur').value;$('#rapporteur').innerHTML='<option value="">— Sélectionner —</option>'+db.ELUS.filter(e=>String(e.id)===selected||norm(e.Nom_complet||'').includes(q)).map(e=>`<option value="${e.id}" ${String(e.id)===selected?'selected':''}>${esc(e.Nom_complet)}</option>`).join('');};
 $('#projectPicker').onclick=e=>{const card=e.target.closest('[data-draft]');if(!card||busy||!access)return;const next=Number(card.dataset.draft);if(next!==id&&mayLeave()){window.TableEditor.close();show(next);$('#draftMessage').scrollIntoView({block:'start'});$('#objet').focus();}};
 for(const selector of ['#projectSearch','#projectCouncil','#projectState','#projectSort'])$(selector).addEventListener(selector==='#projectSearch'?'input':'change',()=>{libraryLimit=12;list();});
 $('#resetProjectFilters').onclick=()=>{$('#projectSearch').value='';$('#projectCouncil').value='all';$('#projectState').value='all';$('#projectSort').value='recent';libraryLimit=12;list();};
 $('#moreProjects').onclick=()=>{libraryLimit+=12;list();};
 const creation=document.createElement('dialog');creation.id='newDraftDialog';creation.setAttribute('aria-labelledby','creationTitle');creation.innerHTML=`<form id="newDraftForm"><div class="creation-heading"><h2 id="creationTitle">Nouvelle délibération</h2><button type="button" id="closeCreation" class="ghost-btn" aria-label="Fermer">×</button></div><p>Un objet suffit pour enregistrer votre brouillon. Vous pourrez compléter toutes les autres informations plus tard.</p><label>Objet de la délibération<input id="creationObject" required maxlength="1000" placeholder="Ex. Renouvellement d’une convention"></label><label>Conseil prévu — facultatif<select id="creationCouncil"></select></label><label>Note de préparation — facultative<textarea id="creationNote" rows="3"></textarea></label><p id="creationError" role="alert"></p><div class="creation-actions"><button type="button" id="cancelCreation" class="ghost-btn">Annuler</button><button id="submitCreation" class="primary-btn">Enregistrer le brouillon</button></div></form>`;document.body.append(creation);
 const closeCreation=()=>{if(!busy)creation.close();};$('#closeCreation').onclick=closeCreation;$('#cancelCreation').onclick=closeCreation;creation.addEventListener('cancel',e=>{if(busy)e.preventDefault();});creation.addEventListener('click',e=>{if(e.target===creation){const r=creation.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeCreation();}});
 $('#newDraft').onclick=()=>{if(busy||!access)return;$('#newDraftForm').reset();$('#creationError').textContent='';$('#creationCouncil').innerHTML='<option value="0">Sans conseil pour le moment</option>'+db.SEANCES_CM.filter(s=>D.sessionOpen(db,s.id)).slice().sort((a,b)=>a.Date_heure_seance-b.Date_heure_seance).map(s=>`<option value="${s.id}">${esc(councilLabel(s))}</option>`).join('');creation.showModal();$('#creationObject').focus();};
 $('#newDraftForm').onsubmit=async e=>{e.preventDefault();if(busy||!access)return;const objet=$('#creationObject').value.trim();if(!objet){$('#creationError').textContent='Renseignez simplement un objet pour identifier ce brouillon.';return;}if(!mayLeave())return;
 await run(async()=>{for(const el of creation.querySelectorAll('input,select,textarea,button'))el.disabled=true;$('#creationError').textContent='';try{
 const fresh=await fetchDB();const payload={general:{objet,seance:Number($('#creationCouncil').value)||0,note:$('#creationNote').value,unite:0,rapporteur:0,domaine:''},expose:[],visas:[],considerants:[],articles:[]};const batch=D.plan(fresh,0,payload);if(!access)throw Error('Accès complet au document requis.');await grist.docApi.applyUserActions(batch.actions);
 creation.close();window.TableEditor.close();id=batch.id;originId=0;originSnapshot='';loadFailed=true;baseline=fingerprint();
 try{db=await fetchDB();loadFailed=false;$('#resetProjectFilters').click();show(id);$('#draftMessage').scrollIntoView({block:'start'});status('connected','✓ Brouillon enregistré. Complétez-le à votre rythme.');}catch(err){status('error','Brouillon enregistré, mais relecture impossible. Cliquez sur Actualiser.');}
 }catch(err){$('#creationError').textContent=err.message;throw err;}finally{for(const el of creation.querySelectorAll('input,select,textarea,button'))el.disabled=false;}});
 };

 $('#reloadDraft').onclick=refresh;
 document.addEventListener('input',e=>{if(e.target.closest('#draftFields'))controls();});
 document.addEventListener('change',e=>{if(e.target.closest('#draftFields'))controls();});
 window.addEventListener('draft-render',()=>{if(initialized)controls();});
 window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
 window.Drafting={readOnly,context:()=>({db,id,access,busy,dirty:dirty()}),fetchDB,refresh,run};
 show(0);$('#planningBack').hidden=route.get('from')!=='planning';
 window.addEventListener('DOMContentLoaded',()=>{
  $('#appVersion').textContent='v0.11.3 · Rédaction';
  if(!window.grist||parent===window){initialized=true;status('warning','Aperçu local : vous pouvez essayer la rédaction et les tableaux. Pour enregistrer, ouvrez cette page comme widget Grist avec accès complet.');controls();return;}
  grist.onOptions((options,interaction)=>{
   access=(interaction?.accessLevel??interaction?.access_level)==='full';
   if(!access){window.TableEditor.close();status('warning','Autorisez l’accès complet au document dans les options du widget Grist.');controls();return;}
   if(!initialized)refresh();else controls();
  });
  grist.ready({requiredAccess:'full'});
 });
})();
