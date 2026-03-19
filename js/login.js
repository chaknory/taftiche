/**
 * js/login.js
 * Gestion du formulaire de connexion et d'inscription.
 */

(function () {
    'use strict';

    // ── Éléments communs ───────────────────────────────────────────────────
    const alertEl     = document.getElementById('authAlert');

    // ── Onglets ────────────────────────────────────────────────────────────
    const tabLogin    = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const panelLogin  = document.getElementById('panelLogin');
    const panelRegister = document.getElementById('panelRegister');
    const panelForgot = document.getElementById('panelForgot');

    function switchTab(tab) {
        const isLogin    = (tab === 'login');
        const isRegister = (tab === 'register');
        const isForgot   = (tab === 'forgot');

        tabLogin.classList.toggle('active', isLogin);
        tabRegister.classList.toggle('active', isRegister);
        tabLogin.setAttribute('aria-selected',    isLogin    ? 'true' : 'false');
        tabRegister.setAttribute('aria-selected', isRegister ? 'true' : 'false');

        panelLogin.style.display    = isLogin    ? '' : 'none';
        panelRegister.style.display = isRegister ? '' : 'none';
        panelForgot.style.display   = isForgot   ? '' : 'none';

        // Masquer les onglets quand on est sur le panneau « mot de passe oublié »
        const tabBar = document.querySelector('.auth-tabs');
        if (tabBar) tabBar.style.display = isForgot ? 'none' : '';

        // Adapter le sous-titre
        const subtitle = document.getElementById('formSubtitle');
        if (subtitle) {
            subtitle.textContent = isForgot
                ? 'إعادة تعيين كلمة المرور'
                : 'الرجاء إدخال بيانات الدخول للمتابعة';
        }

        alertEl.style.display = 'none';
    }

    tabLogin.addEventListener('click',    () => switchTab('login'));
    tabRegister.addEventListener('click', () => switchTab('register'));

    // ── Éléments login ─────────────────────────────────────────────────────
    const form        = document.getElementById('loginForm');
    const usernameEl  = document.getElementById('username');
    const passwordEl  = document.getElementById('password');
    const toggleBtn   = document.getElementById('togglePassword');
    const eyeOpen     = document.getElementById('eyeOpen');
    const eyeClosed   = document.getElementById('eyeClosed');
    const rememberEl  = document.getElementById('rememberMe');
    const loginBtn    = document.getElementById('loginBtn');
    const btnText     = loginBtn.querySelector('.btn-text');
    const btnSpinner  = loginBtn.querySelector('.btn-spinner');

    // ── Vérifier si déjà connecté ─────────────────────────────────────────
    fetch('api/auth/session.php', { credentials: 'same-origin' })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.user.role === 'admin' ? 'admin.html' : 'index.html';
            }
        })
        .catch(() => {});

    // ── Afficher / masquer le mot de passe ────────────────────────────────
    toggleBtn.addEventListener('click', () => {
        const isPassword = passwordEl.type === 'password';
        passwordEl.type  = isPassword ? 'text' : 'password';
        eyeOpen.style.display   = isPassword ? 'none'  : '';
        eyeClosed.style.display = isPassword ? ''      : 'none';
    });

    // ── Soumission ─────────────────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const username = usernameEl.value.trim();
        const password = passwordEl.value;
        let valid = true;

        if (!username) {
            setError('grpUsername', 'usernameError', 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني');
            valid = false;
        }
        if (!password) {
            setError('grpPassword', 'passwordError', 'يرجى إدخال كلمة المرور');
            valid = false;
        }
        if (!valid) return;

        setLoading(true);

        try {
            const res  = await fetch('api/auth/login.php', {
                method:      'POST',
                credentials: 'same-origin',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify({
                    username:    username,
                    password:    password,
                    remember_me: rememberEl.checked,
                }),
            });

            const data = await res.json();

            if (data.success) {
                showAlert('success', 'تم تسجيل الدخول بنجاح… جارٍ التحويل');
                const dest = data.user.role === 'admin' ? 'admin.html' : 'index.html';
                setTimeout(() => { window.location.href = dest; }, 800);
            } else {
                showAlert('error', data.message || 'حدث خطأ، يرجى المحاولة مجددًا');
                setLoading(false);
            }

        } catch (err) {
            showAlert('error', 'تعذّر الاتصال بالخادم، يرجى التحقق من الاتصال');
            setLoading(false);
        }
    });

    // ── Helpers ────────────────────────────────────────────────────────────

    function setLoading(on) {
        loginBtn.disabled     = on;
        btnText.style.display    = on ? 'none' : '';
        btnSpinner.style.display = on ? ''     : 'none';
    }

    function setError(groupId, errorId, msg) {
        document.getElementById(groupId).classList.add('error');
        document.getElementById(errorId).textContent = msg;
    }

    function clearErrors() {
        ['grpUsername', 'grpPassword'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('error');
        });
        document.getElementById('usernameError').textContent = '';
        document.getElementById('passwordError').textContent = '';
        alertEl.style.display = 'none';
    }

    function showAlert(type, msg) {
        alertEl.className     = `auth-alert auth-alert--${type}`;
        alertEl.textContent   = msg;
        alertEl.style.display = 'block';
    }

    // ── Inscription ────────────────────────────────────────────────────────
    const registerForm    = document.getElementById('registerForm');
    const regFirstName    = document.getElementById('regFirstName');
    const regLastName     = document.getElementById('regLastName');
    const regEmail        = document.getElementById('regEmail');
    const regUsername     = document.getElementById('regUsername');
    const regPassword     = document.getElementById('regPassword');
    const regConfirm      = document.getElementById('regConfirm');
    const regConsent      = document.getElementById('regConsent');
    const toggleRegBtn    = document.getElementById('toggleRegPassword');
    const regEyeOpen      = document.getElementById('regEyeOpen');
    const regEyeClosed    = document.getElementById('regEyeClosed');
    const registerBtn     = document.getElementById('registerBtn');
    const regBtnText      = registerBtn.querySelector('.btn-text');
    const regBtnSpinner   = registerBtn.querySelector('.btn-spinner');

    toggleRegBtn.addEventListener('click', () => {
        const isPwd = regPassword.type === 'password';
        regPassword.type          = isPwd ? 'text'     : 'password';
        regEyeOpen.style.display  = isPwd ? 'none'     : '';
        regEyeClosed.style.display = isPwd ? ''        : 'none';
    });

    // ── Restriction mot de passe : Latin + chiffres + caractères spéciaux ASCII ──
    // Regex : caractères imprimables ASCII uniquement (0x21–0x7E), sans espace
    const ALLOWED_PWD = /^[\x21-\x7E]+$/;

    function stripNonAllowed(input) {
        const pos = input.selectionStart;
        const before = input.value;
        const after = before.replace(/[^\x21-\x7E]/g, '');
        if (before !== after) {
            input.value = after;
            // Restaurer la position du curseur
            const diff = before.length - after.length;
            input.setSelectionRange(Math.max(0, pos - diff), Math.max(0, pos - diff));
        }
    }

    regPassword.addEventListener('input', () => stripNonAllowed(regPassword));
    regConfirm.addEventListener('input',  () => stripNonAllowed(regConfirm));

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearRegErrors();

        const firstName = regFirstName.value.trim();
        const lastName  = regLastName.value.trim();
        const email     = regEmail.value.trim();
        const username  = regUsername.value.trim();
        const password  = regPassword.value;
        const confirm   = regConfirm.value;
        let valid = true;

        if (firstName.length < 2) { setError('grpFirstName', 'firstNameError', 'الاسم الشخصي مطلوب (حرفان على الأقل)'); valid = false; }
        if (lastName.length  < 2) { setError('grpLastName',  'lastNameError',  'اللقب مطلوب (حرفان على الأقل)');        valid = false; }
        if (!email)               { setError('grpRegEmail',   'regEmailError',  'يرجى إدخال البريد الإلكتروني');          valid = false; }
        if (!username)            { setError('grpRegUsername','regUsernameError','يرجى إدخال اسم المستخدم');              valid = false; }
        if (!password)            { setError('grpRegPassword','regPasswordError','يرجى إدخال كلمة المرور');               valid = false; }
        if (password && !ALLOWED_PWD.test(password)) {
            setError('grpRegPassword', 'regPasswordError', 'كلمة المرور: أحرف لاتينية وأرقام ورموز فقط (بدون مسافة أو أحرف عربية)');
            valid = false;
        }
        if (password && ALLOWED_PWD.test(password) && confirm && !ALLOWED_PWD.test(confirm)) {
            setError('grpRegConfirm', 'regConfirmError', 'التأكيد: أحرف لاتينية وأرقام ورموز فقط (بدون مسافة أو أحرف عربية)');
            valid = false;
        }
        if (password && password !== confirm) {
            setError('grpRegConfirm', 'regConfirmError', 'كلمتا المرور غير متطابقتين');
            valid = false;
        }
        if (!regConsent.checked) {
            setError('grpRegConsent', 'regConsentError', 'يرجى الموافقة على سياسة الخصوصية لإتمام إنشاء الحساب');
            valid = false;
        }
        if (!valid) return;

        setRegLoading(true);

        try {
            const res  = await fetch('api/auth/register.php', {
                method:      'POST',
                credentials: 'same-origin',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify({ first_name: firstName, last_name: lastName,
                                             email, username, password, consent_personal_data: true }),
            });

            const data = await res.json();

            if (data.success) {
                showAlert('success', 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
                registerForm.reset();
                setTimeout(() => switchTab('login'), 1500);
            } else {
                // Afficher les erreurs de champ éventuelles
                if (data.errors) {
                    const map = {
                        first_name: ['grpFirstName', 'firstNameError'],
                        last_name:  ['grpLastName',  'lastNameError'],
                        email:      ['grpRegEmail',  'regEmailError'],
                        username:   ['grpRegUsername','regUsernameError'],
                        password:   ['grpRegPassword','regPasswordError'],
                        consent_personal_data: ['grpRegConsent', 'regConsentError'],
                    };
                    Object.entries(data.errors).forEach(([key, msg]) => {
                        if (map[key]) setError(...map[key], msg);
                    });
                } else {
                    showAlert('error', data.message || 'حدث خطأ أثناء إنشاء الحساب');
                }
            }
        } catch (err) {
            showAlert('error', 'تعذّر الاتصال بالخادم، يرجى التحقق من الاتصال');
        } finally {
            setRegLoading(false);
        }
    });

    function setRegLoading(on) {
        registerBtn.disabled       = on;
        regBtnText.style.display   = on ? 'none' : '';
        regBtnSpinner.style.display = on ? ''    : 'none';
    }

    function clearRegErrors() {
        ['grpFirstName','grpLastName','grpRegEmail','grpRegUsername','grpRegPassword','grpRegConfirm','grpRegConsent']
            .forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('error'); });
        ['firstNameError','lastNameError','regEmailError','regUsernameError','regPasswordError','regConfirmError','regConsentError']
            .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
        alertEl.style.display = 'none';
    }

    // ── Mot de passe oublié ───────────────────────────────────────────────
    const forgotForm   = document.getElementById('forgotForm');
    const forgotEmail  = document.getElementById('forgotEmail');
    const forgotBtn    = document.getElementById('forgotBtn');
    const fBtnText     = forgotBtn.querySelector('.btn-text');
    const fBtnSpinner  = forgotBtn.querySelector('.btn-spinner');
    const btnForgot    = document.getElementById('btnForgot');
    const btnBackLogin = document.getElementById('btnBackToLogin');

    btnForgot.addEventListener('click',    () => switchTab('forgot'));
    btnBackLogin.addEventListener('click', () => switchTab('login'));

    forgotForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearForgotErrors();

        const email = (forgotEmail.value || '').trim();
        if (!email) {
            setForgotError('البريد الإلكتروني مطلوب');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setForgotError('يرجى إدخال بريد إلكتروني صحيح');
            return;
        }

        setForgotLoading(true);

        try {
            const res  = await fetch('api/auth/forgot_password.php', {
                method:      'POST',
                credentials: 'same-origin',
                headers:     { 'Content-Type': 'application/json' },
                body:        JSON.stringify({ email }),
            });

            const data = await res.json();

            // On affiche toujours le message générique (anti-énumération)
            showAlert('success', data.message || 'إذا كان البريد مسجلًا، ستتلقى رسالة تحتوي على رابط إعادة التعيين.');
            forgotForm.reset();

        } catch (err) {
            showAlert('error', 'تعذّر الاتصال بالخادم، يرجى التحقق من الاتصال');
        } finally {
            setForgotLoading(false);
        }
    });

    function setForgotLoading(on) {
        forgotBtn.disabled       = on;
        fBtnText.style.display   = on ? 'none' : '';
        fBtnSpinner.style.display = on ? ''    : 'none';
    }

    function setForgotError(msg) {
        const grp = document.getElementById('grpForgotEmail');
        const err = document.getElementById('forgotEmailError');
        if (grp) grp.classList.add('error');
        if (err) err.textContent = msg;
    }

    function clearForgotErrors() {
        const grp = document.getElementById('grpForgotEmail');
        const err = document.getElementById('forgotEmailError');
        if (grp) grp.classList.remove('error');
        if (err) err.textContent = '';
        alertEl.style.display = 'none';
    }
})();
