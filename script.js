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

    // حساب آلي لـ Ratio 1j
    document.querySelectorAll('.exploit-input').forEach(input => {
        input.addEventListener('input', () => {
            let diffIn = parseFloat(document.getElementById('diff_in').value) || 0;
            let diffNrj = parseFloat(document.getElementById('diff_nrj').value) || 0;
            
            if (diffIn > 0) {
                document.getElementById('ratio_1j').value = (diffNrj / diffIn).toFixed(3);
            } else {
                document.getElementById('ratio_1j').value = '';
            }
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
        h.addEventListener('click', () => {
            h.nextElementSibling.classList.toggle('active');
            h.classList.toggle('active-header');
        });
    });

    let interventionPhotosBase64 = [];
    document.getElementById('interv_photos').addEventListener('change', function(e) {
        const previewContainer = document.getElementById('photos_preview');
        previewContainer.innerHTML = ''; 
        interventionPhotosBase64 = [];
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if(file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Str = event.target.result;
                    interventionPhotosBase64.push(base64Str);
                    const img = document.createElement('img');
                    img.src = base64Str;
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // استخراج PDF مع حل نهائي لمشكلة الورقة البيضاء
    document.getElementById('btnGeneratePDF').addEventListener('click', () => {
        let equipName = document.getElementById('interv_equip').value;
        if(!equipName) return alert("Veuillez saisir au moins le nom de l'équipement d'intervention dans l'onglet 'Saisie' (Section 3) !");

        let now = new Date();
        let dateTimeStr = now.toLocaleDateString('fr-FR') + ' à ' + now.toLocaleTimeString('fr-FR');
        document.getElementById('pdf_date_heure').innerText = dateTimeStr;
        document.getElementById('pdf_ref').innerText = Math.floor(1000 + Math.random() * 9000) + '-' + now.getFullYear();

        document.getElementById('pdf_equip').innerText = equipName;
        document.getElementById('pdf_puiss').innerText = document.getElementById('interv_puiss').value || 'Non spécifié';
        document.getElementById('pdf_role').innerText = document.getElementById('interv_role').value || 'Non spécifié';
        
        let intDateRaw = document.getElementById('interv_date').value;
        document.getElementById('pdf_date_int').innerText = intDateRaw ? new Date(intDateRaw).toLocaleDateString('fr-FR') : 'Non spécifiée';
        document.getElementById('pdf_duree').innerText = document.getElementById('interv_duree').value || '0';
        
        let mat = document.getElementById('interv_materiel').value || 'Aucun matériel particulier';
        document.getElementById('pdf_materiel').innerHTML = mat.replace(/\n/g, '<br>');
        let pdr = document.getElementById('interv_pdr').value || 'Aucune pièce remplacée';
        document.getElementById('pdf_pdr').innerHTML = pdr.replace(/\n/g, '<br>');

        let photosContainer = document.getElementById('pdf_photos_container');
        photosContainer.innerHTML = '';
        if(interventionPhotosBase64.length === 0) {
            photosContainer.innerHTML = '<p style="color: #94a3b8; font-style: italic; width:100%; text-align:center;">Aucune photo jointe pour cette intervention.</p>';
        } else {
            interventionPhotosBase64.forEach(src => {
                let img = document.createElement('img');
                img.src = src;
                img.style.width = "45%"; img.style.height = "180px"; img.style.objectFit = "cover"; 
                img.style.border = "3px solid #e2e8f0"; img.style.borderRadius = "6px";
                photosContainer.appendChild(img);
            });
        }

        const element = document.getElementById('pdf-report-content');
        
        // استخدام html2pdf مباشرة لأن الحاوية الآن موجودة ومبنية دائماً خارج الشاشة (left: -10000px)
        html2pdf().set({
            margin: 0.2, 
            filename: `Intervention_${equipName.replace(/[^a-z0-9]/gi, '_')}_${now.toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'A4', orientation: 'portrait' }
        }).from(element).save().catch(err => { console.error("PDF Error: ", err); });
    });

    document.getElementById('stepForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const dateKey = document.getElementById('date_exp').value;

        const eqList = [ 'eq_dg_auto', 'eq_dg_man', 'eq_pr1', 'eq_pr2', 'eq_pr3', 'eq_pr4', 'eq_df1', 'eq_df2', 'eq_aero1', 'eq_aero2', 'eq_rac1', 'eq_rac2', 'eq_ps1', 'eq_ps2', 'eq_pg', 'eq_agi', 'eq_cg', 'eq_cs', 'eq_rad', 'eq_palb1', 'eq_palb2', 'eq_palb3', 'eq_palb4', 'eq_sp1', 'eq_sp2', 'eq_vent1', 'eq_vent2', 'eq_pont1', 'eq_pont2'];
        const instList = [ 'inst_us_dg', 'inst_poire_sr1', 'inst_poire_sr2', 'inst_poire_sr3', 'inst_poire_sr4', 'inst_us_df1', 'inst_us_df2', 'inst_poire_gr1', 'inst_poire_gr2', 'inst_poire_gr3', 'inst_us_salb', 'inst_poire_salb'];
        
        let equipData = {}; let pannes = [];
        eqList.forEach(id => { let el = document.getElementById(id); if(el){ equipData[id] = el.value; if(el.value === 'Panne') pannes.push(el.previousElementSibling.innerText); } });
        instList.forEach(id => { let el = document.getElementById(id); if(el){ equipData[id] = el.value; if(el.value === 'Panne') pannes.push(el.previousElementSibling.innerText); } });

        const dataToSave = {
            date: dateKey, meteo: document.getElementById('meteo').value, t_amb: document.getElementById('t_amb').value, pluvio: document.getElementById('pluvio').value,
            equipData: equipData, pannesStr: pannes.length > 0 ? pannes.join(" | ") : "Aucune",
            interventions: { equip: document.getElementById('interv_equip').value, duree: document.getElementById('interv_duree').value, pdr: document.getElementById('interv_pdr').value },
            
            exploitation: { 
                idx_in: document.getElementById('idx_in').value, diff_in: document.getElementById('diff_in').value,
                idx_out: document.getElementById('idx_out').value, diff_out: document.getElementById('diff_out').value,
                idx_nrj: document.getElementById('idx_nrj').value, diff_nrj: document.getElementById('diff_nrj').value,
                ratio_1j: document.getElementById('ratio_1j').value
            },
            
            entree: { hp: document.getElementById('e_hp').value, ha: document.getElementById('e_ha').value, ph: document.getElementById('e_ph').value, temp: document.getElementById('e_temp').value, o2: document.getElementById('e_o2').value, cond: document.getElementById('e_cond').value, mes: document.getElementById('e_mes').value, dbo5: document.getElementById('e_dbo5').value, dco: document.getElementById('e_dco').value, uvt: document.getElementById('e_uvt').value },
            lits: { hp: document.getElementById('l_hp').value, ha: document.getElementById('l_ha').value, ph: document.getElementById('l_ph').value, temp: document.getElementById('l_temp').value, o2: document.getElementById('l_o2').value, cond: document.getElementById('l_cond').value, mes: document.getElementById('l_mes').value, dbo5: document.getElementById('l_dbo5').value, dco: document.getElementById('l_dco').value, uvt: document.getElementById('l_uvt').value },
            decanteur: { voile: document.getElementById('voile_boue').value, recirc: document.getElementById('taux_recirc').value },
            parshall: { hp: document.getElementById('p_hp').value, ha: document.getElementById('p_ha').value, ph: document.getElementById('p_ph').value, temp: document.getElementById('p_temp').value, o2: document.getElementById('p_o2').value, cond: document.getElementById('p_cond').value, mes: document.getElementById('p_mes').value, dbo5: document.getElementById('p_dbo5').value, dco: document.getElementById('p_dco').value, uvt: document.getElementById('p_uvt').value },
            tertiaire: { hp: document.getElementById('t_hp').value, ha: document.getElementById('t_ha').value, ph: document.getElementById('t_ph').value, temp: document.getElementById('t_temp').value, o2: document.getElementById('t_o2').value, cond: document.getElementById('t_cond').value, ufc1: document.getElementById('t_ufc1').value, ufc2: document.getElementById('t_ufc2').value, nem: document.getElementById('t_nem').value, uvt: document.getElementById('t_uvt').value },
            boues: { hp: document.getElementById('b_hp').value, ha: document.getElementById('b_ha').value, ph: document.getElementById('b_ph').value, temp: document.getElementById('b_temp').value, o2: document.getElementById('b_o2').value, cond: document.getElementById('b_cond').value, mes: document.getElementById('b_mes').value, mvs: document.getElementById('b_mvs').value, siccite: document.getElementById('b_siccite').value, lieu: document.getElementById('b_lieu').value },
            gestion: { energie: document.getElementById('cons_nrj').value, h_ge: document.getElementById('h_ge').value, poly: document.getElementById('poly_kg').value, chlore: document.getElementById('chlore_l').value, bass: document.getElementById('bass_purge').value, bp: document.getElementById('v_boue_p').value, bs: document.getElementById('v_boue_s').value, be: document.getElementById('v_boue_e').value, dg: document.getElementById('v_dg').value, df: document.getElementById('v_df').value, sables: document.getElementById('v_sables').value, graisses: document.getElementById('v_graisses').value },
            
            obs: document.getElementById('obs_text').value
        };

        localStorage.setItem(`STEP_${dateKey}`, JSON.stringify(dataToSave));
        alert(`✔ Fiche du ${dateKey} enregistrée avec succès !`);
    });

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

    const finInputs = document.querySelectorAll('.fin-input');
    function calculateFinance() {
        let totalHt = 0; finInputs.forEach(input => totalHt += Number(input.value) || 0);
        let tva = totalHt * 0.20;
        document.getElementById('fin_total_ht').value = totalHt.toFixed(2);
        document.getElementById('fin_tva').value = tva.toFixed(2);
        document.getElementById('fin_total_ttc').value = (totalHt + tva).toFixed(2);
    }
    finInputs.forEach(input => input.addEventListener('input', calculateFinance));

    document.getElementById('btnExportExcel').addEventListener('click', () => {
        const month = document.getElementById('exportMonth').value;
        if(!month) return alert("Veuillez sélectionner un mois.");
        
        let wb = XLSX.utils.book_new();
        let recapData = [
            ["DATE", "Météo", "T(°C)", "Diff Vol In", "Diff Vol Out", "Diff Nrj", "Ratio 1j", "DCO In", "DBO5 In", "MES In", "DCO Out", "DBO5 Out", "MES Out", "Siccité (%)", "PANNES", "INTERVENTIONS", "OBSERVATIONS"]
        ];

        for(let d=1; d<=31; d++) {
            let key = `STEP_${month}-${d.toString().padStart(2, '0')}`;
            let item = localStorage.getItem(key);
            if(item) {
                let data = JSON.parse(item);
                recapData.push([
                    data.date, data.meteo, data.t_amb, 
                    data.exploitation?.diff_in, data.exploitation?.diff_out, data.exploitation?.diff_nrj, data.exploitation?.ratio_1j,
                    data.entree?.dco, data.entree?.dbo5, data.entree?.mes, data.parshall?.dco, data.parshall?.dbo5, data.parshall?.mes,
                    data.boues?.siccite,
                    data.pannesStr, (data.interventions?.equip ? data.interventions.equip : ""), data.obs
                ]);
            }
        }
        if(recapData.length === 1) return alert("Aucune donnée enregistrée pour ce mois.");
        let ws = XLSX.utils.aoa_to_sheet(recapData);
        XLSX.utils.book_append_sheet(wb, ws, "Rapport Mensuel");
        XLSX.writeFile(wb, `Rapport_STEP_${month}.xlsx`);
    });
});
