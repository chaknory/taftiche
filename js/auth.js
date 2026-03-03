/**
 * js/auth.js
 * Guard d'authentification – à inclure sur toutes les pages protégées.
 *
 * Usage :
 *   <script src="js/auth.js"></script>
 *
 * Expose globalement :
 *   Auth.logout()
 *   Auth.getUser()  → objet user courant (depuis la session)
 */

const Auth = (() => {
    let _currentUser = null;

    /**
     * Vérifie la session. Si non authentifié, redirige vers login.html.
     * Appelé automatiquement au chargement de la page.
     */
    async function checkAuth() {
        try {
            const res  = await fetch('api/auth/session.php', { credentials: 'same-origin' });
            const data = await res.json();

            if (!data.success) {
                _redirectToLogin();
                return;
            }

            _currentUser = data.user;
            _renderUserBar(_currentUser);
            await _prefillFormFromDB();

        } catch (err) {
            console.error('Auth check failed:', err);
            _redirectToLogin();
        }
    }

    /** Déconnexion : appel API puis redirection vers login. */
    async function logout() {
        try {
            await fetch('api/auth/logout.php', {
                method:      'POST',
                credentials: 'same-origin',
                headers:     { 'Content-Type': 'application/json' },
            });
        } catch (_) { /* non bloquant */ }
        _redirectToLogin();
    }

    /** Retourne l'utilisateur courant (null si pas encore vérifié). */
    function getUser() {
        return _currentUser;
    }

    // ── Privé ──────────────────────────────────────────────────────────────

    function _redirectToLogin() {
        window.location.href = 'login.html';
    }

    /**
     * Récupère les données personal_info de l'utilisateur connecté et
     * pré-remplit le formulaire si celui-ci est présent sur la page.
     */
    async function _prefillFormFromDB() {
        // Uniquement sur la page contenant le formulaire
        if (!document.getElementById('personalInfoForm')) return;

        try {
            const res  = await fetch('api/auth/prefill.php', { credentials: 'same-origin' });
            const json = await res.json();

            if (!json.success || !json.data) return;

            const d = json.data;

            // Helper : remplit un champ si la valeur existe
            const set = (id, val) => {
                if (val === null || val === undefined || val === '') return;
                const el = document.getElementById(id);
                if (el) el.value = val;
            };

            // ── Champs texte / date / select ───────────────────────────────
            set('district',             d.district);
            set('schoolYear',           d.school_year);
            set('schoolName',           d.school_name);
            set('yearsWorked',          d.years_worked);
            set('firstName',            d.first_name);
            set('familyName',           d.family_name);
            set('maidenName',           d.maiden_name);
            set('birthDate',            d.birth_date);
            set('birthPlace',           d.birth_place);
            set('residence',            d.residence);
            set('phone',                d.phone);
            set('email',                d.email);
            set('address',              d.address);
            // school_entry_date est enregistré sous ce nom, mais affiché dans #firstAppointmentDate
            set('firstAppointmentDate', d.school_entry_date);
            set('diploma',              d.diploma);

            // ── Radio : genre ──────────────────────────────────────────────
            // On déclenche l'événement change pour activer la section
            // الحالة المدنية et mettre à jour les libellés (logique dans app.js)
            if (d.gender) {
                const genderRadio = document.querySelector(
                    `input[name="gender"][value="${d.gender}"]`
                );
                if (genderRadio) {
                    genderRadio.checked = true;
                    genderRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            // ── Radio : situation matrimoniale ─────────────────────────────
            // On attend un tick pour que la section civil soit visible et que
            // les libellés aient été mis à jour par le handler gender ci-dessus.
            if (d.marital_status) {
                await new Promise(resolve => setTimeout(resolve, 50));

                const maritalRadio = document.querySelector(
                    `input[name="marital_status"][value="${d.marital_status}"]`
                );
                if (maritalRadio) {
                    maritalRadio.checked = true;
                    maritalRadio.dispatchEvent(new Event('change', { bubbles: true }));
                }

                // Champ اسم الزوج (visible seulement si أنثى + متزوج)
                if (d.spouse_name) {
                    set('spouseName', d.spouse_name);
                }
            }

        } catch (err) {
            console.warn('Prefill failed:', err);
        }
    }

    /**
     * Injecte la barre utilisateur en haut de .form-container.
     */
    function _renderUserBar(user) {
        const bar = document.createElement('div');
        bar.className = 'user-bar';
        bar.innerHTML = `
            <span class="user-bar__name">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
                ${escHtml(user.first_name)} ${escHtml(user.last_name)}
                ${user.role === 'admin' ? '<span class="user-bar__badge">مسؤول</span>' : ''}
            </span>
            <div class="user-bar__actions">
                ${user.role === 'admin' ? `
                <button class="user-bar__admin-panel" id="adminPanelBtn" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    لوحة الإدارة
                </button>
                <button class="user-bar__add-user" id="addUserBtn" type="button">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    إضافة مستخدم
                </button>` : ''}
                <button class="user-bar__logout" id="logoutBtn" type="button">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    خروج
                </button>
            </div>
        `;

        // Insérer avant le contenu du container
        const container = document.querySelector('.form-container');
        if (container) {
            container.insertBefore(bar, container.firstChild);
        } else {
            document.body.insertBefore(bar, document.body.firstChild);
        }

        document.getElementById('logoutBtn').addEventListener('click', logout);

        if (user.role === 'admin') {
            _buildCreateUserModal();
            _buildAdminPanel();
            document.getElementById('addUserBtn').addEventListener('click', () => {
                document.getElementById('cuModal').classList.add('cu-modal--open');
            });
            document.getElementById('adminPanelBtn').addEventListener('click', () => {
                document.getElementById('apModal').classList.add('ap-modal--open');
                _apLoadTab('users');
            });
        }
    }

    /** Construit et injecte le modal de création d'utilisateur dans le DOM. */
    function _buildCreateUserModal() {
        if (document.getElementById('cuModal')) return; // déjà construit

        const modal = document.createElement('div');
        modal.id        = 'cuModal';
        modal.className = 'cu-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="cu-modal__card">
                <div class="cu-modal__header">
                    <h2>إضافة مستخدم جديد</h2>
                    <button type="button" class="cu-modal__close" id="cuClose" aria-label="إغلاق">✕</button>
                </div>
                <div class="cu-modal__alert" id="cuAlert" style="display:none"></div>
                <form id="cuForm" novalidate>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="cuFirstName"><span class="label-text">الاسم الشخصي</span><span class="required">*</span></label>
                            <input type="text" id="cuFirstName" placeholder="محمد" autocomplete="off">
                            <span class="error-message" id="cuFirstNameErr"></span>
                        </div>
                        <div class="form-group">
                            <label for="cuLastName"><span class="label-text">اللقب</span><span class="required">*</span></label>
                            <input type="text" id="cuLastName" placeholder="بن سالم" autocomplete="off">
                            <span class="error-message" id="cuLastNameErr"></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="cuEmail"><span class="label-text">البريد الإلكتروني</span><span class="required">*</span></label>
                        <input type="email" id="cuEmail" placeholder="user@example.com" autocomplete="off">
                        <span class="error-message" id="cuEmailErr"></span>
                    </div>
                    <div class="form-group">
                        <label for="cuUsername"><span class="label-text">اسم المستخدم</span><span class="required">*</span></label>
                        <input type="text" id="cuUsername" placeholder="mbensalem" autocomplete="off">
                        <span class="error-message" id="cuUsernameErr"></span>
                    </div>
                    <div class="form-group">
                        <label for="cuPassword"><span class="label-text">كلمة المرور</span><span class="required">*</span></label>
                        <input type="password" id="cuPassword" placeholder="8 أحرف على الأقل، حرف كبير ورقم" autocomplete="new-password">
                        <span class="error-message" id="cuPasswordErr"></span>
                    </div>
                    <div class="form-group">
                        <label for="cuRole"><span class="label-text">الصلاحية</span></label>
                        <select id="cuRole">
                            <option value="user">مستخدم عادي</option>
                            <option value="admin">مسؤول</option>
                        </select>
                    </div>
                    <div class="cu-modal__actions">
                        <button type="submit" class="btn btn-submit" id="cuSubmit">
                            <span class="cu-btn-text">إنشاء الحساب</span>
                            <span class="spinner cu-btn-spinner" style="display:none"></span>
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        // Fermeture
        const close = () => {
            modal.classList.remove('cu-modal--open');
            document.getElementById('cuForm').reset();
            _cuAlert('', '');
        };
        document.getElementById('cuClose').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

        // Soumission
        document.getElementById('cuForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            _cuClearErrors();

            const firstName = document.getElementById('cuFirstName').value.trim();
            const lastName  = document.getElementById('cuLastName').value.trim();
            const email     = document.getElementById('cuEmail').value.trim();
            const username  = document.getElementById('cuUsername').value.trim();
            const password  = document.getElementById('cuPassword').value;
            const role      = document.getElementById('cuRole').value;

            let valid = true;
            if (firstName.length < 2) { document.getElementById('cuFirstNameErr').textContent = 'الاسم الشخصي مطلوب (حرفان على الأقل)'; valid = false; }
            if (lastName.length  < 2) { document.getElementById('cuLastNameErr').textContent  = 'اللقب مطلوب (حرفان على الأقل)'; valid = false; }
            if (!email)               { document.getElementById('cuEmailErr').textContent    = 'يرجى إدخال البريد الإلكتروني'; valid = false; }
            if (!username)            { document.getElementById('cuUsernameErr').textContent  = 'يرجى إدخال اسم المستخدم'; valid = false; }
            if (!password)            { document.getElementById('cuPasswordErr').textContent  = 'يرجى إدخال كلمة المرور'; valid = false; }
            if (!valid) return;

            _cuSetLoading(true);
            try {
                const res  = await fetch('api/auth/register.php', {
                    method:      'POST',
                    credentials: 'same-origin',
                    headers:     { 'Content-Type': 'application/json' },
                    body:        JSON.stringify({ first_name: firstName, last_name: lastName,
                                                 email, username, password, role }),
                });
                const data = await res.json();

                if (data.success) {
                    _cuAlert('success', `تم إنشاء الحساب بنجاح! (${escHtml(username)})`);
                    document.getElementById('cuForm').reset();
                } else if (data.errors) {
                    const map = {
                        first_name: 'cuFirstNameErr',
                        last_name:  'cuLastNameErr',
                        email:      'cuEmailErr',
                        username:   'cuUsernameErr',
                        password:   'cuPasswordErr',
                    };
                    Object.entries(data.errors).forEach(([k, msg]) => {
                        const el = document.getElementById(map[k]);
                        if (el) el.textContent = msg;
                    });
                } else {
                    _cuAlert('error', data.message || 'حدث خطأ أثناء إنشاء الحساب');
                }
            } catch (_) {
                _cuAlert('error', 'تعذّر الاتصال بالخادم');
            } finally {
                _cuSetLoading(false);
            }
        });
    }

    function _cuAlert(type, msg) {
        const el = document.getElementById('cuAlert');
        if (!el) return;
        if (!msg) { el.style.display = 'none'; el.className = 'cu-modal__alert'; return; }
        el.style.display = '';
        el.className = `cu-modal__alert cu-modal__alert--${type}`;
        el.textContent = msg;
    }

    // =========================================================================
    // Admin Panel – lوحة الإدارة
    // =========================================================================

    /** Construit le modal principal de la lوحة d'administration */
    function _buildAdminPanel() {
        if (document.getElementById('apModal')) return;

        const modal = document.createElement('div');
        modal.id        = 'apModal';
        modal.className = 'ap-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="ap-modal__card">
                <div class="ap-modal__header">
                    <h2>لوحة الإدارة</h2>
                    <button type="button" class="ap-modal__close" id="apClose" aria-label="إغلاق">✕</button>
                </div>
                <div class="ap-tabs">
                    <button class="ap-tab ap-tab--active" data-tab="users">المستخدمون</button>
                    <button class="ap-tab" data-tab="personal_info">البطاقات الشخصية</button>
                </div>
                <div class="ap-modal__alert" id="apAlert" style="display:none"></div>
                <div class="ap-modal__body" id="apBody">
                    <div class="ap-spinner" id="apSpinner">جارٍ التحميل…</div>
                </div>
            </div>

            <!-- Modal d'édition utilisateur -->
            <div class="ap-edit-overlay" id="apEditOverlay" style="display:none">
                <div class="ap-edit-card" id="apEditCard"></div>
            </div>
        `;
        document.body.appendChild(modal);

        const closePanel = () => modal.classList.remove('ap-modal--open');
        document.getElementById('apClose').addEventListener('click', closePanel);
        modal.addEventListener('click', (e) => { if (e.target === modal) closePanel(); });

        // Fermer overlay d'édition sans fermer le panneau
        modal.querySelector('#apEditOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'apEditOverlay') _apCloseEdit();
        });

        // Onglets
        modal.querySelectorAll('.ap-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.ap-tab').forEach(b => b.classList.remove('ap-tab--active'));
                btn.classList.add('ap-tab--active');
                _apLoadTab(btn.dataset.tab);
            });
        });
    }

    function _apAlert(type, msg) {
        const el = document.getElementById('apAlert');
        if (!el) return;
        if (!msg) { el.style.display = 'none'; return; }
        el.style.display = '';
        el.className = `ap-modal__alert ap-modal__alert--${type}`;
        el.textContent = msg;
    }

    function _apShowSpinner() {
        const body = document.getElementById('apBody');
        if (body) body.innerHTML = '<div class="ap-spinner">جارٍ التحميل…</div>';
    }

    /** Charge le contenu d'un onglet */
    async function _apLoadTab(tab) {
        _apAlert('', '');
        _apShowSpinner();
        if (tab === 'users') {
            await _apLoadUsers();
        } else {
            await _apLoadPersonalInfo();
        }
    }

    // ── Users tab ─────────────────────────────────────────────────────────

    async function _apLoadUsers() {
        try {
            const res  = await fetch('api/admin/users.php', { credentials: 'same-origin' });
            const data = await res.json();
            if (!data.success) { _apAlert('error', data.message); document.getElementById('apBody').innerHTML = ''; return; }

            const rows = data.users.map(u => `
                <tr>
                    <td>${escHtml(u.first_name)} ${escHtml(u.last_name)}</td>
                    <td>${escHtml(u.username)}</td>
                    <td>${escHtml(u.email)}</td>
                    <td><span class="ap-badge ap-badge--${u.role}">${u.role === 'admin' ? 'مسؤول' : 'مستخدم'}</span></td>
                    <td><span class="ap-badge ap-badge--${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'مفعّل' : 'معطّل'}</span></td>
                    <td>${escHtml(u.last_login || '—')}</td>
                    <td class="ap-actions">
                        <button class="ap-btn ap-btn--edit" data-id="${u.id}" data-type="user">تعديل</button>
                        <button class="ap-btn ap-btn--delete" data-id="${u.id}" data-type="user"
                            data-name="${escHtml(u.username)}">حذف</button>
                    </td>
                </tr>
            `).join('');

            document.getElementById('apBody').innerHTML = `
                <div class="ap-table-wrap">
                    <table class="ap-table">
                        <thead><tr>
                            <th>الاسم</th><th>المستخدم</th><th>البريد</th>
                            <th>الصلاحية</th><th>الحالة</th><th>آخر دخول</th><th>إجراءات</th>
                        </tr></thead>
                        <tbody>${rows || '<tr><td colspan="7" class="ap-empty">لا يوجد مستخدمون</td></tr>'}</tbody>
                    </table>
                </div>`;

            _apBindTableActions(data.users, 'user');
        } catch (e) {
            _apAlert('error', 'تعذّر تحميل المستخدمين');
        }
    }

    // ── Personal Info tab ─────────────────────────────────────────────────

    async function _apLoadPersonalInfo() {
        try {
            const res  = await fetch('api/admin/personal_info.php', { credentials: 'same-origin' });
            const data = await res.json();
            if (!data.success) { _apAlert('error', data.message); document.getElementById('apBody').innerHTML = ''; return; }

            const rows = data.records.map(r => `
                <tr>
                    <td>${escHtml(r.family_name)} ${escHtml(r.first_name)}${r.maiden_name ? ' (' + escHtml(r.maiden_name) + ')' : ''}</td>
                    <td>${escHtml(r.gender)}</td>
                    <td>${escHtml(r.email)}</td>
                    <td>${escHtml(r.phone)}</td>
                    <td>${escHtml(r.school_name)}</td>
                    <td>${escHtml(r.school_year)}</td>
                    <td>${escHtml((r.created_at || '').slice(0, 10))}</td>
                    <td class="ap-actions">
                        <button class="ap-btn ap-btn--edit" data-id="${r.id}" data-type="info">تعديل</button>
                        <button class="ap-btn ap-btn--delete" data-id="${r.id}" data-type="info"
                            data-name="${escHtml(r.family_name + ' ' + r.first_name)}">حذف</button>
                    </td>
                </tr>
            `).join('');

            document.getElementById('apBody').innerHTML = `
                <div class="ap-table-wrap">
                    <table class="ap-table">
                        <thead><tr>
                            <th>الاسم</th><th>الجنس</th><th>البريد</th><th>الهاتف</th>
                            <th>المدرسة</th><th>السنة</th><th>تاريخ الإنشاء</th><th>إجراءات</th>
                        </tr></thead>
                        <tbody>${rows || '<tr><td colspan="8" class="ap-empty">لا توجد بطاقات</td></tr>'}</tbody>
                    </table>
                </div>`;

            _apBindTableActions(data.records, 'info');
        } catch (e) {
            _apAlert('error', 'تعذّر تحميل البطاقات الشخصية');
        }
    }

    // ── Actions (edit / delete) ────────────────────────────────────────────

    function _apBindTableActions(records, type) {
        const body = document.getElementById('apBody');
        if (!body) return;

        body.querySelectorAll('.ap-btn--edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const id  = parseInt(btn.dataset.id, 10);
                const rec = records.find(r => r.id === id);
                if (rec) (type === 'user' ? _apOpenEditUser : _apOpenEditInfo)(rec);
            });
        });

        body.querySelectorAll('.ap-btn--delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id   = parseInt(btn.dataset.id, 10);
                const name = btn.dataset.name;
                _apConfirmDelete(id, name, type);
            });
        });
    }

    async function _apConfirmDelete(id, name, type) {
        const overlay = document.getElementById('apEditOverlay');
        const card    = document.getElementById('apEditCard');
        card.innerHTML = `
            <div class="ap-edit-header"><h3>تأكيد الحذف</h3></div>
            <div style="padding:20px;text-align:center">
                <p style="margin-bottom:20px">هل تريد حذف <strong>${escHtml(name)}</strong> نهائيًا؟</p>
                <div style="display:flex;gap:10px;justify-content:center">
                    <button class="ap-btn ap-btn--delete" id="apDelConfirm">نعم، احذف</button>
                    <button class="ap-btn" id="apDelCancel">إلغاء</button>
                </div>
                <div class="ap-modal__alert" id="apDelAlert" style="display:none;margin-top:12px"></div>
            </div>`;
        overlay.style.display = 'flex';

        document.getElementById('apDelCancel').addEventListener('click', _apCloseEdit);
        document.getElementById('apDelConfirm').addEventListener('click', async () => {
            const url = type === 'user' ? 'api/admin/users.php' : 'api/admin/personal_info.php';
            document.getElementById('apDelConfirm').disabled = true;
            try {
                const res  = await fetch(url, {
                    method: 'DELETE', credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id }),
                });
                const data = await res.json();
                if (data.success) {
                    _apCloseEdit();
                    _apAlert('success', data.message);
                    _apReloadCurrentTab();
                } else {
                    const alertEl = document.getElementById('apDelAlert');
                    if (alertEl) { alertEl.style.display=''; alertEl.className='ap-modal__alert ap-modal__alert--error'; alertEl.textContent = data.message; }
                }
            } catch (_) {
                const alertEl = document.getElementById('apDelAlert');
                if (alertEl) { alertEl.style.display=''; alertEl.className='ap-modal__alert ap-modal__alert--error'; alertEl.textContent='تعذّر الحذف'; }
            } finally {
                const btn = document.getElementById('apDelConfirm');
                if (btn) btn.disabled = false;
            }
        });
    }

    // ── Edit User Modal ────────────────────────────────────────────────────

    function _apOpenEditUser(u) {
        const overlay = document.getElementById('apEditOverlay');
        const card    = document.getElementById('apEditCard');
        card.innerHTML = `
            <div class="ap-edit-header">
                <h3>تعديل المستخدم: ${escHtml(u.username)}</h3>
                <button class="ap-modal__close" id="apEditClose">✕</button>
            </div>
            <div class="ap-modal__alert" id="apEditAlert" style="display:none"></div>
            <form id="apEditUserForm" class="ap-edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="label-text">الاسم الشخصي <span class="required">*</span></label>
                        <input type="text" id="apuFirstName" value="${escHtml(u.first_name)}">
                        <span class="error-message" id="apuFirstNameErr"></span>
                    </div>
                    <div class="form-group">
                        <label class="label-text">اللقب <span class="required">*</span></label>
                        <input type="text" id="apuLastName" value="${escHtml(u.last_name)}">
                        <span class="error-message" id="apuLastNameErr"></span>
                    </div>
                </div>
                <div class="form-group">
                    <label class="label-text">البريد الإلكتروني <span class="required">*</span></label>
                    <input type="email" id="apuEmail" value="${escHtml(u.email)}">
                    <span class="error-message" id="apuEmailErr"></span>
                </div>
                <div class="form-group">
                    <label class="label-text">اسم المستخدم <span class="required">*</span></label>
                    <input type="text" id="apuUsername" value="${escHtml(u.username)}">
                    <span class="error-message" id="apuUsernameErr"></span>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="label-text">الصلاحية</label>
                        <select id="apuRole">
                            <option value="user" ${u.role==='user'?'selected':''}>مستخدم</option>
                            <option value="admin" ${u.role==='admin'?'selected':''}>مسؤول</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="label-text">الحالة</label>
                        <select id="apuActive">
                            <option value="1" ${u.is_active?'selected':''}>مفعّل</option>
                            <option value="0" ${!u.is_active?'selected':''}>معطّل</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="label-text">كلمة مرور جديدة <span style="font-size:0.8em;color:#888">(اتركها فارغة لعدم التغيير)</span></label>
                    <input type="password" id="apuPassword" placeholder="8 أحرف، حرف كبير ورقم" autocomplete="new-password">
                    <span class="error-message" id="apuPasswordErr"></span>
                </div>
                <div class="cu-modal__actions">
                    <button type="submit" class="btn btn-submit" id="apuSubmit">
                        <span class="cu-btn-text">حفظ التغييرات</span>
                        <span class="spinner cu-btn-spinner" style="display:none"></span>
                    </button>
                </div>
            </form>`;
        overlay.style.display = 'flex';

        document.getElementById('apEditClose').addEventListener('click', _apCloseEdit);

        document.getElementById('apEditUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            ['apuFirstNameErr','apuLastNameErr','apuEmailErr','apuUsernameErr','apuPasswordErr']
                .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });

            const payload = {
                id:         u.id,
                first_name: document.getElementById('apuFirstName').value.trim(),
                last_name:  document.getElementById('apuLastName').value.trim(),
                email:      document.getElementById('apuEmail').value.trim(),
                username:   document.getElementById('apuUsername').value.trim(),
                role:       document.getElementById('apuRole').value,
                is_active:  parseInt(document.getElementById('apuActive').value, 10),
                password:   document.getElementById('apuPassword').value,
            };

            const btn = document.getElementById('apuSubmit');
            btn.disabled = true;
            btn.querySelector('.cu-btn-text').style.display    = 'none';
            btn.querySelector('.cu-btn-spinner').style.display = '';

            try {
                const res  = await fetch('api/admin/users.php', {
                    method: 'PUT', credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();

                if (data.success) {
                    _apCloseEdit();
                    _apAlert('success', data.message);
                    _apReloadCurrentTab();
                } else if (data.errors) {
                    const map = { first_name:'apuFirstNameErr', last_name:'apuLastNameErr', email:'apuEmailErr', username:'apuUsernameErr', password:'apuPasswordErr' };
                    Object.entries(data.errors).forEach(([k, msg]) => { const el = document.getElementById(map[k]); if (el) el.textContent = msg; });
                } else {
                    const alertEl = document.getElementById('apEditAlert');
                    alertEl.style.display=''; alertEl.className='ap-modal__alert ap-modal__alert--error'; alertEl.textContent = data.message;
                }
            } catch (_) {
                const alertEl = document.getElementById('apEditAlert');
                if (alertEl) { alertEl.style.display=''; alertEl.className='ap-modal__alert ap-modal__alert--error'; alertEl.textContent='تعذّر الاتصال بالخادم'; }
            } finally {
                btn.disabled = false;
                btn.querySelector('.cu-btn-text').style.display    = '';
                btn.querySelector('.cu-btn-spinner').style.display = 'none';
            }
        });
    }

    // ── Edit Personal Info Modal ───────────────────────────────────────────

    function _apOpenEditInfo(r) {
        const overlay = document.getElementById('apEditOverlay');
        const card    = document.getElementById('apEditCard');

        const genderOpts = ['ذكر','أنثى'].map(g =>
            `<option value="${g}" ${r.gender===g?'selected':''}>${g}</option>`).join('');
        const maritalOpts = ['أعزب','متزوج','أرمل','مطلق'].map(m =>
            `<option value="${m}" ${r.marital_status===m?'selected':''}>${m}</option>`).join('');

        card.innerHTML = `
            <div class="ap-edit-header">
                <h3>تعديل البطاقة: ${escHtml(r.family_name)} ${escHtml(r.first_name)}</h3>
                <button class="ap-modal__close" id="apEditClose">✕</button>
            </div>
            <div class="ap-modal__alert" id="apEditAlert" style="display:none"></div>
            <form id="apEditInfoForm" class="ap-edit-form">
                <div class="form-row">
                    <div class="form-group">
                        <label class="label-text">الاسم الشخصي <span class="required">*</span></label>
                        <input type="text" id="apiFirstName" value="${escHtml(r.first_name)}">
                        <span class="error-message" id="apiFirstNameErr"></span>
                    </div>
                    <div class="form-group">
                        <label class="label-text">الاسم العائلي <span class="required">*</span></label>
                        <input type="text" id="apiFamilyName" value="${escHtml(r.family_name)}">
                        <span class="error-message" id="apiFamilyNameErr"></span>
                    </div>
                    <div class="form-group">
                        <label class="label-text">اللقب الأصلي</label>
                        <input type="text" id="apiMaidenName" value="${escHtml(r.maiden_name||'')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="label-text">الجنس</label>
                        <select id="apiGender">${genderOpts}</select>
                    </div>
                    <div class="form-group">
                        <label class="label-text">الحالة المدنية</label>
                        <select id="apiMarital">${maritalOpts}</select>
                    </div>
                    <div class="form-group">
                        <label class="label-text">اسم الزوج</label>
                        <input type="text" id="apiSpouseName" value="${escHtml(r.spouse_name||'')}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="label-text">تاريخ الميلاد</label>
                        <input type="date" id="apiBirthDate" value="${escHtml(r.birth_date||'')}">
                    </div>
                    <div class="form-group">
                        <label class="label-text">مكان الميلاد</label>
                        <input type="text" id="apiBirthPlace" value="${escHtml(r.birth_place)}">
                    </div>
                    <div class="form-group">
                        <label class="label-text">مكان الإقامة</label>
                        <input type="text" id="apiResidence" value="${escHtml(r.residence)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="label-text">البريد الإلكتروني <span class="required">*</span></label>
                        <input type="email" id="apiEmail" value="${escHtml(r.email)}">
                        <span class="error-message" id="apiEmailErr"></span>
                    </div>
                    <div class="form-group">
                        <label class="label-text">رقم الهاتف</label>
                        <input type="text" id="apiPhone" value="${escHtml(r.phone)}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="label-text">العنوان</label>
                    <input type="text" id="apiAddress" value="${escHtml(r.address)}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="label-text">المقاطعة</label>
                        <input type="text" id="apiDistrict" value="${escHtml(r.district)}">
                    </div>
                    <div class="form-group">
                        <label class="label-text">السنة الدراسية</label>
                        <input type="text" id="apiSchoolYear" value="${escHtml(r.school_year)}">
                    </div>
                    <div class="form-group">
                        <label class="label-text">اسم المدرسة</label>
                        <input type="text" id="apiSchoolName" value="${escHtml(r.school_name)}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="label-text">عدد سنوات العمل</label>
                        <input type="number" id="apiYearsWorked" min="0" max="60" value="${escHtml(String(r.years_worked))}">
                    </div>
                    <div class="form-group">
                        <label class="label-text">تاريخ الدخول المدرسي</label>
                        <input type="date" id="apiSchoolEntry" value="${escHtml(r.school_entry_date||'')}">
                    </div>
                    <div class="form-group">
                        <label class="label-text">الشهادة / الدبلوم</label>
                        <input type="text" id="apiDiploma" value="${escHtml(r.diploma)}">
                    </div>
                </div>
                <div class="cu-modal__actions">
                    <button type="submit" class="btn btn-submit" id="apiSubmit">
                        <span class="cu-btn-text">حفظ التغييرات</span>
                        <span class="spinner cu-btn-spinner" style="display:none"></span>
                    </button>
                </div>
            </form>`;
        overlay.style.display = 'flex';

        document.getElementById('apEditClose').addEventListener('click', _apCloseEdit);

        document.getElementById('apEditInfoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            ['apiFirstNameErr','apiFamilyNameErr','apiEmailErr']
                .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });

            const payload = {
                id:               r.id,
                first_name:       document.getElementById('apiFirstName').value.trim(),
                family_name:      document.getElementById('apiFamilyName').value.trim(),
                maiden_name:      document.getElementById('apiMaidenName').value.trim(),
                gender:           document.getElementById('apiGender').value,
                marital_status:   document.getElementById('apiMarital').value,
                spouse_name:      document.getElementById('apiSpouseName').value.trim(),
                birth_date:       document.getElementById('apiBirthDate').value,
                birth_place:      document.getElementById('apiBirthPlace').value.trim(),
                residence:        document.getElementById('apiResidence').value.trim(),
                email:            document.getElementById('apiEmail').value.trim(),
                phone:            document.getElementById('apiPhone').value.trim(),
                address:          document.getElementById('apiAddress').value.trim(),
                district:         document.getElementById('apiDistrict').value.trim(),
                school_year:      document.getElementById('apiSchoolYear').value.trim(),
                school_name:      document.getElementById('apiSchoolName').value.trim(),
                years_worked:     parseInt(document.getElementById('apiYearsWorked').value, 10),
                school_entry_date:document.getElementById('apiSchoolEntry').value,
                diploma:          document.getElementById('apiDiploma').value.trim(),
            };

            const btn = document.getElementById('apiSubmit');
            btn.disabled = true;
            btn.querySelector('.cu-btn-text').style.display    = 'none';
            btn.querySelector('.cu-btn-spinner').style.display = '';

            try {
                const res  = await fetch('api/admin/personal_info.php', {
                    method: 'PUT', credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();

                if (data.success) {
                    _apCloseEdit();
                    _apAlert('success', data.message);
                    _apReloadCurrentTab();
                } else if (data.errors) {
                    const map = { first_name:'apiFirstNameErr', family_name:'apiFamilyNameErr', email:'apiEmailErr' };
                    Object.entries(data.errors).forEach(([k, msg]) => { const el = document.getElementById(map[k]); if (el) el.textContent = msg; });
                } else {
                    const alertEl = document.getElementById('apEditAlert');
                    if (alertEl) { alertEl.style.display=''; alertEl.className='ap-modal__alert ap-modal__alert--error'; alertEl.textContent = data.message; }
                }
            } catch (_) {
                const alertEl = document.getElementById('apEditAlert');
                if (alertEl) { alertEl.style.display=''; alertEl.className='ap-modal__alert ap-modal__alert--error'; alertEl.textContent='تعذّر الاتصال بالخادم'; }
            } finally {
                btn.disabled = false;
                btn.querySelector('.cu-btn-text').style.display    = '';
                btn.querySelector('.cu-btn-spinner').style.display = 'none';
            }
        });
    }

    function _apCloseEdit() {
        const overlay = document.getElementById('apEditOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    function _apReloadCurrentTab() {
        const active = document.querySelector('.ap-tab--active');
        if (active) _apLoadTab(active.dataset.tab);
    }

    function _cuClearErrors() {
        ['cuFirstNameErr','cuLastNameErr','cuEmailErr','cuUsernameErr','cuPasswordErr']
            .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
        _cuAlert('', '');
    }

    function _cuSetLoading(on) {
        const btn     = document.getElementById('cuSubmit');
        if (!btn) return;
        btn.disabled = on;
        btn.querySelector('.cu-btn-text').style.display    = on ? 'none' : '';
        btn.querySelector('.cu-btn-spinner').style.display = on ? ''     : 'none';
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Auto-run à l'import
    checkAuth();

    return { logout, getUser };
})();
