(function(){
  const state = {
    currentId: null,
    expose: [], visas: [], considerants: [], articles: [], annexes: []
  };

  const demo = {
    expose:[
      {text:'La commune de Sanguinet propose d’actualiser ses tarifs municipaux pour l’année 2027.', format:'Texte courant'},
      {text:'Ces tarifs concernent notamment les services municipaux et les occupations du domaine public.', format:'Texte courant'},
      {text:'Cette révision tient compte de l’évolution des coûts et de la volonté de maintenir un service public de qualité.', format:'Texte courant'}
    ],
    visas:[
      {text:'le Code général des collectivités territoriales', category:'Code'},
      {text:'la délibération relative aux tarifs municipaux 2026', category:'Délibération antérieure'},
      {text:'les pièces annexées à la présente délibération', category:'Document annexé'}
    ],
    considerants:[
      {text:'la nécessité d’actualiser les tarifs municipaux pour l’année 2027', category:'Nécessité de la décision'},
      {text:'la volonté de garantir l’accessibilité des services publics', category:'Intérêt général'},
      {text:'l’équilibre budgétaire du budget principal', category:'Motif financier'}
    ],
    articles:[
      {text:'D’approuver les tarifs municipaux applicables à compter du 1er janvier 2027.', category:'Approbation', title:'', tables:[]},
      {text:'D’autoriser Monsieur le Maire à signer tout document nécessaire à l’exécution de la présente délibération.', category:'Autorisation', title:'', tables:[]}
    ]
  };

  const categoriesVisas = ['Code','Loi ou règlement','Délibération antérieure','Décision ou arrêté','Avis ou consultation','Convention ou contrat','Document annexé','Autre'];
  const categoriesCons = ['Contexte','Motif juridique','Motif administratif','Motif financier','Motif technique','Intérêt général','Nécessité de la décision','Autre'];
  const categoriesArticles = ['Prise d’acte','Approbation','Autorisation','Décision','Fixation d’un montant ou tarif','Attribution','Modification','Abrogation','Mandat donné au Maire','Disposition financière','Autre'];

  function escapeHtml(v=''){return String(v).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}
  function options(values, selected){return values.map(v=>`<option ${v===selected?'selected':''}>${escapeHtml(v)}</option>`).join('');}
  function setOptions(el, rows, labelFn, selected){
    el.innerHTML='<option value="">— Sélectionner —</option>' + rows.map(r=>`<option value="${r.id}" ${Number(selected)===Number(r.id)?'selected':''}>${escapeHtml(labelFn(r))}</option>`).join('');
  }

  function normalizeLoaded(data){
    state.currentId = data.id;
    state.expose = data.expose.map(r=>({id:r.id,text:r.Texte_paragraphe||'',format:r.Format_paragraphe||'Texte courant'}));
    state.visas = data.visas.map(r=>({id:r.id,text:r.Texte_visa||'',category:r.Categorie_visa||'Autre'}));
    state.considerants = data.considerants.map(r=>({id:r.id,text:r.Texte_considerant||'',category:r.Categorie_considerant||'Autre'}));
    state.articles = data.articles.map(r=>({id:r.id,text:r.Texte_article||'',category:r.Categorie_article||'Autre',title:r.Titre_article||'',tables:(r._tables||[]).map(t=>({id:t.id,title:t.Titre_tableau||'',showTitle:!!t.Afficher_titre,showHeader:t.Afficher_entete!==false,repeatHeader:t.Repeter_entete_sur_pages!==false,style:t.Style_tableau||'Institutionnel standard',width:t.Largeur_tableau||'Pleine largeur',note:t.Note_sous_tableau||'',columns:(t._columns||[]).map(c=>({id:c.id,title:c.Intitule_colonne||'',format:c.Format_valeur||'Texte',align:c.Alignement||'Automatique',width:c.Largeur_relative||null,decimals:c.Nombre_decimales||0})),rows:(t._lines||[]).map(l=>({id:l.id,type:l.Type_ligne||'Données',noSplit:l.Ne_pas_scinder!==false,comment:l.Commentaire_interne||'',cells:(l._cells||[]).map(c=>c?({id:c.id,text:c.Valeur_texte||'',number:c.Valeur_nombre,date:c.Valeur_date||null}):({text:''}))}))}))}));
    state.annexes = data.annexes || [];
  }

  function load(data){
    normalizeLoaded(data);
    const d=data.fields, refs=data.refs;
    document.getElementById('objet').value=d.Objet||'';
    document.getElementById('domaine').value=d.Domaine||'';
    document.getElementById('statut').value=d.Statut_deliberation||'';
    setOptions(document.getElementById('seance'), refs.seances, r=>r.Libelle_seance||r.Reference_seance||`Séance ${r.id}`, d.Seance);
    setOptions(document.getElementById('rapporteur'), refs.elus, r=>r.Nom_complet||`${r.Prenom||''} ${r.Nom||''}`.trim(), d.Rapporteur);
    setOptions(document.getElementById('unite'), refs.unites, r=>r.Nom_service||r.Code_service||`Unité ${r.id}`, d.Unite_redactrice);
    renderAll();
  }

  function renderList(key, containerId, prefix=''){
    const el=document.getElementById(containerId); el.innerHTML='';
    state[key].forEach((item,i)=>{
      const row=document.createElement('div'); row.className='stack-item'; row.draggable=true; row.dataset.index=i; row.dataset.key=key;
      let category='';
      if(key==='visas') category=`<select class="inline-category" data-prop="category" data-key="${key}" data-index="${i}">${options(categoriesVisas,item.category)}</select>`;
      if(key==='considerants') category=`<select class="inline-category" data-prop="category" data-key="${key}" data-index="${i}">${options(categoriesCons,item.category)}</select>`;
      row.innerHTML=`<span class="drag" title="Glisser pour réordonner">⋮⋮</span>${category}<div class="prefix-input">${prefix?`<span>${prefix}</span>`:''}<input value="${escapeHtml(item.text)}" data-prop="text" data-key="${key}" data-index="${i}"></div><button class="mini-btn" data-del="${key}:${i}" title="Supprimer">🗑</button>`;
      el.appendChild(row);
    });
  }

  function renderExpose(){
    const el=document.getElementById('exposeList'); el.innerHTML='';
    state.expose.forEach((item,i)=>{
      const row=document.createElement('div'); row.className='stack-item expose-row'; row.draggable=true; row.dataset.index=i; row.dataset.key='expose';
      row.innerHTML=`<span class="drag">⋮⋮</span><select class="inline-category" data-prop="format" data-key="expose" data-index="${i}">${options(['Texte courant','Sous-titre','Liste à puces','Liste numérotée'],item.format)}</select><textarea data-prop="text" data-key="expose" data-index="${i}">${escapeHtml(item.text)}</textarea><button class="mini-btn" data-del="expose:${i}">🗑</button>`;
      el.appendChild(row);
    });
  }

  function renderArticles(){
    const el=document.getElementById('articlesList'); el.innerHTML='';
    state.articles.forEach((item,i)=>{
      const row=document.createElement('div'); row.className='article'; row.draggable=true; row.dataset.index=i; row.dataset.key='articles';
      row.innerHTML=`<div class="article-head"><div><span class="drag">⋮⋮</span><span class="article-title">Article ${i+1}</span></div><button class="mini-btn" data-del="articles:${i}">🗑</button></div><div class="article-meta"><select data-prop="category" data-key="articles" data-index="${i}">${options(categoriesArticles,item.category)}</select><input placeholder="Titre facultatif" value="${escapeHtml(item.title||'')}" data-prop="title" data-key="articles" data-index="${i}"></div><textarea data-prop="text" data-key="articles" data-index="${i}">${escapeHtml(item.text)}</textarea><div class="article-table-tools"><button class="table-btn" type="button" onclick="TableEditor.open(${i},0)">▦ ${item.tables?.length ? `Tableaux (${item.tables.length})` : 'Insérer un tableau'}</button>${(item.tables||[]).slice(1).map((t,ti)=>`<button class="table-chip" type="button" onclick="TableEditor.open(${i},${ti+1})">Tableau ${ti+2}</button>`).join('')}</div>`;
      el.appendChild(row);
    });
  }

  function renderAnnexes(){
    const el=document.getElementById('annexesList');
    if(!state.annexes.length){ el.innerHTML='<span class="empty-note">Aucune annexe rattachée.</span>'; return; }
    el.innerHTML=state.annexes.map(a=>`<span class="attachment">📎 ${escapeHtml(a.Titre_annexe||a.Type_annexe||'Annexe')}</span>`).join('');
  }

  function refreshCounts(){
    document.getElementById('countExpose').textContent=`${state.expose.length} paragraphe${state.expose.length>1?'s':''}`;
    document.getElementById('countVisas').textContent=`${state.visas.length} visa${state.visas.length>1?'s':''}`;
    document.getElementById('countConsiderants').textContent=`${state.considerants.length} considérant${state.considerants.length>1?'s':''}`;
    document.getElementById('countArticles').textContent=`${state.articles.length} article${state.articles.length>1?'s':''}`;
    document.getElementById('countAnnexes').textContent=`${state.annexes.length} annexe${state.annexes.length>1?'s':''}`;
    document.getElementById('previewObjet').textContent=document.getElementById('objet').value||'—';
    renderChecklist();
  }

  function renderChecklist(){
    const checks=[
      ['Séance sélectionnée',!!document.getElementById('seance').value],
      ['Objet renseigné',!!document.getElementById('objet').value.trim()],
      ['Rapporteur désigné',!!document.getElementById('rapporteur').value],
      ['Service rédacteur renseigné',!!document.getElementById('unite').value],
      ['Exposé des motifs',state.expose.some(x=>x.text.trim())],
      ['Au moins un visa',state.visas.some(x=>x.text.trim())],
      ['Au moins un considérant',state.considerants.some(x=>x.text.trim())],
      ['Au moins un article',state.articles.some(x=>x.text.trim())]
    ];
    const ul=document.getElementById('checklist'); ul.innerHTML='';
    checks.forEach(([label,ok])=>{const li=document.createElement('li');li.innerHTML=`<span class="${ok?'ok':'warn'}">●</span>${label}`;ul.appendChild(li)});
    const done=checks.filter(x=>x[1]).length; document.getElementById('score').textContent=`${done}/${checks.length}`;
  }

  function payload(){
    return {
      general:{
        seance:Number(document.getElementById('seance').value)||null,
        objet:document.getElementById('objet').value.trim(),
        rapporteur:Number(document.getElementById('rapporteur').value)||null,
        unite:Number(document.getElementById('unite').value)||null,
        domaine:document.getElementById('domaine').value,
        statut:document.getElementById('statut').value
      },
      expose:state.expose, visas:state.visas, considerants:state.considerants, articles:state.articles
    };
  }

  async function save(){
    const btn=document.getElementById('saveBtn'); const old=btn.textContent;
    btn.disabled=true; btn.textContent='Enregistrement…';
    try{
      if(window.GristBridge?.isConnected()){
        const fresh=await window.GristBridge.saveDeliberation(payload());
        load(fresh); btn.textContent='✓ Enregistré dans Grist';
      } else {
        btn.textContent='✓ Enregistré (démo)';
      }
      setTimeout(()=>btn.textContent=old,1600);
    }catch(err){
      console.error(err); btn.textContent='⚠ Erreur d’enregistrement';
      window.dispatchEvent(new CustomEvent('grist-status',{detail:{type:'error',message:err.message}}));
      setTimeout(()=>btn.textContent=old,2200);
    } finally { btn.disabled=false; }
  }

  function renderAll(){renderExpose();renderList('visas','visasList','Vu');renderList('considerants','considerantsList','Considérant');renderArticles();renderAnnexes();refreshCounts();}

  document.addEventListener('click',e=>{
    const add=e.target.closest('.add-item');
    if(add){const section=add.closest('[data-section]').dataset.section;const defaults={expose:{text:'',format:'Texte courant'},visas:{text:'',category:'Autre'},considerants:{text:'',category:'Autre'}};state[section].push({...defaults[section]});renderAll();}
    if(e.target.id==='addArticle'){state.articles.push({text:'',category:'Autre',title:'',tables:[]});renderAll();}
    const del=e.target.dataset.del;if(del){const [key,index]=del.split(':');state[key].splice(Number(index),1);renderAll();}
    if(e.target.id==='saveBtn') save();
  });
  document.addEventListener('input',e=>{
    if(e.target.dataset.key){const item=state[e.target.dataset.key][Number(e.target.dataset.index)];if(item)item[e.target.dataset.prop||'text']=e.target.value;refreshCounts();}
    if(['objet','seance','rapporteur','unite','domaine','statut'].includes(e.target.id)) refreshCounts();
  });
  document.addEventListener('change',e=>{
    if(e.target.dataset.key){const item=state[e.target.dataset.key][Number(e.target.dataset.index)];if(item)item[e.target.dataset.prop]=e.target.value;}
    refreshCounts();
  });

  let dragInfo=null;
  document.addEventListener('dragstart',e=>{const row=e.target.closest('[data-key][data-index]');if(row)dragInfo={key:row.dataset.key,index:Number(row.dataset.index)};});
  document.addEventListener('dragover',e=>{if(e.target.closest('[data-key][data-index]'))e.preventDefault();});
  document.addEventListener('drop',e=>{const row=e.target.closest('[data-key][data-index]');if(!row||!dragInfo)return;const key=row.dataset.key;if(key!==dragInfo.key)return;const to=Number(row.dataset.index);const [moved]=state[key].splice(dragInfo.index,1);state[key].splice(to,0,moved);dragInfo=null;renderAll();});

  window.DeliberationEditor={load,payload,state,renderAll};
  Object.assign(state, JSON.parse(JSON.stringify(demo)));
  renderAll();
})();
