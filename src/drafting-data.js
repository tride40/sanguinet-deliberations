/* One atomic batch per draft. IDs are explicit to link new children in that batch.
 * A fresh-read check rejects stale drafts; simultaneous insert collisions fail the batch. */
(function(root){
 'use strict';
 const tables=['DELIBERATIONS','SEANCES_CM','ELUS','UNITES_ORGANISATIONNELLES','EXPOSE_MOTIFS','VISAS','CONSIDERANTS','ARTICLES','CONTENUS_ARTICLES','TABLEAUX','COLONNES_TABLEAUX','LIGNES_TABLEAUX','CELLULES_TABLEAUX','ANNEXES','JOURNAL_ACTIONS','ORDRE_DU_JOUR'];
 const rows=t=>(t.id||[]).map((id,i)=>Object.fromEntries(Object.keys(t).map(k=>[k,t[k][i]])));
 const sorted=(a,k)=>a.slice().sort((x,y)=>(x[k]||0)-(y[k]||0)||x.id-y.id);
 const related=(db,t,k,id)=>db[t].filter(r=>Number(r[k])===Number(id));
 function scope(db,id){
  if(!id)return Object.fromEntries(tables.map(t=>[t,[]]));
  const a=related(db,'ARTICLES','Deliberation',id), aids=new Set(a.map(r=>r.id));
  const t=db.TABLEAUX.filter(r=>aids.has(r.Article)), tids=new Set(t.map(r=>r.id));
  const l=db.LIGNES_TABLEAUX.filter(r=>tids.has(r.Tableau)), lids=new Set(l.map(r=>r.id));
  const c=db.COLONNES_TABLEAUX.filter(r=>tids.has(r.Tableau)), cids=new Set(c.map(r=>r.id));
  return {DELIBERATIONS:db.DELIBERATIONS.filter(r=>r.id===id),EXPOSE_MOTIFS:related(db,'EXPOSE_MOTIFS','Deliberation',id),VISAS:related(db,'VISAS','Deliberation',id),CONSIDERANTS:related(db,'CONSIDERANTS','Deliberation',id),ARTICLES:a,CONTENUS_ARTICLES:db.CONTENUS_ARTICLES.filter(r=>aids.has(r.Article)),TABLEAUX:t,COLONNES_TABLEAUX:c,LIGNES_TABLEAUX:l,CELLULES_TABLEAUX:db.CELLULES_TABLEAUX.filter(r=>lids.has(r.Ligne)||cids.has(r.Colonne)),ANNEXES:related(db,'ANNEXES','Deliberation',id),ORDRE_DU_JOUR:related(db,'ORDRE_DU_JOUR','Deliberation',id)};
 }
 function load(db,id){
  const s=scope(db,id), fields=s.DELIBERATIONS[0]||{Statut_deliberation:'Brouillon service'};
  const articles=sorted(s.ARTICLES,'Numero_article').map(a=>({...a,_tables:sorted(s.TABLEAUX.filter(t=>t.Article===a.id),'Position_dans_article').map(t=>{
   const cols=sorted(s.COLONNES_TABLEAUX.filter(c=>c.Tableau===t.id),'Ordre_colonne');
   return {...t,_columns:cols,_lines:sorted(s.LIGNES_TABLEAUX.filter(l=>l.Tableau===t.id),'Ordre_ligne').map(l=>({...l,_cells:cols.map(c=>s.CELLULES_TABLEAUX.find(x=>x.Ligne===l.id&&x.Colonne===c.id)||null)}))};
  })}));
  return {id,fields,refs:{seances:db.SEANCES_CM,elus:db.ELUS,unites:db.UNITES_ORGANISATIONNELLES},expose:sorted(s.EXPOSE_MOTIFS,'Ordre_paragraphe'),visas:sorted(s.VISAS,'Ordre_visa'),considerants:sorted(s.CONSIDERANTS,'Ordre_considerant'),articles,annexes:sorted(s.ANNEXES,'Ordre_annexe')};
 }
 function sessionOpen(db,id){if(!id)return true;const s=db.SEANCES_CM.find(s=>s.id===id);return !!s&&!s.Date_envoi_convocation&&!s.Ordre_du_jour_valide&&['','Préparation','Projets en cours de rédaction','Validation DGS'].includes(s.Statut_seance||'')&&!db.ORDRE_DU_JOUR.some(p=>p.Seance===id&&p.Statut_suivi&&p.Statut_suivi!=='À venir');}
 function locked(db,id){if(!id)return false;const s=scope(db,id),d=s.DELIBERATIONS[0];return !d || !['','Brouillon service','Corrections demandées'].includes(d.Statut_deliberation||'') || !sessionOpen(db,d.Seance) || s.ORDRE_DU_JOUR.some(p=>!sessionOpen(db,p.Seance)) || s.CONTENUS_ARTICLES.length>0;}
 function plan(db,id,p){
  if(locked(db,id))throw Error('Ce projet est en lecture seule dans la page de rédaction.');
  if(!p.general.objet.trim())throw Error('Renseignez au moins l’objet pour enregistrer le brouillon.');
  if(!sessionOpen(db,p.general.seance))throw Error('Cette séance est verrouillée ou déjà engagée. Choisissez une séance en préparation.');
  if(id&&db.ORDRE_DU_JOUR.some(point=>point.Deliberation===id&&point.Seance!==p.general.seance))throw Error('Ce projet est inscrit à un ordre du jour. Retirez-le dans la planification avant de changer sa séance.');
  for(const [key,t] of [['seance','SEANCES_CM'],['rapporteur','ELUS'],['unite','UNITES_ORGANISATIONNELLES']])if(p.general[key]&&!db[t].some(r=>r.id===p.general[key]))throw Error('Une référence sélectionnée n’existe plus. Actualisez la page.');
  const next=Object.fromEntries(tables.map(t=>[t,Math.max(0,...db[t].map(r=>r.id))+1]));
  const old=scope(db,id),keep={},actions=[];
  function put(t,oldId,fields){
   const record=oldId&&(old[t]||[]).find(r=>r.id===oldId);
   if(oldId&&!record)throw Error('Référence de contenu invalide. Rechargez le projet.');
   const rid=oldId||next[t]++;
   (keep[t]??=new Set()).add(rid);
   if(!record)actions.push(['AddRecord',t,rid,fields]);
   else {const changed=Object.fromEntries(Object.entries(fields).filter(([k,v])=>JSON.stringify(record[k]??null)!==JSON.stringify(v)));if(Object.keys(changed).length)actions.push(['UpdateRecord',t,rid,changed]);}
   return rid;
  }
  const general=p.general;
  const did=put('DELIBERATIONS',id,{Objet:general.objet,...('note' in general?{Observations_internes:general.note||''}:{}),Seance:general.seance||0,Rapporteur:general.rapporteur||0,Unite_redactrice:general.unite||0,Domaine:general.domaine||'',...(!id?{Statut_deliberation:'Brouillon service'}:{})});
  for(const point of old.ORDRE_DU_JOUR)actions.push(['UpdateRecord','ORDRE_DU_JOUR',point.id,{Intitule_point:general.objet,Rapporteur:general.rapporteur||0,Unite_pilote:general.unite||0}]);
  const flags=(rid)=>rid?{}:{Inclure_dossier_preparatoire:true,Inclure_acte_definitif:true};
  [['expose','EXPOSE_MOTIFS','Ordre_paragraphe','Texte_paragraphe','Format_paragraphe','format'],['visas','VISAS','Ordre_visa','Texte_visa','Categorie_visa','category'],['considerants','CONSIDERANTS','Ordre_considerant','Texte_considerant','Categorie_considerant','category']].forEach(([k,t,o,txt,cat,prop])=>p[k].forEach((x,i)=>put(t,x.id,{Deliberation:did,[o]:i+1,[txt]:x.text||'',[cat]:x[prop]||'Autre',...flags(x.id)})));
  p.articles.forEach((a,i)=>{
   const aid=put('ARTICLES',a.id,{Deliberation:did,Numero_article:i+1,Categorie_article:a.category||'Autre',Titre_article:a.title||'',Texte_article:a.text||'',...flags(a.id)});
   (a.tables||[]).forEach((t,ti)=>{
    const tid=put('TABLEAUX',t.id,{Article:aid,Position_dans_article:ti+1,Titre_tableau:t.title||'',Afficher_titre:!!t.showTitle,Afficher_entete:t.showHeader!==false,Style_tableau:t.style||'Institutionnel standard',Largeur_tableau:t.width||'Pleine largeur',Note_sous_tableau:t.note||'',Repeter_entete_sur_pages:t.repeatHeader!==false,...flags(t.id)});
    const cols=t.columns.map((c,ci)=>put('COLONNES_TABLEAUX',c.id,{Tableau:tid,Ordre_colonne:ci+1,Intitule_colonne:c.title||'',Format_valeur:c.format||'Texte',Alignement:c.align||'Automatique',Largeur_relative:Number(c.width)||null,Nombre_decimales:Number(c.decimals)||0}));
    t.rows.forEach((r,ri)=>{
     const lid=put('LIGNES_TABLEAUX',r.id,{Tableau:tid,Ordre_ligne:ri+1,Type_ligne:r.type||'Données',Ne_pas_scinder:r.noSplit!==false,Commentaire_interne:r.comment||''});
     cols.forEach((cid,ci)=>{const c=r.cells[ci]||{};let date=c.date?Date.parse(c.date+'T00:00:00Z')/1000:null;if(date!==null&&!Number.isFinite(date))throw Error('Une date du tableau est invalide.');put('CELLULES_TABLEAUX',c.id,{Ligne:lid,Colonne:cid,Valeur_texte:c.text||'',Valeur_nombre:c.number===''||c.number==null?null:Number(c.number),Valeur_date:date});});
    });
   });
  });
  // Delete descendants first, including cells removed by column or row deletion.
  for(const t of ['CELLULES_TABLEAUX','LIGNES_TABLEAUX','COLONNES_TABLEAUX','TABLEAUX','ARTICLES','CONSIDERANTS','VISAS','EXPOSE_MOTIFS'])for(const r of old[t])if(!keep[t]?.has(r.id))actions.push(['RemoveRecord',t,r.id]);
  if(actions.length)actions.push(['AddRecord','JOURNAL_ACTIONS',null,{Date_action:Date.now()/1000,Utilisateur:0,Type_action:id?'Modification':'Création',Deliberation:did,Seance:general.seance||0,Description:id?'Enregistrement du projet de délibération':'Création du projet de délibération',Automatique:false,Niveau:'Information'}]);
  return {id:did,actions};
 }
 const api={tables,rows,scope,load,locked,plan};root.DraftingData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
