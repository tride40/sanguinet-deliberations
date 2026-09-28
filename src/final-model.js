(function(root){
'use strict';
function result(db,d){
 const votes=db.VOTES_DELIBERATIONS.filter(v=>v.Deliberation===d.id&&v.Vote!=='Absent'),seen=new Set(),t={for:0,against:0,abstain:0,nppv:0,missing:0};
 for(const v of votes){const id=v.Vote_par_pouvoir?v.Mandant:v.Elu;if(!id||seen.has(id)||!v.Elu)throw Error('Voix manquante ou en double pour « '+d.Objet+' ».');seen.add(id);const key={'Pour':'for','Contre':'against','Abstention':'abstain','Ne prend pas part au vote':'nppv'}[v.Vote];t[key||'missing']++;}
 const outcome=SessionData.outcome({decision:'Vote',scrutin:d.Mode_scrutin,tie:d.Departage},t);
 if(!votes.length||outcome.pending||outcome.decision!==d.Decision_seance)throw Error('Les votes enregistrés ne concordent pas avec la décision de « '+d.Objet+' ». Corrigez et revalidez le résultat.');
 return {t,...outcome};
}
function validate(db,s,agenda){
 if(s?.Statut_seance!=='Terminée')throw Error('Terminez le conseil avant d’éditer ses actes définitifs.');
 if(!s.President_seance||!s.Secretaire_seance)throw Error('Président et secrétaire de séance manquants.');
 for(const a of agenda){if(a.point.Statut_suivi!=='Validé')throw Error('Un résultat n’est pas validé.');if(!['Adoptée','Rejetée'].includes(a.d.Decision_seance))throw Error('Seules les décisions adoptées ou rejetées peuvent être éditées.');const n=String(a.d.Numero_deliberation||'').trim();if(!n)throw Error('Renseignez le numéro officiel de « '+a.title+' ».');if(db.DELIBERATIONS.some(d=>d.id!==a.d.id&&String(d.Numero_deliberation||'').trim().toLowerCase()===n.toLowerCase()))throw Error('Numéro officiel déjà utilisé : '+n);if(db.AMENDEMENTS_SEANCE.some(m=>m.Deliberation===a.d.id&&!m.Integre_texte_definitif&&!['Rejeté','Rejetée','Retiré','Retirée'].includes(m.Decision_amendement)))throw Error('Un amendement reste à intégrer ou à qualifier pour « '+a.title+' ».');a.result=result(db,a.d);}
}
root.FinalModel={result,validate};
})(typeof window==='undefined'?globalThis:window);
