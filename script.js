document.addEventListener('DOMContentLoaded', () => {
    // 1. شاشة الافتتاحية
    setTimeout(() => { document.getElementById('splash-screen').classList.add('hidden-splash'); }, 2000);

    // 2. التنقل
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

    // 3. جلب الطقس التلقائي (قلعة السراغنة)
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

    // 4. جدول التدفقات 24 ساعة
    const tbody = document.getElementById('hourly-tbody');
    for (let i = 0; i < 24; i++) {
        let h1 = (9 + i) % 24, h2 = (10 + i) % 24;
        let timeStr = `${h1.toString().padStart(2,'0')}:00 - ${h2.toString().padStart(2,'0')}:00`;
        tbody.insertAdjacentHTML('beforeend', `
            <tr>
                <td>${timeStr}</td>
                <td><input type="number" class="val-entree" data-idx="${i}" step="0.1" placeholder="0"></td>
                <td><input type="number" class="val-sortie" data-idx="${i}" step="0.1" placeholder="0"></td>
            </tr>
        `);
    }

    const calcTotals = () => {
        let sumE = 0, sumS = 0;
        document.querySelectorAll('.val-entree').forEach(i => sumE += Number(i.value) || 0);
        document.querySelectorAll('.val-sortie').forEach(i => sumS += Number(i.value) || 0);
        document.getElementById('vol_entree').value = sumE.toFixed(1);
        document.getElementById('vol_sortie').value = sumS.toFixed(1);
    };
    document.getElementById('hourly-tbody').addEventListener('input', calcTotals);

    // 5. CCTP Check
    document.querySelectorAll('.cctp-check').forEach(input => {
        input.addEventListener('input', function() {
            let max = parseFloat(this.getAttribute('data-max'));
            if(parseFloat(this.value) > max) this.classList.add('exceed-cctp');
            else this.classList.remove('exceed-cctp');
        });
    });

    // 6. الأكورديون
    document.querySelectorAll('.accordion-header').forEach(h => {
        h.addEventListener('click', () => {
            h.nextElementSibling.classList.toggle('active');
            h.classList.toggle('active-header');
        });
    });

    // 7. حفظ البيانات الشاملة
    document.getElementById('stepForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const dateKey = document.getElementById('date_exp').value;
        let hourly = [];
        for(let i=0; i<24; i++) {
            hourly.push({
                in: document.querySelector(`.val-entree[data-idx="${i}"]`).value,
                out: document.querySelector(`.val-sortie[data-idx="${i}"]`).value
            });
        }

        const dataToSave = {
            date: dateKey, meteo: document.getElementById('meteo').value, t_amb: document.getElementById('t_amb').value, pluvio: document.getElementById('pluvio').value,
            debits: { hourly, tot_in: document.getElementById('vol_entree').value, tot_out: document.getElementById('vol_sortie').value },
            entree: { ph: document.getElementById('e_ph').value, temp: document.getElementById('e_temp').value, mes: document.getElementById('e_mes').value, dbo5: document.getElementById('e_dbo5').value, dco: document.getElementById('e_dco').value },
            pretraite: { deg1: document.getElementById('deg1').value, deg2: document.getElementById('deg2').value, pont: document.getElementById('pont_racleur').value },
            lits: { ph: document.getElementById('l_ph').value, temp: document.getElementById('l_temp').value, mes: document.getElementById('l_mes').value, dbo5: document.getElementById('l_dbo5').value, dco: document.getElementById('l_dco').value },
            decanteur: { voile: document.getElementById('voile_boue').value, recirc: document.getElementById('taux_recirc').value },
            parshall: { ph: document.getElementById('p_ph').value, temp: document.getElementById('p_temp').value, mes: document.getElementById('p_mes').value, dbo5: document.getElementById('p_dbo5').value, dco: document.getElementById('p_dco').value },
            equip: { h_rel: document.getElementById('h_pompe_rel').value, et_rel: document.getElementById('etat_pompe_rel').value, h_rec: document.getElementById('h_pompe_rec').value, et_rec: document.getElementById('etat_pompe_rec').value },
            gestion: { energie: document.getElementById('cons_nrj').value, h_ge: document.getElementById('h_ge').value, poly: document.getElementById('poly_kg').value, chlore: document.getElementById('chlore_l').value, v_be: document.getElementById('v_boue_e').value, dg: document.getElementById('v_dg').value, sables: document.getElementById('v_sables').value, siccite: document.getElementById('b_siccite').value },
            obs: document.getElementById('obs_text').value
        };

        localStorage.setItem(`STEP_${dateKey}`, JSON.stringify(dataToSave));
        alert(`✔ Fiche du ${dateKey} enregistrée avec succès !`);
    });

    // 8. حساب PV
    function calculatePV() {
        const month = document.getElementById('date_exp').value.substring(0, 7);
        let tb=0, tdg=0, ts=0;
        for(let i=0; i<localStorage.length; i++) {
            let k = localStorage.key(i);
            if(k.startsWith(`STEP_${month}`)) {
                let d = JSON.parse(localStorage.getItem(k));
                tb += Number(d.gestion.v_be); tdg += Number(d.gestion.dg); ts += Number(d.gestion.sables);
            }
        }
        document.getElementById('pv_boues').innerText = tb.toFixed(1);
        document.getElementById('pv_dg').innerText = tdg.toFixed(1);
        document.getElementById('pv_sables').innerText = ts.toFixed(1);
    }

    // 9. Attachement Financier
    const finInputs = document.querySelectorAll('.fin-input');
    function calculateFinance() {
        let totalHt = 0;
        finInputs.forEach(input => totalHt += Number(input.value) || 0);
        let tva = totalHt * 0.20;
        document.getElementById('fin_total_ht').value = totalHt.toFixed(2);
        document.getElementById('fin_tva').value = tva.toFixed(2);
        document.getElementById('fin_total_ttc').value = (totalHt + tva).toFixed(2);
    }
    finInputs.forEach(input => input.addEventListener('input', calculateFinance));

    // 10. التصدير الفعلي لملف Excel بجميع الأعمدة
    document.getElementById('btnExportExcel').addEventListener('click', () => {
        const month = document.getElementById('exportMonth').value;
        if(!month) return alert("Veuillez sélectionner un mois d'abord.");
        
        let wb = XLSX.utils.book_new();
        // رؤوس الأعمدة شاملة كل المراحل الجديدة
        let recapData = [
            ["DATE", "Météo", "T. Amb(°C)", "Vol. Entrée", "Vol. Sortie", 
             "DCO In", "DBO5 In", "MES In", "DCO Out", "DBO5 Out", "MES Out", 
             "Dég. 1", "Dég. 2", "Pont (H)", "Voile Boue (m)", "Recirculation (%)", 
             "P. Relevage (H)", "P. Recirc. (H)", 
             "Énergie (kWh)", "Polymère (Kg)", "Chlore (L)", "Boues (m³)", "Observations"]
        ];

        for(let d=1; d<=31; d++) {
            let dayStr = d.toString().padStart(2, '0');
            let key = `STEP_${month}-${dayStr}`;
            let item = localStorage.getItem(key);
            if(item) {
                let data = JSON.parse(item);
                recapData.push([
                    data.date, data.meteo, data.t_amb, data.debits.tot_in, data.debits.tot_out,
                    data.entree.dco, data.entree.dbo5, data.entree.mes, data.parshall.dco, data.parshall.dbo5, data.parshall.mes,
                    data.pretraite.deg1, data.pretraite.deg2, data.pretraite.pont, data.decanteur.voile, data.decanteur.recirc,
                    data.equip.h_rel, data.equip.h_rec,
                    data.gestion.energie, data.gestion.poly, data.gestion.chlore, data.gestion.v_be, data.obs
                ]);
            }
        }

        if(recapData.length === 1) return alert("Aucune donnée enregistrée pour ce mois.");

        let ws = XLSX.utils.aoa_to_sheet(recapData);
        XLSX.utils.book_append_sheet(wb, ws, "Rapport Mensuel");
        XLSX.writeFile(wb, `Rapport_STEP_${month}.xlsx`);
    });
});
