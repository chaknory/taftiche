(function () {
    'use strict';

    window.createAdminInspectionModule = function createAdminInspectionModule(deps) {
        const {
            showToast,
            fmtDate,
            esc,
            openDeleteModal,
            printInspection,
            getAllRecords,
        } = deps;

        let allInspections = [];

        const inspectionModal = document.getElementById('inspectionModal');
        const inspectionForm = document.getElementById('inspectionForm');
        const inspectionSaveBtn = document.getElementById('inspectionSaveBtn');

        async function loadInspections() {
            try {
                const res = await fetch('api/admin/inspections.php', { credentials: 'same-origin' });
                const data = await res.json();
                if (!data.success) {
                    showToast('فشل تحميل زيارات التفتيش', 'error');
                    return;
                }
                allInspections = data.inspections || [];
                renderInspections(allInspections);
            } catch (err) {
                showToast('خطأ في الاتصال', 'error');
            }
        }

        function getAllInspections() {
            return allInspections;
        }

        function renderInspections(list) {
            const loading = document.getElementById('loadingInspections');
            const tbl = document.getElementById('tblInspections');
            const body = document.getElementById('bodyInspections');

            loading.style.display = 'none';
            tbl.style.display = 'table';
            body.innerHTML = '';

            if (!list.length) {
                body.innerHTML = '<tr><td colspan="11" style="text-align:center;color:var(--text-light);padding:30px">لا توجد زيارات تفتيش مسجلة</td></tr>';
                return;
            }

            list.forEach((ins, i) => {
                const teacherName = [esc(ins.family_name), esc(ins.first_name)].filter(Boolean).join(' ') || '–';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${teacherName}</td>
                <td>${esc(ins.school_name) || '–'}</td>
                <td>${esc(ins.inspector_name)}</td>
                <td>${fmtDate(ins.inspection_date)}</td>
                <td>${esc(ins.heure_visite) || '–'}</td>
                <td>${ins.duree_visite !== null && ins.duree_visite !== undefined && ins.duree_visite !== '' ? esc(ins.duree_visite) : '–'}</td>
                <td>${esc(ins.subject) || '–'}</td>
                <td>${fmtDate(ins.created_at)}</td>
                <td style="white-space:nowrap">
                    <div style="display:flex;gap:4px;align-items:center;justify-content:center">
                    <button class="btn-action btn-edit" data-id="${ins.id}" title="تعديل">تعديل</button>
                    <button class="btn-action btn-del"  data-id="${ins.id}" title="حذف">حذف</button>
                    <button class="btn-action btn-pdf"  data-id="${ins.id}" title="تصدير PDF">↓ PDF</button>
                    </div>
                </td>
            `;
                body.appendChild(tr);
            });

            body.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const ins = allInspections.find(r => String(r.id) === btn.dataset.id);
                    console.log('Editing inspection', ins);
                    if (ins) openInspectionModal(ins);
                });
            });

            body.querySelectorAll('.btn-del').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.dataset.id;
                    openDeleteModal(
                        'حذف زيارة التفتيش',
                        'هل تريد حذف هذه الزيارة نهائيًا؟ لا يمكن التراجع عن هذه العملية.',
                        async () => {
                            const res = await fetch('api/admin/inspections.php', {
                                method: 'DELETE',
                                credentials: 'same-origin',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: parseInt(id, 10) }),
                            });
                            const data = await res.json();
                            if (data.success) {
                                showToast('تم حذف الزيارة');
                                await loadInspections();
                            } else {
                                showToast(data.message || 'فشل الحذف', 'error');
                            }
                        }
                    );
                });
            });

            body.querySelectorAll('.btn-pdf').forEach(btn => {
                btn.addEventListener('click', () => {
                    const ins = allInspections.find(r => String(r.id) === btn.dataset.id);
                    const name = ins ? [ins.family_name, ins.first_name].filter(Boolean).join('_') : '';
                    printInspection(btn, btn.dataset.id, name);
                });
            });
        }

        function resetSelectedTeacherInfo() {
            document.getElementById('insp_teacher_fullname').textContent = '—';
            document.getElementById('insp_teacher_diploma').textContent = '—';
            document.getElementById('insp_teacher_grade').textContent = '—';
            document.getElementById('insp_teacher_echelon').textContent = '—';
            document.getElementById('insp_teacher_info').classList.add('hidden');
        }

        function updateSelectedTeacherInfo(teacherId, fallbackTeacherName) {
            if (!teacherId) {
                resetSelectedTeacherInfo();
                return;
            }

            const selectedTeacher = getAllRecords().find(r => String(r.id) === String(teacherId));
            if (!selectedTeacher) {
                if (!fallbackTeacherName) {
                    resetSelectedTeacherInfo();
                    return;
                }
                document.getElementById('insp_teacher_fullname').textContent = fallbackTeacherName;
                document.getElementById('insp_teacher_diploma').textContent = '—';
                document.getElementById('insp_teacher_grade').textContent = '—';
                document.getElementById('insp_teacher_echelon').textContent = '—';
                document.getElementById('insp_teacher_info').classList.remove('hidden');
                return;
            }

            document.getElementById('insp_teacher_fullname').textContent =
                [selectedTeacher.family_name, selectedTeacher.first_name].filter(Boolean).join(' ') || fallbackTeacherName || '—';
            document.getElementById('insp_teacher_diploma').textContent = selectedTeacher.diploma || '—';
            document.getElementById('insp_teacher_grade').textContent = selectedTeacher.grade || '—';
            document.getElementById('insp_teacher_echelon').textContent = selectedTeacher.echelon || '—';
            document.getElementById('insp_teacher_info').classList.remove('hidden');
        }

        function populateTeacherSelect() {
            const sel = document.getElementById('insp_teacher_select');
            sel.innerHTML = '<option value="">-- اختر الأستاذ --</option>';
            getAllRecords().forEach(r => {
                const opt = document.createElement('option');
                opt.value = r.id;
                opt.textContent = [r.family_name, r.first_name].filter(Boolean).join(' ');
                sel.appendChild(opt);
            });
        }

        function openInspectionModal(ins) {
            const isEdit = !!ins;
            document.getElementById('inspectionModalTitle').textContent = isEdit
                ? 'تعديل زيارة التفتيش'
                : 'إضافة زيارة تفتيش جديدة';

            inspectionForm.querySelectorAll('.edit-field').forEach(f => f.classList.remove('has-error'));

            document.getElementById('insp_id').value = isEdit ? ins.id : '';
            document.getElementById('insp_teacher_select').value = isEdit ? (ins.personal_info_id || '') : '';
            document.getElementById('insp_inspector_name').value = isEdit ? (ins.inspector_name || '') : '';
            document.getElementById('insp_inspection_date').value = isEdit
                ? (ins.inspection_date ? ins.inspection_date.split('T')[0].split(' ')[0] : '')
                : '';
            document.getElementById('insp_heure_visite').value = isEdit ? (ins.heure_visite || '') : '';
            document.getElementById('insp_duree_visite').value = isEdit && ins.duree_visite !== null && ins.duree_visite !== undefined
                ? ins.duree_visite
                : '';
            document.getElementById('insp_school_name').value = isEdit ? (ins.school_name || '') : '';
            document.getElementById('insp_subject').value = isEdit ? (ins.subject || '') : '';

            const teacherField = document.getElementById('insp_teacher_field');
            teacherField.style.display = isEdit ? 'none' : '';
            resetSelectedTeacherInfo();
            if (isEdit && ins.personal_info_id) {
                const fallbackTeacherName = [ins.family_name, ins.first_name].filter(Boolean).join(' ');
                updateSelectedTeacherInfo(ins.personal_info_id, fallbackTeacherName);
            }

            // Réinitialiser la grille d'observation
            const obsLoading = document.getElementById('insp_obs_loading');
            const obsGrid    = document.getElementById('insp_obs_grid');
            obsLoading.style.display = '';
            obsGrid.innerHTML = '';

            inspectionModal.classList.remove('hidden');
            inspectionModal.scrollTop = 0;

            // Charger le catalogue (avec réponses si édition)
            const catalogueUrl = isEdit
                ? `api/admin/inspections.php?id=${ins.id}`
                : 'api/admin/inspections.php?catalogue=1';

            fetch(catalogueUrl, { credentials: 'same-origin' })
                .then(r => r.json())
                .then(data => {
                    if (data.success && data.catalogue) {
                        renderObservationGrid(data.catalogue);
                    }
                })
                .catch(() => {/* ignore errors on catalogue load */})
                .finally(() => { obsLoading.style.display = 'none'; });
        }

        function closeInspectionModal() {
            inspectionModal.classList.add('hidden');
        }

        // ── Rendu de la grille d'observation ──────────────────────────────
        function renderObservationGrid(catalogue) {
            const grid = document.getElementById('insp_obs_grid');
            grid.innerHTML = '';

            catalogue.forEach(section => {
                if (!section.items || !section.items.length) return;

                const block = document.createElement('div');
                block.className = 'obs-section-block';

                const header = document.createElement('div');
                header.className = 'obs-section-header';
                header.textContent = section.titre;
                block.appendChild(header);

                section.items.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'obs-item-row';

                    const label = document.createElement('div');
                    label.className = 'obs-item-label';
                    label.textContent = item.libelle;
                    row.appendChild(label);

                    const controls = document.createElement('div');
                    controls.className = 'obs-item-controls';

                    const resp = item.response || null;

                    if (item.type_reponse === 'choix') {
                        const sel = document.createElement('select');
                        sel.className = 'obs-choice-select';
                        sel.dataset.itemId = item.id;
                        sel.dataset.type   = 'choix';
                        sel.innerHTML = '<option value="">—</option>';
                        (item.choices || []).forEach(ch => {
                            const opt = document.createElement('option');
                            opt.value = ch.id;
                            opt.textContent = ch.libelle;
                            if (resp && String(resp.choice_id) === String(ch.id)) opt.selected = true;
                            sel.appendChild(opt);
                        });
                        controls.appendChild(sel);

                    } else if (item.type_reponse === 'texte') {
                        const ta = document.createElement('textarea');
                        ta.className = 'obs-texte-input';
                        ta.dataset.itemId = item.id;
                        ta.dataset.type   = 'texte';
                        ta.rows = 2;
                        ta.value = resp ? (resp.valeur_texte || '') : '';
                        controls.appendChild(ta);

                    } else if (item.type_reponse === 'bool') {
                        const wrap = document.createElement('label');
                        wrap.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:.83rem';
                        const cb = document.createElement('input');
                        cb.type = 'checkbox';
                        cb.dataset.itemId = item.id;
                        cb.dataset.type   = 'bool';
                        cb.checked = resp ? !!parseInt(resp.valeur_bool, 10) : false;
                        wrap.appendChild(cb);
                        wrap.appendChild(document.createTextNode('نعم'));
                        controls.appendChild(wrap);

                    } else if (item.type_reponse === 'note') {
                        const inp = document.createElement('input');
                        inp.type = 'number';
                        inp.className = 'obs-note-input';
                        inp.dataset.itemId = item.id;
                        inp.dataset.type   = 'note';
                        inp.value = resp && resp.valeur_num !== null ? resp.valeur_num : '';
                        controls.appendChild(inp);
                    }

                    // Commentaire optionnel
                    const comm = document.createElement('input');
                    comm.type = 'text';
                    comm.className = 'obs-commentaire-input';
                    comm.dataset.itemId = item.id;
                    comm.dataset.commentaire = '1';
                    comm.placeholder = 'ملاحظة إضافية…';
                    comm.value = resp ? (resp.commentaire || '') : '';
                    controls.appendChild(comm);

                    row.appendChild(controls);
                    block.appendChild(row);
                });

                grid.appendChild(block);
            });
        }

        // ── Collecte des réponses depuis la grille ─────────────────────────
        function collectObservationResponses() {
            const grid = document.getElementById('insp_obs_grid');
            if (!grid) return [];

            // Index des commentaires par item_id
            const commentaires = {};
            grid.querySelectorAll('[data-commentaire]').forEach(el => {
                const v = el.value.trim();
                if (v) commentaires[el.dataset.itemId] = v;
            });

            const responses = [];
            grid.querySelectorAll('[data-item-id]:not([data-commentaire])').forEach(el => {
                const itemId = parseInt(el.dataset.itemId, 10);
                const type = el.dataset.type;
                const resp = { item_id: itemId, commentaire: commentaires[itemId] || null };

                if (type === 'choix') {
                    resp.choice_id = el.value ? parseInt(el.value, 10) : null;
                } else if (type === 'texte') {
                    resp.valeur_texte = el.value.trim() || null;
                } else if (type === 'bool') {
                    resp.valeur_bool = el.checked ? 1 : 0;
                } else if (type === 'note') {
                    resp.valeur_num = el.value !== '' ? parseFloat(el.value) : null;
                }

                // N'envoyer que si au moins une valeur est renseignée
                const hasValue = resp.choice_id != null
                    || resp.valeur_texte != null
                    || resp.valeur_bool != null
                    || resp.valeur_num != null
                    || resp.commentaire != null;
                if (hasValue) responses.push(resp);
            });

            return responses;
        }

        document.getElementById('searchInspections').addEventListener('input', function () {
            const q = this.value.trim().toLowerCase();
            if (!q) {
                renderInspections(allInspections);
                return;
            }
            renderInspections(allInspections.filter(ins =>
                (ins.first_name || '').toLowerCase().includes(q) ||
                (ins.family_name || '').toLowerCase().includes(q) ||
                (ins.school_name || '').toLowerCase().includes(q) ||
                (ins.inspector_name || '').toLowerCase().includes(q) ||
                (ins.heure_visite || '').toLowerCase().includes(q) ||
                String(ins.duree_visite || '').toLowerCase().includes(q) ||
                (ins.subject || '').toLowerCase().includes(q)
            ));
        });

        document.getElementById('openAddInspectionBtn').addEventListener('click', () => {
            populateTeacherSelect();
            openInspectionModal(null);
        });

        document.getElementById('insp_teacher_select').addEventListener('change', function () {
            updateSelectedTeacherInfo(this.value);
        });

        document.getElementById('inspectionModalClose').addEventListener('click', closeInspectionModal);
        document.getElementById('inspectionCancelBtn').addEventListener('click', closeInspectionModal);
        inspectionModal.addEventListener('click', e => {
            if (e.target === inspectionModal) {
                closeInspectionModal();
            }
        });

        inspectionForm.addEventListener('submit', async e => {
            e.preventDefault();
            inspectionForm.querySelectorAll('.edit-field').forEach(f => f.classList.remove('has-error'));

            const id = document.getElementById('insp_id').value;
            const isEdit = !!id;
            const teacherId = document.getElementById('insp_teacher_select').value;
            const inspectorName = document.getElementById('insp_inspector_name').value.trim();
            const inspectionDate = document.getElementById('insp_inspection_date').value;
            const heureVisite = document.getElementById('insp_heure_visite').value;
            const dureeVisiteRaw = document.getElementById('insp_duree_visite').value;
            const schoolName = document.getElementById('insp_school_name').value;
            const subject = document.getElementById('insp_subject').value.trim();

            let valid = true;

            if (!isEdit && !teacherId) {
                document.getElementById('insp_teacher_field').classList.add('has-error');
                valid = false;
            }
            if (!inspectorName) {
                document.getElementById('insp_inspector_field').classList.add('has-error');
                valid = false;
            }
            if (!inspectionDate) {
                document.getElementById('insp_date_field').classList.add('has-error');
                valid = false;
            }
            if (heureVisite && !/^([01]\d|2[0-3]):[0-5]\d$/.test(heureVisite)) {
                document.getElementById('insp_time_field').classList.add('has-error');
                valid = false;
            }
            if (dureeVisiteRaw !== '' && Number.isNaN(Number(dureeVisiteRaw))) {
                document.getElementById('insp_duration_field').classList.add('has-error');
                valid = false;
            }
            if (!valid) {
                showToast('يرجى تعبئة الحقول الإلزامية', 'error');
                return;
            }

            const dureeVisite = dureeVisiteRaw === '' ? null : Number(dureeVisiteRaw);

            const payload = isEdit
                ? {
                    id: parseInt(id, 10),
                    inspector_name: inspectorName,
                    inspection_date: inspectionDate,
                    heure_visite: heureVisite || null,
                    duree_visite: dureeVisite,
                    school_name: schoolName,
                    subject,
                }
                : {
                    personal_info_id: parseInt(teacherId, 10),
                    inspector_name: inspectorName,
                    inspection_date: inspectionDate,
                    heure_visite: heureVisite || null,
                    duree_visite: dureeVisite,
                    school_name: schoolName,
                    subject,
                };

            payload.responses = collectObservationResponses();

            inspectionSaveBtn.disabled = true;
            inspectionSaveBtn.textContent = 'جارٍ الحفظ…';

            try {
                const res = await fetch('api/admin/inspections.php', {
                    method: isEdit ? 'PUT' : 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();

                if (data.success) {
                    closeInspectionModal();
                    showToast(isEdit ? 'تم تحديث الزيارة بنجاح' : 'تمت إضافة الزيارة بنجاح');
                    await loadInspections();
                } else {
                    const errs = data.errors || {};
                    if (errs.personal_info_id) {
                        document.getElementById('insp_teacher_field').classList.add('has-error');
                    }
                    if (errs.inspector_name) {
                        document.getElementById('insp_inspector_field').classList.add('has-error');
                    }
                    if (errs.inspection_date) {
                        document.getElementById('insp_date_field').classList.add('has-error');
                    }
                    if (errs.heure_visite) {
                        document.getElementById('insp_time_field').classList.add('has-error');
                    }
                    if (errs.duree_visite) {
                        document.getElementById('insp_duration_field').classList.add('has-error');
                    }
                    showToast(data.message || 'فشل الحفظ', 'error');
                }
            } catch (err) {
                showToast('خطأ في الاتصال بالخادم', 'error');
            } finally {
                inspectionSaveBtn.disabled = false;
                inspectionSaveBtn.textContent = 'حفظ الزيارة';
            }
        });

        return {
            loadInspections,
            getAllInspections,
        };
    };
})();
