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
            document.getElementById('addUserBtn').addEventListener('click', () => {
                document.getElementById('cuModal').classList.add('cu-modal--open');
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
