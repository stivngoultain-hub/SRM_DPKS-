document.addEventListener('DOMContentLoaded', () => {
    const PIN_KEY = 'app_secure_pin';
    if (!localStorage.getItem(PIN_KEY)) {
        localStorage.setItem(PIN_KEY, '1111');
    }
    
    setTimeout(() => { 
        document.getElementById('splash-screen').classList.add('hidden-splash'); 
    }, 2000);

    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('login-screen').style.display = 'none';
    }

    document.getElementById('btn-login').addEventListener('click', () => {
        const enteredPin = document.getElementById('login-pin').value;
        const savedPin = localStorage.getItem(PIN_KEY);
        if (enteredPin === savedPin) {
            sessionStorage.setItem('isLoggedIn', 'true');
            document.getElementById('login-screen').style.opacity = '0';
            setTimeout(() => { document.getElementById('login-screen').style.display = 'none'; }, 300);
        } else {
            document.getElementById('login-error').style.display = 'block';
            document.getElementById('login-pin').value = '';
        }
    });

    document.getElementById('btnChangePin').addEventListener('click', () => {
        const oldPin = document.getElementById('old_pin').value;
        const newPin = document.getElementById('new_pin').value;
        const savedPin = localStorage.getItem(PIN_KEY);
        const msgEl = document.getElementById('pin-msg');

        if (oldPin !== savedPin) {
            msgEl.textContent = 'Ancien code PIN incorrect !';
            msgEl.className = 'text-center mt-10 text-red';
            return;
        }
        if (newPin.length < 4) {
            msgEl.textContent = 'Le nouveau code doit contenir au moins 4 caractères.';
            msgEl.className = 'text-center mt-10 text-red';
            return;
        }

        localStorage.setItem(PIN_KEY, newPin);
        msgEl.textContent = 'Code PIN mis à jour avec succès !';
        msgEl.className = 'text-center mt-10 text-green';
        document.getElementById('old_pin').value = '';
        document.getElementById('new_pin').value = '';
    });

    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            navItems.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            if(btn.dataset.target === 'tab-pv') loadPVData();
        });
    });

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('date_exp').value = todayStr;
    document.getElementById('pv_date').value = todayStr;

    async function fetchAutoWeather() {
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=32.0494&longitude=-7.4083&current_weather=true`);
            const data = await response.json();
            if(data && data.current_weather) {
                document.getElementById('t_amb').value = data.current_weather.temperature;
                let wc = data.current_weather.weathercode;
                let meteoSelect = document.getElementById('meteo');
                if (wc >= 50 && wc <= 67) meteoSelect.value = "Pluvieux";
                else if (wc >= 1 && wc <= 3) meteoSelect.value = "Nuageux";
                else meteoSelect.value = "Ensoleillé";
            }
        } catch (e) {}
    }
    fetchAutoWeather();

    document.querySelectorAll('.exploit-input').forEach(input => {
        input.addEventListener('input', () => {
            let diffIn = parseFloat(document.getElementById('diff_in').value) || 0;
            let diffNrj = parseFloat(document.getElementById('diff_nrj').value) || 0;
            if (diffIn > 0) document.getElementById('ratio_1j').value = (diffNrj / diffIn).toFixed(3);
            else document.getElementById('ratio_1j').value = '';
        });
    });

    document.querySelectorAll('.cctp-check').forEach(input => {
        input.addEventListener('input', function() {
            let max = parseFloat(this.getAttribute('data-max'));
            if(parseFloat(this.value) > max) this.classList.add('exceed-cctp');
            else this.classList.remove('exceed-cctp');
        });
    });

    document.querySelectorAll('.accordion-header').forEach(h => {
        h.addEventListener('click', (e) => {
            if(e.target.classList.contains('btn-print-card')) return; 
            h.nextElementSibling.classList.toggle('active');
            h.classList.toggle('active-header');
        });
    });

    // 1. Interventions Équipements
    let interventionPhotosMap = { "1": { avant: [], apres: [] } };
    let intCounter = 1;

    document.getElementById('btnAddIntervention').addEventListener('click', () => {
        intCounter++;
        interventionPhotosMap[intCounter.toString()] = { avant: [], apres: [] };
        const container = document.getElementById('interventions_container');
        const newBlock = document.createElement('div');
        newBlock.className = 'intervention-block';
        newBlock.setAttribute('data-id', intCounter.toString());
        newBlock.innerHTML = `
            <div class="intervention-header">
                <h5>Intervention Équipement #${intCounter}</h5>
                <button type="button" class="btn-remove-int"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="form-grid">
                <div class="input-group full-width"><label>Équipement</label><input type="text" class="int_equip"></div>
                <div class="input-group"><label>Puissance (kW)</label><input type="text" class="int_puiss"></div>
                <div class="input-group"><label>Rôle</label><input type="text" class="int_role"></div>
                <div class="input-group"><label>Date d'intervention</label><input type="date" class="int_date"></div>
                <div class="input-group"><label>Durée (Heures)</label><input type="number" class="int_duree" step="0.5"></div>
                
                <div class="input-group">
                    <label>Étape de traitement</label>
                    <select class="int_etape">
                        <option value="Prétraitement">Prétraitement</option>
                        <option value="Traitement primaire">Traitement primaire</option>
                        <option value="Traitement secondaire">Traitement secondaire</option>
                        <option value="Traitement tertiaire">Traitement tertiaire</option>
                    </select>
                </div>

                <div class="input-group">
                    <label>Type de panne</label>
                    <select class="int_panne_type">
                        <option value="Panne électrique">Panne électrique</option>
                        <option value="Panne mécanique">Panne mécanique</option>
                        <option value="Panne hydraulique">Panne hydraulique</option>
                    </select>
                </div>

                <div class="input-group full-width"><label>Matériel utilisé</label><textarea class="int_materiel" rows="2"></textarea></div>
                <div class="input-group full-width"><label>PDR utilisés</label><textarea class="int_pdr" rows="2"></textarea></div>
                
                <div class="input-group">
                    <label class="text-orange"><i class="fa-solid fa-camera"></i> Photos AVANT</label>
                    <input type="file" accept="image/*" multiple class="file-upload-input int_photos_avant">
                    <div class="photos-preview-avant mt-10"></div>
                </div>
                <div class="input-group">
                    <label class="text-green"><i class="fa-solid fa-camera"></i> Photos APRÈS</label>
                    <input type="file" accept="image/*" multiple class="file-upload-input int_photos_apres">
                    <div class="photos-preview-apres mt-10"></div>
                </div>
            </div>
        `;
        container.appendChild(newBlock);
        newBlock.querySelector('.btn-remove-int').addEventListener('click', function() {
            delete interventionPhotosMap[intCounter.toString()];
            newBlock.remove();
        });
    });

    document.getElementById('interventions_container').addEventListener('change', function(e) {
        if(e.target.classList.contains('int_photos_avant') || e.target.classList.contains('int_photos_apres')) {
            const block = e.target.closest('.intervention-block');
            const blockId = block.getAttribute('data-id');
            const isAvant = e.target.classList.contains('int_photos_avant');
            const previewContainer = block.querySelector(isAvant ? '.photos-preview-avant' : '.photos-preview-apres');
            
            previewContainer.innerHTML = '';
            if(isAvant) interventionPhotosMap[blockId].avant = [];
            else interventionPhotosMap[blockId].apres = [];
            
            Array.from(e.target.files).forEach(file => {
                if(file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const b64 = event.target.result;
                        if(isAvant) interventionPhotosMap[blockId].avant.push(b64);
                        else interventionPhotosMap[blockId].apres.push(b64);
                        const img = document.createElement('img');
                        img.src = b64;
                        previewContainer.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });

    // 2. Interventions sur Ouvrage (جديد)
    let ouvragePhotosMap = { "1": [] };
    let ouvCounter = 1;

    document.getElementById('btnAddOuvrage').addEventListener('click', () => {
        ouvCounter++;
        ouvragePhotosMap[ouvCounter.toString()] = [];
        const container = document.getElementById('ouvrages_container');
        const newBlock = document.createElement('div');
        newBlock.className = 'ouvrage-block';
        newBlock.setAttribute('data-id', ouvCounter.toString());
        newBlock.innerHTML = `
            <div class="intervention-header">
                <h5>Intervention Ouvrage #${ouvCounter}</h5>
                <button type="button" class="btn-remove-ouv"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="form-grid">
                <div class="input-group">
                    <label>Quel Ouvrage</label>
                    <select class="ouv_quel">
                        <option value="Station de relevage">Station de relevage</option>
                        <option value="Parshall d'entrée">Parshall d'entrée</option>
                        <option value="Répartiteur">Répartiteur</option>
                        <option value="Dessableur-déshuileur 1">Dessableur-déshuileur 1</option>
                        <option value="Dessableur-déshuileur 2">Dessableur-déshuileur 2</option>
                        <option value="Equi-repartiteur">Equi-repartiteur</option>
                        <option value="Les bassins anaérobies">Les bassins anaérobies</option>
                        <option value="Les lits bactériens">Les lits bactériens</option>
                        <option value="Les clarificateurs">Les clarificateurs</option>
                        <option value="Tirtaite">Tirtaite</option>
                        <option value="SP eau de service">SP eau de service</option>
                    </select>
                </div>
                <div class="input-group"><label>Rôle de l'ouvrage</label><input type="text" class="ouv_role"></div>
                <div class="input-group">
                    <label>Type d'intervention</label>
                    <select class="ouv_type">
                        <option value="Réhabilitation">Réhabilitation</option>
                        <option value="Réparation">Réparation</option>
                        <option value="Nettoyage par jet d'eau">Nettoyage par jet d'eau</option>
                        <option value="Installation d'un équipement">Installation d'un équipement</option>
                        <option value="Modification">Modification</option>
                    </select>
                </div>
                <div class="input-group"><label>Date d'intervention</label><input type="date" class="ouv_date"></div>
                <div class="input-group"><label>Référence de marché</label><input type="text" class="ouv_ref"></div>
                <div class="input-group"><label>Nom de l'entreprise</label><input type="text" class="ouv_entreprise"></div>
                <div class="input-group full-width"><label>Remarques</label><textarea class="ouv_remarques" rows="2"></textarea></div>
                <div class="input-group full-width">
                    <label class="text-cyan"><i class="fa-solid fa-camera"></i> Photos de l'ouvrage</label>
                    <input type="file" accept="image/*" multiple class="file-upload-input ouv_photos">
                    <div class="photos-preview-ouv mt-10" style="display:flex; gap:10px; flex-wrap:wrap;"></div>
                </div>
            </div>
        `;
        container.appendChild(newBlock);
        newBlock.querySelector('.btn-remove-ouv').addEventListener('click', function() {
            delete ouvragePhotosMap[ouvCounter.toString()];
            newBlock.remove();
        });
    });

    document.getElementById('ouvrages_container').addEventListener('change', function(e) {
        if(e.target.classList.contains('ouv_photos')) {
            const block = e.target.closest('.ouvrage-block');
            const blockId = block.getAttribute('data-id');
            const previewContainer = block.querySelector('.photos-preview-ouv');
            
            previewContainer.innerHTML = '';
            ouvragePhotosMap[blockId] = [];
            
            Array.from(e.target.files).forEach(file => {
                if(file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const b64 = event.target.result;
                        ouvragePhotosMap[blockId].push(b64);
                        const img = document.createElement('img');
                        img.src = b64;
                        previewContainer.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });

    // 3. حفظ تفاصيل PV Evacuation
    document.getElementById('btnSavePVDetails').addEventListener('click', () => {
        const pvData = {
            date: document.getElementById('pv_date').value,
            societe: document.getElementById('pv_societe').value,
            chauffeur: document.getElementById('pv_chauffeur').value,
            matricule: document.getElementById('pv_matricule').value,
            agrement: document.getElementById('pv_agrement').value,
            ville: document.getElementById('pv_ville').value,
            dg: document.getElementById('pv_dg_edit').value,
            df: document.getElementById('pv_df_edit').value,
            sable: document.getElementById('pv_sable_edit').value,
            graisse: document.getElementById('pv_graisse_edit').value
        };
        localStorage.setItem('PV_Transport_Details', JSON.stringify(pvData));
        alert("✔ PV d'évacuation enregistré avec succès !");
    });

    function loadPVData() {
        let savedPvData = localStorage.getItem('PV_Transport_Details');
        if(savedPvData) {
            let pvd = JSON.parse(savedPvData);
            document.getElementById('pv_date').value = pvd.date || todayStr;
            document.getElementById('pv_societe').value = pvd.societe || '';
            document.getElementById('pv_chauffeur').value = pvd.chauffeur || '';
            document.getElementById('pv_matricule').value = pvd.matricule || '';
            document.getElementById('pv_agrement').value = pvd.agrement || '';
            document.getElementById('pv_ville').value = pvd.ville || '';
            document.getElementById('pv_dg_edit').value = pvd.dg || '0';
            document.getElementById('pv_df_edit').value = pvd.df || '0';
            document.getElementById('pv_sable_edit').value = pvd.sable || '0';
            document.getElementById('pv_graisse_edit').value = pvd.graisse || '0';
        } else {
            // حساب تلقائي افتراضي من النفايات المدخلة
            let tdg=0, tdf=0, ts=0, tg=0;
            const month = document.getElementById('date_exp').value.substring(0, 7);
            for(let i=0; i<localStorage.length; i++) {
                let k = localStorage.key(i);
                if(k.startsWith(`STEP_${month}`)) {
                    let d = JSON.parse(localStorage.getItem(k));
                    tdg += Number(d.gestion?.dg)||0; 
                    tdf += Number(d.gestion?.df)||0; 
                    ts += Number(d.gestion?.sables)||0; 
                    tg += Number(d.gestion?.graisses)||0;
                }
            }
            document.getElementById('pv_dg_edit').value = tdg.toFixed(1);
            document.getElementById('pv_df_edit').value = tdf.toFixed(1);
            document.getElementById('pv_sable_edit').value = ts.toFixed(1);
            document.getElementById('pv_graisse_edit').value = tg.toFixed(1);
        }
    }

    // 4. بناء الـ PDF الشامل
    function buildPdfContent(cardsToInclude) {
        let logoImgSrc = document.getElementById('main-logo') ? document.getElementById('main-logo').src : 'logo.png';
        
        let contentHTML = `
            <div style="border-bottom: 2px solid #e8eaed; padding-bottom: 12px; margin-bottom: 25px; display:flex; justify-content:space-between; align-items:flex-end;">
                <div>
                    <h1 style="margin: 0; font-size: 26px; color: #202124; font-weight: 800;">Rapport d'Exploitation</h1>
                    <p style="margin: 5px 0 0; font-size: 13px; color: #5f6368; font-weight: 500;">STEP El Kelaa des Sraghna &bull; <b>${document.getElementById('date_exp').value}</b></p>
                </div>
                <div><img src="${logoImgSrc}" style="max-height: 50px; mix-blend-mode: multiply;" crossorigin="anonymous"></div>
            </div>
        `;

        const allCards = document.querySelectorAll('.accordion-item');
        let isFirstIncluded = true;

        allCards.forEach((card, index) => {
            let cardNum = index + 1;
            if(!cardsToInclude.includes(cardNum)) return;

            let pageBreakStyle = (!isFirstIncluded && cardsToInclude.length > 1) ? 'page-break-before: always; padding-top: 20px;' : '';
            isFirstIncluded = false;

            let cardTitle = card.querySelector('.header-title span').innerText;
            contentHTML += `<div style="${pageBreakStyle} margin-bottom: 30px;"><h2 style="font-size: 15px; color: #1a73e8; border-bottom: 1px solid #e8eaed; padding-bottom: 6px; margin-bottom: 15px; text-transform: uppercase;">${cardTitle}</h2>`;

            if (cardNum === 3) { // Interventions Équipements
                const blocks = card.querySelectorAll('.intervention-block');
                if(blocks.length === 0) contentHTML += `<p style="font-size:13px; color:#80868b; font-style: italic;">Aucune intervention.</p>`;
                blocks.forEach(block => {
                    let id = block.getAttribute('data-id');
                    let equip = block.querySelector('.int_equip').value || '-';
                    let puiss = block.querySelector('.int_puiss').value || '-';
                    let role = block.querySelector('.int_role').value || '-';
                    let date = block.querySelector('.int_date').value || '-';
                    let duree = block.querySelector('.int_duree').value || '-';
                    let etape = block.querySelector('.int_etape').value || '-';
                    let panneType = block.querySelector('.int_panne_type').value || '-';
                    let mat = block.querySelector('.int_materiel').value || '-';
                    let pdr = block.querySelector('.int_pdr').value || '-';

                    contentHTML += `
                        <div style="background:#f8f9fa; border:1px solid #dadce0; border-radius:8px; padding:15px; margin-bottom:15px; page-break-inside: avoid;">
                            <h4 style="margin:0 0 10px 0; color:#202124; font-size:15px;">Équipement : <span style="color:#1a73e8;">${equip}</span></h4>
                            <table style="width:100%; font-size:13px; border-collapse: collapse; margin-bottom:10px; color:#3c4043;">
                                <tr><td style="padding:6px 0; width:50%;"><b>Puissance :</b> ${puiss}</td><td><b>Rôle :</b> ${role}</td></tr>
                                <tr><td style="padding:6px 0;"><b>Date :</b> ${date}</td><td><b>Durée :</b> ${duree} H</td></tr>
                                <tr><td style="padding:6px 0;"><b>Étape :</b> ${etape}</td><td><b>Type de panne :</b> ${panneType}</td></tr>
                                <tr><td colspan="2" style="padding:6px 0; border-top:1px dashed #dadce0;"><b>Matériel :</b> ${mat}</td></tr>
                                <tr><td colspan="2" style="padding:6px 0;"><b>PDR :</b> ${pdr}</td></tr>
                            </table>
                    `;
                    let photos = interventionPhotosMap[id];
                    if((photos.avant && photos.avant.length > 0) || (photos.apres && photos.apres.length > 0)) {
                        contentHTML += `<div style="display:flex; justify-content:space-between; gap:15px; border-top:1px solid #e8eaed; padding-top:10px;">`;
                        contentHTML += `<div style="width:48%;"><h5 style="color:#d93025; font-size:11px; margin-bottom:5px;">AVANT</h5><div style="display:flex; gap:5px; flex-wrap:wrap;">`;
                        (photos.avant || []).forEach(p => { contentHTML += `<img src="${p}" style="width:90px; height:60px; object-fit:cover; border-radius:4px;">`; });
                        contentHTML += `</div></div>`;
                        contentHTML += `<div style="width:48%;"><h5 style="color:#188038; font-size:11px; margin-bottom:5px;">APRÈS</h5><div style="display:flex; gap:5px; flex-wrap:wrap;">`;
                        (photos.apres || []).forEach(p => { contentHTML += `<img src="${p}" style="width:90px; height:60px; object-fit:cover; border-radius:4px;">`; });
                        contentHTML += `</div></div></div>`;
                    }
                    contentHTML += `</div>`;
                });
            }
            else if (cardNum === 4) { // Interventions sur Ouvrage (جديد)
                const ouvBlocks = card.querySelectorAll('.ouvrage-block');
                if(ouvBlocks.length === 0) contentHTML += `<p style="font-size:13px; color:#80868b; font-style: italic;">Aucune intervention sur ouvrage.</p>`;
                ouvBlocks.forEach(block => {
                    let id = block.getAttribute('data-id');
                    let quel = block.querySelector('.ouv_quel').value || '-';
                    let role = block.querySelector('.ouv_role').value || '-';
                    let typeInt = block.querySelector('.ouv_type').value || '-';
                    let date = block.querySelector('.ouv_date').value || '-';
                    let ref = block.querySelector('.ouv_ref').value || '-';
                    let ent = block.querySelector('.ouv_entreprise').value || '-';
                    let rem = block.querySelector('.ouv_remarques').value || '-';

                    contentHTML += `
                        <div style="background:#f8f9fa; border:1px solid #dadce0; border-radius:8px; padding:15px; margin-bottom:15px; page-break-inside: avoid;">
                            <h4 style="margin:0 0 10px 0; color:#1a73e8; font-size:15px;">Ouvrage : ${quel}</h4>
                            <table style="width:100%; font-size:13px; border-collapse: collapse; margin-bottom:10px; color:#3c4043;">
                                <tr><td style="padding:6px 0; width:50%;"><b>Rôle :</b> ${role}</td><td><b>Type d'intervention :</b> ${typeInt}</td></tr>
                                <tr><td style="padding:6px 0;"><b>Date :</b> ${date}</td><td><b>Réf. Marché :</b> ${ref}</td></tr>
                                <tr><td colspan="2" style="padding:6px 0;"><b>Entreprise :</b> ${ent}</td></tr>
                                <tr><td colspan="2" style="padding:6px 0; border-top:1px dashed #dadce0;"><b>Remarques :</b> ${rem}</td></tr>
                            </table>
                    `;
                    let oPhotos = ouvragePhotosMap[id];
                    if(oPhotos && oPhotos.length > 0) {
                        contentHTML += `<div style="border-top:1px solid #e8eaed; padding-top:10px;"><h5 style="color:#1a73e8; font-size:11px; margin-bottom:5px;">PHOTOS OUVRAGE</h5><div style="display:flex; gap:8px; flex-wrap:wrap;">`;
                        oPhotos.forEach(p => { contentHTML += `<img src="${p}" style="width:100px; height:70px; object-fit:cover; border-radius:4px;">`; });
                        contentHTML += `</div></div>`;
                    }
                    contentHTML += `</div>`;
                });
            }
            else if (cardNum === 12) { // Observations
                let obs = document.getElementById('obs_text').value || 'Aucune observation.';
                contentHTML += `<div style="font-size:13px; color:#3c4043; line-height:1.6; background:#f8f9fa; border-left: 3px solid #fbbc04; padding:12px; border-radius:4px;">${obs.replace(/\n/g, '<br>')}</div>`;
            }
            else {
                contentHTML += `<table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #3c4043;"><tbody>`;
                const inputs = card.querySelectorAll('input, select');
                let count = 0;
                inputs.forEach(input => {
                    let label = input.previousElementSibling ? input.previousElementSibling.innerText : '';
                    if(!label) return;
                    let val = input.value || '-';
                    
                    let valStyle = "font-weight: 600;";
                    if (cardNum === 1) {
                        if (val === "Marche") valStyle += " color: #2d8a35; background-color: #dff0e1; padding: 2px 6px; border-radius: 4px; display: inline-block;";
                        else if (val === "Arrêt") valStyle += " color: #d94f1c; background-color: #fce6dc; padding: 2px 6px; border-radius: 4px; display: inline-block;";
                        else if (val === "Panne") valStyle += " color: #ea5348; background-color: #f8e1e1; padding: 2px 6px; border-radius: 4px; display: inline-block;";
                    }

                    if (count % 2 === 0) contentHTML += `<tr style="page-break-inside: avoid;">`;
                    contentHTML += `
                        <td style="padding: 8px 6px; border-bottom: 1px solid #f1f3f4; width: 25%; font-weight: 500; color:#5f6368; background: ${count%4 < 2 ? '#ffffff' : '#fafafa'};">${label}</td>
                        <td style="padding: 8px 6px; border-bottom: 1px solid #f1f3f4; width: 25%; background: ${count%4 < 2 ? '#ffffff' : '#fafafa'};"><span style="${valStyle}">${val}</span></td>
                    `;
                    if (count % 2 === 1) contentHTML += `</tr>`;
                    count++;
                });
                if (count % 2 !== 0) contentHTML += `<td colspan="2" style="border-bottom: 1px solid #f1f3f4; background: ${count%4 < 2 ? '#ffffff' : '#fafafa'};"></td></tr>`;
                contentHTML += `</tbody></table>`;
            }
            contentHTML += `</div>`;
        });

        contentHTML += `<div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #e8eaed; text-align: center; font-size: 10px; color: #9aa0a6;">SRM DPKS - Système de Gestion d'Exploitation STEP</div>`;
        document.getElementById('pdf-dynamic-content').innerHTML = contentHTML;
    }

    function generatePDF(filename) {
        const container = document.getElementById('pdf-master-container');
        const element = document.getElementById('pdf-dynamic-content');
        container.style.visibility = 'visible';
        const currentScroll = window.scrollY;
        window.scrollTo(0, 0); 
        
        html2pdf().set({
            margin: [0.5, 0.4, 0.5, 0.4], 
            filename: filename,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 850 },
            jsPDF: { unit: 'in', format: 'A4', orientation: 'portrait' }
        }).from(element).save().then(() => {
            container.style.visibility = 'hidden';
            window.scrollTo(0, currentScroll);
        });
    }

    document.getElementById('btnGenerateAllPDF').addEventListener('click', () => {
        buildPdfContent([1,2,3,4,5,6,7,8,9,10,11,12]);
        let d = document.getElementById('date_exp').value;
        generatePDF(`Rapport_Complet_STEP_${d}.pdf`);
    });

    document.querySelectorAll('.btn-print-card').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            let cardId = parseInt(this.getAttribute('data-card'));
            buildPdfContent([cardId]);
            let d = document.getElementById('date_exp').value;
            generatePDF(`Rapport_Section_${cardId}_STEP_${d}.pdf`);
        });
    });

    // 5. حفظ السجل اليومي
    document.getElementById('stepForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const dateKey = document.getElementById('date_exp').value;

        let savedInterventions = [];
        document.querySelectorAll('.intervention-block').forEach(block => {
            savedInterventions.push({
                equip: block.querySelector('.int_equip').value,
                puiss: block.querySelector('.int_puiss').value,
                role: block.querySelector('.int_role').value,
                date: block.querySelector('.int_date').value,
                duree: block.querySelector('.int_duree').value,
                etape: block.querySelector('.int_etape').value,
                panneType: block.querySelector('.int_panne_type').value,
                mat: block.querySelector('.int_materiel').value,
                pdr: block.querySelector('.int_pdr').value
            });
        });

        let savedOuvrages = [];
        document.querySelectorAll('.ouvrage-block').forEach(block => {
            savedOuvrages.push({
                quel: block.querySelector('.ouv_quel').value,
                role: block.querySelector('.ouv_role').value,
                type: block.querySelector('.ouv_type').value,
                date: block.querySelector('.ouv_date').value,
                ref: block.querySelector('.ouv_ref').value,
                entreprise: block.querySelector('.ouv_entreprise').value,
                remarques: block.querySelector('.ouv_remarques').value
            });
        });

        const dataToSave = {
            date: dateKey, meteo: document.getElementById('meteo').value, t_amb: document.getElementById('t_amb').value, pluvio: document.getElementById('pluvio').value,
            interventions: savedInterventions,
            ouvrages: savedOuvrages,
            exploitation: { 
                idx_in: document.getElementById('idx_in').value, diff_in: document.getElementById('diff_in').value,
                idx_out: document.getElementById('idx_out').value, diff_out: document.getElementById('diff_out').value,
                idx_nrj: document.getElementById('idx_nrj').value, diff_nrj: document.getElementById('diff_nrj').value,
                ratio_1j: document.getElementById('ratio_1j').value
            },
            entree: { dco: document.getElementById('e_dco').value, dbo5: document.getElementById('e_dbo5').value, mes: document.getElementById('e_mes').value },
            parshall: { dco: document.getElementById('p_dco').value, dbo5: document.getElementById('p_dbo5').value, mes: document.getElementById('p_mes').value },
            boues: { siccite: document.getElementById('b_siccite').value },
            gestion: { dg: document.getElementById('v_dg').value, df: document.getElementById('v_df').value, sables: document.getElementById('v_sables').value, graisses: document.getElementById('v_graisses').value },
            obs: document.getElementById('obs_text').value
        };

        localStorage.setItem(`STEP_${dateKey}`, JSON.stringify(dataToSave));
        alert(`✔ Fiche du ${dateKey} enregistrée avec succès !`);
    });

    // 6. تصدير إكسيل
    document.getElementById('btnExportExcel').addEventListener('click', () => {
        const month = document.getElementById('exportMonth').value;
        if(!month) return alert("Veuillez sélectionner un mois.");
        
        let wb = XLSX.utils.book_new();
        let recapData = [
            ["DATE", "Météo", "T(°C)", "Diff Vol In", "Diff Vol Out", "Diff Nrj", "Ratio 1j", "DCO In", "DBO5 In", "MES In", "DCO Out", "DBO5 Out", "MES Out", "Siccité (%)", "Nbr Interv.", "Nbr Ouvrages", "OBSERVATIONS"]
        ];

        for(let d=1; d<=31; d++) {
            let key = `STEP_${month}-${d.toString().padStart(2, '0')}`;
            let item = localStorage.getItem(key);
            if(item) {
                let data = JSON.parse(item);
                let numInterv = data.interventions ? data.interventions.length : 0;
                let numOuv = data.ouvrages ? data.ouvrages.length : 0;
                recapData.push([
                    data.date, data.meteo, data.t_amb, 
                    data.exploitation?.diff_in, data.exploitation?.diff_out, data.exploitation?.diff_nrj, data.exploitation?.ratio_1j,
                    data.entree?.dco, data.entree?.dbo5, data.entree?.mes, data.parshall?.dco, data.parshall?.dbo5, data.parshall?.mes,
                    data.boues?.siccite,
                    numInterv, numOuv, data.obs
                ]);
            }
        }
        if(recapData.length === 1) return alert("Aucune donnée enregistrée pour ce mois.");
        let ws = XLSX.utils.aoa_to_sheet(recapData);
        XLSX.utils.book_append_sheet(wb, ws, "Rapport Mensuel");
        XLSX.writeFile(wb, `Rapport_STEP_${month}.xlsx`);
    });
});
