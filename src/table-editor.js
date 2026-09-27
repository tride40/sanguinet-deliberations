// Éditeur visuel des tableaux rattachés aux ARTICLES.
(function(){
  const FORMATS = ['Texte','Nombre entier','Nombre décimal','Montant en euros','Pourcentage','Date','Surface','Référence'];
  const ALIGNS = ['Automatique','Gauche','Centré','Droite'];
  const ROW_TYPES = ['Données','Titre de section','Sous-total','Total'];
  const STYLES = ['Institutionnel standard','Tableau chiffré','Tableau comparatif','Tableau sans bordures'];
  const WIDTHS = ['Pleine largeur','Ajustée au contenu'];

  let articleIndex = null;
  let tableIndex = null;
  let working = null;

  function esc(v=''){return String(v).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));}
  function opts(arr, selected){return arr.map(v=>`<option ${v===selected?'selected':''}>${esc(v)}</option>`).join('');}
  function clone(o){return JSON.parse(JSON.stringify(o));}
  function emptyTable(){return {title:'',showTitle:false,showHeader:true,repeatHeader:true,style:'Institutionnel standard',width:'Pleine largeur',note:'',columns:[{title:'Colonne 1',format:'Texte',align:'Automatique',width:50,decimals:0},{title:'Colonne 2',format:'Texte',align:'Automatique',width:50,decimals:0}],rows:[{type:'Données',noSplit:true,comment:'',cells:[{text:''},{text:''}]}]};}
  function ensureShape(t){
    t.columns = t.columns || [];
    t.rows = t.rows || [];
    if (!t.columns.length) t.columns.push({title:'Colonne 1',format:'Texte',align:'Automatique',width:100,decimals:0});
    if (!t.rows.length) t.rows.push({type:'Données',noSplit:true,comment:'',cells:t.columns.map(()=>({text:''}))});
    t.rows.forEach(r=>{r.cells=r.cells||[]; while(r.cells.length<t.columns.length)r.cells.push({text:''}); if(r.cells.length>t.columns.length)r.cells.length=t.columns.length;});
    return t;
  }

  function ensureModal(){
    if(document.getElementById('tableEditorModal')) return;
    const modal=document.createElement('div'); modal.id='tableEditorModal'; modal.className='table-modal';
    modal.innerHTML=`<div class="table-dialog" role="dialog" aria-modal="true">
      <div class="table-dialog-header"><div><span class="eyebrow">ARTICLE</span><h2 id="tableEditorTitle">Création d’un tableau</h2></div><button class="modal-close" id="closeTableEditor">×</button></div>
      <div class="table-tabs"><button class="active">Contenu</button><button disabled>Mise en forme avancée</button></div>
      <div class="table-editor-body">
        <aside class="table-settings">
          <label>Titre du tableau<input id="teTitle" placeholder="Ex. Tarifs municipaux 2027"></label>
          <div class="check-row"><input type="checkbox" id="teShowTitle"><label for="teShowTitle">Afficher le titre</label></div>
          <div class="check-row"><input type="checkbox" id="teShowHeader"><label for="teShowHeader">Afficher l’en-tête</label></div>
          <div class="check-row"><input type="checkbox" id="teRepeatHeader"><label for="teRepeatHeader">Répéter l’en-tête sur plusieurs pages</label></div>
          <label>Style<select id="teStyle">${opts(STYLES,'Institutionnel standard')}</select></label>
          <label>Largeur<select id="teWidth">${opts(WIDTHS,'Pleine largeur')}</select></label>
          <label>Note sous le tableau<textarea id="teNote" rows="3"></textarea></label>
          <hr>
          <button class="secondary-wide" id="addTableColumn">＋ Ajouter une colonne</button>
          <button class="secondary-wide" id="addTableRow">＋ Ajouter une ligne</button>
          <button class="danger-wide" id="deleteCurrentTable">Supprimer ce tableau</button>
        </aside>
        <section class="table-canvas"><div class="table-canvas-toolbar"><strong>Aperçu et saisie</strong><span id="teDimensions"></span></div><div id="tableGridWrap"></div></section>
      </div>
      <div class="table-dialog-footer"><button class="ghost-btn" id="cancelTableEditor">Annuler</button><div><button class="secondary-btn" id="duplicateTable">Dupliquer</button><button class="primary-inline" id="saveTableEditor">Enregistrer le tableau</button></div></div>
    </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click',e=>{
      if(e.target===modal || e.target.id==='closeTableEditor' || e.target.id==='cancelTableEditor') close();
      if(e.target.id==='addTableColumn'){ addColumn(); }
      if(e.target.id==='addTableRow'){ addRow(); }
      if(e.target.id==='saveTableEditor'){ commit(); }
      if(e.target.id==='deleteCurrentTable'){ removeTable(); }
      if(e.target.id==='duplicateTable'){ duplicate(); }
      const dc=e.target.closest('[data-del-col]'); if(dc) deleteColumn(Number(dc.dataset.delCol));
      const dr=e.target.closest('[data-del-row]'); if(dr) deleteRow(Number(dr.dataset.delRow));
    });
    modal.addEventListener('input',e=>{ if(e.target.matches('[data-cell]')) updateCellFromInput(e.target); syncMetaFromControls(); });
    modal.addEventListener('change',e=>{ if(e.target.matches('[data-col-prop]')) updateColumn(e.target); if(e.target.matches('[data-row-prop]')) updateRow(e.target); syncMetaFromControls(); renderGrid(); });
  }

  function syncControlsFromMeta(){
    document.getElementById('teTitle').value=working.title||'';
    document.getElementById('teShowTitle').checked=!!working.showTitle;
    document.getElementById('teShowHeader').checked=working.showHeader!==false;
    document.getElementById('teRepeatHeader').checked=working.repeatHeader!==false;
    document.getElementById('teStyle').value=working.style||'Institutionnel standard';
    document.getElementById('teWidth').value=working.width||'Pleine largeur';
    document.getElementById('teNote').value=working.note||'';
  }
  function syncMetaFromControls(){
    if(!working)return;
    working.title=document.getElementById('teTitle').value;
    working.showTitle=document.getElementById('teShowTitle').checked;
    working.showHeader=document.getElementById('teShowHeader').checked;
    working.repeatHeader=document.getElementById('teRepeatHeader').checked;
    working.style=document.getElementById('teStyle').value;
    working.width=document.getElementById('teWidth').value;
    working.note=document.getElementById('teNote').value;
  }

  function renderGrid(){
    ensureShape(working);
    document.getElementById('teDimensions').textContent=`${working.columns.length} colonne${working.columns.length>1?'s':''} × ${working.rows.length} ligne${working.rows.length>1?'s':''}`;
    const wrap=document.getElementById('tableGridWrap');
    let html='<div class="table-grid-scroll"><table class="editor-table"><thead><tr><th class="row-tools">#</th>';
    working.columns.forEach((c,ci)=>{html+=`<th><div class="col-head"><input value="${esc(c.title||'')}" data-col-prop="title" data-col="${ci}" placeholder="Intitulé"><button class="mini-btn" data-del-col="${ci}" title="Supprimer la colonne">🗑</button></div><div class="col-meta"><select data-col-prop="format" data-col="${ci}">${opts(FORMATS,c.format||'Texte')}</select><select data-col-prop="align" data-col="${ci}">${opts(ALIGNS,c.align||'Automatique')}</select></div></th>`;});
    html+='</tr></thead><tbody>';
    working.rows.forEach((r,ri)=>{html+=`<tr><td class="row-tools"><span>${ri+1}</span><select data-row-prop="type" data-row="${ri}" title="Type de ligne">${opts(ROW_TYPES,r.type||'Données')}</select><button class="mini-btn" data-del-row="${ri}" title="Supprimer la ligne">🗑</button></td>`;
      working.columns.forEach((c,ci)=>{const cell=r.cells[ci]||{}; const type=c.format==='Date'?'date':(c.format==='Nombre entier'||c.format==='Nombre décimal'||c.format==='Montant en euros'||c.format==='Pourcentage'||c.format==='Surface'?'number':'text'); const val=type==='date'?(cell.date||''):type==='number'?(cell.number??''):(cell.text||''); html+=`<td><input class="cell-input" type="${type}" ${type==='number'?'step="any"':''} value="${esc(val)}" data-cell="${ri}:${ci}"></td>`;});
      html+='</tr>';});
    html+='</tbody></table></div>';
    wrap.innerHTML=html;
  }

  function updateColumn(el){const i=Number(el.dataset.col); working.columns[i][el.dataset.colProp]=el.value;}
  function updateRow(el){const i=Number(el.dataset.row); working.rows[i][el.dataset.rowProp]=el.value;}
  function updateCellFromInput(el){const [ri,ci]=el.dataset.cell.split(':').map(Number); const c=working.columns[ci]; const cell=working.rows[ri].cells[ci]||(working.rows[ri].cells[ci]={}); if(c.format==='Date'){cell.date=el.value;cell.text='';cell.number=null;} else if(['Nombre entier','Nombre décimal','Montant en euros','Pourcentage','Surface'].includes(c.format)){cell.number=el.value===''?null:Number(el.value);cell.text='';cell.date=null;} else {cell.text=el.value;cell.number=null;cell.date=null;}}
  function addColumn(){syncMetaFromControls();working.columns.push({title:`Colonne ${working.columns.length+1}`,format:'Texte',align:'Automatique',width:null,decimals:0});working.rows.forEach(r=>r.cells.push({text:''}));renderGrid();}
  function deleteColumn(i){if(working.columns.length<=1)return;working.columns.splice(i,1);working.rows.forEach(r=>r.cells.splice(i,1));renderGrid();}
  function addRow(){syncMetaFromControls();working.rows.push({type:'Données',noSplit:true,comment:'',cells:working.columns.map(()=>({text:''}))});renderGrid();}
  function deleteRow(i){if(working.rows.length<=1)return;working.rows.splice(i,1);renderGrid();}

  function open(aIndex,tIndex=0){
    ensureModal();
    articleIndex=Number(aIndex); tableIndex=Number(tIndex)||0;
    const article=window.DeliberationEditor?.state?.articles?.[articleIndex]; if(!article)return;
    article.tables=article.tables||[];
    if(!article.tables[tableIndex]) article.tables[tableIndex]=emptyTable();
    working=ensureShape(clone(article.tables[tableIndex]));
    document.getElementById('tableEditorTitle').textContent=`Tableau de l’article ${articleIndex+1}`;
    syncControlsFromMeta(); renderGrid(); document.getElementById('tableEditorModal').classList.add('open'); document.body.classList.add('modal-open');
  }
  function close(){document.getElementById('tableEditorModal')?.classList.remove('open');document.body.classList.remove('modal-open');working=null;}
  function commit(){syncMetaFromControls();const article=window.DeliberationEditor.state.articles[articleIndex];article.tables=article.tables||[];article.tables[tableIndex]=working;window.DeliberationEditor.renderAll();close();}
  function removeTable(){const article=window.DeliberationEditor.state.articles[articleIndex];article.tables=article.tables||[];article.tables.splice(tableIndex,1);window.DeliberationEditor.renderAll();close();}
  function duplicate(){syncMetaFromControls(); const article=window.DeliberationEditor.state.articles[articleIndex];article.tables=article.tables||[];const copy=clone(working);delete copy.id;(copy.columns||[]).forEach(c=>delete c.id);(copy.rows||[]).forEach(r=>{delete r.id;(r.cells||[]).forEach(c=>delete c.id)});article.tables.splice(tableIndex+1,0,copy);tableIndex++;working=copy;window.DeliberationEditor.renderAll();renderGrid();}

  window.TableEditor={open};
})();
