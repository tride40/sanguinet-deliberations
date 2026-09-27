(function(root){
 'use strict';
 const tables=['SEANCES_CM','DELIBERATIONS','ORDRE_DU_JOUR','ELUS','PARAMETRES_APPLICATION','JOURNAL_ACTIONS'];
 const preparation=['','Préparation','Projets en cours de rédaction','Validation DGS'];
 const draftStatuses=['','Brouillon service','Corrections demandées','Validé par la DGS','Inscrit à l’ordre du jour'];
 const points=(db,id)=>db.ORDRE_DU_JOUR.filter(p=>p.Seance===id).sort((a,b)=>a.Ordre_point-b.Ordre_point||a.id-b.id);
 function editable(db,id){const s=db.SEANCES_CM.find(s=>s.id===id);return !!s&&!s.Date_envoi_convocation&&preparation.includes(s.Statut_seance||'')&&!points(db,id).some(p=>p.Statut_suivi&&p.Statut_suivi!=='À venir');}
 function open(db,id){return editable(db,id)&&!db.SEANCES_CM.find(s=>s.id===id).Ordre_du_jour_valide;}
 function parisDate(value){
  if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Renseignez la date et l’heure du conseil.');
  const base=Date.parse(value+'Z'),fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const candidates=[60,120].map(offset=>base-offset*60000).filter(ms=>Number.isFinite(ms)&&fmt.format(new Date(ms)).replace(' ','T')===value);
  if(candidates.length!==1)throw Error('Cette heure est inexistante ou ambiguë lors du changement d’heure. Choisissez une autre heure.');
  return candidates[0]/1000;
 }
 function localDate(seconds){if(!seconds)return '';return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(seconds*1000)).replace(' ','T');}
 const dateOnly=value=>value?Date.parse(value+'T00:00:00Z')/1000:null;
 function event(id,description,type='Modification'){return ['AddRecord','JOURNAL_ACTIONS',null,{Seance:id,Utilisateur:0,Date_action:Date.now()/1000,Type_action:type,Description:description,Niveau:'Information',Automatique:false}];}
 function sessionPlan(db,id,input){
  if(id&&!open(db,id))throw Error('Cette séance est verrouillée. Rouvrez sa préparation avant de la modifier.');
  const date=parisDate(input.date),convocation=dateOnly(input.convocation);
  if(input.convocation&&(!Number.isFinite(convocation)||input.convocation>input.date.slice(0,10)))throw Error('La date prévue de convocation doit être antérieure ou égale au jour du conseil.');
  if(!input.place.trim())throw Error('Renseignez le lieu du conseil.');
  const members=Number(input.members);if(!Number.isInteger(members)||members<1)throw Error('Renseignez un nombre de membres en exercice supérieur à zéro.');
  if(db.SEANCES_CM.some(s=>s.id!==id&&s.Date_heure_seance===date))throw Error('Une séance existe déjà à cette date et cette heure.');
  const rid=id||Math.max(0,...db.SEANCES_CM.map(s=>s.id))+1;
  const reference='CM-'+input.date.slice(0,10).replaceAll('-','');
  const label='Conseil municipal du '+new Date(date*1000).toLocaleString('fr-FR',{timeZone:'Europe/Paris',dateStyle:'short',timeStyle:'short'});
  const fields={Date_heure_seance:date,Reference_seance:reference,Libelle_seance:label,Lieu_seance:input.place.trim(),Date_convocation:convocation,Nb_membres_exercice:members,...(!id?{Type_seance:'Ordinaire',Publicite_seance:'Publique',Statut_seance:'Préparation',Ordre_du_jour_valide:false}:{})};
  return {id:rid,actions:[[id?'UpdateRecord':'AddRecord','SEANCES_CM',rid,fields],event(rid,id?'Modification du calendrier de la séance':'Création de la séance',id?'Modification':'Création')]};
 }
 function agendaPlan(db,id,desired){
  if(!open(db,id))throw Error('La préparation de cette séance est verrouillée.');
  const old=points(db,id),seen=new Set(),kept=new Set(),actions=[];
  let next=Math.max(0,...db.ORDRE_DU_JOUR.map(p=>p.id))+1;
  desired.forEach((p,i)=>{
   const before=p.id?old.find(x=>x.id===p.id):null;if(p.id&&!before)throw Error('Un point de l’ordre du jour a changé. Actualisez.');
   if(before){if(kept.has(p.id))throw Error('Point en double.');kept.add(p.id);}
   let fields;
   if(p.Deliberation){
    if(seen.has(p.Deliberation))throw Error('Une délibération ne peut figurer deux fois à l’ordre du jour.');seen.add(p.Deliberation);
    const d=db.DELIBERATIONS.find(d=>d.id===p.Deliberation);
    if(!d||!draftStatuses.includes(d.Statut_deliberation||''))throw Error('Cette délibération ne peut plus être déplacée dans la préparation.');
    if(d.Seance&&d.Seance!==id)throw Error('Ce projet est déjà fléché vers une autre séance. Retirez d’abord son affectation dans la séance concernée.');
    if(db.ORDRE_DU_JOUR.some(x=>x.Deliberation===d.id&&x.id!==p.id))throw Error('Ce projet est déjà inscrit à un ordre du jour.');
    fields={Seance:id,Deliberation:d.id,Type_point:'Délibération',Ordre_point:i+1,Intitule_point:d.Objet||'Sans objet',Rapporteur:d.Rapporteur||0,Unite_pilote:d.Unite_redactrice||0};
    if(d.Seance!==id)actions.push(['UpdateRecord','DELIBERATIONS',d.id,{Seance:id}]);
   }else{
    if(!before)throw Error('Seules les délibérations peuvent être ajoutées dans cette première version.');
    fields={Ordre_point:i+1};
   }
   if(before)actions.push(['UpdateRecord','ORDRE_DU_JOUR',before.id,fields]);
   else actions.push(['AddRecord','ORDRE_DU_JOUR',next++,{...fields,Statut_suivi:'À venir',Inscrire_convocation:true,Inscrire_dossier_elus:true}]);
  });
  for(const p of old)if(!kept.has(p.id)){
   if(!p.Deliberation)throw Error('Les points sans délibération doivent être conservés dans cette version.');
   actions.push(['RemoveRecord','ORDRE_DU_JOUR',p.id]);
   if(!seen.has(p.Deliberation))actions.push(['UpdateRecord','DELIBERATIONS',p.Deliberation,{Seance:0}]);
  }
  actions.push(event(id,'Enregistrement de l’ordre du jour préparatoire','Inscription ODJ'));
  return {id,actions};
 }
 function lockPlan(db,id,lock){
  if(!editable(db,id))throw Error('Une séance envoyée ou commencée ne peut plus être rouverte dans la planification.');
  const list=points(db,id);if(lock&&!list.length)throw Error('Ajoutez au moins un point avant de verrouiller l’ordre du jour.');
  return {id,actions:[['UpdateRecord','SEANCES_CM',id,{Ordre_du_jour_valide:lock}],event(id,lock?'Verrouillage de l’ordre du jour':'Réouverture de la préparation de l’ordre du jour')]};
 }
 const api={tables,points,editable,open,parisDate,localDate,sessionPlan,agendaPlan,lockPlan};root.PlanningData=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
