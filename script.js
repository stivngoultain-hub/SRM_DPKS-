document.addEventListener('DOMContentLoaded', () => {
    const PIN_KEY = 'app_secure_pin';
    if (!localStorage.getItem(PIN_KEY)) {
        localStorage.setItem(PIN_KEY, '1111');
    }
    
    setTimeout(() => { 
        const splash = document.getElementById('splash-screen');
        if(splash) splash.classList.add('hidden-splash'); 
    }, 2000);

    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const loginScreen = document.getElementById('login-screen');
        if(loginScreen) loginScreen.style.display = 'none';
    }

    const btnLogin = document.getElementById('btn-login');
    if(btnLogin) {
        btnLogin.addEventListener('click', () => {
            const enteredPin = document.getElementById('login-pin').value;
            const savedPin = localStorage.getItem(PIN_KEY);
            if (enteredPin === savedPin) {
                sessionStorage.setItem('isLoggedIn', 'true');
                const loginScreen = document.getElementById('login-screen');
                loginScreen.style.opacity = '0';
                setTimeout(() => { loginScreen.style.display = 'none'; }, 300);
            } else {
                document.getElementById('login-error').style.display = 'block';
                document.getElementById('login-pin').value = '';
            }
        });
    }

    const btnChangePin = document.getElementById('btnChangePin');
    if(btnChangePin) {
        btnChangePin.addEventListener('click', () => {
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
    }

    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            navItems.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.target);
            if(target) target.classList.add('active');
        });
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const dateExp = document.getElementById('date_exp');
    const pvDate = document.getElementById('pv_date');
    if(dateExp) dateExp.value = todayStr;
    if(pvDate) pvDate.value = todayStr;

    // تبديل نماذج Signalement d'anomalie حسب الاختيار
    const anomTypeSelect = document.getElementById('anom_type');
    const anomSections = {
        'Equipements': document.getElementById('anom_sec_equip'),
        'Ouvrage': document.getElementById('anom_sec_ouvrage'),
        'Engin': document.getElementById('anom_sec_engin'),
        'Autres': document.getElementById('anom_sec_autres')
    };

    if(anomTypeSelect) {
        anomTypeSelect.addEventListener('change', () => {
            let val = anomTypeSelect.value;
            Object.keys(anomSections).forEach(k => {
                if(anomSections[k]) anomSections[k].style.display = (k === val) ? 'block' : 'none';
            });
        });
    }

    // تخزين صور الإبلاغ عن العيوب
    let anomPhotos = { equip: [], ouvrage: [], engin: [], autres: [] };
    function handleAnomImages(inputEl, previewEl, key) {
        if(!inputEl) return;
        inputEl.addEventListener('change', function() {
            previewEl.innerHTML = '';
            anomPhotos[key] = [];
            Array.from(this.files).forEach(file => {
                if(file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        let b64 = e.target.result;
                        anomPhotos[key].push(b64);
                        const img = document.createElement('img');
                        img.src = b64;
                        img.className = 'anom-img-preview';
                        previewEl.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            });
        });
    }
    handleAnomImages(document.getElementById('anom_eq_photos'), document.getElementById('anom_eq_preview'), 'equip');
    handleAnomImages(document.getElementById('anom_ouv_photos'), document.getElementById('anom_ouv_preview'), 'ouvrage');
    handleAnomImages(document.getElementById('anom_engin_photos'), document.getElementById('anom_engin_preview'), 'engin');
    handleAnomImages(document.getElementById('anom_autre_photos'), document.getElementById('anom_autre_preview'), 'autres');

    const btnSaveAnomalie = document.getElementById('btnSaveAnomalie');
    if(btnSaveAnomalie) {
        btnSaveAnomalie.addEventListener('click', () => {
            let type = anomTypeSelect ? anomTypeSelect.value : 'Equipements';
            let anomData = { type, date: todayStr };
            if(type === 'Equipements') {
                anomData.nom = document.getElementById('anom_eq_nom').value;
                anomData.etape = document.getElementById('anom_eq_etape').value;
                anomData.role = document.getElementById('anom_eq_role').value;
                anomData.def = document.getElementById('anom_eq_def').value;
                anomData.sol = document.getElementById('anom_eq_sol').value;
                anomData.pdr = document.getElementById('anom_eq_pdr').value;
                anomData.duree = document.getElementById('anom_eq_duree').value;
                anomData.impact = document.getElementById('anom_eq_impact').value;
                anomData.rem = document.getElementById('anom_eq_rem').value;
                anomData.photos = anomPhotos.equip;
            } else if(type === 'Ouvrage') {
                anomData.nom = document.getElementById('anom_ouv_nom').value;
                anomData.rem = document.getElementById('anom_ouv_rem').value;
                anomData.photos = anomPhotos.ouvrage;
            } else if(type === 'Engin') {
                anomData.enginType = document.getElementById('anom_engin_type').value;
                anomData.mat = document.getElementById('anom_engin_mat').value;
                anomData.km = document.getElementById('anom_engin_km').value;
                anomData.prob = document.getElementById('anom_engin_prob').value;
                anomData.sol = document.getElementById('anom_engin_sol').value;
                anomData.impact = document.getElementById('anom_engin_impact').value;
                anomData.rem = document.getElementById('anom_engin_rem').value;
                anomData.photos = anomPhotos.engin;
            } else {
                anomData.rem = document.getElementById('anom_autre_rem').value;
                anomData.photos = anomPhotos.autres;
            }
            localStorage.setItem(`Anomalie_${Date.now()}`, JSON.stringify(anomData));
            alert("✔ Signalement d'anomalie enregistré avec succès !");
        });
    }

    async function fetchAutoWeather() {
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=32.0494&longitude=-7.4083&current_weather=true`);
            const data = await response.json();
            if(data && data.current_weather) {
                const tamb = document.getElementById('t_amb');
                if(tamb) tamb.value = data.current_weather.temperature;
            }
        } catch (e) {}
    }
    fetchAutoWeather();

    document.querySelectorAll('.exploit-input').forEach(input => {
        input.addEventListener('input', () => {
            let diffIn = parseFloat(document.getElementById('diff_in')?.value) || 0;
            let diffNrj = parseFloat(document.getElementById('diff_nrj')?.value) || 0;
            let ratio = document.getElementById('ratio_1j');
            if(ratio) {
                if (diffIn > 0) ratio.value = (diffNrj / diffIn).toFixed(3);
                else ratio.value = '';
            }
        });
    });

    document.querySelectorAll('.accordion-header').forEach(h => {
        h.addEventListener('click', (e) => {
            if(e.target.classList.contains('btn-print-card')) return; 
            h.nextElementSibling.classList.toggle('active');
            h.classList.toggle('active-header');
        });
    });

    // Interventions Équipements
    let interventionPhotosMap = { "1": { avant: [], apres: [] } };
    let intCounter = 1;

    const btnAddIntervention = document.getElementById('btnAddIntervention');
    if(btnAddIntervention) {
        btnAddIntervention.addEventListener('click', () => {
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
                        <label>Types de panne (Sélectionnez un ou deux)</label>
                        <div style="display:flex; flex-direction:column; gap:6px; background:var(--input-bg); padding:8px; border-radius:8px; border:1px solid var(--border-color);">
                            <label style="font-weight:normal; font-size:0.9rem;"><input type="checkbox" class="int_panne_chk" value="Panne électrique"> Panne électrique</label>
                            <label style="font-weight:normal; font-size:0.9rem;"><input type="checkbox" class="int_panne_chk" value="Panne mécanique"> Panne mécanique</label>
                            <label style="font-weight:normal; font-size:0.9rem;"><input type="checkbox" class="int_panne_chk" value="Panne hydraulique"> Panne hydraulique</label>
                        </div>
                    </div>

                    <div class="input-group full-width"><label>Matériel utilisé</label><textarea class="int_materiel" rows="2" placeholder="Chaque matériel sur une ligne..."></textarea></div>
                    <div class="input-group full-width"><label>PDR utilisés</label><textarea class="int_pdr" rows="2" placeholder="Chaque pièce sur une ligne..."></textarea></div>
                    
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
                delete interventionPhotosMap[newBlock.getAttribute('data-id')];
                newBlock.remove();
            });
        });
    }

    const intContainer = document.getElementById('interventions_container');
    if(intContainer) {
        intContainer.addEventListener('change', function(e) {
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
    }

    // Interventions sur Ouvrage
    let ouvragePhotosMap = { "1": [] };
    let ouvCounter = 1;

    const btnAddOuvrage = document.getElementById('btnAddOuvrage');
    if(btnAddOuvrage) {
        btnAddOuvrage.addEventListener('click', () => {
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
                delete ouvragePhotosMap[newBlock.getAttribute('data-id')];
                newBlock.remove();
            });
        });
    }

    const ouvContainer = document.getElementById('ouvrages_container');
    if(ouvContainer) {
        ouvContainer.addEventListener('change', function(e) {
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
    }

    // بناء الـ PDF مع الترويسة المركزية، التاريخ الكامل، شعار logo.png، والصور الأكبر
    function buildPdfContent(cardsToInclude) {
        let logoImgSrc = 'logo.png';
        
        let rawDate = document.getElementById('date_exp').value;
        let formattedDate = rawDate ? new Date(rawDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

        let contentHTML = `
            <div style="text-align: center; border-bottom: 2px solid #1c3d5a; padding-bottom: 15px; margin-bottom: 25px;">
                <img src="${logoImgSrc}" style="max-height: 70px; margin-bottom: 10px; mix-blend-mode: multiply;" crossorigin="anonymous">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; color: #1c3d5a; font-weight: 700; text-transform: uppercase;">Société régionale multiservices Marrakech-Safi</h3>
                <p style="margin: 2px 0; font-size: 12px; color: #4a637c; font-weight: 600;">Direction provinciale El kalâa des sraghna</p>
                <p style="margin: 2px 0; font-size: 12px; color: #4a637c; font-weight: 600;">Département assainissement liquide</p>
                <p style="margin: 2px 0; font-size: 11px; color: #5f6368; font-weight: 500;">Division exploitation des ouvrages d'assainissement liquide</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #1c3d5a; font-weight: 800;">Service : STEP</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #d94f1c; font-weight: bold;">Date : ${formattedDate}</p>
            </div>
            <h1 style="text-align: center; font-size: 18px; color: #1c3d5a; margin-bottom: 20px; text-transform: uppercase;">Rapport d'Exploitation & Suivi</h1>
        `;

        const allCards = document.querySelectorAll('.accordion-item');
        let isFirstIncluded = true;

        allCards.forEach((card, index) => {
            let cardNum = index + 1;
            if(!cardsToInclude.includes(cardNum)) return;

            let pageBreakStyle = (!isFirstIncluded && cardsToInclude.length > 1) ? 'page-break-before: always; padding-top: 20px;' : '';
            isFirstIncluded = false;

            let cardTitle = card.querySelector('.header-title span').innerText;
            contentHTML += `<div style="${pageBreakStyle} margin-bottom: 30px;"><h2 style="font-size: 14px; color: #1c3d5a; border-bottom: 1px solid #1c3d5a; padding-bottom: 6px; margin-bottom: 15px; text-transform: uppercase;">${cardTitle}</h2>`;

            if (cardNum === 3) {
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
                    
                    let pannes = [];
                    block.querySelectorAll('.int_panne_chk:checked').forEach(chk => pannes.push(chk.value));
                    let panneType = pannes.length > 0 ? pannes.join(' + ') : '-';

                    let matRaw = block.querySelector('.int_materiel').value || '';
                    let matLines = matRaw.split('\n').filter(l => l.trim() !== '').map(l => `<div>• ${l}</div>`).join('') || '-';

                    let pdrRaw = block.querySelector('.int_pdr').value || '';
                    let pdrLines = pdrRaw.split('\n').filter(l => l.trim() !== '').map(l => `<div>• ${l}</div>`).join('') || '-';

                    contentHTML += `
                        <div style="background:#f8f9fa; border:1px solid #dadce0; border-radius:8px; padding:15px; margin-bottom:15px; page-break-inside: avoid;">
                            <h4 style="margin:0 0 10px 0; color:#1c3d5a; font-size:14px;">Équipement : <span style="color:#358898;">${equip}</span></h4>
                            <table style="width:100%; font-size:12px; border-collapse: collapse; margin-bottom:10px; color:#3c4043;">
                                <tr><td style="padding:5px 0; width:50%;"><b>Puissance :</b> ${puiss}</td><td><b>Rôle :</b> ${role}</td></tr>
                                <tr><td style="padding:5px 0;"><b>Date :</b> ${date}</td><td><b>Durée :</b> ${duree} H</td></tr>
                                <tr><td style="padding:5px 0;"><b>Étape :</b> ${etape}</td><td><b>Type de panne :</b> ${panneType}</td></tr>
                                <tr><td colspan="2" style="padding:6px 0; border-top:1px dashed #dadce0;"><b>Matériel utilisé :</b><br>${matLines}</td></tr>
                                <tr><td colspan="2" style="padding:6px 0;"><b>PDR utilisés :</b><br>${pdrLines}</td></tr>
                            </table>
                    `;
                    let photos = interventionPhotosMap[id];
                    if((photos && photos.avant && photos.avant.length > 0) || (photos && photos.apres && photos.apres.length > 0)) {
                        contentHTML += `<div style="display:flex; justify-content:space-between; gap:15px; border-top:1px solid #e8eaed; padding-top:10px;">`;
                        contentHTML += `<div style="width:48%;"><h5 style="color:#d93025; font-size:11px; margin-bottom:5px;">AVANT</h5><div style="display:flex; gap:8px; flex-wrap:wrap;">`;
                        (photos.avant || []).forEach(p => { contentHTML += `<img src="${p}" style="width:160px; height:120px; object-fit:cover; border-radius:6px; border:1px solid #ccc;">`; });
                        contentHTML += `</div></div>`;
                        contentHTML += `<div style="width:48%;"><h5 style="color:#2d8a35; font-size:11px; margin-bottom:5px;">APRÈS</h5><div style="display:flex; gap:8px; flex-wrap:wrap;">`;
                        (photos.apres || []).forEach(p => { contentHTML += `<img src="${p}" style="width:160px; height:120px; object-fit:cover; border-radius:6px; border:1px solid #ccc;">`; });
                        contentHTML += `</div></div></div>`;
                    }
                    contentHTML += `</div>`;
                });
            }
            else if (cardNum === 4) {
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
                            <h4 style="margin:0 0 10px 0; color:#1c3d5a; font-size:14px;">Ouvrage : ${quel}</h4>
                            <table style="width:100%; font-size:12px; border-collapse: collapse; margin-bottom:10px; color:#3c4043;">
                                <tr><td style="padding:5px 0; width:50%;"><b>Rôle :</b> ${role}</td><td><b>Type d'intervention :</b> ${typeInt}</td></tr>
                                <tr><td style="padding:5px 0;"><b>Date :</b> ${date}</td><td><b>Réf. Marché :</b> ${ref}</td></tr>
                                <tr><td colspan="2" style="padding:5px 0;"><b>Entreprise :</b> ${ent}</td></tr>
                                <tr><td colspan="2" style="padding:6px 0; border-top:1px dashed #dadce0;"><b>Remarques :</b> ${rem}</td></tr>
                            </table>
                    `;
                    let oPhotos = ouvragePhotosMap[id];
                    if(oPhotos && oPhotos.length > 0) {
                        contentHTML += `<div style="border-top:1px solid #e8eaed; padding-top:10px;"><h5 style="color:#358898; font-size:11px; margin-bottom:5px;">PHOTOS OUVRAGE</h5><div style="display:flex; gap:10px; flex-wrap:wrap;">`;
                        oPhotos.forEach(p => { contentHTML += `<img src="${p}" style="width:160px; height:120px; object-fit:cover; border-radius:6px; border:1px solid #ccc;">`; });
                        contentHTML += `</div></div>`;
                    }
                    contentHTML += `</div>`;
                });
            }
            else if (cardNum === 12) {
                let obs = document.getElementById('obs_text').value || 'Aucune observation.';
                contentHTML += `<div style="font-size:13px; color:#3c4043; line-height:1.6; background:#f8f9fa; border-left: 3px solid #fbbc04; padding:12px; border-radius:4px;">${obs.replace(/\n/g, '<br>')}</div>`;
            }
            else {
                contentHTML += `<table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #3c4043;"><tbody>`;
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
                        <td style="padding: 7px 6px; border-bottom: 1px solid #f1f3f4; width: 25%; font-weight: 500; color:#5f6368; background: ${count%4 < 2 ? '#ffffff' : '#fafafa'};">${label}</td>
                        <td style="padding: 7px 6px; border-bottom: 1px solid #f1f3f4; width: 25%; background: ${count%4 < 2 ? '#ffffff' : '#fafafa'};"><span style="${valStyle}">${val}</span></td>
                    `;
                    if (count % 2 === 1) contentHTML += `</tr>`;
                    count++;
                });
                if (count % 2 !== 0) contentHTML += `<td colspan="2" style="border-bottom: 1px solid #f1f3f4; background: ${count%4 < 2 ? '#ffffff' : '#fafafa'};"></td></tr>`;
                contentHTML += `</tbody></table>`;
            }
            contentHTML += `</div>`;
        });

        // إضافة العيوب المسجلة إن وجدت
        let anomalyKeys = Object.keys(localStorage).filter(k => k.startsWith('Anomalie_'));
        if(anomalyKeys.length > 0 && cardsToInclude.includes(12)) {
            contentHTML += `<div style="page-break-before: always; padding-top: 20px;"><h2 style="font-size: 14px; color: #1c3d5a; border-bottom: 1px solid #1c3d5a; padding-bottom: 6px; margin-bottom: 15px; text-transform: uppercase;">SIGNALEMENTS D'ANOMALIES</h2>`;
            anomalyKeys.forEach(ak => {
                let anom = JSON.parse(localStorage.getItem(ak));
                contentHTML += `<div style="background:#f8f9fa; border:1px solid #dadce0; border-radius:8px; padding:15px; margin-bottom:15px; page-break-inside: avoid;">`;
                contentHTML += `<h4 style="margin:0 0 8px 0; color:#ea5348; font-size:13px;">Type : ${anom.type} (${anom.date})</h4>`;
                contentHTML += `<table style="width:100%; font-size:12px; border-collapse: collapse; color:#3c4043;">`;
                if(anom.nom) contentHTML += `<tr><td style="padding:4px 0;"><b>Nom / Ouvrage :</b> ${anom.nom}</td></tr>`;
                if(anom.etape) contentHTML += `<tr><td style="padding:4px 0;"><b>Étape :</b> ${anom.etape} | <b>Rôle :</b> ${anom.role || '-'}</td></tr>`;
                if(anom.def) contentHTML += `<tr><td style="padding:4px 0;"><b>Défaillance :</b> ${anom.def} | <b>Solution :</b> ${anom.sol || '-'}</td></tr>`;
                if(anom.pdr) contentHTML += `<tr><td style="padding:4px 0;"><b>PDR :</b> ${anom.pdr} | <b>Durée :</b> ${anom.duree || '-'}</td></tr>`;
                if(anom.impact) contentHTML += `<tr><td style="padding:4px 0;"><b>Impact :</b> ${anom.impact}</td></tr>`;
                if(anom.enginType) contentHTML += `<tr><td style="padding:4px 0;"><b>Engin :</b> ${anom.enginType} (Matricule: ${anom.mat || '-'}, Km/TDF: ${anom.km || '-'})</td></tr>`;
                if(anom.prob) contentHTML += `<tr><td style="padding:4px 0;"><b>Problème :</b> ${anom.prob} | <b>Solution :</b> ${anom.sol || '-'}</td></tr>`;
                if(anom.rem) contentHTML += `<tr><td style="padding:4px 0;"><b>Remarques :</b> ${anom.rem}</td></tr>`;
                contentHTML += `</table>`;
                if(anom.photos && anom.photos.length > 0) {
                    contentHTML += `<div style="margin-top:10px; border-top:1px dashed #ccc; padding-top:8px;"><div style="display:flex; gap:10px; flex-wrap:wrap;">`;
                    anom.photos.forEach(p => { contentHTML += `<img src="${p}" style="width:160px; height:120px; object-fit:cover; border-radius:6px; border:1px solid #ccc;">`; });
                    contentHTML += `</div></div>`;
                }
                contentHTML += `</div>`;
            });
            contentHTML += `</div>`;
        }

        contentHTML += `<div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #1c3d5a; text-align: center; font-size: 10px; color: #4a637c;">Société régionale multiservices Marrakech-Safi &bull; Direction provinciale El kalâa des sraghna &bull; Service STEP</div>`;
        document.getElementById('pdf-dynamic-content').innerHTML = contentHTML;
    }

    function generatePDF(filename) {
        const container = document.getElementById('pdf-master-container');
        const element = document.getElementById('pdf-dynamic-content');
        if(!container || !element) return;
        container.style.visibility = 'visible';
        const currentScroll = window.scrollY;
        window.scrollTo(0, 0); 
        
        html2pdf().set({
            margin: [0.4, 0.4, 0.4, 0.4], 
            filename: filename,
            image: { type: 'jpeg', quality: 1 },
            html2canvas: { scale: 2, useCORS: true, scrollY: 0, windowWidth: 850 },
            jsPDF: { unit: 'in', format: 'A4', orientation: 'portrait' }
        }).from(element).save().then(() => {
            container.style.visibility = 'hidden';
            window.scrollTo(0, currentScroll);
        });
    }

    const btnGenerateAllPDF = document.getElementById('btnGenerateAllPDF');
    if(btnGenerateAllPDF) {
        btnGenerateAllPDF.addEventListener('click', () => {
            buildPdfContent([1,2,3,4,5,6,7,8,9,10,11,12]);
            let d = document.getElementById('date_exp').value;
            generatePDF(`Rapport_Complet_STEP_${d}.pdf`);
        });
    }

    document.querySelectorAll('.btn-print-card').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            let cardId = parseInt(this.getAttribute('data-card'));
            buildPdfContent([cardId]);
            let d = document.getElementById('date_exp').value;
            generatePDF(`Rapport_Section_${cardId}_STEP_${d}.pdf`);
        });
    });

    // حفظ السجل اليومي
    const stepForm = document.getElementById('stepForm');
    if(stepForm) {
        stepForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const dateKey = document.getElementById('date_exp').value;

            let savedInterventions = [];
            document.querySelectorAll('.intervention-block').forEach(block => {
                let pannes = [];
                block.querySelectorAll('.int_panne_chk:checked').forEach(chk => pannes.push(chk.value));

                savedInterventions.push({
                    equip: block.querySelector('.int_equip').value,
                    puiss: block.querySelector('.int_puiss').value,
                    role: block.querySelector('.int_role').value,
                    date: block.querySelector('.int_date').value,
                    duree: block.querySelector('.int_duree').value,
                    etape: block.querySelector('.int_etape').value,
                    panneTypes: pannes,
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
                obs: document.getElementById('obs_text').value
            };

            localStorage.setItem(`STEP_${dateKey}`, JSON.stringify(dataToSave));
            alert(`✔ Fiche du ${dateKey} enregistrée avec succès !`);
        });
    }

    // تصدير إكسيل
    const btnExportExcel = document.getElementById('btnExportExcel');
    if(btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            const month = document.getElementById('exportMonth').value;
            if(!month) return alert("Veuillez sélectionner un mois.");
            
            let wb = XLSX.utils.book_new();
            let recapData = [
                ["DATE", "Météo", "T(°C)", "Diff Vol In", "Diff Vol Out", "Diff Nrj", "Ratio 1j", "Nbr Interv.", "Nbr Ouvrages", "OBSERVATIONS"]
            ];

            for(let d=1; d<=31; d++) {
                let key = `STEP_${month}-${d.toString().padStart(2, '0')}`;
                let item = localStorage.getItem(key);
                if(item) {
                    let data = JSON.parse(item);
                    recapData.push([
                        data.date, data.meteo, data.t_amb, 
                        data.exploitation?.diff_in, data.exploitation?.diff_out, data.exploitation?.diff_nrj, data.exploitation?.ratio_1j,
                        data.interventions ? data.interventions.length : 0,
                        data.ouvrages ? data.ouvrages.length : 0,
                        data.obs
                    ]);
                }
            }
            if(recapData.length === 1) return alert("Aucune donnée enregistrée pour ce mois.");
            let ws = XLSX.utils.aoa_to_sheet(recapData);
            XLSX.utils.book_append_sheet(wb, ws, "Rapport Mensuel");
            XLSX.writeFile(wb, `Rapport_STEP_${month}.xlsx`);
        });
    }
});
