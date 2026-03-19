(function () {
    'use strict';

    // ── Auth guard: admin only ─────────────────────────────────────────────
    let currentAdmin = null;

    async function bootAdmin() {
        try {
            const res  = await fetch('api/auth/session.php', { credentials: 'same-origin' });
            const data = await res.json();

            if (!data.success) {
                window.location.href = 'login.html';
                return;
            }

            if (data.user.role !== 'admin') {
                // Regular user → redirect to index
                window.location.href = 'index.html';
                return;
            }

            currentAdmin = data.user;
            document.getElementById('adminBadge').textContent =
                (data.user.first_name || '') + ' ' + (data.user.last_name || '') || data.user.username;

            await Promise.all([loadJobRanks(), loadRecords(), loadUsers(), loadInspections()]);
            await loadSchools();
            await loadEvaluations();

        } catch (err) {
            console.error('Admin boot error:', err);
            window.location.href = 'login.html';
        }
    }

    // ── Job Ranks – populate all job_rank selects from the central API ─────
    let validJobRanks = [];

    async function loadJobRanks() {
        try {
            const res  = await fetch('api/job_ranks.php', { credentials: 'same-origin' });
            const data = await res.json();
            if (!data.success) return;
            validJobRanks = data.ranks;
            populateJobRankSelect('ar_job_rank', '-- اختر --');
            populateJobRankSelect('ef_job_rank', '--');
        } catch (e) {
            console.warn('Impossible de charger les rangs:', e);
        }
    }

    function populateJobRankSelect(id, placeholder) {
        const sel = document.getElementById(id);
        if (!sel) return;
        // Keep only the placeholder option
        sel.innerHTML = `<option value="">${placeholder}</option>`;
        validJobRanks.forEach(rank => {
            const opt = document.createElement('option');
            opt.value       = rank;
            opt.textContent = rank;
            sel.appendChild(opt);
        });
    }

    // ── Tabs ───────────────────────────────────────────────────────────────
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // ── Logout ─────────────────────────────────────────────────────────────
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        try {
            await fetch('api/auth/logout.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (_) {}
        window.location.href = 'login.html';
    });

    // ── Helpers ────────────────────────────────────────────────────────────
    let toastTimer;
    function showToast(msg, type = 'success') {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.className   = 'admin-toast show ' + type;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.className = 'admin-toast'; }, 3200);
    }

    function fmtDate(str) {
        if (!str) return '–';
        return str.split('T')[0].split(' ')[0];
    }

    // ── Delete modal ───────────────────────────────────────────────────────
    let _pendingDelete = null;

    function openDeleteModal(title, msg, fn) {
        _pendingDelete = fn;
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMsg').textContent   = msg;
        document.getElementById('deleteModal').classList.remove('hidden');
    }

    document.getElementById('cancelDelBtn').addEventListener('click', () => {
        document.getElementById('deleteModal').classList.add('hidden');
        _pendingDelete = null;
    });

    document.getElementById('confirmDelBtn').addEventListener('click', async () => {
        document.getElementById('deleteModal').classList.add('hidden');
        if (_pendingDelete) await _pendingDelete();
        _pendingDelete = null;
    });

    // ══ RECORDS (personal_info) ════════════════════════════════════════════
    let allRecords = [];

    async function loadRecords() {
        try {
            const res  = await fetch('api/admin/personal_info.php', { credentials: 'same-origin' });
            const data = await res.json();
            if (!data.success) { showToast('فشل تحميل البطاقات', 'error'); return; }

            allRecords = data.records || [];
            document.getElementById('statTeachers').textContent = allRecords.length;
            renderRecords(allRecords);
        } catch (err) {
            showToast('خطأ في الاتصال', 'error');
        }
    }

    function renderRecords(list) {
        const loading = document.getElementById('loadingRecords');
        const tbl     = document.getElementById('tblRecords');
        const body    = document.getElementById('bodyRecords');

        loading.style.display = 'none';
        tbl.style.display     = 'table';
        body.innerHTML        = '';

        if (!list.length) {
            body.innerHTML = '<tr><td colspan="13" class="empty-row">لا توجد بيانات</td></tr>';
            return;
        }

        list.forEach((r, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${esc(r.first_name)}</td>
                <td>${esc(r.family_name)}</td>
                <td>${esc(r.school_name) || '–'}</td>
                <td>${esc(r.job_rank) || '–'}</td>
                <td>${fmtDate(r.first_appointment_date)}</td>
                <td>${esc(r.echelon) || '–'}</td>
                <td>${esc(r.grade) || '–'}</td>
                <td>${fmtDate(r.last_inspection_date)}</td>
                <td>${r.last_inspection_score ?? '–'}</td>
                <td class="cell-nowrap" colspan="3">
                    <div class="inline-actions">
                    <button class="btn-action btn-pdf"  data-id="${r.id}" title="تصدير PDF">↓ PDF</button>
                    <button class="btn-action btn-edit" data-id="${r.id}" title="عرض / تعديل">تعديل</button>
                    <button class="btn-action btn-del"  data-id="${r.id}" title="حذف">حذف</button>
                    </div>
                </td>
            `;
            body.appendChild(tr);
        });

        // Edit record
        body.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const rec = allRecords.find(r => String(r.id) === btn.dataset.id);
                if (rec) openEditModal(rec);
            });
        });

        // PDF export
        body.querySelectorAll('.btn-pdf').forEach(btn => {
            btn.addEventListener('click', () => {
                const rec = allRecords.find(r => String(r.id) === btn.dataset.id);
                if (rec) printRecord(rec);
            });
        });

        // Delete record
        body.querySelectorAll('.btn-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                openDeleteModal(
                    'حذف البطاقة',
                    'هل تريد حذف هذه البطاقة الشخصية نهائيًا؟',
                    async () => {
                        const res  = await fetch('api/admin/personal_info.php', {
                            method:      'DELETE',
                            credentials: 'same-origin',
                            headers:     { 'Content-Type': 'application/json' },
                            body:        JSON.stringify({ id: parseInt(id) }),
                        });
                        const data = await res.json();
                        if (data.success) { showToast('تم حذف البطاقة'); await loadRecords(); }
                        else showToast(data.message || 'فشل الحذف', 'error');
                    }
                );
            });
        });
    }

    document.getElementById('searchRecords').addEventListener('input', function () {
        const q = this.value.trim().toLowerCase();
        if (!q) { renderRecords(allRecords); return; }
        renderRecords(allRecords.filter(r =>
            (r.first_name  || '').toLowerCase().includes(q) ||
            (r.family_name || '').toLowerCase().includes(q) ||
            (r.school_name || '').toLowerCase().includes(q)
        ));
    });

    // ══ USERS ══════════════════════════════════════════════════════════════
    let allUsers = [];

    async function loadUsers() {
        try {
            const res  = await fetch('api/admin/users.php', { credentials: 'same-origin' });
            const data = await res.json();
            if (!data.success) { showToast('فشل تحميل المستخدمين', 'error'); return; }

            allUsers = data.users || [];
            document.getElementById('statUsers').textContent  = allUsers.length;
            document.getElementById('statAdmins').textContent = allUsers.filter(u => u.role === 'admin').length;
            renderUsers(allUsers);
        } catch (err) {
            showToast('خطأ في الاتصال', 'error');
        }
    }

    function renderUsers(list) {
        const loading = document.getElementById('loadingUsers');
        const tbl     = document.getElementById('tblUsers');
        const body    = document.getElementById('bodyUsers');

        loading.style.display = 'none';
        tbl.style.display     = 'table';
        body.innerHTML        = '';

        if (!list.length) {
            body.innerHTML = '<tr><td colspan="8" class="empty-row">لا توجد بيانات</td></tr>';
            return;
        }

        list.forEach((u, i) => {
            const isAdmin = u.role === 'admin';
            const active  = parseInt(u.is_active) === 1;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${esc(u.first_name)} ${esc(u.last_name)}</td>
                <td>${esc(u.username)}</td>
                <td>${esc(u.email)}</td>
                <td><span class="badge ${isAdmin ? 'badge-admin' : 'badge-user'}">${isAdmin ? 'مدير' : 'مستخدم'}</span></td>
                <td><span class="badge ${active ? 'badge-active' : 'badge-off'}">${active ? 'نشط' : 'معطّل'}</span></td>
                <td>${fmtDate(u.last_login)}</td>
                <td>
                    <button class="btn-action btn-del" data-id="${u.id}" title="حذف">حذف</button>
                </td>
            `;
            body.appendChild(tr);
        });

        body.querySelectorAll('.btn-del').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (parseInt(id) === currentAdmin?.id) {
                    showToast('لا يمكنك حذف حسابك الخاص', 'error'); return;
                }
                openDeleteModal(
                    'حذف المستخدم',
                    'هل تريد حذف هذا المستخدم نهائيًا؟ سيتم حذف بياناته الشخصية أيضًا.',
                    async () => {
                        const res  = await fetch('api/admin/users.php', {
                            method:      'DELETE',
                            credentials: 'same-origin',
                            headers:     { 'Content-Type': 'application/json' },
                            body:        JSON.stringify({ id: parseInt(id) }),
                        });
                        const data = await res.json();
                        if (data.success) { showToast('تم حذف المستخدم'); await loadUsers(); }
                        else showToast(data.message || 'فشل الحذف', 'error');
                    }
                );
            });
        });
    }

    document.getElementById('searchUsers').addEventListener('input', function () {
        const q = this.value.trim().toLowerCase();
        if (!q) { renderUsers(allUsers); return; }
        renderUsers(allUsers.filter(u =>
            (u.first_name || '').toLowerCase().includes(q) ||
            (u.last_name  || '').toLowerCase().includes(q) ||
            (u.username   || '').toLowerCase().includes(q) ||
            (u.email      || '').toLowerCase().includes(q)
        ));
    });

    // ══ ADD USER MODAL ═════════════════════════════════════════════════════
    const addUserModal  = document.getElementById('addUserModal');
    const addUserForm   = document.getElementById('addUserForm');
    const addUserSaveBtn = document.getElementById('addUserSaveBtn');

    function openAddUserModal() {
        addUserForm.reset();
        ['au_fn_field','au_ln_field','au_em_field','au_un_field','au_pw_field'].forEach(id => {
            document.getElementById(id).classList.remove('has-error');
        });
        addUserModal.classList.remove('hidden');
        document.getElementById('au_first_name').focus();
    }

    function closeAddUserModal() {
        addUserModal.classList.add('hidden');
    }

    document.getElementById('openAddUserBtn').addEventListener('click', openAddUserModal);
    document.getElementById('addUserModalClose').addEventListener('click', closeAddUserModal);
    document.getElementById('addUserCancelBtn').addEventListener('click', closeAddUserModal);
    addUserModal.addEventListener('click', e => { if (e.target === addUserModal) closeAddUserModal(); });

    addUserForm.addEventListener('submit', async e => {
        e.preventDefault();

        const firstName = document.getElementById('au_first_name').value.trim();
        const lastName  = document.getElementById('au_last_name').value.trim();
        const email     = document.getElementById('au_email').value.trim();
        const username  = document.getElementById('au_username').value.trim();
        const password  = document.getElementById('au_password').value;
        const role      = document.getElementById('au_role').value;

        addUserSaveBtn.disabled = true;
        addUserSaveBtn.textContent = 'جارٍ الإنشاء…';

        try {
            const res  = await fetch('api/admin/users.php', {
                method:      'POST',
                credentials: 'same-origin',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify({ first_name: firstName, last_name: lastName,
                                             email, username, password, role }),
            });
            const data = await res.json();

            if (data.success) {
                closeAddUserModal();
                showToast('تم إنشاء الحساب بنجاح');
                await loadUsers();
            } else {
                // Afficher les erreurs de champ
                const errs = data.errors || {};
                const map = {
                    first_name: ['au_fn_field',  'au_fn_err'],
                    last_name:  ['au_ln_field',  'au_ln_err'],
                    email:      ['au_em_field',  'au_em_err'],
                    username:   ['au_un_field',  'au_un_err'],
                    password:   ['au_pw_field',  'au_pw_err'],
                };
                let shown = false;
                Object.entries(map).forEach(([key, [fieldId, errId]]) => {
                    const field = document.getElementById(fieldId);
                    if (errs[key]) {
                        document.getElementById(errId).textContent = errs[key];
                        field.classList.add('has-error');
                        shown = true;
                    } else {
                        field.classList.remove('has-error');
                    }
                });
                if (!shown) showToast(data.message || 'فشل إنشاء الحساب', 'error');
            }
        } catch (err) {
            showToast('خطأ في الاتصال', 'error');
        } finally {
            addUserSaveBtn.disabled = false;
            addUserSaveBtn.textContent = 'إنشاء الحساب';
        }
    });

    // ══ PDF MODULE (separated file) ════════════════════════════════════════
    const pdfModule = window.createAdminPdfModule({
        showToast,
    });
    const printRecord = (record) => pdfModule.printRecord(record);
    const printInspection = (btn, inspId, inspName) => pdfModule.printInspection(btn, inspId, inspName);

    // ══ EDIT RECORD MODAL ═══════════════════════════════════════════════════

    const editModal    = document.getElementById('editModal');
    const editForm     = document.getElementById('editRecordForm');
    const editSaveBtn  = document.getElementById('editSaveBtn');

    // Map of field id → record key
    const FIELDS = [
        'district','school_year','school_name','years_worked',
        'gender','first_name','family_name','maiden_name',
        'birth_date','birth_place','residence',
        'marital_status','spouse_name','children_count',
        'phone','email',
        'school_entry_date','diploma','first_appointment_date',
        'job_rank','status','echelon','grade','execution_date',
        'latest_inspection_date','latest_inspection_score',
        'last_inspection_date','last_inspection_score',
        'previous_year_class','current_year_class',
        'student_count','haraka','class_note',
        'tech_institute_grad_year','university_grad_year',
    ];

    function openEditModal(rec) {
        // Clear previous errors
        editForm.querySelectorAll('.edit-field').forEach(f => f.classList.remove('has-error'));

        document.getElementById('ef_id').value = rec.id;

        FIELDS.forEach(key => {
            const el = document.getElementById('ef_' + key);
            if (!el) return;
            const val = rec[key];
            if (el.tagName === 'SELECT') {
                el.value = val || '';
            } else {
                el.value = (val !== null && val !== undefined) ? val : '';
            }
        });

        editModal.classList.remove('hidden');
        // Scroll modal to top
        editModal.scrollTop = 0;
    }

    function closeEditModal() {
        editModal.classList.add('hidden');
    }

    document.getElementById('editModalClose').addEventListener('click', closeEditModal);
    document.getElementById('editCancelBtn').addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear errors
        editForm.querySelectorAll('.edit-field').forEach(f => f.classList.remove('has-error'));

        // Client-side required validation
        let valid = true;
        if (!document.getElementById('ef_first_name').value.trim()) {
            document.getElementById('ef_first_name').closest('.edit-field').classList.add('has-error');
            valid = false;
        }
        if (!document.getElementById('ef_family_name').value.trim()) {
            document.getElementById('ef_family_name').closest('.edit-field').classList.add('has-error');
            valid = false;
        }
        if (!document.getElementById('ef_email').value.trim()) {
            document.getElementById('ef_email').closest('.edit-field').classList.add('has-error');
            valid = false;
        }
        if (!valid) return;

        // Build payload
        const payload = { id: parseInt(document.getElementById('ef_id').value) };
        FIELDS.forEach(key => {
            const el = document.getElementById('ef_' + key);
            if (!el) return;
            const v = el.value;
            // Send numeric fields as numbers when non-empty
            if (el.type === 'number') {
                payload[key] = v !== '' ? parseInt(v) : '';
            } else {
                payload[key] = v;
            }
        });

        editSaveBtn.disabled   = true;
        editSaveBtn.textContent = 'جارٍ الحفظ…';

        try {
            const res  = await fetch('api/admin/personal_info.php', {
                method:      'PUT',
                credentials: 'same-origin',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                showToast('تم حفظ التعديلات بنجاح');
                closeEditModal();
                await loadRecords();
            } else {
                // Show server-side field errors
                if (data.errors) {
                    Object.keys(data.errors).forEach(key => {
                        const el = document.getElementById('ef_' + key);
                        if (el) {
                            el.closest('.edit-field').classList.add('has-error');
                            const errEl = document.getElementById('ef_' + key + '_err');
                            if (errEl) errEl.textContent = data.errors[key];
                        }
                    });
                }
                showToast(data.message || 'فشل الحفظ', 'error');
            }
        } catch (err) {
            showToast('خطأ في الاتصال بالخادم', 'error');
        } finally {
            editSaveBtn.disabled   = false;
            editSaveBtn.textContent = 'حفظ التعديلات';
        }
    });

    // ══ ADD RECORD MODAL ════════════════════════════════════════════════════
    const addRecordModal   = document.getElementById('addRecordModal');
    const addRecordForm    = document.getElementById('addRecordForm');
    const addRecordSaveBtn = document.getElementById('addRecordSaveBtn');

    const AR_FIELDS = [
        'district','school_year','school_name','years_worked',
        'gender','first_name','family_name','maiden_name',
        'birth_date','birth_place','residence',
        'marital_status','spouse_name','children_count',
        'phone','email',
        'school_entry_date','diploma','first_appointment_date',
        'job_rank','status','echelon','grade','execution_date',
        'latest_inspection_date','latest_inspection_score',
        'last_inspection_date','last_inspection_score',
        'previous_year_class','current_year_class',
        'student_count','haraka','class_note',
        'tech_institute_grad_year','university_grad_year',
    ];

    const AR_ERRORS = {
        school_name: 'ar_school_name_err', gender: 'ar_gender_err',
        first_name:  'ar_first_name_err',  family_name: 'ar_family_name_err',
        birth_date:  'ar_birth_date_err',  birth_place: 'ar_birth_place_err',
        residence:   'ar_residence_err',   marital_status: 'ar_marital_status_err',
        phone:       'ar_phone_err',       email: 'ar_email_err',
        diploma: 'ar_diploma_err',
    };

    function openAddRecordModal() {
        addRecordForm.reset();
        document.getElementById('ar_district').value   = '11';
        document.getElementById('ar_school_year').value = '2025 / 2026';
        addRecordForm.querySelectorAll('.edit-field').forEach(f => f.classList.remove('has-error'));
        addRecordModal.classList.remove('hidden');
        addRecordModal.scrollTop = 0;
        document.getElementById('ar_first_name').focus();
    }

    function closeAddRecordModal() {
        addRecordModal.classList.add('hidden');
    }

    document.getElementById('openAddRecordBtn').addEventListener('click', openAddRecordModal);
    document.getElementById('addRecordModalClose').addEventListener('click', closeAddRecordModal);
    document.getElementById('addRecordCancelBtn').addEventListener('click', closeAddRecordModal);
    addRecordModal.addEventListener('click', e => { if (e.target === addRecordModal) closeAddRecordModal(); });

    addRecordForm.addEventListener('submit', async e => {
        e.preventDefault();
        addRecordForm.querySelectorAll('.edit-field').forEach(f => f.classList.remove('has-error'));

        // Client-side required check
        const required = ['ar_first_name','ar_family_name','ar_gender','ar_birth_date',
                          'ar_birth_place','ar_residence','ar_marital_status',
                          'ar_phone','ar_email','ar_diploma','ar_school_name'];
        let valid = true;
        required.forEach(id => {
            const el = document.getElementById(id);
            if (!el || !el.value.trim()) {
                el && el.closest('.edit-field').classList.add('has-error');
                valid = false;
            }
        });
        if (!valid) { showToast('يرجى تعبئة الحقول الإلزامية', 'error'); return; }

        // Build payload
        const payload = {};
        AR_FIELDS.forEach(key => {
            const el = document.getElementById('ar_' + key);
            if (!el) return;
            const v = el.value;
            payload[key] = (el.type === 'number' && v !== '') ? parseInt(v) : v;
        });

        addRecordSaveBtn.disabled   = true;
        addRecordSaveBtn.textContent = 'جارٍ الإضافة…';

        try {
            const res  = await fetch('api/admin/personal_info.php', {
                method:      'POST',
                credentials: 'same-origin',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                closeAddRecordModal();
                showToast('تم إضافة البطاقة بنجاح');
                await loadRecords();
            } else {
                const errs = data.errors || {};
                Object.entries(AR_ERRORS).forEach(([key, errId]) => {
                    const el = document.getElementById('ar_' + key);
                    if (errs[key] && el) {
                        const errEl = document.getElementById(errId);
                        if (errEl) errEl.textContent = errs[key];
                        el.closest('.edit-field').classList.add('has-error');
                    }
                });
                showToast(data.message || 'فشل الإضافة', 'error');
            }
        } catch (err) {
            showToast('خطأ في الاتصال بالخادم', 'error');
        } finally {
            addRecordSaveBtn.disabled   = false;
            addRecordSaveBtn.textContent = 'إضافة البطاقة';
        }
    });

    // ── Escape helper ──────────────────────────────────────────────────────
    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ── Boot ───────────────────────────────────────────────────────────────

    // ══ INSPECTIONS MODULE (separated file) ═══════════════════════════════
    const inspectionModule = window.createAdminInspectionModule({
        showToast,
        fmtDate,
        esc,
        openDeleteModal,
        printInspection,
        getAllRecords: () => allRecords,
    });

    const loadInspections  = () => inspectionModule.loadInspections();
    const getAllInspections = () => inspectionModule.getAllInspections();

    // ══ EVALUATIONS MODULE (separated file) ═══════════════════════════════
    const evaluationsModule = window.createAdminEvaluationsModule({
        showToast,
        fmtDate,
        esc,
        openDeleteModal,
        getAllInspections,
    });

    const loadEvaluations = () => evaluationsModule.loadEvaluations();

    // ══ IMPORT + SCHOOLS MODULES (separated files) ═══════════════════════
    window.createAdminImportModule({
        showToast,
        esc,
        loadRecords,
    });

    const schoolsModule = window.createAdminSchoolsModule({
        showToast,
        esc,
        openDeleteModal,
    });
    const loadSchools = () => schoolsModule.loadSchools();

    bootAdmin();
})();
