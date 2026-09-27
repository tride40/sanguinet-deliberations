/* Data model shared by the live widget and its tests. No document credentials. */
(function(root){
'use strict';
const TABLES=['ELUS','GROUPES_POLITIQUES','AGENTS','UNITES_ORGANISATIONNELLES','PARAMETRES_APPLICATION','SEANCES_CM','PARTICIPATIONS_SEANCE','ORDRE_DU_JOUR','DELIBERATIONS','VOTES_DELIBERATIONS','VOTES_GROUPES','JOURNAL_ACTIONS','AMENDEMENTS_SEANCE'];
const PRESENT='Présent',PROXY='Absent ayant donné pouvoir',NPPV='Ne prend pas part au vote';
const CHOICES=['Pour','Contre','Abstention',NPPV];
const REQUIRED={ELUS:['Nom_complet','Actif','Groupe_politique'],GROUPES_POLITIQUES:['Nom'],SEANCES_CM:['Date_heure_seance','President_seance','Secretaire_seance','Nb_membres_exercice'],PARTICIPATIONS_SEANCE:['Seance','Elu','Statut_presence','Mandataire','Groupe_seance'],ORDRE_DU_JOUR:['Seance','Deliberation','Statut_suivi','Date_validation_seance','Valide_par'],DELIBERATIONS:['Seance','Objet','Mode_saisie_vote','Departage','Resultat_vote_calcule'],VOTES_DELIBERATIONS:['Deliberation','Elu','Vote','Vote_par_pouvoir','Mandant','Groupe_vote','Exception_individuelle'],VOTES_GROUPES:['Deliberation','Groupe','Vote'],JOURNAL_ACTIONS:['Date_action','Utilisateur','Description','Point_ODJ','Elu_concerne','Mandataire']};
function rows(raw){return (raw.id||[]).map((id,i)=>Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,Array.isArray(v)?v[i]:v])));}
function id(v){return Number(v)||0;}
function active(db){return db.ELUS.filter(e=>e.Actif).sort((a,b)=>(a.Ordre_protocolaire||0)-(b.Ordre_protocolaire||0));}
function participantErrors(parts,elus){
 const errors=[],seen=new Set(),holders=new Set();
 for(const p of parts){
  if(!p.Elu||seen.has(p.Elu))errors.push('Élu manquant ou présent plusieurs fois dans les participations.');seen.add(p.Elu);
  if(![PRESENT,PROXY,'Absent excusé sans pouvoir','Absent non excusé'].includes(p.Statut_presence))errors.push('Renseignez la présence de chaque élu.');
  if(p.Statut_presence===PROXY){
   if(!p.Mandataire||p.Mandataire===p.Elu)errors.push('Choisissez un mandataire distinct du mandant.');
   if(holders.has(p.Mandataire))errors.push('Un mandataire ne peut porter qu’un pouvoir.');holders.add(p.Mandataire);
   if(!parts.some(x=>x.Elu===p.Mandataire&&x.Statut_presence===PRESENT))errors.push('Le mandataire doit être présent.');
  }else if(p.Mandataire)errors.push('Effacez le mandataire pour les élus sans pouvoir.');
 }
 if(elus.some(e=>!seen.has(e.id)))errors.push('Les participations ne couvrent pas tous les élus actifs.');
 return [...new Set(errors)];
}
function electorate(parts){return parts.filter(p=>p.Statut_presence===PRESENT||p.Statut_presence===PROXY).map(p=>({id:p.Elu,group:id(p.Groupe_seance),proxy:p.Statut_presence===PROXY,caster:p.Statut_presence===PROXY?p.Mandataire:p.Elu}));}
function fromSaved(v){return {id:v.Vote_par_pouvoir?id(v.Mandant):id(v.Elu),caster:id(v.Elu),proxy:!!v.Vote_par_pouvoir,group:id(v.Groupe_vote)};}
function tally(voters,draft){const t={for:0,against:0,abstain:0,nppv:0,missing:0};for(const e of voters){const v=Object.hasOwn(draft.overrides,e.id)?draft.overrides[e.id]:draft.groups[e.group]||'';t[v==='Pour'?'for':v==='Contre'?'against':v==='Abstention'?'abstain':v===NPPV?'nppv':'missing']++;}return t;}
function outcome(d,t){
 if(d.decision==='Ajournée')return {label:'Ajourné',decision:'Ajournée'};
 if(d.decision==='Retirée')return {label:'Retiré',decision:'Retirée'};
 if(d.decision==='Sans vote')return {label:'Sans vote',decision:'En attente'};
 if(t.missing)return {label:'Saisie à compléter',pending:true};
 if(!t.for&&!t.against)return {label:'Aucun suffrage exprimé',pending:true};
 if(t.for>t.against)return {label:t.against?'Adopté à la majorité':'Adopté à l’unanimité',decision:'Adoptée',adopted:true};
 if(t.for<t.against)return {label:'Rejeté',decision:'Rejetée'};
 if(d.scrutin==='Scrutin secret')return {label:'Rejeté',decision:'Rejetée'};
 if(d.tie==='Voix prépondérante pour')return {label:'Adopté à la majorité',decision:'Adoptée',adopted:true};
 if(['Voix prépondérante contre','Sans voix prépondérante'].includes(d.tie))return {label:'Rejeté',decision:'Rejetée'};
 return {label:'Égalité — départage à préciser',pending:true};
}
function sync(table,oldRows,desired,key){
 const actions=[],byKey=new Map();for(const row of oldRows){const k=key(row);if(byKey.has(k))throw Error('Doublons détectés dans '+table+'. Corrigez-les dans Grist avant de continuer.');byKey.set(k,row);}
 const wanted=new Set();for(const fields of desired){const k=key(fields);if(wanted.has(k))throw Error('Doublon dans les données à enregistrer.');wanted.add(k);const old=byKey.get(k);actions.push([old?'UpdateRecord':'AddRecord',table,old?old.id:null,fields]);}
 for(const old of oldRows)if(!wanted.has(key(old)))actions.push(['RemoveRecord',table,old.id]);return actions;
}
class Store{
 constructor(api){this.api=api;this.db=null;}
 async read(){const entries=await Promise.all(TABLES.map(async t=>{const raw=await this.api.fetchTable(t);for(const col of REQUIRED[t]||[])if(!(col in raw))throw Error('Colonne manquante : '+t+'.'+col);return [t,rows(raw)];}));return Object.fromEntries(entries);}
 async load(){this.db=await this.read();return this.db;}
 async fresh(){const fresh=await this.read();if(JSON.stringify(fresh)!==JSON.stringify(this.db))throw Error('Le document a changé depuis le chargement. Votre saisie est conservée à l’écran. Actualisez après l’avoir notée, puis recommencez.');return fresh;}
 async apply(actions){return this.api.applyUserActions(actions);}
}
root.SessionData={TABLES,REQUIRED,PRESENT,PROXY,NPPV,CHOICES,rows,id,active,participantErrors,electorate,fromSaved,tally,outcome,sync,Store};
if(typeof module!=='undefined')module.exports=root.SessionData;
})(typeof window!=='undefined'?window:globalThis);
