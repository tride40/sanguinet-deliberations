(function(){
 'use strict';const $=s=>document.querySelector(s),R=ResetData;let access=false,busy=false,preview=null;
 function status(message,type=''){ $('#status').textContent=message;$('#status').className=type; }
 function controls(){ $('#analyse').disabled=!access||busy;$('#erase').disabled=!access||busy||!preview||!R.plan(preview).length||!$('#backup').checked||$('#confirmation').value!=='EFFACER LES TESTS';$('#backup').disabled=busy;$('#confirmation').disabled=busy; }
 function invalidate(){preview=null;$('#preview').hidden=true;$('#backup').checked=false;$('#confirmation').value='';controls();}
 function render(s){$('#counts').replaceChildren();for(const table of R.targets){const tr=document.createElement('tr');for(const text of [table,s.data[table]?String(s.data[table].id.length):'Table absente — ignorée']){const td=document.createElement('td');td.textContent=text;tr.append(td);}$('#counts').append(tr);}const count=s.active.reduce((n,t)=>n+s.data[t].id.length,0);$('#total').textContent=count+' ligne(s) à supprimer.';$('#preserved').textContent='Références conservées : '+s.preserved.map(t=>t+' ('+s.data[t].id.length+')').join(' · ');$('#preview').hidden=false;}
 $('#analyse').onclick=async()=>{busy=true;invalidate();status('Analyse en cours…');try{const s=await R.snapshot(grist.docApi);if(!access)throw Error('Accès complet retiré.');preview=s;render(s);status('Analyse terminée. Aucune donnée modifiée.');}catch(e){status(e.message,'error');}finally{busy=false;controls();}};
 $('#backup').onchange=controls;$('#confirmation').oninput=controls;
 $('#erase').onclick=async()=>{
  if($('#erase').disabled)return;busy=true;controls();let submitted=false,completed=false;
  try{
   status('Vérification des données avant suppression…');const fresh=await R.snapshot(grist.docApi);
   if(!access)throw Error('Accès complet retiré.');
   if(!preview||R.fingerprint(fresh)!==R.fingerprint(preview))throw Error('Le document a changé depuis l’analyse. Relancez l’analyse et vérifiez le nouvel aperçu.');
   const actions=R.plan(fresh);submitted=true;await grist.docApi.applyUserActions(actions);completed=true;
   invalidate();const after=await R.snapshot(grist.docApi);const remaining=after.active.reduce((n,t)=>n+after.data[t].id.length,0);
   const changedReferences=fresh.preserved.filter(t=>R.fingerprint(fresh.data[t])!==R.fingerprint(after.data[t]));
   if(remaining||changedReferences.length)throw Error('Suppression effectuée, mais le contrôle final signale '+remaining+' ligne(s) de test restante(s)'+(changedReferences.length?' et des références recalculées ou modifiées : '+changedReferences.join(', '):'')+'. Vérifiez le document ; aucune nouvelle suppression automatique ne sera faite.');
   status('Remise à zéro terminée : les tables de test sont vides et les données de référence sont conservées. Fermez puis rechargez les autres widgets avant de commencer le scénario.','success');
  }catch(e){invalidate();status((completed?'La suppression a été exécutée. ':submitted?'Le résultat de la demande doit être vérifié dans Grist avant toute nouvelle tentative. ':'Aucune suppression effectuée. ')+e.message,'error');}
  finally{busy=false;controls();}
 };
 if(!window.grist||parent===window){status('Ouvrez cette page dans un widget Grist avec accès complet au document.');return;}
 grist.onOptions((o,i)=>{access=(i?.accessLevel??i?.access_level)==='full';if(!access){invalidate();status('Autorisez l’accès complet au document dans les options du widget.');}else if(!busy&&!preview)status('Connecté. Lancez l’analyse pour voir les données concernées.');controls();});
 grist.ready({requiredAccess:'full'});
})();
