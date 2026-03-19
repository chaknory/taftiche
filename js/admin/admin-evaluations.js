(function () {
    'use strict';

    window.createAdminEvaluationsModule = function createAdminEvaluationsModule(deps) {
        const {
            showToast,
            fmtDate,
            esc,
            openDeleteModal,
            getAllInspections,
        } = deps;

        let allEvaluations = [];

        const evalModal    = document.getElementById('evalModal');
        const evalForm     = document.getElementById('evalForm');
        const evalSaveBtn  = document.getElementById('evalSaveBtn');

        // ── Chargement ────────────────────────────────────────────────────
        async function loadEvaluations() {
            try {
                const res  = await fetch('api/admin/evaluations.php', { credentials: 'same-origin' });
                const data = await res.json();
                if (!data.success) {
                    showToast('فشل تحميل التقييمات', 'error');
                    return;
                }
                allEvaluations = data.evaluations || [];
                renderEvaluations(allEvaluations);
            } catch (err) {
                showToast('خطأ في الاتصال', 'error');
            }
        }

        function getAllEvaluations() { return allEvaluations; }

        // ── Rendu tableau ─────────────────────────────────────────────────
        function renderEvaluations(list) {
            const loading = document.getElementById('loadingEvaluations');
            const tbl     = document.getElementById('tblEvaluations');
            const body    = document.getElementById('bodyEvaluations');

            loading.style.display = 'none';
            tbl.style.display     = 'table';
            body.innerHTML        = '';

            if (!list.length) {
                body.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-light);padding:30px">لا توجد تقييمات مسجلة</td></tr>';
                return;
            }

            list.forEach((ev, i) => {
                const teacherName = [esc(ev.family_name), esc(ev.first_name)].filter(Boolean).join(' ') || '–';
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${i + 1}</td>
                    <td><strong>${esc(ev.titre)}</strong></td>
                    <td>${teacherName}</td>
                    <td>${esc(ev.school_name) || '–'}</td>
                    <td>${fmtDate(ev.inspection_date)}</td>
                    <td>${ev.note_finale !== null && ev.note_finale !== undefined && ev.note_finale !== '' ? esc(String(ev.note_finale)) : '–'}</td>
                    <td>${fmtDate(ev.created_at)}</td>
                    <td style="white-space:nowrap">
                        <div style="display:flex;gap:4px;align-items:center;justify-content:center">
                            <button class="btn-action btn-edit" data-id="${ev.id}" title="تعديل">تعديل</button>
                            <button class="btn-action btn-del"  data-id="${ev.id}" title="حذف">حذف</button>
                        </div>
                    </td>
                `;
                body.appendChild(tr);
            });

            body.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    try {
                        const res  = await fetch(`api/admin/evaluations.php?id=${id}`, { credentials: 'same-origin' });
                        const data = await res.json();
                        if (data.success) {
                            openEvalModal(data.evaluation);
                        } else {
                            showToast('فشل تحميل بيانات التقييم', 'error');
                        }
                    } catch (_) {
                        showToast('خطأ في الاتصال', 'error');
                    }
                });
            });

            body.querySelectorAll('.btn-del').forEach(btn => {
                btn.addEventListener('click', () => {
                    openDeleteModal(
                        'حذف التقييم',
                        'هل تريد حذف هذا التقييم نهائيًا؟ لا يمكن التراجع عن هذه العملية.',
                        async () => {
                            const res  = await fetch('api/admin/evaluations.php', {
                                method: 'DELETE',
                                credentials: 'same-origin',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: parseInt(btn.dataset.id, 10) }),
                            });
                            const data = await res.json();
                            if (data.success) {
                                showToast('تم حذف التقييم');
                                await loadEvaluations();
                            } else {
                                showToast(data.message || 'فشل الحذف', 'error');
                            }
                        }
                    );
                });
            });
        }

        // ── Sections dynamiques ────────────────────────────────────────────

        function createSectionBlock(sectionData) {
            const block = document.createElement('div');
            block.className = 'eval-section-block';

            // Header: titre + remove button
            const header = document.createElement('div');
            header.className = 'eval-section-header';

            const titleInput = document.createElement('input');
            titleInput.type        = 'text';
            titleInput.className   = 'eval-sec-titre';
            titleInput.placeholder = 'عنوان القسم (مثال: نقاط القوة)';
            titleInput.maxLength   = 200;
            titleInput.value       = sectionData?.titre || '';

            const removeBtn = document.createElement('button');
            removeBtn.setAttribute('type', 'button');
            removeBtn.className   = 'btn-eval-remove';
            removeBtn.textContent = '✕ حذف القسم';
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                block.remove();
                updateSectionsEmptyState();
            });

            header.appendChild(titleInput);
            header.appendChild(removeBtn);
            block.appendChild(header);

            // Body: optional contenu + subsections + add-subsection button
            const body = document.createElement('div');
            body.className = 'eval-section-body';

            const contenu = document.createElement('textarea');
            contenu.className   = 'eval-section-contenu';
            contenu.placeholder = 'ملاحظة نصية للقسم (اختياري)';
            contenu.rows        = 2;
            contenu.value       = sectionData?.contenu || '';
            body.appendChild(contenu);

            // Sub-sections container
            const subsContainer = document.createElement('div');
            subsContainer.className = 'eval-subsections-container';
            body.appendChild(subsContainer);

            // Pre-fill subsections
            if (sectionData?.subsections) {
                sectionData.subsections.forEach(sub => subsContainer.appendChild(createSubsectionBlock(sub)));
            }

            // Add subsection button
            const addSubBtn = document.createElement('button');
            addSubBtn.setAttribute('type', 'button');
            addSubBtn.className   = 'btn-eval-add-subsection';
            addSubBtn.textContent = '+ إضافة محتوى فرعي';
            addSubBtn.addEventListener('click', (e) => {
                e.preventDefault();
                subsContainer.appendChild(createSubsectionBlock(null));
            });
            body.appendChild(addSubBtn);

            // Add بند button (shortcut: creates a liste-type subsection + first item row)
            const addBandBtn = document.createElement('button');
            addBandBtn.setAttribute('type', 'button');
            addBandBtn.className   = 'btn-eval-add-item';
            addBandBtn.textContent = '+ إضافة بند';
            addBandBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const sub = createSubsectionBlock({ type: 'liste', contenu: '', items: [] });
                subsContainer.appendChild(sub);
                addItemRow(sub.querySelector('.eval-items-container'));
                const inputs = sub.querySelectorAll('.eval-item-libelle');
                if (inputs.length) inputs[inputs.length - 1].focus();
            });
            body.appendChild(addBandBtn);

            block.appendChild(body);
            return block;
        }

        function createSubsectionBlock(subData) {
            const block = document.createElement('div');
            block.className = 'eval-subsection-block';

            // Header: type select + remove button
            const header = document.createElement('div');
            header.className = 'eval-subsection-header';

            const typeLabel = document.createElement('label');
            typeLabel.textContent = 'النوع:';
            typeLabel.style.cssText = 'font-size:.78rem;color:#1a3a5c;font-weight:600;flex-shrink:0';

            const typeSelect = document.createElement('select');
            typeSelect.className = 'eval-subsec-type';
            [['texte', 'نص حر'], ['liste', 'قائمة بنود']].forEach(([val, lbl]) => {
                const opt = document.createElement('option');
                opt.value       = val;
                opt.textContent = lbl;
                if ((subData?.type || 'texte') === val) opt.selected = true;
                typeSelect.appendChild(opt);
            });

            const removeBtn = document.createElement('button');
            removeBtn.setAttribute('type', 'button');
            removeBtn.className   = 'btn-eval-remove';
            removeBtn.textContent = '✕ حذف';
            removeBtn.style.marginRight = 'auto';
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                block.remove();
            });

            header.appendChild(typeLabel);
            header.appendChild(typeSelect);
            header.appendChild(removeBtn);
            block.appendChild(header);

            // Body: contenu textarea + items section
            const body = document.createElement('div');
            body.className = 'eval-subsection-body';

            const contenu = document.createElement('textarea');
            contenu.className   = 'eval-subsec-contenu';
            contenu.placeholder = 'محتوى نصي (اختياري)';
            contenu.rows        = 2;
            contenu.value       = subData?.contenu || '';
            body.appendChild(contenu);

            // Items section (only shown for 'liste' type)
            const itemsSection = document.createElement('div');
            itemsSection.className = 'eval-items-container';

            if (subData?.items) {
                subData.items.forEach(item => addItemRow(itemsSection, item));
            }

            const addItemBtn = document.createElement('button');
            addItemBtn.setAttribute('type', 'button');
            addItemBtn.className   = 'btn-eval-add-item';
            addItemBtn.textContent = '+ إضافة بند';
            addItemBtn.addEventListener('click', (e) => {
                e.preventDefault();
                addItemRow(itemsSection);
                const inputs = itemsSection.querySelectorAll('.eval-item-libelle');
                if (inputs.length) inputs[inputs.length - 1].focus();
            });

            body.appendChild(itemsSection);
            body.appendChild(addItemBtn);
            block.appendChild(body);

            // Show/hide items based on type
            function toggleItemsVisibility() {
                const isListe = typeSelect.value === 'liste';
                itemsSection.style.display = isListe ? '' : 'none';
                addItemBtn.style.display   = isListe ? '' : 'none';
                contenu.placeholder = isListe
                    ? 'وصف اختياري للقائمة'
                    : 'محتوى نصي (اختياري)';
            }
            typeSelect.addEventListener('change', toggleItemsVisibility);
            toggleItemsVisibility();

            return block;
        }

        function addItemRow(container, itemData) {
            const row = document.createElement('div');
            row.className = 'eval-item-row';

            const libelle = document.createElement('input');
            libelle.type        = 'text';
            libelle.className   = 'eval-item-libelle';
            libelle.placeholder = 'البند…';
            libelle.maxLength   = 500;
            libelle.value       = itemData?.item || '';

            const removeBtn = document.createElement('button');
            removeBtn.setAttribute('type', 'button');
            removeBtn.className   = 'btn-eval-remove';
            removeBtn.textContent = '✕';
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                row.remove();
            });

            row.appendChild(libelle);
            row.appendChild(removeBtn);
            container.appendChild(row);
        }

        function updateSectionsEmptyState() {
            const container = document.getElementById('eval_sections_container');
            const empty     = document.getElementById('eval_sections_empty');
            empty.style.display = container.children.length === 0 ? '' : 'none';
        }

        // ── Modal open / close ────────────────────────────────────────────

        function populateInspectionSelect(selectedId) {
            const sel = document.getElementById('eval_inspection_id');
            sel.innerHTML = '<option value="">-- اختر الزيارة --</option>';
            getAllInspections().forEach(ins => {
                const teacherName = [ins.family_name, ins.first_name].filter(Boolean).join(' ');
                const label = `${fmtDate(ins.inspection_date)} – ${ins.school_name || ''} – ${teacherName}`.replace(/–\s*–/g, '–');
                const opt = document.createElement('option');
                opt.value       = ins.id;
                opt.textContent = label;
                if (selectedId && String(ins.id) === String(selectedId)) opt.selected = true;
                sel.appendChild(opt);
            });
        }

        function openEvalModal(ev) {
            const isEdit = !!ev;
            document.getElementById('evalModalTitle').textContent = isEdit
                ? 'تعديل التقييم'
                : 'إضافة تقييم جديد';

            evalForm.querySelectorAll('.edit-field').forEach(f => f.classList.remove('has-error'));

            document.getElementById('eval_id').value          = isEdit ? ev.id : '';
            document.getElementById('eval_titre').value       = isEdit ? (ev.titre || '') : '';
            document.getElementById('eval_note_finale').value = isEdit && ev.note_finale !== null && ev.note_finale !== undefined
                ? ev.note_finale : '';

            populateInspectionSelect(isEdit ? ev.inspection_id : null);

            // Sections
            const container = document.getElementById('eval_sections_container');
            container.innerHTML = '';
            (isEdit && ev.sections ? ev.sections : []).forEach(sec => {
                container.appendChild(createSectionBlock(sec));
            });
            updateSectionsEmptyState();

            evalModal.classList.remove('hidden');
            evalModal.scrollTop = 0;
        }

        function closeEvalModal() {
            evalModal.classList.add('hidden');
        }

        // ── Collecte données ──────────────────────────────────────────────

        function collectSections() {
            const sections = [];
            document.querySelectorAll('#eval_sections_container .eval-section-block').forEach(block => {
                const titre   = block.querySelector('.eval-sec-titre')?.value.trim() || '';
                const contenu = block.querySelector(':scope > .eval-section-body > .eval-section-contenu')?.value.trim() || '';
                const subsections = [];
                block.querySelectorAll('.eval-subsection-block').forEach(subBlock => {
                    const type       = subBlock.querySelector('.eval-subsec-type')?.value || 'texte';
                    const subContenu = subBlock.querySelector('.eval-subsec-contenu')?.value.trim() || '';
                    const items      = [];
                    subBlock.querySelectorAll('.eval-item-libelle').forEach(input => {
                        const item = (input.value || '').trim();
                        if (item) items.push({ item });
                    });
                    subsections.push({ type, contenu: subContenu || null, items });
                });
                if (titre) sections.push({ titre, contenu: contenu || null, subsections });
            });
            console.debug('[eval] collectSections:', JSON.stringify(sections));
            return sections;
        }

        // ── Event listeners ───────────────────────────────────────────────

        document.getElementById('openAddEvalBtn').addEventListener('click', () => {
            openEvalModal(null);
        });

        document.getElementById('addEvalSectionBtn').addEventListener('click', () => {
            const container = document.getElementById('eval_sections_container');
            container.appendChild(createSectionBlock(null));
            updateSectionsEmptyState();
        });

        document.getElementById('evalModalClose').addEventListener('click', closeEvalModal);
        document.getElementById('evalCancelBtn').addEventListener('click', closeEvalModal);
        evalModal.addEventListener('click', e => {
            if (e.target === evalModal) closeEvalModal();
        });

        document.getElementById('searchEvaluations').addEventListener('input', function () {
            const q = this.value.trim().toLowerCase();
            if (!q) { renderEvaluations(allEvaluations); return; }
            renderEvaluations(allEvaluations.filter(ev =>
                (ev.titre       || '').toLowerCase().includes(q) ||
                (ev.first_name  || '').toLowerCase().includes(q) ||
                (ev.family_name || '').toLowerCase().includes(q) ||
                (ev.school_name || '').toLowerCase().includes(q)
            ));
        });

        evalForm.addEventListener('submit', async e => {
            e.preventDefault();
            evalForm.querySelectorAll('.edit-field').forEach(f => f.classList.remove('has-error'));

            const id          = document.getElementById('eval_id').value;
            const isEdit      = !!id;
            const titre       = document.getElementById('eval_titre').value.trim();
            const noteRaw     = document.getElementById('eval_note_finale').value;
            const inspectionId = document.getElementById('eval_inspection_id').value;
            const sections    = collectSections();

            let valid = true;
            if (!titre) {
                document.getElementById('eval_titre_field').classList.add('has-error');
                valid = false;
            }
            if (!inspectionId) {
                document.getElementById('eval_insp_field').classList.add('has-error');
                valid = false;
            }
            if (noteRaw !== '' && (isNaN(Number(noteRaw)) || Number(noteRaw) < 0 || Number(noteRaw) > 20)) {
                document.getElementById('eval_note_field').classList.add('has-error');
                valid = false;
            }
            if (!valid) {
                showToast('يرجى تعبئة الحقول الإلزامية', 'error');
                return;
            }

            const payload = {
                titre,
                note_finale: noteRaw !== '' ? Number(noteRaw) : null,
                inspection_id: inspectionId ? parseInt(inspectionId, 10) : null,
                sections,
            };
            if (isEdit) payload.id = parseInt(id, 10);

            evalSaveBtn.disabled    = true;
            evalSaveBtn.textContent = 'جارٍ الحفظ…';

            try {
                const res  = await fetch('api/admin/evaluations.php', {
                    method: isEdit ? 'PUT' : 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();

                if (data.success) {
                    closeEvalModal();
                    showToast(isEdit ? 'تم تحديث التقييم بنجاح' : 'تمت إضافة التقييم بنجاح');
                    await loadEvaluations();
                } else {
                    const errs = data.errors || {};
                    if (errs.titre)         document.getElementById('eval_titre_field').classList.add('has-error');
                    if (errs.inspection_id) document.getElementById('eval_insp_field').classList.add('has-error');
                    if (errs.note_finale)   document.getElementById('eval_note_field').classList.add('has-error');
                    showToast(data.message || 'فشل الحفظ', 'error');
                }
            } catch (_) {
                showToast('خطأ في الاتصال بالخادم', 'error');
            } finally {
                evalSaveBtn.disabled    = false;
                evalSaveBtn.textContent = 'حفظ التقييم';
            }
        });

        return { loadEvaluations, getAllEvaluations };
    };
})();
