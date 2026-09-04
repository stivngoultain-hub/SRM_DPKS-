document.addEventListener('DOMContentLoaded', () => {
    // 1. شاشة الافتتاحية
    setTimeout(() => { document.getElementById('splash-screen').classList.add('hidden-splash'); }, 2000);

    // 2. نظام التنقل بين النوافذ
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

    // 3. توليد جدول 24 ساعة للتدفقات
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

    // 4. الحسابات التلقائية (مجموع التدفق ومعدل الاستهلاك)
    const calcTotals = () => {
        let sumE = 0, sumS = 0;
        document.querySelectorAll('.val-entree').forEach(i => sumE += Number(i.value) || 0);
        document.querySelectorAll('.val-sortie').forEach(i => sumS += Number(i.value) || 0);
        document.getElementById('vol_entree').value = sumE.toFixed(1);
        document.getElementById('vol_sortie').value = sumS.toFixed(1);

        let energie = Number(document.getElementById('cons_nrj').value) || 0;
        document.getElementById('taux_nrj').value = sumE > 0 ? (energie / sumE).toFixed(6) : 0;
    };
    document.getElementById('hourly-tbody').addEventListener('input', calcTotals);
    document.getElementById('cons_nrj').addEventListener('input', calcTotals);

    // 5. التحذير عند تجاوز معايير CCTP
    document.querySelectorAll('.cctp-check').forEach(input => {
        input.addEventListener('input', function() {
            let max = parseFloat(this.getAttribute('data-max'));
            if(parseFloat(this.value) > max) this.classList.add('exceed-cctp');
            else this.classList.remove('exceed-cctp');
        });
    });

    // 6. الأكورديون (القوائم الطية)
    document.querySelectorAll('.accordion-header').forEach(h => {
        h.addEventListener('click', () => {
            h.nextElementSibling.classList.toggle('active');
            h.classList.toggle('active-header');
        });
    });

    // 7. حفظ البيانات اليومية
    document.getElementById('date_exp').value = new Date().toISOString().split('T')[0];
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
            parshall: { mes: document.getElementById('p_mes').value, dbo5: document.getElementById('p_dbo5').value, dco: document.getElementById('p_dco').value },
            gestion: { energie: document.getElementById('cons_nrj').value, v_be: document.getElementById('v_boue_e').value, dg: document.getElementById('v_dg').value, df: document.getElementById('v_df').value, sables: document.getElementById('v_sables').value, graisses: document.getElementById('v_graisses').value }
        };

        localStorage.setItem(`STEP_${dateKey}`, JSON.stringify(dataToSave));
        alert(`✔ Fiche du ${dateKey} enregistrée avec succès !`);
    });

    // 8. حساب PV Évacuation تلقائياً للشهر
    function calculatePV() {
        const month = document.getElementById('date_exp').value.substring(0, 7);
        let tb=0, tdg=0, tdf=0, ts=0, tg=0;
        for(let i=0; i<localStorage.length; i++) {
            let k = localStorage.key(i);
            if(k.startsWith(`STEP_${month}`)) {
                let d = JSON.parse(localStorage.getItem(k));
                tb += Number(d.gestion.v_be); tdg += Number(d.gestion.dg); tdf += Number(d.gestion.df);
                ts += Number(d.gestion.sables); tg += Number(d.gestion.graisses);
            }
        }
        document.getElementById('pv_boues').innerText = tb.toFixed(1);
        document.getElementById('pv_dg').innerText = tdg.toFixed(1);
        document.getElementById('pv_df').innerText = tdf.toFixed(1);
        document.getElementById('pv_sables').innerText = ts.toFixed(1);
        document.getElementById('pv_graisses').innerText = tg.toFixed(1);
    }

    // 9. الحسابات المالية التفاعلية (Attachement)
    const finInputs = document.querySelectorAll('.fin-input');
    const totalHtField = document.getElementById('fin_total_ht');
    const tvaField = document.getElementById('fin_tva');
    const totalTtcField = document.getElementById('fin_total_ttc');

    function calculateFinance() {
        let totalHt = 0;
        finInputs.forEach(input => totalHt += Number(input.value) || 0);
        let tva = totalHt * 0.20;
        let totalTtc = totalHt + tva;
        totalHtField.value = totalHt.toFixed(2);
        tvaField.value = tva.toFixed(2);
        totalTtcField.value = totalTtc.toFixed(2);
    }
    finInputs.forEach(input => input.addEventListener('input', calculateFinance));

    document.getElementById('btnSaveFinance').addEventListener('click', () => {
        const month = document.getElementById('exportMonth').value || document.getElementById('date_exp').value.substring(0, 7);
        const financeData = {
            total_ht: totalHtField.value, tva: tvaField.value, total_ttc: totalTtcField.value
        };
        localStorage.setItem(`FINANCE_${month}`, JSON.stringify(financeData));
        alert(`✔ Attachement financier du mois ${month} enregistré !`);
    });

    // 10. التصدير الفعلي لملف Excel عبر SheetJS
    document.getElementById('btnExportExcel').addEventListener('click', () => {
        const month = document.getElementById('exportMonth').value;
        if(!month) return alert("Veuillez sélectionner un mois d'abord.");
        
        let wb = XLSX.utils.book_new();
        let recapData = [
            ["DATE", "pH Entrée", "Temp Entrée", "MES Entrée", "DBO5 Entrée", "DCO Entrée", "Vol. Entrée (m³)", "Vol. Sortie (m³)", "Énergie (kWh)"]
        ];

        for(let d=1; d<=31; d++) {
            let dayStr = d.toString().padStart(2, '0');
            let key = `STEP_${month}-${dayStr}`;
            let item = localStorage.getItem(key);
            if(item) {
                let data = JSON.parse(item);
                recapData.push([
                    data.date, data.entree.ph, data.entree.temp, data.entree.mes, data.entree.dbo5, data.entree.dco,
                    data.debits.tot_in, data.debits.tot_out, data.gestion.energie
                ]);
            }
        }

        if(recapData.length === 1) return alert("Aucune donnée enregistrée pour ce mois.");

        let ws = XLSX.utils.aoa_to_sheet(recapData);
        XLSX.utils.book_append_sheet(wb, ws, "Synthèse Mensuelle");
        XLSX.writeFile(wb, `Rapport_STEP_${month}.xlsx`);
    });
});
