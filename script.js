document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { document.getElementById('splash-screen').classList.add('hidden-splash'); }, 2000);

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

    async function fetchAutoWeather() {
        try {
            const lat = 32.0494; const lon = -7.4083;
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
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
            // تجاهل النقر إذا كان على زر الطباعة
            if(e.target.classList.contains('btn-print-card')) return;
            h.nextElementSibling.classList.toggle('active');
            h.classList.toggle('active-header');
        });
    });

    // إدارة التدخلات المتعددة (Interventions)
    let interventionPhotosMap = { "1": [] };
    let intCounter = 1;

    document.getElementById('btnAddIntervention').addEventListener('click', () => {
        intCounter++;
        interventionPhotosMap[intCounter.toString()] = [];
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
                <div class="input-group full-width"><label>Équipement d'intervention</label><input type="text" class="int_equip" placeholder="Ex: Pompe..."></div>
                <div class="input-group"><label>Puissance (kW)</label><input type="text" class="int_puiss"></div>
                <div class="input-group"><label>Rôle</label><input type="text" class="int_role"></div>
                <div class="input-group"><label>Date d'intervention</label><input type="date" class="int_date"></div>
                <div class="input-group"><label>Durée (Heures)</label><input type="number" class="int_duree" step="0.5"></div>
                <div class="input-group full-width"><label>Matériel utilisé</label><textarea class="int_materiel" rows="2"></textarea></div>
                <div class="input-group full-width"><label>PDR utilisés</label><textarea class="int_pdr" rows="2"></textarea></div>
                <div class="input-group full-width">
                    <label><i class="fa-solid fa-camera"></i> Photos</label>
                    <input type="file" accept="image/*" multiple class="file-upload-input int_photos_input">
                    <div class="photos-preview-container mt-10"></div>
                </div>
            </div>
        `;
        container.appendChild(newBlock);

        // زر الحذف
        newBlock.querySelector('.btn-remove-int').addEventListener('click', function() {
            delete interventionPhotosMap[intCounter.toString()];
            newBlock.remove();
        });
    });

    // استماع لرفع الصور للتدخلات الحالية والمستقبلية (Event Delegation)
    document.getElementById('interventions_container').addEventListener('change', function(e) {
        if(e.target.classList.contains('int_photos_input')) {
            const block = e.target.closest('.intervention-block');
            const blockId = block.getAttribute('data-id');
            const previewContainer = block.querySelector('.photos-preview-container');
            previewContainer.innerHTML = '';
            interventionPhotosMap[blockId] = [];
            
            Array.from(e.target.files).forEach(file => {
                if(file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const b64 = event.target.result;
                        interventionPhotosMap[blockId].push(b64);
                        const img = document.createElement('img');
                        img.src = b64;
                        previewContainer.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });

    // ================== نظام PDF الاحترافي (أسلوب NotebookLM) ==================
    function buildPdfContent(cardsToInclude) {
        let contentHTML = `
            <div style="border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h1 style="margin: 0; font-size: 24px; color: #202124; font-weight: 700;">Rapport d'Exploitation</h1>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #5f6368;">STEP El Kelaa des Sraghna - Date : <b>${document.getElementById('date_exp').value}</b></p>
                </div>
                <div><img src="logo.png" style="max-height: 50px;"></div>
            </div>
        `;

        const allCards = document.querySelectorAll('.accordion-item');
        
        allCards.forEach((card, index) => {
            let cardNum = index + 1;
            if(!cardsToInclude.includes(cardNum)) return; // سكيب إذا لم يتم اختيار البطاقة

            let cardTitle = card.querySelector('.header-title span').innerText;
            contentHTML += `
                <div style="page-break-inside: avoid; margin-bottom: 35px;">
                    <h2 style="font-size: 16px; color: #1a73e8; border-bottom: 1px solid #1a73e8; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px;">${cardTitle}</h2>
            `;

            // معالجة خاصة لبطاقة التدخلات (رقم 3)
            if (cardNum === 3) {
                const blocks = card.querySelectorAll('.intervention-block');
                if(blocks.length === 0) contentHTML += `<p style="font-size:12px; color:#5f6368;">Aucune intervention enregistrée.</p>`;
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
                        <div style="background:#f8f9fa; border:1px solid #dadce0; border-radius:8px; padding:15px; margin-bottom:15px; page-break-inside: avoid;">
                            <h4 style="margin:0 0 10px 0; color:#202124; font-size:14px;">Équipement: ${equip}</h4>
                            <table style="width:100%; font-size:12px; border-collapse: collapse; margin-bottom:10px;">
                                <tr><td style="padding:4px 0; width:50%;"><b>Puissance:</b> ${puiss}</td><td style="padding:4px 0;"><b>Rôle:</b> ${role}</td></tr>
                                <tr><td style="padding:4px 0;"><b>Date:</b> ${date}</td><td style="padding:4px 0;"><b>Durée:</b> ${duree} H</td></tr>
                                <tr><td style="padding:4px 0; border-top:1px dashed #dadce0;" colspan="2"><b>Matériel:</b> ${mat}</td></tr>
                                <tr><td style="padding:4px 0; border-top:1px dashed #dadce0;" colspan="2"><b>Pièces:</b> ${pdr}</td></tr>
                            </table>
                    `;
                    // الصور
                    let photos = interventionPhotosMap[id];
                    if(photos && photos.length > 0) {
                        contentHTML += `<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:10px;">`;
                        photos.forEach(p => {
                            contentHTML += `<img src="${p}" style="width:150px; height:100px; object-fit:cover; border-radius:4px; border:1px solid #dadce0;">`;
                        });
                        contentHTML += `</div>`;
                    }
                    contentHTML += `</div>`;
                });
            } 
            else if (cardNum === 13) { // الملاحظات
                let obs = document.getElementById('obs_text').value || 'Aucune observation.';
                contentHTML += `<p style="font-size:13px; color:#202124; line-height:1.6; background:#f1f3f4; padding:12px; border-radius:6px;">${obs.replace(/\n/g, '<br>')}</p>`;
            }
            else {
                // البطاقات العادية (جداول البيانات)
                contentHTML += `<table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #202124;"><tbody>`;
                const inputs = card.querySelectorAll('input, select');
                let count = 0;
                inputs.forEach(input => {
                    let label = input.previousElementSibling ? input.previousElementSibling.innerText : '';
                    if(!label) return;
                    let val = input.value || '-';
                    
                    if (count % 2 === 0) contentHTML += `<tr>`;
                    contentHTML += `
                        <td style="padding: 8px; border-bottom: 1px solid #f1f3f4; width: 25%; font-weight: 600; color:#5f6368;">${label}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #f1f3f4; width: 25%;">${val}</td>
                    `;
                    if (count % 2 === 1) contentHTML += `</tr>`;
                    count++;
                });
                if (count % 2 !== 0) contentHTML += `<td colspan="2" style="border-bottom: 1px solid #f1f3f4;"></td></tr>`; // إغلاق السطر إذا كان فردي
                contentHTML += `</tbody></table>`;
            }
            
            contentHTML += `</div>`;
        });

        // تذييل الصفحة
        contentHTML += `
            <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 10px; color: #9aa0a6;">
                Document généré par l'application SRM DPKS - Kelaa des Sraghna
            </div>
        `;

        document.getElementById('pdf-dynamic-content').innerHTML = contentHTML;
    }

    function generatePDF(filename) {
        const element = document.getElementById('pdf-dynamic-content');
        html2pdf().set({
            margin: 0.4, 
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'A4', orientation: 'portrait' }
        }).from(element).save();
    }

    // زر الطباعة الشامل (كل البطاقات 1 إلى 13)
    document.getElementById('btnGenerateAllPDF').addEventListener('click', () => {
        buildPdfContent([1,2,3,4,5,6,7,8,9,10,11,12,13]);
        let d = document.getElementById('date_exp').value;
        generatePDF(`Rapport_Complet_STEP_${d}.pdf`);
    });

    // أزرار الطباعة الفردية (في رأس كل بطاقة)
    document.querySelectorAll('.btn-print-card').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // لمنع طي/فتح البطاقة
            let cardId = parseInt(this.getAttribute('data-card'));
            buildPdfContent([cardId]);
            let d = document.getElementById('date_exp').value;
            generatePDF(`Rapport_Section_${cardId}_STEP_${d}.pdf`);
        });
    });

    // ================== الحفظ ==================
    document.getElementById('stepForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const dateKey = document.getElementById('date_exp').value;

        // تجميع التدخلات (Interventions)
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
            interventions: savedInterventions, // مصفوفة التدخلات
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

    // ================== PV ==================
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

    // ================== Excel ==================
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
