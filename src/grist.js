// Pont unique entre l'interface et Grist.
// Le widget est prévu pour être rattaché à la table DELIBERATIONS.
(function () {
  const TABLES = {
    deliberations: 'DELIBERATIONS',
    seances: 'SEANCES_CM',
    elus: 'ELUS',
    agents: 'AGENTS',
    unites: 'UNITES_ORGANISATIONNELLES',
    expose: 'EXPOSE_MOTIFS',
    visas: 'VISAS',
    considerants: 'CONSIDERANTS',
    articles: 'ARTICLES',
    contenusArticles: 'CONTENUS_ARTICLES',
    tableaux: 'TABLEAUX',
    colonnesTableaux: 'COLONNES_TABLEAUX',
    lignesTableaux: 'LIGNES_TABLEAUX',
    cellulesTableaux: 'CELLULES_TABLEAUX',
    annexes: 'ANNEXES'
  };

  let currentId = null;
  let connected = false;
  let referenceData = null;

  function colTableToRows(table) {
    if (!table || !table.id || !Array.isArray(table.id)) return [];
    const keys = Object.keys(table);
    return table.id.map((id, i) => {
      const row = { id };
      keys.forEach(k => row[k] = Array.isArray(table[k]) ? table[k][i] : table[k]);
      return row;
    });
  }

  async function fetchRows(tableId) {
    const raw = await grist.docApi.fetchTable(tableId);
    return colTableToRows(raw);
  }

  async function getReferences() {
    if (referenceData) return referenceData;
    const [seances, elus, agents, unites] = await Promise.all([
      fetchRows(TABLES.seances), fetchRows(TABLES.elus), fetchRows(TABLES.agents), fetchRows(TABLES.unites)
    ]);
    referenceData = { seances, elus, agents, unites };
    return referenceData;
  }

  function byDeliberation(rows, id) {
    return rows.filter(r => Number(r.Deliberation) === Number(id));
  }

  function buildTableTree(articleRows, tableRows, columnRows, lineRows, cellRows) {
    const tablesByArticle = new Map();
    for (const article of articleRows) tablesByArticle.set(Number(article.id), []);

    const colsByTable = new Map();
    const linesByTable = new Map();
    const cellsByLine = new Map();

    for (const c of columnRows) {
      const id = Number(c.Tableau);
      if (!colsByTable.has(id)) colsByTable.set(id, []);
      colsByTable.get(id).push(c);
    }
    for (const l of lineRows) {
      const id = Number(l.Tableau);
      if (!linesByTable.has(id)) linesByTable.set(id, []);
      linesByTable.get(id).push(l);
    }
    for (const cell of cellRows) {
      const id = Number(cell.Ligne);
      if (!cellsByLine.has(id)) cellsByLine.set(id, []);
      cellsByLine.get(id).push(cell);
    }

    for (const t of tableRows) {
      const articleId = Number(t.Article);
      if (!tablesByArticle.has(articleId)) continue;
      const cols = (colsByTable.get(Number(t.id)) || []).sort((a,b)=>(a.Ordre_colonne||0)-(b.Ordre_colonne||0));
      const lines = (linesByTable.get(Number(t.id)) || []).sort((a,b)=>(a.Ordre_ligne||0)-(b.Ordre_ligne||0));
      const enrichedLines = lines.map(line => {
        const rawCells = cellsByLine.get(Number(line.id)) || [];
        const byColumn = new Map(rawCells.map(c => [Number(c.Colonne), c]));
        return {
          ...line,
          _cells: cols.map(col => byColumn.get(Number(col.id)) || null)
        };
      });
      tablesByArticle.get(articleId).push({
        ...t,
        _columns: cols,
        _lines: enrichedLines
      });
    }
    for (const arr of tablesByArticle.values()) arr.sort((a,b)=>(a.Position_dans_article||0)-(b.Position_dans_article||0));
    return tablesByArticle;
  }

  async function loadDeliberation(id) {
    if (!id) return null;
    const [delibs, refs, exposeRows, visaRows, consRows, articleRowsAll, annexeRows, tableRows, columnRows, lineRows, cellRows] = await Promise.all([
      fetchRows(TABLES.deliberations), getReferences(), fetchRows(TABLES.expose), fetchRows(TABLES.visas),
      fetchRows(TABLES.considerants), fetchRows(TABLES.articles), fetchRows(TABLES.annexes),
      fetchRows(TABLES.tableaux), fetchRows(TABLES.colonnesTableaux), fetchRows(TABLES.lignesTableaux), fetchRows(TABLES.cellulesTableaux)
    ]);
    const d = delibs.find(r => Number(r.id) === Number(id));
    if (!d) return null;

    const articleRows = byDeliberation(articleRowsAll, id).sort((a,b)=>(a.Numero_article||0)-(b.Numero_article||0));
    const tree = buildTableTree(articleRows, tableRows, columnRows, lineRows, cellRows);
    const articles = articleRows.map(a => ({...a, _tables: tree.get(Number(a.id)) || []}));

    return {
      id: d.id,
      fields: d,
      refs,
      expose: byDeliberation(exposeRows, id).sort((a,b)=>(a.Ordre_paragraphe||0)-(b.Ordre_paragraphe||0)),
      visas: byDeliberation(visaRows, id).sort((a,b)=>(a.Ordre_visa||0)-(b.Ordre_visa||0)),
      considerants: byDeliberation(consRows, id).sort((a,b)=>(a.Ordre_considerant||0)-(b.Ordre_considerant||0)),
      articles,
      annexes: byDeliberation(annexeRows, id).sort((a,b)=>(a.Ordre_annexe||0)-(b.Ordre_annexe||0))
    };
  }

  async function syncChildren(tableId, existingRows, items, fieldBuilder) {
    const table = grist.getTable(tableId);
    const existingIds = new Set(existingRows.map(r => Number(r.id)));
    const keptIds = new Set(items.filter(x => x.id).map(x => Number(x.id)));
    const toDelete = [...existingIds].filter(id => !keptIds.has(id));
    if (toDelete.length) await table.destroy(toDelete);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const fields = fieldBuilder(item, i);
      if (item.id) {
        await table.update({ id: Number(item.id), fields });
      } else {
        const created = await table.create({ fields });
        if (created && created.id) item.id = created.id;
      }
    }
  }

  async function destroyTableTree(existingTable) {
    const cellIds = [];
    const lineIds = [];
    const colIds = [];
    for (const line of existingTable._lines || []) {
      lineIds.push(Number(line.id));
      for (const cell of line._cells || []) if (cell?.id) cellIds.push(Number(cell.id));
    }
    for (const col of existingTable._columns || []) if (col?.id) colIds.push(Number(col.id));
    if (cellIds.length) await grist.getTable(TABLES.cellulesTableaux).destroy(cellIds);
    if (lineIds.length) await grist.getTable(TABLES.lignesTableaux).destroy(lineIds);
    if (colIds.length) await grist.getTable(TABLES.colonnesTableaux).destroy(colIds);
    await grist.getTable(TABLES.tableaux).destroy([Number(existingTable.id)]);
  }

  async function syncTableForArticle(article, existingArticle) {
    const desired = article.tables || [];
    const existing = existingArticle?._tables || [];
    const keep = new Set(desired.filter(t => t.id).map(t => Number(t.id)));
    for (const old of existing) {
      if (!keep.has(Number(old.id))) await destroyTableTree(old);
    }

    const tableApi = grist.getTable(TABLES.tableaux);
    for (let ti = 0; ti < desired.length; ti++) {
      const t = desired[ti];
      const tableFields = {
        Article: Number(article.id),
        Position_dans_article: ti + 1,
        Titre_tableau: t.title || '',
        Afficher_titre: !!t.showTitle,
        Afficher_entete: t.showHeader !== false,
        Style_tableau: t.style || 'Institutionnel standard',
        Largeur_tableau: t.width || 'Pleine largeur',
        Note_sous_tableau: t.note || '',
        Inclure_dossier_preparatoire: true,
        Inclure_acte_definitif: true,
        Repeter_entete_sur_pages: t.repeatHeader !== false
      };
      if (t.id) await tableApi.update({id:Number(t.id), fields:tableFields});
      else {
        const created = await tableApi.create({fields:tableFields});
        t.id = created?.id;
      }

      const oldTable = existing.find(x => Number(x.id) === Number(t.id)) || {_columns:[], _lines:[]};
      await syncChildren(TABLES.colonnesTableaux, oldTable._columns || [], t.columns || [], (c,ci)=>({
        Tableau:Number(t.id), Ordre_colonne:ci+1, Intitule_colonne:c.title || '',
        Format_valeur:c.format || 'Texte', Alignement:c.align || 'Automatique',
        Largeur_relative:Number(c.width)||null, Nombre_decimales:Number(c.decimals)||0
      }));

      await syncChildren(TABLES.lignesTableaux, oldTable._lines || [], t.rows || [], (r,ri)=>({
        Tableau:Number(t.id), Ordre_ligne:ri+1, Type_ligne:r.type || 'Données',
        Ne_pas_scinder:r.noSplit !== false, Commentaire_interne:r.comment || ''
      }));

      // Les identifiants colonnes et lignes sont désormais connus : synchronisation des cellules.
      const freshCols = t.columns || [];
      const oldCells = (oldTable._lines || []).flatMap(l => l._cells || []).filter(Boolean);
      const desiredCells = [];
      for (let ri=0; ri<(t.rows||[]).length; ri++) {
        const row = t.rows[ri];
        for (let ci=0; ci<freshCols.length; ci++) {
          const cell = row.cells?.[ci] || {};
          desiredCells.push({...cell, rowId:row.id, colId:freshCols[ci].id});
        }
      }
      await syncChildren(TABLES.cellulesTableaux, oldCells, desiredCells, (c)=>({
        Ligne:Number(c.rowId), Colonne:Number(c.colId),
        Valeur_texte:c.text || '',
        Valeur_nombre:(c.number === '' || c.number === null || typeof c.number === 'undefined') ? null : Number(c.number),
        Valeur_date:c.date || null
      }));

      // Réinjecte les ids de cellules dans la structure locale dans l'ordre ligne/colonne.
      let cursor = 0;
      for (const row of t.rows || []) {
        row.cells = row.cells || [];
        for (let ci=0; ci<freshCols.length; ci++) {
          row.cells[ci] = desiredCells[cursor++];
        }
      }
    }
  }

  async function saveDeliberation(payload) {
    if (!connected || !currentId) throw new Error('Aucune délibération Grist sélectionnée.');
    const dTable = grist.getTable(TABLES.deliberations);
    await dTable.update({ id: Number(currentId), fields: {
      Seance: payload.general.seance || null,
      Objet: payload.general.objet || '',
      Rapporteur: payload.general.rapporteur || null,
      Unite_redactrice: payload.general.unite || null,
      Domaine: payload.general.domaine || '',
      Statut_deliberation: payload.general.statut || ''
    }});

    const existing = await loadDeliberation(currentId);

    await syncChildren(TABLES.expose, existing.expose, payload.expose, (x,i)=>({
      Deliberation: Number(currentId), Ordre_paragraphe: i+1, Texte_paragraphe: x.text || '',
      Format_paragraphe: x.format || 'Texte courant', Inclure_dossier_preparatoire: true, Inclure_acte_definitif: true
    }));
    await syncChildren(TABLES.visas, existing.visas, payload.visas, (x,i)=>({
      Deliberation: Number(currentId), Ordre_visa: i+1, Categorie_visa: x.category || 'Autre', Texte_visa: x.text || '',
      Inclure_dossier_preparatoire: true, Inclure_acte_definitif: true
    }));
    await syncChildren(TABLES.considerants, existing.considerants, payload.considerants, (x,i)=>({
      Deliberation: Number(currentId), Ordre_considerant: i+1, Categorie_considerant: x.category || 'Autre', Texte_considerant: x.text || '',
      Inclure_dossier_preparatoire: true, Inclure_acte_definitif: true
    }));
    await syncChildren(TABLES.articles, existing.articles, payload.articles, (x,i)=>({
      Deliberation: Number(currentId), Numero_article: i+1, Categorie_article: x.category || 'Autre',
      Titre_article: x.title || '', Texte_article: x.text || '', Inclure_dossier_preparatoire: true, Inclure_acte_definitif: true
    }));

    // Les articles nouvellement créés ont désormais un id. On peut enregistrer leurs tableaux.
    for (const article of payload.articles) {
      const oldArticle = existing.articles.find(a => Number(a.id) === Number(article.id));
      await syncTableForArticle(article, oldArticle);
    }

    return await loadDeliberation(currentId);
  }

  function notifyStatus(type, message) {
    window.dispatchEvent(new CustomEvent('grist-status', {detail:{type,message}}));
  }

  async function init() {
    if (!window.grist) {
      notifyStatus('demo', 'Mode démonstration — ouvrez le widget dans Grist pour travailler sur les données réelles.');
      return { connected:false, reason:'grist-api-unavailable' };
    }

    try {
      grist.ready({ requiredAccess: 'full' });
      connected = true;
      notifyStatus('loading', 'Connexion à Grist…');

      grist.onRecord(async function(record) {
        if (!record || !record.id) {
          currentId = null;
          notifyStatus('warning', 'Sélectionnez une délibération dans Grist.');
          return;
        }
        try {
          currentId = Number(record.id);
          const data = await loadDeliberation(currentId);
          if (window.DeliberationEditor && data) {
            window.DeliberationEditor.load(data);
            notifyStatus('connected', `Délibération #${currentId} chargée depuis Grist.`);
          }
        } catch (err) {
          console.error(err);
          notifyStatus('error', `Erreur de lecture Grist : ${err.message}`);
        }
      });
      return { connected:true };
    } catch (err) {
      console.error(err);
      connected = false;
      notifyStatus('error', `Connexion Grist impossible : ${err.message}`);
      return { connected:false, reason:err.message };
    }
  }

  window.GristBridge = {
    TABLES,
    init,
    loadDeliberation: () => currentId ? loadDeliberation(currentId) : null,
    saveDeliberation,
    isConnected: () => connected,
    getCurrentId: () => currentId
  };
})();
