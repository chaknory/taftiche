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

    function switchTab(tab) {
        const isLogin = (tab === 'login');
        tabLogin.classList.toggle('active', isLogin);
        tabRegister.classList.toggle('active', !isLogin);
        tabLogin.setAttribute('aria-selected', isLogin ? 'true' : 'false');
        tabRegister.setAttribute('aria-selected', isLogin ? 'false' : 'true');
        panelLogin.style.display    = isLogin ? '' : 'none';
        panelRegister.style.display = isLogin ? 'none' : '';
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
        .then(data => { if (data.success) window.location.href = 'index.html'; })
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
                setTimeout(() => { window.location.href = 'index.html'; }, 800);
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
        if (password && password !== confirm) {
            setError('grpRegConfirm', 'regConfirmError', 'كلمتا المرور غير متطابقتين');
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
                                             email, username, password }),
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
        ['grpFirstName','grpLastName','grpRegEmail','grpRegUsername','grpRegPassword','grpRegConfirm']
            .forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('error'); });
        ['firstNameError','lastNameError','regEmailError','regUsernameError','regPasswordError','regConfirmError']
            .forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
        alertEl.style.display = 'none';
    }
})();
