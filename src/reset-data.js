(function(root){
 'use strict';
 // Fixed allowlist: never infer destructive targets from the document's table list.
 const targets=['CELLULES_TABLEAUX','LIGNES_TABLEAUX','COLONNES_TABLEAUX','TABLEAUX','CONTENUS_ARTICLES','ARTICLES','VISAS','CONSIDERANTS','EXPOSE_MOTIFS','ANNEXES','VALIDATIONS_DELIBERATIONS','AMENDEMENTS_SEANCE','VOTES_DELIBERATIONS','VOTES_GROUPES','DOCUMENTS_GENERES','ORDRE_DU_JOUR','SUJETS_PREVISIONNELS','PARTICIPATIONS_SEANCE','JOURNAL_ACTIONS','DELIBERATIONS','SEANCES_CM'];
 const keep=['ELUS','GROUPES_POLITIQUES','AGENTS','UNITES_ORGANISATIONNELLES','AFFECTATIONS','PARAMETRES_APPLICATION','SEQUENCES_NUMEROTATION','MODELES_DOCUMENTS'];
 const rows=t=>(t.id||[]).map((id,i)=>Object.fromEntries(Object.keys(t).map(k=>[k,t[k][i]])));
 function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
 const fingerprint=s=>JSON.stringify(canonical(s));
 async function snapshot(api){
  const meta=await api.fetchTable('_grist_Tables'),columns=await api.fetchTable('_grist_Tables_column'),tables=rows(meta),names=tables.map(t=>t.tableId);
  for(const name of ['SEANCES_CM','DELIBERATIONS','ELUS','PARAMETRES_APPLICATION'])if(!names.includes(name))throw Error('Document non reconnu : table '+name+' absente.');
  const active=targets.filter(t=>names.includes(t)),preserved=keep.filter(t=>names.includes(t));
  const extra=rows(columns).filter(c=>!c.isFormula&&/^Ref(List)?:/.test(c.type)&&active.includes(c.type.split(':')[1])&&!active.includes(tables.find(t=>t.id===c.parentId)?.tableId));
  if(extra.length)throw Error('Analyse interrompue : des tables conservées pointent vers les données à effacer : '+extra.map(c=>(tables.find(t=>t.id===c.parentId)?.tableId||'?')+'.'+c.colId).join(', ')+'. Faites vérifier ces liens avant de poursuivre.');
  const data={};for(const name of [...active,...preserved])data[name]=await api.fetchTable(name);
  return {meta,columns,active,preserved,data};
 }
 function plan(s){return s.active.filter(t=>s.data[t].id.length).map(t=>['BulkRemoveRecord',t,[...s.data[t].id]]);}
 root.ResetData=Object.freeze({targets,keep,snapshot,fingerprint,plan});
})(typeof window==='undefined'?globalThis:window);
