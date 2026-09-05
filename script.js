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
        });
    });

    const todayStr = new Date().toISOString().split('T')[0];
    document.getElementById('date_exp').value = todayStr;

    document.querySelectorAll('.accordion-header').forEach(h => {
        h.addEventListener('click', () => {
            h.nextElementSibling.classList.toggle('active');
            h.classList.toggle('active-header');
        });
    });

    // ----- إدارة الصور المصغرة وتحويلها لصيغة Base64 للـ PDF -----
    let interventionPhotosBase64 = []; // مصفوفة لتخزين الصور
    
    document.getElementById('interv_photos').addEventListener('change', function(e) {
        const previewContainer = document.getElementById('photos_preview');
        previewContainer.innerHTML = ''; 
        interventionPhotosBase64 = []; // تصفير المصفوفة
        
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if(file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64Str = event.target.result;
                    interventionPhotosBase64.push(base64Str); // حفظ الصورة
                    
                    const img = document.createElement('img');
                    img.src = base64Str;
                    previewContainer.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    });

    // ----- توليد ملف الـ PDF لتقرير التدخل -----
    document.getElementById('btnGeneratePDF').addEventListener('click', () => {
        // التحقق من كتابة اسم المعدة على الأقل
        let equipName = document.getElementById('interv_equip').value;
        if(!equipName) {
            alert("Veuillez saisir au moins le nom de l'équipement d'intervention !");
            return;
        }

        // 1. إعداد التاريخ والوقت الآلي
        let now = new Date();
        let dateTimeStr = now.toLocaleDateString('fr-FR') + ' à ' + now.toLocaleTimeString('fr-FR');
        document.getElementById('pdf_date_heure').innerText = dateTimeStr;

        // 2. تعبئة البيانات في القالب المخفي
        document.getElementById('pdf_equip').innerText = equipName;
        document.getElementById('pdf_puiss').innerText = document.getElementById('interv_puiss').value || '-';
        document.getElementById('pdf_role').innerText = document.getElementById('interv_role').value || '-';
        document.getElementById('pdf_date_int').innerText = document.getElementById('interv_date').value || '-';
        document.getElementById('pdf_duree').innerText = document.getElementById('interv_duree').value || '-';
        document.getElementById('pdf_materiel').innerText = document.getElementById('interv_materiel').value || '-';
        document.getElementById('pdf_pdr').innerText = document.getElementById('interv_pdr').value || '-';

        // 3. حقن الصور في القالب المخفي
        let photosContainer = document.getElementById('pdf_photos_container');
        photosContainer.innerHTML = '';
        if(interventionPhotosBase64.length === 0) {
            photosContainer.innerHTML = '<p style="color: #64748b; font-style: italic;">Aucune photo jointe.</p>';
        } else {
            interventionPhotosBase64.forEach(src => {
                let img = document.createElement('img');
                img.src = src;
                // تنسيق الصورة داخل الـ PDF
                img.style.width = "45%";
                img.style.maxHeight = "250px";
                img.style.objectFit = "contain";
                img.style.border = "1px solid #cbd5e1";
                img.style.padding = "5px";
                img.style.borderRadius = "8px";
                photosContainer.appendChild(img);
            });
        }

        // 4. استدعاء مكتبة html2pdf لتوليد الملف
        const element = document.getElementById('pdf-report-content');
        const container = document.getElementById('pdf-report-container');
        
        // إظهار العنصر مؤقتاً ليتسنى للمكتبة تصويره
        container.style.display = 'block';

        let opt = {
            margin:       0.5, // هوامش الصفحة
            filename:     `Intervention_${equipName}_${now.toISOString().split('T')[0]}.pdf`, // اسم الملف الآلي
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true }, // scale:2 لرفع دقة الـ PDF
            jsPDF:        { unit: 'in', format: 'A4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            // إخفاء القالب مرة أخرى بعد التحميل
            container.style.display = 'none';
        }).catch(err => {
            console.error("Erreur PDF: ", err);
            container.style.display = 'none';
        });
    });

    // (احتفظ بباقي دوال حفظ Excel وحساب الـ PV أسفل هذا الكود كما هي)
});
