(function () {
    'use strict';

    window.createAdminSchoolsModule = function createAdminSchoolsModule(deps) {
        const {
            showToast,
            esc,
            openDeleteModal,
        } = deps;

        let allSchools = [];

        const schoolModal = document.getElementById('schoolModal');
        const schoolForm = document.getElementById('schoolForm');
        const schoolSaveBtn = document.getElementById('schoolSaveBtn');

        async function loadSchools() {
            try {
                const res = await fetch('api/admin/schools.php', { credentials: 'same-origin' });
                const data = await res.json();
                if (!data.success) {
                    showToast('فشل تحميل المدارس', 'error');
                    return;
                }
                allSchools = data.schools || [];
                renderSchools();
                populateAllSchoolSelects();
            } catch {
                showToast('خطأ في الاتصال', 'error');
            }
        }

        function populateAllSchoolSelects() {
            ['ef_school_name', 'ar_school_name', 'insp_school_name'].forEach(id => {
                const sel = document.getElementById(id);
                if (!sel) {
                    return;
                }
                const current = sel.value;
                sel.innerHTML = '<option value="">-- اختر --</option>';
                allSchools.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.nom;
                    opt.textContent = s.nom;
                    sel.appendChild(opt);
                });
                if (current) {
                    sel.value = current;
                }
            });
        }

        function renderSchools(filter) {
            const q = (filter || '').toLowerCase();
            const list = allSchools.filter(s =>
                !q ||
                (s.nom || '').toLowerCase().includes(q) ||
                (s.district || '').toLowerCase().includes(q)
            );
            const body = document.getElementById('bodySchools');
            body.innerHTML = '';
            if (!list.length) {
                body.innerHTML = '<tr><td colspan="13" class="empty-row">لا توجد مدارس</td></tr>';
                return;
            }
            list.forEach((s, i) => {
                const district = s.district || '';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${esc(s.nom)}</td>
                <td>${esc(district) || '–'}</td>
                <td>${esc(s.adresse) || '–'}</td>
                <td>${esc(s.ville) || '–'}</td>
                <td class="cell-center">${s.nb_directeur ?? 0}</td>
                <td class="cell-center">${s.nb_sub_dir ?? 0}</td>
                <td class="cell-center">${s.nb_Prf_arb ?? 0}</td>
                <td class="cell-center">${s.nb_prf_frc ?? 0}</td>
                <td class="cell-center">${s.nb_prf_ang ?? 0}</td>
                <td class="cell-center">${s.nb_prf_sprt ?? 0}</td>
                <td class="cell-nowrap">
                    <div class="inline-actions">
                    <button class="btn-action btn-edit" data-id="${s.id}" title="تعديل">✏ تعديل</button>
                    <button class="btn-action btn-del"  data-id="${s.id}" title="حذف">حذف</button>
                    </div>
                </td>`;
                body.appendChild(tr);
            });
            body.querySelectorAll('.btn-edit').forEach(btn =>
                btn.addEventListener('click', () => {
                    const school = allSchools.find(s => String(s.id) === btn.dataset.id);
                    if (school) {
                        openSchoolModal(school);
                    }
                })
            );
            body.querySelectorAll('.btn-del').forEach(btn =>
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    const school = allSchools.find(s => String(s.id) === id);
                    const nom = school ? school.nom : '';
                    openDeleteModal('حذف المدرسة', `هل تريد حذف المدرسة "${nom}"؟`, async () => {
                        const res = await fetch('api/admin/schools.php', {
                            method: 'DELETE', credentials: 'same-origin',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: parseInt(id, 10) }),
                        });
                        const data = await res.json();
                        if (data.success) {
                            showToast('تم حذف المدرسة');
                            await loadSchools();
                        } else {
                            showToast(data.message || 'فشل الحذف', 'error');
                        }
                    });
                })
            );
        }

        function openSchoolModal(school) {
            const isEdit = !!school;
            document.getElementById('schoolModalTitle').textContent = isEdit ? 'تعديل المدرسة' : 'إضافة مدرسة';
            document.getElementById('school_id').value = isEdit ? school.id : '';
            document.getElementById('school_name_input').value = isEdit ? school.nom : '';
            document.getElementById('school_code_input').value = isEdit ? (school.code || '') : '';
            document.getElementById('school_adresse_input').value = isEdit ? (school.adresse || '') : '';
            document.getElementById('school_ville_input').value = isEdit ? (school.ville || '') : '';
            document.getElementById('school_nb_directeur').value = isEdit ? (school.nb_directeur ?? 0) : 0;
            document.getElementById('school_nb_sub_dir').value = isEdit ? (school.nb_sub_dir ?? 0) : 0;
            document.getElementById('school_nb_prf_arb').value = isEdit ? (school.nb_Prf_arb ?? 0) : 0;
            document.getElementById('school_nb_prf_frc').value = isEdit ? (school.nb_prf_frc ?? 0) : 0;
            document.getElementById('school_nb_prf_ang').value = isEdit ? (school.nb_prf_ang ?? 0) : 0;
            document.getElementById('school_nb_prf_sprt').value = isEdit ? (school.nb_prf_sprt ?? 0) : 0;
            document.getElementById('school_district_input').value = isEdit ? (school.district || '') : '';
            document.getElementById('school_name_field').classList.remove('has-error');
            schoolModal.classList.remove('hidden');
            document.getElementById('school_name_input').focus();
        }

        function closeSchoolModal() {
            schoolModal.classList.add('hidden');
        }

        document.getElementById('openAddSchoolBtn').addEventListener('click', () => openSchoolModal(null));
        document.getElementById('schoolModalClose').addEventListener('click', closeSchoolModal);
        document.getElementById('schoolCancelBtn').addEventListener('click', closeSchoolModal);
        schoolModal.addEventListener('click', e => {
            if (e.target === schoolModal) {
                closeSchoolModal();
            }
        });

        schoolForm.addEventListener('submit', async e => {
            e.preventDefault();
            const id = document.getElementById('school_id').value;
            const nom = document.getElementById('school_name_input').value.trim();
            const district = document.getElementById('school_district_input').value.trim() || null;
            const code = document.getElementById('school_code_input').value.trim() || null;
            const adresse = document.getElementById('school_adresse_input').value.trim() || null;
            const ville = document.getElementById('school_ville_input').value.trim() || null;
            const nb_directeur = parseInt(document.getElementById('school_nb_directeur').value, 10) || 0;
            const nb_sub_dir = parseInt(document.getElementById('school_nb_sub_dir').value, 10) || 0;
            const nb_Prf_arb = parseInt(document.getElementById('school_nb_prf_arb').value, 10) || 0;
            const nb_prf_frc = parseInt(document.getElementById('school_nb_prf_frc').value, 10) || 0;
            const nb_prf_ang = parseInt(document.getElementById('school_nb_prf_ang').value, 10) || 0;
            const nb_prf_sprt = parseInt(document.getElementById('school_nb_prf_sprt').value, 10) || 0;
            const isEdit = !!id;
            if (!nom) {
                document.getElementById('school_name_field').classList.add('has-error');
                return;
            }
            const fields = { nom, district, code, adresse, ville, nb_directeur, nb_sub_dir, nb_Prf_arb, nb_prf_frc, nb_prf_ang, nb_prf_sprt };
            const payload = isEdit ? { id: parseInt(id, 10), ...fields } : fields;
            schoolSaveBtn.disabled = true;
            schoolSaveBtn.textContent = 'جارٍ الحفظ…';
            try {
                const res = await fetch('api/admin/schools.php', {
                    method: isEdit ? 'PUT' : 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (data.success) {
                    closeSchoolModal();
                    showToast(isEdit ? 'تم تحديث المدرسة' : 'تمت إضافة المدرسة');
                    await loadSchools();
                } else {
                    if (data.errors && data.errors.nom) {
                        document.getElementById('school_name_field').classList.add('has-error');
                    }
                    showToast(data.message || 'فشل الحفظ', 'error');
                }
            } catch {
                showToast('خطأ في الاتصال', 'error');
            } finally {
                schoolSaveBtn.disabled = false;
                schoolSaveBtn.textContent = 'حفظ';
            }
        });

        document.getElementById('searchSchools').addEventListener('input', function () {
            renderSchools(this.value.trim());
        });

        return {
            loadSchools,
            renderSchools,
        };
    };
})();
