document.addEventListener('DOMContentLoaded', () => {
    // 1. نظام الحماية (Login System)
    const PIN_KEY = 'app_secure_pin';
    if (!localStorage.getItem(PIN_KEY)) {
        localStorage.setItem(PIN_KEY, '1111'); // الرمز الافتراضي
    }
    
    // إخفاء الـ Splash Screen بعد ثانيتين
    setTimeout(() => { 
        document.getElementById('splash-screen').classList.add('hidden-splash'); 
    }, 2000);

    // التحقق من الجلسة
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('login-screen').style.display = 'none';
    }

    // زر فك القفل
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

    // تغيير الرقم السري (الإعدادات)
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

    // 2. التنقل بين التبويبات
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    navItems.forEach(btn => {
        btn.addEventListener('click', () => {
            navItems.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            if(btn.dataset.target === 'tab-pv') calculatePV();
        });
    });

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('date_exp').value = todayStr;

    // الميتيو
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
        } catch (e) { console.log("Météo hors ligne."); }
    }
    fetchAutoWeather();

    // Ratio 1j auto
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
            if(e.target.classList.contains('btn-print-card')) return; // تجاهل زر الطباعة
            h.nextElementSibling.classList.toggle('active');
            h.classList.toggle('active-header');
        });
    });

    // 3. إدارة التدخلات المتعددة (Avant / Après)
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
                <h5>Intervention #${intCounter}</h5>
                <button type="button" class="btn-remove-int"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="form-grid">
                <div class="input-group full-width"><label>Équipement</label><input type="text" class="int_equip" placeholder="Ex: Pompe..."></div>
                <div class="input-group"><label>Puissance (kW)</label><input type="text" class="int_puiss"></div>
                <div class="input-group"><label>Rôle</label><input type="text" class="int_role"></div>
                <div class="input-group"><label>Date d'intervention</label><input type="date" class="int_date"></div>
                <div class="input-group"><label>Durée (Heures)</label><input type="number" class="int_duree" step="0.5"></div>
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

    // استماع لرفع الصور (قبل / بعد)
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

    // ================== 4. نظام PDF الاحترافي (NotebookLM Style & Page Breaks) ==================
    function buildPdfContent(cardsToInclude) {
        let contentHTML = `
            <div style="border-bottom: 2px solid #e8eaed; padding-bottom: 20px; margin-bottom: 30px; display:flex; justify-content:space-between; align-items:flex-end;">
                <div>
                    <h1 style="margin: 0; font-size: 26px; color: #202124; font-weight: 800; letter-spacing: -0.5px;">Rapport d'Exploitation</h1>
                    <p style="margin: 6px 0 0; font-size: 14px; color: #5f6368; font-weight: 500;">STEP El Kelaa des Sraghna &bull; <b>${document.getElementById('date_exp').value}</b></p>
                </div>
                <div><img src="logo.png" style="max-height: 55px;"></div>
            </div>
        `;

        const allCards = document.querySelectorAll('.accordion-item');
        let isFirstIncluded = true;

        allCards.forEach((card, index) => {
            let cardNum = index + 1;
            if(!cardsToInclude.includes(cardNum)) return;

            // فصل الصفحات: إذا لم تكن هذه هي البطاقة الأولى، نضع فاصلاً
            let pageBreakClass = (!isFirstIncluded && cardsToInclude.length > 1) ? 'pdf-page-break' : '';
            isFirstIncluded = false;

            let cardTitle = card.querySelector('.header-title span').innerText;
            contentHTML += `
                <div class="${pageBreakClass}" style="margin-bottom: 40px; page-break-inside: avoid;">
                    <h2 style="font-size: 15px; color: #1a73e8; border-bottom: 2px solid #f1f3f4; padding-bottom: 8px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">${cardTitle}</h2>
            `;

            // بطاقة التدخلات
            if (cardNum === 3) {
                const blocks = card.querySelectorAll('.intervention-block');
                if(blocks.length === 0) contentHTML += `<p style="font-size:13px; color:#80868b; font-style: italic;">Aucune intervention enregistrée.</p>`;
                
                blocks.forEach(block => {
                    let id = block.getAttribute('data-id');
                    let equip = block.querySelector('.int_equip').value || '-';
                    let puiss = block.querySelector('.int_puiss').value || '-';
                    let role = block.querySelector('.int_role').value || '-';
                    let date = block.querySelector('.int_date').value || '-';
                    let duree = block.querySelector('.int_duree').value || '-';
                    let mat = block.querySelector('.int_materiel').value || '-';
                    let pdr = block.querySelector('.int_pdr').value || '-';

                    contentHTML += `
                        <div style="background:#f8f9fa; border:1px solid #dadce0; border-radius:8px; padding:20px; margin-bottom:20px; page-break-inside: avoid;">
                            <h4 style="margin:0 0 15px 0; color:#202124; font-size:16px;">Équipement : <span style="color:#1a73e8;">${equip}</span></h4>
                            <table style="width:100%; font-size:13px; border-collapse: collapse; margin-bottom:15px; color:#3c4043;">
                                <tr><td style="padding:6px 0; width:50%;"><b>Puissance :</b> ${puiss}</td><td style="padding:6px 0;"><b>Rôle :</b> ${role}</td></tr>
                                <tr><td style="padding:6px 0;"><b>Date :</b> ${date}</td><td style="padding:6px 0;"><b>Durée :</b> ${duree} Heures</td></tr>
                                <tr><td style="padding:8px 0; border-top:1px dashed #dadce0;" colspan="2"><b>Matériel utilisé :</b> ${mat}</td></tr>
                                <tr><td style="padding:8px 0; border-top:1px dashed #dadce0;" colspan="2"><b>Pièces de rechange :</b> ${pdr}</td></tr>
                            </table>
                    `;
                    // عرض صور قبل وبعد
                    let photos = interventionPhotosMap[id];
                    if((photos.avant && photos.avant.length > 0) || (photos.apres && photos.apres.length > 0)) {
                        contentHTML += `<div style="display:flex; justify-content: space-between; gap: 15px; border-top: 1px solid #e8eaed; padding-top: 15px;">`;
                        
                        // Avant
                        contentHTML += `<div style="width:48%;">
                            <h5 style="margin:0 0 10px 0; font-size:12px; color:#d93025; text-transform:uppercase;">Avant</h5>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">`;
                        (photos.avant || []).forEach(p => {
                            contentHTML += `<img src="${p}" style="width:120px; height:80px; object-fit:cover; border-radius:6px; border:1px solid #dadce0;">`;
                        });
                        contentHTML += `</div></div>`;

                        // Après
                        contentHTML += `<div style="width:48%;">
                            <h5 style="margin:0 0 10px 0; font-size:12px; color:#188038; text-transform:uppercase;">Après</h5>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">`;
                        (photos.apres || []).forEach(p => {
                            contentHTML += `<img src="${p}" style="width:120px; height:80px; object-fit:cover; border-radius:6px; border:1px solid #dadce0;">`;
                        });
                        contentHTML += `</div></div>`;

                        contentHTML += `</div>`;
                    }
                    contentHTML += `</div>`;
                });
            } 
            else if (cardNum === 13) { // الملاحظات
                let obs = document.getElementById('obs_text').value || 'Aucune observation enregistrée.';
                contentHTML += `<div style="font-size:14px; color:#3c4043; line-height:1.6; background:#f8f9fa; border-left: 4px solid #fbbc04; padding:15px; border-radius:4px;">${obs.replace(/\n/g, '<br>')}</div>`;
            }
            else {
                // الجداول العادية
                contentHTML += `<table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #3c4043;"><tbody>`;
                const inputs = card.querySelectorAll('input, select');
                let count = 0;
                inputs.forEach(input => {
                    let label = input.previousElementSibling ? input.previousElementSibling.innerText : '';
                    if(!label) return;
                    let val = input.value || '-';
                    
                    if (count % 2 === 0) contentHTML += `<tr>`;
                    contentHTML += `
                        <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f4; width: 25%; font-weight: 500; color:#5f6368; background: #fafafa;">${label}</td>
                        <td style="padding: 10px 8px; border-bottom: 1px solid #f1f3f4; width: 25%; font-weight: 600;">${val}</td>
                    `;
                    if (count % 2 === 1) contentHTML += `</tr>`;
                    count++;
                });
                if (count % 2 !== 0) contentHTML += `<td colspan="2" style="border-bottom: 1px solid #f1f3f4; background: #fafafa;"></td></tr>`;
                contentHTML += `</tbody></table>`;
            }
            
            contentHTML += `</div>`;
        });

        contentHTML += `
            <div style="margin-top: 50px; padding-top: 15px; border-top: 1px solid #e8eaed; text-align: center; font-size: 11px; color: #9aa0a6;">
                Document sécurisé généré par SRM DPKS - Système de Gestion Intégrée
            </div>
        `;

        document.getElementById('pdf-dynamic-content').innerHTML = contentHTML;
    }

    function generatePDF(filename) {
        const element = document.getElementById('pdf-dynamic-content');
        html2pdf().set({
            margin: 0.5, 
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'in', format: 'A4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] } // تفعيل خاصية الفصل في المكتبة
        }).from(element).save();
    }

    // الأزرار
    document.getElementById('btnGenerateAllPDF').addEventListener('click', () => {
        buildPdfContent([1,2,3,4,5,6,7,8,9,10,11,12,13]);
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

    // ================== الحفظ (Enregistrement) ==================
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
                mat: block.querySelector('.int_materiel').value,
                pdr: block.querySelector('.int_pdr').value
            });
        });

        const dataToSave = {
            date: dateKey, meteo: document.getElementById('meteo').value, t_amb: document.getElementById('t_amb').value, pluvio: document.getElementById('pluvio').value,
            interventions: savedInterventions,
            exploitation: { 
                idx_in: document.getElementById('idx_in').value, diff_in: document.getElementById('diff_in').value,
                idx_out: document.getElementById('idx_out').value, diff_out: document.getElementById('diff_out').value,
                idx_nrj: document.getElementById('idx_nrj').value, diff_nrj: document.getElementById('diff_nrj').value,
                ratio_1j: document.getElementById('ratio_1j').value
            },
            entree: { dco: document.getElementById('e_dco').value, dbo5: document.getElementById('e_dbo5').value, mes: document.getElementById('e_mes').value },
            parshall: { dco: document.getElementById('p_dco').value, dbo5: document.getElementById('p_dbo5').value, mes: document.getElementById('p_mes').value },
            boues: { siccite: document.getElementById('b_siccite').value },
            gestion: { be: document.getElementById('v_boue_e').value, dg: document.getElementById('v_dg').value, df: document.getElementById('v_df').value, sables: document.getElementById('v_sables').value, graisses: document.getElementById('v_graisses').value },
            obs: document.getElementById('obs_text').value
        };

        localStorage.setItem(`STEP_${dateKey}`, JSON.stringify(dataToSave));
        alert(`✔ Fiche du ${dateKey} enregistrée avec succès !`);
    });

    // ================== PV + Excel ==================
    function calculatePV() {
        const month = document.getElementById('date_exp').value.substring(0, 7);
        let tb=0, tdg=0, tdf=0, ts=0, tg=0;
        for(let i=0; i<localStorage.length; i++) {
            let k = localStorage.key(i);
            if(k.startsWith(`STEP_${month}`)) {
                let d = JSON.parse(localStorage.getItem(k));
                tb += Number(d.gestion?.be)||0; tdg += Number(d.gestion?.dg)||0; tdf += Number(d.gestion?.df)||0; ts += Number(d.gestion?.sables)||0; tg += Number(d.gestion?.graisses)||0;
            }
        }
        document.getElementById('pv_boues').innerText = tb.toFixed(1);
        document.getElementById('pv_dg').innerText = tdg.toFixed(1);
        document.getElementById('pv_df').innerText = tdf.toFixed(1);
        document.getElementById('pv_sables').innerText = ts.toFixed(1);
        document.getElementById('pv_graisses').innerText = tg.toFixed(1);
    }

    document.getElementById('btnExportExcel').addEventListener('click', () => {
        const month = document.getElementById('exportMonth').value;
        if(!month) return alert("Veuillez sélectionner un mois.");
        
        let wb = XLSX.utils.book_new();
        let recapData = [
            ["DATE", "Météo", "T(°C)", "Diff Vol In", "Diff Vol Out", "Diff Nrj", "Ratio 1j", "DCO In", "DBO5 In", "MES In", "DCO Out", "DBO5 Out", "MES Out", "Siccité (%)", "Nbr Interventions", "OBSERVATIONS"]
        ];

        for(let d=1; d<=31; d++) {
            let key = `STEP_${month}-${d.toString().padStart(2, '0')}`;
            let item = localStorage.getItem(key);
            if(item) {
                let data = JSON.parse(item);
                let numInterv = data.interventions ? data.interventions.length : 0;
                recapData.push([
                    data.date, data.meteo, data.t_amb, 
                    data.exploitation?.diff_in, data.exploitation?.diff_out, data.exploitation?.diff_nrj, data.exploitation?.ratio_1j,
                    data.entree?.dco, data.entree?.dbo5, data.entree?.mes, data.parshall?.dco, data.parshall?.dbo5, data.parshall?.mes,
                    data.boues?.siccite,
                    numInterv, data.obs
                ]);
            }
        }
        if(recapData.length === 1) return alert("Aucune donnée enregistrée pour ce mois.");
        let ws = XLSX.utils.aoa_to_sheet(recapData);
        XLSX.utils.book_append_sheet(wb, ws, "Rapport Mensuel");
        XLSX.writeFile(wb, `Rapport_STEP_${month}.xlsx`);
    });
});
