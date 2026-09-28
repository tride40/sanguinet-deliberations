/* Local, read-only document generation. No network requests except bundled assets. */
(function(root){
'use strict';
const W=595.28,H=841.89,L=56.7,R=W-L,BOTTOM=724,TOP=125;
const tables=['DELIBERATIONS','SEANCES_CM','ELUS','PARAMETRES_APPLICATION','ORDRE_DU_JOUR','EXPOSE_MOTIFS','VISAS','CONSIDERANTS','ARTICLES','CONTENUS_ARTICLES','TABLEAUX','COLONNES_TABLEAUX','LIGNES_TABLEAUX','CELLULES_TABLEAUX','ANNEXES','VOTES_DELIBERATIONS','AMENDEMENTS_SEANCE','DOCUMENTS_GENERES'];
const text=v=>v==null?'':String(v).replace(/\r\n?/g,'\n').replace(/\t/g,'    ').replace(/\u202f|\u00a0/g,' ');
const sort=(rows,key)=>rows.slice().sort((a,b)=>(Number(a[key])||0)-(Number(b[key])||0)||a.id-b.id);
const included=r=>r.Inclure_dossier_preparatoire!==false;
const date=(v,withDay=false)=>new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',...(withDay?{weekday:'long'}:{}),day:'numeric',month:'long',year:'numeric'}).format(new Date(v*1000));
const capital=s=>s.charAt(0).toUpperCase()+s.slice(1);
const name=e=>text([e?.Prenom,e?.Nom].filter(Boolean).join(' ')||e?.Nom_complet);
function options(db,id){
 const s=db.SEANCES_CM.find(s=>s.id===id),p=db.PARAMETRES_APPLICATION[0]||{};
 return {letterDate:s?.Date_convocation?new Date(s.Date_convocation*1000).toISOString().slice(0,10):'',signer:name(db.ELUS.find(e=>e.id===p.Maire)),quality:'Le Maire',address:p.Adresse_mairie||'1 place de la Mairie',city:[p.Code_postal||'40460',p.Ville||'Sanguinet'].join(' '),phone:p.Telephone||'05 58 82 11 82',email:p.Courriel_general||'mairie@sanguinet.fr',fax:p.Fax||'05 58 82 00 21'};
}
function cellValue(c,col){
 if(!c)return '';
 if(col.Format_valeur==='Date')return c.Valeur_date?new Date(c.Valeur_date*1000).toLocaleDateString('fr-FR',{timeZone:'UTC'}):'';
 if(['Nombre entier','Nombre décimal','Montant en euros','Pourcentage','Surface'].includes(col.Format_valeur)){
  if(c.Valeur_nombre==null||c.Valeur_nombre==='')return '';
  const decimals=col.Format_valeur==='Nombre entier'?0:Math.max(0,Math.min(8,Number(col.Nombre_decimales)||0));
  return Number(c.Valeur_nombre).toLocaleString('fr-FR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals})+({'Montant en euros':' €','Pourcentage':' %','Surface':' m²'}[col.Format_valeur]||'');
 }
 return text(c.Valeur_texte);
}
function snapshot(db,id,opt){
 const s=db.SEANCES_CM.find(s=>s.id===id);
 const final=opt.kind==='final'||opt.kind==='finalComplete';
 if(!s||!Number.isFinite(s.Date_heure_seance)||!s.Date_heure_seance)throw Error('Sélectionnez un conseil avec une date et une heure enregistrées.');
 if(!text(s.Lieu_seance).trim())throw Error('Renseignez et enregistrez le lieu du conseil.');
 const points=sort(db.ORDRE_DU_JOUR.filter(p=>p.Seance===id),'Ordre_point');
 if(!points.length)throw Error('L’ordre du jour est vide.');
 let agenda=points.map((p,i)=>{const d=db.DELIBERATIONS.find(d=>d.id===p.Deliberation);if(p.Deliberation&&!d)throw Error('Le point '+(i+1)+' référence une délibération introuvable.');if(d?.Seance&&d.Seance!==id)throw Error('Une délibération appartient à une autre séance.');const title=text(p.Intitule_point||d?.Objet).trim();if(!title)throw Error('Le point '+(i+1)+' n’a pas d’intitulé.');return {point:p,d,title,number:i+1};});
 if(['complete','convocation'].includes(opt.kind)&&(!DocumentStore.latest(db,id)||opt.freshLetter)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(opt.letterDate)||!Number.isFinite(Date.parse(opt.letterDate+'T12:00:00Z')))throw Error('Renseignez la date du courrier.');
  if(!text(opt.signer).trim()||!text(opt.quality).trim())throw Error('Renseignez le nom et la qualité du signataire.');
 }
 if(opt.kind!=='convocation'&&!agenda.some(a=>a.d))throw Error('Aucun projet de délibération n’est inscrit à cet ordre du jour.');
 if(!final&&!s.Ordre_du_jour_valide)throw Error('Verrouillez l’ordre du jour avant de générer les documents.');
 if(final){if(opt.kind==='finalComplete'&&agenda.some(a=>a.point.Statut_suivi!=='Validé'||(a.d&&!['Adoptée','Rejetée','Ajournée','Retirée'].includes(a.d.Decision_seance))))throw Error('Un point du conseil reste à valider ou son résultat est incomplet.');agenda=agenda.filter(a=>a.d&&['Adoptée','Rejetée'].includes(a.d.Decision_seance));if(opt.kind==='final')agenda=agenda.filter(a=>a.d.id===Number(opt.deliberation));if(!agenda.length)throw Error('Aucune délibération adoptée ou rejetée à éditer.');FinalModel.validate(db,s,agenda);}
 const projectIds=new Set(agenda.filter(a=>a.d).map(a=>a.d.id));
 const annexes=opt.kind==='convocation'?[]:db.ANNEXES.filter(a=>projectIds.has(a.Deliberation)&&(final?a.Obligatoire_acte_definitif:a.Obligatoire_dossier_preparatoire)!==false).sort((a,b)=>agenda.findIndex(x=>x.d?.id===a.Deliberation)-agenda.findIndex(x=>x.d?.id===b.Deliberation)||(a.Ordre_annexe||0)-(b.Ordre_annexe||0)||a.id-b.id);
 for(const a of annexes)if(!DocumentStore.ids(a.Fichier).length)throw Error('Le fichier de l’annexe « '+a.Titre_annexe+' » manque. Ajoutez-le avant de générer le dossier.');
 if(opt.kind!=='convocation')for(const a of agenda.filter(a=>a.d)){
  const aids=new Set(db.ARTICLES.filter(r=>r.Deliberation===a.d.id).map(r=>r.id));
  if(db.CONTENUS_ARTICLES.some(r=>aids.has(r.Article)&&(final?r.Inclure_acte_definitif:r.Inclure_dossier_preparatoire)!==false))throw Error('Le projet « '+a.title+' » contient des éléments structurés supplémentaires : export bloqué pour éviter de les omettre.');
 }
 const signed=final||opt.kind==='projects'||(opt.kind==='convocation'&&opt.freshLetter)?null:DocumentStore.latest(db,id);if(signed&&signed.Empreinte_source!==DocumentStore.source(db,id))throw Error('La convocation signée ne correspond plus aux données actuelles. Téléversez la version mise à jour avant de générer.');
 return {s,agenda,annexes,final,signed,opt:{...options(db,id),...opt},db};
}
async function fonts(){const doc=await PDFLib.PDFDocument.create();return {normal:await doc.embedFont(PDFLib.StandardFonts.Helvetica),bold:await doc.embedFont(PDFLib.StandardFonts.HelveticaBold)};}
function wrap(value,width,size,font){
 const result=[];
 for(const para of text(value).split('\n')){
  if(!para){result.push('');continue;}
  let line='';
  for(const word of para.split(/\s+/)){
   if(font.widthOfTextAtSize(word,size)>width){
    if(line){result.push(line);line='';}
    for(const ch of word){if(font.widthOfTextAtSize(line+ch,size)>width){result.push(line);line='';}line+=ch;}
   }else if(line&&font.widthOfTextAtSize(line+' '+word,size)>width){result.push(line);line=word;}
   else line+=(line?' ':'')+word;
  }
  if(line)result.push(line);
 }
 return result;
}
async function layout(db,id,opt){
 const data=snapshot(db,id,opt),f=await fonts(),accent=opt.bw?'000000':'35679A',pages=[];
 let page,y;
 function fresh(kind,label){page={kind,label,items:[]};pages.push(page);y=TOP;return page;}
 function put(value,style={}){
  const size=style.size||10.5,line=size*1.3,lines=wrap(value,style.width||R-L,size,style.bold?f.bold:f.normal);
  const top=style.top??y;
  if(style.top!=null){page.items.push({type:'text',text:text(value),lines,top,x:style.x??L,line,...style,size});return top+lines.length*line;}
  if(style.keep&&y+Math.min(lines.length,2)*line+style.keep>BOTTOM)fresh(page.kind,page.label);
  let rest=lines.slice();
  while(rest.length){let count=Math.floor((BOTTOM-y)/line);if(count<1){fresh(page.kind,page.label);count=Math.floor((BOTTOM-y)/line);}const batch=rest.splice(0,count);page.items.push({type:'text',text:batch.join('\n'),lines:batch,top:y,x:style.x??L,line,...style,size});y+=batch.length*line;if(rest.length)fresh(page.kind,page.label);}
  y+=style.after??7;
  return y;
 }
 const heading=(t,after=7)=>put(t,{bold:true,color:accent,keep:30,after});
 const title=t=>put(t,{size:14,bold:true,align:'center',after:14,keep:30});
 const sessionDate=capital(date(data.s.Date_heure_seance,true)),hour=new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'}).format(new Date(data.s.Date_heure_seance*1000)).replace(':',' h ');
 if(opt.kind==='complete'||opt.kind==='finalComplete'){
  fresh('cover','Dossier de séance');
  put('CONSEIL MUNICIPAL',{top:250,size:12,bold:true,color:accent});
  put(data.final?'Délibérations définitives':'Dossier de séance',{top:292,size:30,bold:true});
  put(data.final?'Actes à faire signer':'Convocation et projets de délibération',{top:334,size:14,color:'505050'});
  const end=put(sessionDate,{top:408,size:21,bold:true,color:accent});
  put(hour,{top:end+8,size:18,bold:true});put(data.s.Lieu_seance,{top:end+58,size:11});
  put('À L’ATTENTION DES CONSEILLERS MUNICIPAUX',{top:617,size:9,bold:true,color:accent});
  put(data.final?'Délibérations adoptées ou rejetées, dans l’ordre de la séance':'Projets présentés dans l’ordre du jour de la séance',{top:638,size:10,color:'505050'});
 }
 if(['complete','convocation'].includes(opt.kind)&&!data.signed){
  fresh('letter','Convocation');
  put('Mesdames et Messieurs les Conseillers municipaux',{bold:true,align:'right',after:24});
  title('CONVOCATION AU CONSEIL MUNICIPAL');y+=8;
  put('Sanguinet, le '+date(Date.parse(data.opt.letterDate+'T12:00:00Z')/1000),{align:'right',after:30});
  put('Mesdames, Messieurs,',{after:16});
  put('J’ai l’honneur de vous inviter à participer à la prochaine réunion du conseil municipal qui se réunira le :',{after:24});
  put(sessionDate+' à '+hour,{size:12,bold:true,color:accent,align:'center',after:7});
  put(data.s.Lieu_seance,{size:11,bold:true,align:'center',after:30});
  put('Dans l’attente de cette prochaine rencontre, je vous prie d’agréer, Mesdames et Messieurs, l’assurance de ma considération distinguée.',{after:30});
  put(data.opt.quality+',',{align:'right',after:6});put(data.opt.signer,{align:'right',bold:true,after:48});
  const agendaHeights=data.agenda.map(a=>wrap(a.title,R-L-27,10.5,f.normal).length*13.65+6);
  const needed=13.65+12+agendaHeights.reduce((a,b)=>a+b,0);
  let notice;
  if(y+needed>BOTTOM){heading('ORDRE DU JOUR');notice={type:'text',text:'',lines:[''],top:y,x:L,size:10.5,line:13.65};page.items.push(notice);fresh('agenda','Ordre du jour');}
  const start=pages.length;
  heading('ORDRE DU JOUR',12);
  for(const a of data.agenda){
   const lines=wrap(a.title,R-L-27,10.5,f.normal),h=lines.length*13.65;
   if(h>BOTTOM-TOP-35)throw Error('Un intitulé de l’ordre du jour est trop long pour une page. Réduisez cet intitulé.');
   if(y+h>BOTTOM){fresh('agenda','Ordre du jour');heading('ORDRE DU JOUR · SUITE',12);}
   page.items.push({type:'agenda',top:y,number:a.number,lines,line:13.65,size:10.5,height:h});y+=h+6;
  }
  if(notice){notice.text=start===pages.length?'L’ordre du jour figure à la page suivante.':`L’ordre du jour figure aux pages ${start} à ${pages.length}.`;notice.lines=[notice.text];}
 }
 if(opt.kind!=='convocation')for(const a of data.agenda.filter(a=>a.d)){
  const d=a.d,related=(t,key)=>sort(db[t].filter(r=>r.Deliberation===d.id&&(data.final?r.Inclure_acte_definitif:r.Inclure_dossier_preparatoire)!==false),key);
  fresh('project',d.Reference_projet||'Projet '+a.number);
  title(data.final?'DÉLIBÉRATION DU CONSEIL MUNICIPAL':'PROJET DE DÉLIBÉRATION DU CONSEIL MUNICIPAL');
  if(data.final)put('N° '+d.Numero_deliberation,{bold:true,align:'center',after:12});
  put('OBJET : '+d.Objet,{size:12,bold:true,align:'center',after:15,keep:30});
  put((data.final?'Séance du : ':'Séance prévue : ')+sessionDate+' à '+hour,{size:9,after:15});
  if(data.final){const full=id=>name(db.ELUS.find(e=>e.id===id));put('Président de séance : '+full(data.s.President_seance)+' — Secrétaire : '+full(data.s.Secretaire_seance),{size:9});const t=a.result.t;put('Mode de scrutin : '+text(d.Mode_scrutin),{size:9});put(`${t.for} pour · ${t.against} contre · ${t.abstain} abstention(s) · ${t.nppv} non-participation(s)`,{bold:true,size:10});heading(a.result.label+(a.result.adopted&&!t.against?' des suffrages exprimés':''));if(t.for===t.against)put('Départage : '+(d.Departage||'Scrutin secret'),{size:9});}
  const expose=related('EXPOSE_MOTIFS','Ordre_paragraphe');
  if(expose.length)heading('EXPOSÉ DES MOTIFS');
  for(const e of expose){
   if(e.Format_paragraphe==='Sous-titre')heading(e.Texte_paragraphe);
   else if(['Liste à puces','Liste numérotée'].includes(e.Format_paragraphe))text(e.Texte_paragraphe).split('\n').filter(Boolean).forEach((line,i)=>put((e.Format_paragraphe==='Liste à puces'?'• ':`${i+1}. `)+line));
   else put(e.Texte_paragraphe);
  }
  for(const [t,key,field,prefix] of [['VISAS','Ordre_visa','Texte_visa','VU'],['CONSIDERANTS','Ordre_considerant','Texte_considerant','CONSIDÉRANT']])for(const r of related(t,key))put(text(r[field]).toLocaleUpperCase('fr').startsWith(prefix+' ')?r[field]:prefix+' '+text(r[field]));
  heading(data.final?(a.result.adopted?'DÉCISION DU CONSEIL MUNICIPAL':'PROPOSITION REJETÉE PAR LE CONSEIL MUNICIPAL'):'DÉCISION PROPOSÉE AU CONSEIL MUNICIPAL');
  const reporter=name(db.ELUS.find(e=>e.id===d.Rapporteur));
  put(data.final?(a.result.adopted?'Le Conseil municipal, après en avoir délibéré, décide :':'Le Conseil municipal a rejeté la proposition suivante :'):(reporter?'Sur le rapport de '+reporter+', il':'Il')+' est proposé au conseil municipal de décider ce qui suit :');
  for(const article of related('ARTICLES','Numero_article')){
   heading('Article '+article.Numero_article+(article.Titre_article?' - '+article.Titre_article:''));put(article.Texte_article);
   for(const t of sort(db.TABLEAUX.filter(t=>t.Article===article.id&&(data.final?t.Inclure_acte_definitif:t.Inclure_dossier_preparatoire)!==false),'Position_dans_article')){
    const cols=sort(db.COLONNES_TABLEAUX.filter(c=>c.Tableau===t.id),'Ordre_colonne');
    if(!cols.length)throw Error('Un tableau ne contient aucune colonne.');
    if(t.Afficher_titre&&t.Titre_tableau)heading(t.Titre_tableau);
    const weights=cols.map(c=>Number(c.Largeur_relative)>0?Number(c.Largeur_relative):1),sum=weights.reduce((a,b)=>a+b,0),widths=weights.map(w=>(R-L)*w/sum);
    if(widths.some(w=>w<25))throw Error('Un tableau comporte une colonne trop étroite pour être exportée. Ajustez ses largeurs.');
    const makeRow=(values,header=false,bold=false)=>{const lines=values.map((v,i)=>wrap(v,widths[i]-10,9,(header||bold)?f.bold:f.normal));return {type:'row',lines,widths,header,bold:header||bold,height:Math.max(1,...lines.map(x=>x.length))*11.7+10,size:9,line:11.7,borders:t.Style_tableau!=='Tableau sans bordures',aligns:cols.map(c=>c.Alignement)};};
    const header=t.Afficher_entete===false?null:makeRow(cols.map(c=>text(c.Intitule_colonne)),true);
    const tableRows=sort(db.LIGNES_TABLEAUX.filter(l=>l.Tableau===t.id),'Ordre_ligne').map(l=>makeRow(cols.map(col=>cellValue(db.CELLULES_TABLEAUX.find(c=>c.Ligne===l.id&&c.Colonne===col.id),col)),false,['Total','Sous-total','Titre de section'].includes(l.Type_ligne)));
    const addRow=r=>{page.items.push({...r,top:y});y+=r.height;};
    if(header&&y+header.height+(tableRows[0]?.height||0)>BOTTOM)fresh(page.kind,page.label);
    if(header)addRow(header);
    for(const [ri,r] of tableRows.entries()){
     if(r.height+(header&&t.Repeter_entete_sur_pages!==false?header.height:0)>BOTTOM-TOP)throw Error('Une ligne de tableau est trop haute pour une page. Scindez son contenu en plusieurs lignes.');
     const pair=ri===tableRows.length-2?r.height+tableRows[ri+1].height:0;
     const reserve=pair&&pair+(header?.height||0)<=BOTTOM-TOP?pair:r.height;
     if(y+reserve>BOTTOM&&y>TOP+(header?.height||0)){fresh(page.kind,page.label);if(header&&t.Repeter_entete_sur_pages!==false)addRow(header);}
     addRow(r);
    }
    y+=8;if(t.Note_sous_tableau)put(t.Note_sous_tableau,{size:8});
   }
  }
  if(data.final){put('Fait à Sanguinet, le '+date(data.s.Date_heure_seance),{keep:65,after:15});put('Le président de séance : '+name(db.ELUS.find(e=>e.id===data.s.President_seance)),{after:32});put('Le secrétaire de séance : '+name(db.ELUS.find(e=>e.id===data.s.Secretaire_seance)),{after:32});}
 }
 return {pages,data,accent};
}
let assetPromise;
async function assets(bw){
 if(!assetPromise)assetPromise=fetch('assets/logo.png').then(r=>{if(!r.ok)throw Error('Logo indisponible. Vérifiez que le dossier assets a été déposé.');return r.blob();}).catch(e=>{assetPromise=null;throw e;});
 const blob=await assetPromise;
 if(!bw)return new Uint8Array(await blob.arrayBuffer());
 const bitmap=await createImageBitmap(blob),cv=document.createElement('canvas');cv.width=bitmap.width;cv.height=bitmap.height;const ctx=cv.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();const pixels=ctx.getImageData(0,0,cv.width,cv.height);for(let i=0;i<pixels.data.length;i+=4){const v=Math.round(.299*pixels.data[i]+.587*pixels.data[i+1]+.114*pixels.data[i+2]);pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=v;}ctx.putImageData(pixels,0,0);return new Uint8Array(await (await new Promise(r=>cv.toBlob(r,'image/png'))).arrayBuffer());
}
async function pdf(model,logo){
 const {PDFDocument,StandardFonts,rgb}=PDFLib,doc=await PDFDocument.create(),normal=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),img=await doc.embedPng(logo),{data,accent}=model;
 const color=h=>rgb(parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255);
 doc.setTitle('Conseil municipal - '+date(data.s.Date_heure_seance));doc.setAuthor('Ville de Sanguinet');
 model.pages.forEach((p,index)=>{
  const page=doc.addPage([W,H]);
  const line=(s,x,top,size=10.5,isBold=false,ink='000000',align='left',width=R-L)=>{const font=isBold?bold:normal,tw=font.widthOfTextAtSize(s,size);const offset=align==='right'?width-tw:align==='center'?(width-tw)/2:0;page.drawText(s,{x:x+offset,y:H-top-size,size,font,color:color(ink)});};
  line('RÉPUBLIQUE FRANÇAISE',L,40,8);line('DÉPARTEMENT DES LANDES',L,54,8.5);line('Ville de Sanguinet',L,70,9,true);page.drawImage(img,{x:R-111,y:H-94,width:111,height:57.6});
  if(p.kind!=='project'){
  page.drawLine({start:{x:L,y:91},end:{x:R,y:91},thickness:.4,color:color('D6D6D6')});
  line('MAIRIE DE SANGUINET',L,H-82,8,true,accent);line(text(data.opt.address),L,H-69,8,false,'505050');line(text(data.opt.city),L,H-57,8,false,'505050');
  line(text(data.opt.email),L,H-82,8,false,'505050','right');line('Tél. '+text(data.opt.phone),L,H-69,8,false,'505050','right');line('Fax '+text(data.opt.fax),L,H-57,8,false,'505050','right');
  }
  if(p.kind!=='cover'){line('Conseil municipal du '+date(data.s.Date_heure_seance),L,H-33,7);}
  for(const item of p.items){
   if(item.type==='text')item.lines.forEach((s,i)=>line(s,item.x,item.top+i*item.line,item.size,item.bold,item.color||'000000',item.align,item.width||R-L));
   if(item.type==='agenda'){line(String(item.number).padStart(2,'0'),L,item.top,10.5,true,accent);item.lines.forEach((s,i)=>line(s,L+27,item.top+i*item.line));}
   if(item.type==='row'){
    let x=L;item.widths.forEach((width,col)=>{page.drawRectangle({x,y:H-item.top-item.height,width,height:item.height,color:item.header?color(data.opt.bw?'EEEEEE':'EDF3F8'):rgb(1,1,1),...(item.borders?{borderColor:color(data.opt.bw?'CCCCCC':'CBD5DF'),borderWidth:.4}:{})});item.lines[col].forEach((s,i)=>line(s,x+5,item.top+5+i*item.line,item.size,item.bold,'000000',item.aligns[col]==='Droite'?'right':item.aligns[col]==='Centré'?'center':'left',width-10));x+=width;});
   }
  }
 });
 return new Blob([await doc.save()],{type:'application/pdf'});
}
async function word(model,logo){
 const D=docx,{data,accent}=model,tw=v=>Math.round(v*20),run=(t,size=10.5,bold=false,color='000000')=>new D.TextRun({text:t,font:'Arial',size:size*2,bold,color});
 const p=(t,size=10.5,bold=false,color='000000',extra={})=>new D.Paragraph({children:[run(t,size,bold,color)],spacing:{before:0,after:0,line:tw(size*1.3),lineRule:D.LineRuleType.EXACT},...extra});
 const lineParagraph=(item,before=0)=>new D.Paragraph({children:item.lines.flatMap((s,i)=>[...(i?[new D.TextRun({break:1})]:[]),run(s,item.size,item.bold,item.color||'000000')]),alignment:item.align||'left',indent:{left:tw((item.x||L)-L)},spacing:{before:tw(before),after:0,line:tw(item.line),lineRule:D.LineRuleType.EXACT},widowControl:false});
 const border={style:D.BorderStyle.NONE,size:0,color:'FFFFFF'};
 const sections=model.pages.map((page,index)=>{
  if(page.kind==='scan')return {properties:{type:D.SectionType.NEXT_PAGE,page:{size:{width:tw(page.width),height:tw(page.height)},margin:{top:0,bottom:0,left:0,right:0,header:0,footer:0}}},headers:{default:new D.Header({children:[]})},footers:{default:new D.Footer({children:[]})},children:[new D.Paragraph({spacing:{before:0,after:0,line:1,lineRule:D.LineRuleType.EXACT},children:[new D.ImageRun({type:'png',data:page.png,transformation:{width:page.width*96/72,height:page.height*96/72},floating:{horizontalPosition:{relative:D.HorizontalPositionRelativeFrom.PAGE,offset:0},verticalPosition:{relative:D.VerticalPositionRelativeFrom.PAGE,offset:0},wrap:{type:D.TextWrappingType.NONE},behindDocument:false}})]})]};
  const header=new D.Header({children:[p('RÉPUBLIQUE FRANÇAISE',8),p('DÉPARTEMENT DES LANDES',8.5),p('Ville de Sanguinet',9,true),new D.Paragraph({children:[new D.ImageRun({type:'png',data:logo,transformation:{width:148,height:76.8},floating:{horizontalPosition:{relative:D.HorizontalPositionRelativeFrom.PAGE,offset:Math.round((R-111)*12700)},verticalPosition:{relative:D.VerticalPositionRelativeFrom.PAGE,offset:Math.round(36.4*12700)},wrap:{type:D.TextWrappingType.NONE},behindDocument:false}})],spacing:{before:0,after:0,line:1,lineRule:D.LineRuleType.EXACT}})]});
  const footerLine=(left,right,bold=false)=>new D.Paragraph({children:[run(left,8,bold,bold?accent:'505050'),run('\t'+right,8)],tabStops:[{type:D.TabStopType.RIGHT,position:tw(R-L)}],spacing:{before:0,after:0,line:tw(12),lineRule:D.LineRuleType.EXACT}});
  const pageCount=new D.Paragraph({children:page.kind==='cover'?[]:[run('Conseil municipal du '+date(data.s.Date_heure_seance)+'\t',7),new D.TextRun({children:[D.PageNumber.CURRENT,' / ',D.PageNumber.TOTAL_PAGES],font:'Arial',size:14})],tabStops:[{type:D.TabStopType.RIGHT,position:tw(R-L)}],spacing:{before:tw(12),after:0,line:tw(10),lineRule:D.LineRuleType.EXACT}});
  const footer=new D.Footer({children:[...(page.kind==='project'?[]:[footerLine('MAIRIE DE SANGUINET',text(data.opt.email),true),footerLine(text(data.opt.address),'Tél. '+text(data.opt.phone)),footerLine(text(data.opt.city),'Fax '+text(data.opt.fax))]),pageCount]});
  const children=[];let cursor=TOP;
  for(let n=0;n<page.items.length;n++){
   const item=page.items[n],gap=Math.max(0,item.top-cursor);
   if(gap)children.push(p(' ',1,false,'000000',{spacing:{before:0,after:0,line:tw(gap),lineRule:D.LineRuleType.EXACT}}));
   if(item.type==='row'){
    const rows=[];let last=item;
    while(n<page.items.length&&page.items[n].type==='row'){
     const r=page.items[n];last=r;
     rows.push(new D.TableRow({height:{value:tw(r.height),rule:D.HeightRule.ATLEAST},cantSplit:true,tableHeader:r.header,children:r.widths.map((w,i)=>new D.TableCell({width:{size:tw(w),type:D.WidthType.DXA},margins:{top:tw(5),bottom:tw(5),left:tw(5),right:tw(5)},shading:r.header?{fill:data.opt.bw?'EEEEEE':'EDF3F8'}:undefined,borders:Object.fromEntries(['top','bottom','left','right'].map(k=>[k,r.borders?{style:D.BorderStyle.SINGLE,size:4,color:data.opt.bw?'CCCCCC':'CBD5DF'}:border])),children:[lineParagraph({lines:r.lines[i],size:r.size,line:r.line,bold:r.bold,align:r.aligns[i]==='Droite'?'right':r.aligns[i]==='Centré'?'center':'left'})]}))}));n++;
    }n--;
    children.push(new D.Table({rows,width:{size:tw(R-L),type:D.WidthType.DXA},columnWidths:item.widths.map(tw),layout:D.TableLayoutType.FIXED}));cursor=last.top+last.height;
   }else if(item.type==='agenda'){
    children.push(new D.Paragraph({children:[run(String(item.number).padStart(2,'0')+'\t',10.5,true,accent),...item.lines.flatMap((s,i)=>[...(i?[new D.TextRun({break:1})]:[]),run(s)])],indent:{left:tw(27),hanging:tw(27)},tabStops:[{type:D.TabStopType.LEFT,position:tw(27)}],spacing:{before:0,after:0,line:tw(item.line),lineRule:D.LineRuleType.EXACT},widowControl:false}));cursor=item.top+item.height;
   }else{children.push(lineParagraph(item,0));cursor=item.top+item.lines.length*item.line;}
  }
  return {properties:{type:D.SectionType.NEXT_PAGE,page:{size:{width:tw(W),height:tw(H)},margin:{top:tw(TOP),bottom:tw(H-BOTTOM-8),left:tw(L),right:tw(L),header:tw(40),footer:tw(25)}}},headers:{default:header},footers:{default:footer},children};
 });
 return D.Packer.toBlob(new D.Document({creator:'Ville de Sanguinet',title:'Dossier du conseil municipal',styles:{default:{document:{run:{font:'Arial',size:21},paragraph:{spacing:{before:0,after:0}}}}},sections}));
}

async function loadExternal(model){
 const {data}=model,documents={signed:null,annexes:[]},api=data.opt.api;
 const read=async id=>{if(!api)throw Error('Accès Grist requis pour joindre les fichiers.');const bytes=await DocumentStore.download(api,id);try{const doc=await PDFLib.PDFDocument.load(bytes);if(!doc.getPageCount())throw Error();}catch(e){throw Error('Une pièce jointe n’est pas un PDF lisible non chiffré. Convertissez-la en PDF avant de poursuivre.');}return bytes;};
 if(data.signed&&['complete','convocation'].includes(data.opt.kind)){const refs=DocumentStore.ids(data.signed.Fichier);if(refs.length!==1)throw Error('La convocation signée doit contenir exactement un PDF.');documents.signed=await read(refs[0]);}
 const seen=new Set();for(const a of data.annexes)for(const id of DocumentStore.ids(a.Fichier)){if(seen.has(id))continue;seen.add(id);documents.annexes.push(await read(id));}
 return documents;
}
let cmapBundle;
class BundledPdfData {
 constructor(options){Object.assign(this,options);}
 async fetch({kind,filename}){if(kind==='cMapUrl'){if(!cmapBundle)cmapBundle=fetch(new URL('vendor/pdfjs/cmaps.json',location.href)).then(r=>{if(!r.ok)throw Error('Ressources PDF absentes.');return r.json();}).catch(e=>{cmapBundle=null;throw e;});const data=(await cmapBundle)[filename];if(!data)throw Error('Ressource PDF introuvable.');return Uint8Array.from(atob(data),c=>c.charCodeAt(0));}const response=await fetch(this[kind]+filename);if(!response.ok)throw Error('Ressource PDF absente : '+filename);return new Uint8Array(await response.arrayBuffer());}
}
async function scanPages(bytes,bw){
 const lib=await import('../vendor/pdfjs/pdf.mjs');lib.GlobalWorkerOptions.workerSrc=new URL('vendor/pdfjs/pdf.worker.min.mjs',location.href).href;
 const task=lib.getDocument({data:bytes.slice(),BinaryDataFactory:BundledPdfData,useWorkerFetch:false,standardFontDataUrl:new URL('vendor/pdfjs/standard_fonts/',location.href).href,cMapUrl:new URL('vendor/pdfjs/cmaps/',location.href).href,cMapPacked:true,wasmUrl:new URL('vendor/pdfjs/wasm/',location.href).href,isEvalSupported:false});const doc=await task.promise,result=[];
 try{for(let n=1;n<=doc.numPages;n++){const p=await doc.getPage(n),base=p.getViewport({scale:1}),view=p.getViewport({scale:1.7}),canvas=document.createElement('canvas');canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);const ctx=canvas.getContext('2d');await p.render({canvasContext:ctx,viewport:view}).promise;if(bw){const image=ctx.getImageData(0,0,canvas.width,canvas.height);for(let i=0;i<image.data.length;i+=4){const v=Math.round(.299*image.data[i]+.587*image.data[i+1]+.114*image.data[i+2]);image.data[i]=image.data[i+1]=image.data[i+2]=v;}ctx.putImageData(image,0,0);}const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));result.push({kind:'scan',png:new Uint8Array(await blob.arrayBuffer()),width:base.width,height:base.height});canvas.width=canvas.height=0;p.cleanup();}}finally{await doc.destroy();}return result;
}
async function addScans(model,external){const scans=external.signed?await scanPages(external.signed,model.data.opt.bw):[];const index=model.pages[0]?.kind==='cover'?1:0;model.pages.splice(index,0,...scans);for(const bytes of external.annexes)model.pages.push(...await scanPages(bytes,model.data.opt.bw));}
async function mergedPdf(model,logo,external){
 const result=await PDFLib.PDFDocument.create(),base=await PDFLib.PDFDocument.load(await (await pdf(model,logo)).arrayBuffer()),generated=[];
 async function append(bytes){if(model.data.opt.bw){for(const p of await scanPages(bytes,true)){const page=result.addPage([p.width,p.height]),img=await result.embedPng(p.png);page.drawImage(img,{x:0,y:0,width:p.width,height:p.height});}}else{const doc=await PDFLib.PDFDocument.load(bytes);for(const p of await result.copyPages(doc,doc.getPageIndices()))result.addPage(p);}}
 for(let i=0;i<=model.pages.length;i++){if(external.signed&&i===(model.pages[0]?.kind==='cover'?1:0))await append(external.signed);if(i<model.pages.length){const [page]=await result.copyPages(base,[i]);result.addPage(page);if(model.pages[i].kind!=='cover')generated.push({page,index:result.getPageCount()});}}
 for(const bytes of external.annexes)await append(bytes);
 const font=await result.embedFont(PDFLib.StandardFonts.Helvetica);for(const {page,index} of generated){const value=index+' / '+result.getPageCount();page.drawText(value,{x:R-font.widthOfTextAtSize(value,7),y:26,size:7,font});}
 return new Blob([await result.save()],{type:'application/pdf'});
}
async function generate(db,id,opt){
 if(!['convocation','projects','complete','final','finalComplete'].includes(opt.kind))throw Error('Choisissez le document à extraire.');
 if(!opt.pdf&&!opt.word)throw Error('Choisissez au moins un format.');
 let model;
 try{model=await layout(db,id,opt);}catch(e){if(/WinAnsi/.test(e.message))throw Error('Un caractère du texte ne peut pas être exporté dans cette version. Remplacez les symboles inhabituels dans le projet concerné.');throw e;}
 const logo=await assets(opt.bw),files=[];
 const safe=v=>String(v).replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').trim().slice(0,90);
 const day=new Date(model.data.s.Date_heure_seance*1000).toLocaleDateString('fr-CA',{timeZone:'Europe/Paris'});
 const label={convocation:'Convocation',projects:'Projets de délibérations',complete:'Dossier avant conseil',final:'Délibération '+(model.data.agenda[0]?.d.Numero_deliberation||'')+' - '+(model.data.agenda[0]?.d.Objet||''),finalComplete:'Dossier des délibérations définitives'}[opt.kind];
 const stem=safe(label)+' - Conseil du '+day+' - '+(opt.bw?'Noir et blanc':'Couleur');
 const external=await loadExternal(model);
 if(opt.pdf)files.push({name:stem+'.pdf',blob:await mergedPdf(model,logo,external)});
 if(opt.word){await addScans(model,external);files.push({name:stem+'.docx',blob:await word(model,logo)});}
 return {files,pages:model.pages.length,model};
}
root.CouncilExports={tables,options,snapshot,layout,generate,cellValue};
})(typeof window==='undefined'?globalThis:window);
