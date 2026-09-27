(function(root){
'use strict';
const PRESENT='Présent',PROXY='Absent ayant donné pouvoir';
const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').trim();
function holder(rows,id,except){return rows.find(r=>r.Elu!==except&&r.Statut_presence===PROXY&&r.Mandataire===id);}
function setPresence(rows,id,status){
 const row=rows.find(r=>r.Elu===id);if(!row)throw Error('Élu introuvable.');
 if(status!==PRESENT&&holder(rows,id))throw Error('Cet élu porte un pouvoir. Réattribuez ce pouvoir avant de le déclarer absent.');
 row.Statut_presence=status;row.Mandataire=0;
}
function giveProxy(rows,donor,recipient){
 if(donor===recipient)throw Error('Choisissez un autre élu.');
 const from=rows.find(r=>r.Elu===donor),to=rows.find(r=>r.Elu===recipient);
 if(!from||!to)throw Error('Élu introuvable.');
 if(holder(rows,donor))throw Error('Cet élu porte un pouvoir. Réattribuez-le avant de lui donner le statut absent.');
 if(holder(rows,recipient,donor))throw Error('Cet élu porte déjà un autre pouvoir.');
 const promoted=to.Statut_presence!==PRESENT,previousProxy=to.Statut_presence===PROXY;
 from.Statut_presence=PROXY;from.Mandataire=recipient;
 to.Statut_presence=PRESENT;to.Mandataire=0;
 return {promoted,previousProxy};
}
root.CallModel={normalize,holder,setPresence,giveProxy};if(typeof module!=='undefined')module.exports=root.CallModel;
})(typeof window!=='undefined'?window:globalThis);
