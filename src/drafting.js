(function(){
 'use strict';
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
  $('#saveBtn').disabled=!access||busy||readOnly()||loadFailed;
  $('#projectPicker').disabled=busy||!access;$('#newDraft').disabled=busy||!access;$('#reloadDraft').disabled=busy||!access;
  $('#draftMessage').textContent=readOnly()?'Lecture seule : projet engagé dans le circuit de validation, inscrit à l’ordre du jour ou comportant des contenus structurés à préserver.':dirty()?'● Modifications non enregistrées':id?'✓ Projet enregistré dans Grist':'Nouveau brouillon — saisissez son objet pour pouvoir l’enregistrer.';
 }
 function list(){
  const q=$('#projectSearch').value.toLocaleLowerCase('fr');
  $('#projectPicker').innerHTML='<option value="0">Nouveau projet</option>'+db.DELIBERATIONS.filter(d=>d.id===id||(d.Objet||'').toLocaleLowerCase('fr').includes(q)).sort((a,b)=>b.id-a.id).map(d=>`<option value="${d.id}">${esc(d.Objet||'Sans objet')} — ${esc(d.Statut_deliberation||'Brouillon')}</option>`).join('');
  $('#projectPicker').value=String(id);
 }
 function show(next){
  id=next;E.load(D.load(db,id));baseline=fingerprint();originalScope=JSON.stringify(D.scope(db,id));list();controls();
 }
 async function fetchDB(){
  const results=await Promise.allSettled(D.tables.map(t=>grist.docApi.fetchTable(t)));
  const errors=results.flatMap((r,i)=>r.status==='rejected'?[`${D.tables[i]} : ${r.reason?.message||r.reason}`]:[]);
  if(errors.length)throw Error('Lecture Grist impossible. '+errors.join(' ; '));
  if(!access)throw Error('L’accès complet au document est requis.');
  return Object.fromEntries(results.map((r,i)=>[D.tables[i],D.rows(r.value)]));
 }
 async function run(fn){if(busy)return;busy=true;controls();try{await fn();}catch(e){status('error',e.message);}finally{busy=false;controls();}}
 function mayLeave(){return !dirty()||window.confirm('Abandonner les modifications non enregistrées ?');}
 async function refresh(){if(!mayLeave())return;await run(async()=>{const fresh=await fetchDB();db=fresh;loadFailed=false;show(db.DELIBERATIONS.some(d=>d.id===id)?id:0);initialized=true;status('connected','Connecté à Grist — rédaction des projets de délibérations.');});}
 async function save(){
  if(!access||readOnly()||loadFailed)return;
  await run(async()=>{
   const p=structuredClone(E.payload());
   if(!p.general.objet.trim())throw Error('Renseignez l’objet de la délibération avant d’enregistrer.');
   const fresh=await fetchDB();
   if(id&&JSON.stringify(D.scope(fresh,id))!==originalScope)throw Error('Ce projet a été modifié dans Grist depuis son ouverture. Votre saisie est conservée à l’écran. Copiez les passages à garder avant d’actualiser.');
   const batch=D.plan(fresh,id,p);
   if(!access)throw Error('L’accès complet au document est requis.');
   if(batch.actions.length)await grist.docApi.applyUserActions(batch.actions);
   // Commit acknowledged: never replay a create if subsequent reloading fails.
   id=batch.id;baseline=fingerprint();loadFailed=true;
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
 $('#projectSearch').oninput=list;
 $('#projectPicker').onchange=()=>{const next=Number($('#projectPicker').value);if(mayLeave())show(next);else $('#projectPicker').value=String(id);};
 $('#newDraft').onclick=()=>{if(mayLeave()){window.TableEditor.close();show(0);$('#objet').focus();}};
 $('#reloadDraft').onclick=refresh;
 document.addEventListener('input',e=>{if(e.target.closest('#draftFields'))controls();});
 document.addEventListener('change',e=>{if(e.target.closest('#draftFields'))controls();});
 window.addEventListener('draft-render',()=>{if(initialized)controls();});
 window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
 window.Drafting={readOnly};
 show(0);
 window.addEventListener('DOMContentLoaded',()=>{
  $('#appVersion').textContent='v0.6.0 · Rédaction';
  if(!window.grist||parent===window){initialized=true;status('warning','Aperçu local : vous pouvez essayer la rédaction et les tableaux. Pour enregistrer, ouvrez cette page comme widget Grist avec accès complet.');controls();return;}
  grist.onOptions((options,interaction)=>{
   access=(interaction?.accessLevel??interaction?.access_level)==='full';
   if(!access){window.TableEditor.close();status('warning','Autorisez l’accès complet au document dans les options du widget Grist.');controls();return;}
   if(!initialized)refresh();else controls();
  });
  grist.ready({requiredAccess:'full'});
 });
})();
