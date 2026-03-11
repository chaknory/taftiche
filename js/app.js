/**
 * استمارة المعلومات الشخصية
 * Formulaire d'informations personnelles
 * ==========================================
 */

// Configuration
const CONFIG = {
    API_URL: 'api/submit.php',
    MESSAGES: {
        fullName: 'يرجى إدخال الاسم الكامل (3 أحرف على الأقل)',
        birthDate: 'يرجى اختيار تاريخ الميلاد',
        gender: 'يرجى اختيار الجنس',
        phone: 'يرجى إدخال رقم هاتف صحيح مكون من 10 أرقام ويبدأ بـ 05 أو 06',
        email: 'يرجى إدخال بريد إلكتروني صحيح',
        address: 'يرجى إدخال العنوان (5 أحرف على الأقل)',
        district: 'يرجى إدخال المقاطعة المدرسية',
        schoolYear: 'يرجى إدخال السنة الدراسية',
        schoolName: 'يرجى اختيار اسم المدرسة',
        yearsWorked: 'يرجى إدخال عدد سنوات العمل (بين 0 و 60)',
        firstName: 'يرجى إدخال الاسم الشخصي (2 أحرف على الأقل)',
        familyName: 'يرجى إدخال الاسم العائلي (2 أحرف على الأقل)',
        birthPlace: 'يرجى إدخال مكان الميلاد',
        maritalStatus: 'يرجى اختيار الحالة المدنية',
        spouseName: 'يرجى إدخال اسم الزوج الكامل (3 أحرف على الأقل)',
        childrenCount: 'يرجى إدخال عدد الأطفال (بين 0 و 30)',
        schoolEntryDate: 'يرجى اختيار تاريخ الدخول المدرسي الأولي',
        residence: 'يرجى إدخال مكان الإقامة (2 أحرف على الأقل)',
        diploma: 'يرجى إدخال الشهادة / الدبلوم المحصل عليه (2 أحرف على الأقل)',
        techInstituteGradYear: 'السنة المختارة غير صحيحة',
        universityGradYear: 'السنة المختارة غير صحيحة',
        firstAppointmentDate: 'يرجى اختيار تاريخ أول تعيين بالتعليم',
        job_rank: 'يرجى إدخال الرتبة (2 أحرف على الأقل)',
        status: 'يرجى إدخال الصفة (2 أحرف على الأقل)',
        studentCount: 'يرجى إدخال عدد التلاميذ (بين 1 و 200)',
        haraka: 'يرجى تحديد ما إذا كنت معنيًا بالحركة',
        networkError: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        serverError: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
    }
};

// DOM Elements
const form = document.getElementById('personalInfoForm');
const submitBtn = document.getElementById('submitBtn');
const successMessage = document.getElementById('successMessage');

// ==========================================
// Validation Functions
// ==========================================

const validators = {
    district(value) {
        return value.trim().length >= 1;
    },

    schoolYear(value) {
        return value.trim().length >= 4;
    },

    schoolName(value) {
        return value.trim().length > 0;
    },

    yearsWorked(value) {
        const n = Number(value);
        return value !== '' && Number.isInteger(n) && n >= 0 && n <= 60;
    },

    firstName(value) {
        return value.trim().length >= 2;
    },

    familyName(value) {
        return value.trim().length >= 2;
    },

    maidenName() {
        return true; // champ optionnel
    },

    birthDate(value) {
        if (!value) return false;
        const date = new Date(value);
        const today = new Date();
        return date < today && date.getFullYear() > 1900;
    },

    birthPlace(value) {
        return value.trim().length >= 2;
    },

    residence(value) {
        return value.trim().length >= 2;
    },

    maritalStatus() {
        const civil = document.getElementById('civil');
        if (!civil || civil.style.display === 'none') return true; // masqué = pas encore requis
        return document.querySelector('input[name="marital_status"]:checked') !== null;
    },

    spouseName(value) {
        const group = document.getElementById('spouseNameGroup');
        if (!group || group.style.display === 'none') return true; // optionnel si masqué
        return value.trim().length >= 3;
    },

    childrenCount() {
        return true; // champ optionnel
    },

    gender() {
        return document.querySelector('input[name="gender"]:checked') !== null;
    },

    phone(value) {
        return /^0[56][0-9]{8}$/.test(value.trim());
    },

    email(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
    },

    address(value) {
        return value.trim().length >= 5;
    },

    schoolEntryDate(value) {
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime());
    },

    diploma(value) {
        return value.trim().length >= 2;
    },

    techInstituteGradYear(value) {
        if (value === '' || value === null || value === undefined) return true; // optionnel
        const year = parseInt(value, 10);
        const currentYear = new Date().getFullYear();
        return Number.isInteger(year) && year >= 1980 && year <= currentYear;
    },

    universityGradYear(value) {
        if (value === '' || value === null || value === undefined) return true; // optionnel
        const year = parseInt(value, 10);
        const currentYear = new Date().getFullYear();
        return Number.isInteger(year) && year >= 1980 && year <= currentYear;
    },

    firstAppointmentDate(value) {
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime());
    },

    job_rank(value) {
        if (!value) return true; // champ optionnel
        // Valider contre la liste chargée depuis l'API (si disponible)
        return !window.VALID_JOB_RANKS || window.VALID_JOB_RANKS.includes(value);
    },

    status(value) {
         return true; // champ optionnel
    },

    lastInspectionDate() {
        return true; // champ optionnel
    },

    lastInspectionScore(value) {
        if (value === '' || value === null || value === undefined) return true;
        const n = Number(value);
        return Number.isInteger(n) && n >= 0 && n <= 20;
    },

    echelon() {
        return true; // champ optionnel
    },

    grade() {
        return true; // champ optionnel
    },

    executionDate() {
        return true; // champ optionnel
    },

    latestInspectionDate() {
        return true; // champ optionnel
    },

    latestInspectionScore(value) {
        if (value === '' || value === null || value === undefined) return true;
        const n = Number(value);
        return Number.isInteger(n) && n >= 0 && n <= 20;
    },

    previousYearClass() {
        return true; // champ optionnel
    },

    currentYearClass(value) {
        return value !== '' && value !== null && value !== undefined;
    },

    studentCount(value) {
        const n = Number(value);
        return value !== '' && Number.isInteger(n) && n >= 1 && n <= 200;
    },

    haraka() {
        return document.querySelector('input[name="haraka"]:checked') !== null;
    }
};

/**
 * Validate a single field
 */
function validateField(fieldName) {
    const fieldMap = {
        district: { element: 'district', errorId: 'districtError' },
        schoolYear: { element: 'schoolYear', errorId: 'schoolYearError' },
        schoolName: { element: 'schoolName', errorId: 'schoolNameError' },
        yearsWorked: { element: 'yearsWorked', errorId: 'yearsWorkedError' },
        firstName: { element: 'firstName', errorId: 'firstNameError' },
        familyName: { element: 'familyName', errorId: 'familyNameError' },
        maidenName: { element: 'maidenName', errorId: 'maidenNameError' },
        birthPlace: { element: 'birthPlace', errorId: 'birthPlaceError' },
        residence: { element: 'residence', errorId: 'residenceError' },
        maritalStatus: { element: null, errorId: 'maritalStatusError' },
        spouseName: { element: 'spouseName', errorId: 'spouseNameError' },
        childrenCount: { element: 'childrenCount', errorId: 'childrenCountError' },
        birthDate: { element: 'birthDate', errorId: 'birthDateError' },
        gender: { element: null, errorId: 'genderError' },
        phone: { element: 'phone', errorId: 'phoneError' },
        email: { element: 'email', errorId: 'emailError' },
        address: { element: 'address', errorId: 'addressError' },
        schoolEntryDate: { element: 'schoolEntryDate', errorId: 'schoolEntryDateError' },
        diploma: { element: 'diploma', errorId: 'diplomaError' },
        techInstituteGradYear: { element: 'techInstituteGradYear', errorId: 'techInstituteGradYearError' },
        universityGradYear: { element: 'universityGradYear', errorId: 'universityGradYearError' },
        firstAppointmentDate: { element: 'firstAppointmentDate', errorId: 'firstAppointmentDateError' },
        job_rank: { element: 'job_rank', errorId: 'job_rankError' },
        status: { element: 'status', errorId: 'statusError' },
        lastInspectionDate: { element: 'lastInspectionDate', errorId: 'lastInspectionDateError' },
        lastInspectionScore: { element: 'lastInspectionScore', errorId: 'lastInspectionScoreError' },
        echelon: { element: 'echelon', errorId: 'echelonError' },
        grade: { element: 'grade', errorId: 'gradeError' },
        executionDate: { element: 'executionDate', errorId: 'executionDateError' },
        latestInspectionDate: { element: 'latestInspectionDate', errorId: 'latestInspectionDateError' },
        latestInspectionScore: { element: 'latestInspectionScore', errorId: 'latestInspectionScoreError' },
        previousYearClass: { element: 'previousYearClass', errorId: 'previousYearClassError' },
        currentYearClass: { element: 'currentYearClass', errorId: 'currentYearClassError' },
        studentCount: { element: 'studentCount', errorId: 'studentCountError' },
        haraka: { element: null, errorId: 'harakaError' }
    };

    const config = fieldMap[fieldName];
    if (!config) return true;

    const input = config.element ? document.getElementById(config.element) : null;
    const errorEl = document.getElementById(config.errorId);
    const value = input ? input.value : '';
    const isValid = validators[fieldName](value);

    // Update UI — skip if neither element exists in this page's DOM
    const anchor = input || errorEl;
    if (!anchor) return isValid;
    const formGroup = anchor.closest('.form-group');
    if (!formGroup) return isValid;

    if (isValid) {
        formGroup.classList.remove('error');
        formGroup.classList.add('valid');
        if (errorEl) errorEl.textContent = '';
    } else {
        formGroup.classList.remove('valid');
        formGroup.classList.add('error');
        if (errorEl) errorEl.textContent = CONFIG.MESSAGES[fieldName];
    }

    return isValid;
}

/**
 * Validate entire form
 */
function validateForm() {
    const fields = ['district', 'schoolYear', 'schoolName', 'yearsWorked', 'firstName', 'familyName', 'maidenName', 'birthDate', 'birthPlace', 'residence', 'gender', 'maritalStatus', 'childrenCount', 'spouseName', 'phone', 'email', 'address', 'diploma', 'firstAppointmentDate', 'job_rank', 'status', 'techInstituteGradYear', 'universityGradYear', 'lastInspectionDate', 'lastInspectionScore', 'echelon', 'grade', 'executionDate', 'latestInspectionDate', 'latestInspectionScore', 'previousYearClass', 'currentYearClass', 'studentCount', 'haraka'];
    let isFormValid = true;

    fields.forEach(field => {
        if (!validateField(field)) {
            isFormValid = false;
        }
    });

    return isFormValid;
}

// ==========================================
// Event Listeners - Real-time validation
// ==========================================

// Populate graduation year selects (1980 → current year, descending)
(function populateGradYearSelects() {
    const currentYear = new Date().getFullYear();
    ['techInstituteGradYear', 'universityGradYear'].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        for (let y = currentYear; y >= 1980; y--) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            select.appendChild(opt);
        }
        select.addEventListener('change', () => validateField(id));
    });
})();

// Text inputs
['district', 'schoolYear', 'schoolName', 'yearsWorked', 'firstName', 'familyName', 'maidenName', 'birthPlace', 'residence', 'childrenCount', 'spouseName', 'phone', 'email', 'address', 'diploma'].forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.addEventListener('blur', () => validateField(fieldId));
    input.addEventListener('input', () => {
        const formGroup = input.closest('.form-group');
        if (formGroup.classList.contains('error')) {
            validateField(fieldId);
        }
    });
});

// Date inputs
['birthDate', 'schoolEntryDate', 'firstAppointmentDate', 'lastInspectionDate', 'executionDate', 'latestInspectionDate'].forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) el.addEventListener('change', () => validateField(fieldId));
});

// Selects — job_rank, status
['job_rank', 'status'].forEach(fieldId => {
    const sel = document.getElementById(fieldId);
    if (!sel) return;
    sel.addEventListener('change', () => validateField(fieldId));
});

// Text inputs — echelon, grade + inspection scores
['echelon', 'grade', 'lastInspectionScore', 'latestInspectionScore'].forEach(fieldId => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    input.addEventListener('blur', () => validateField(fieldId));
    input.addEventListener('input', () => {
        const formGroup = input.closest('.form-group');
        if (formGroup.classList.contains('error')) validateField(fieldId);
    });
});

// Class assignment selects
['previousYearClass', 'currentYearClass'].forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) el.addEventListener('change', () => validateField(fieldId));
});

// Student count
const studentCountInput = document.getElementById('studentCount');
if (studentCountInput) {
    studentCountInput.addEventListener('blur', () => validateField('studentCount'));
    studentCountInput.addEventListener('input', () => {
        const formGroup = studentCountInput.closest('.form-group');
        if (formGroup.classList.contains('error')) validateField('studentCount');
    });
}

// Haraka radios
document.querySelectorAll('input[name="haraka"]').forEach(radio => {
    radio.addEventListener('change', () => validateField('haraka'));
});

// Radio buttons
const MARITAL_LABELS = {
    'ذكر': ['أعزب', 'متزوج', 'أرمل', 'مطلق'],
    'أنثى': ['عزباء', 'متزوجة', 'أرملة', 'مطلقة']
};

function updateMaritalLabels(gender) {
    const labels = MARITAL_LABELS[gender];
    document.querySelectorAll('#civil .marital-label').forEach((el, i) => {
        el.textContent = labels[i];
    });
}

function updateChildrenCountVisibility() {
    const marital = document.querySelector('input[name="marital_status"]:checked')?.value;
    const group = document.getElementById('childrenCountGroup');
    const input = document.getElementById('childrenCount');
    if (!group || !input) return;
    const singleValues = ['أعزب', 'عزباء'];
    const show = marital !== undefined && !singleValues.includes(marital);
    group.style.display = show ? 'block' : 'none';
    group.style.animation = show ? 'fadeIn 0.3s ease' : '';
    if (!show) {
        input.value = '';
        group.classList.remove('error', 'valid');
        document.getElementById('childrenCountError').textContent = '';
    }
}

function updateSpouseNameVisibility() {
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const marital = document.querySelector('input[name="marital_status"]:checked')?.value;
    const group = document.getElementById('spouseNameGroup');
    const input = document.getElementById('spouseName');
    if (!group || !input) return;
    const show = gender === 'أنثى' && marital === 'متزوج';
    group.style.display = show ? 'block' : 'none';
    group.style.animation = show ? 'fadeIn 0.3s ease' : '';
    if (!show) {
        input.value = '';
        group.classList.remove('error', 'valid');
        document.getElementById('spouseNameError').textContent = '';
    }
}

document.querySelectorAll('input[name="gender"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const civil = document.getElementById('civil');
        // Reset marital selection when gender changes
        document.querySelectorAll('input[name="marital_status"]').forEach(r => r.checked = false);
        const civilGroup = civil.closest ? civil : civil;
        civilGroup.classList.remove('error', 'valid');
        document.getElementById('maritalStatusError').textContent = '';

        updateMaritalLabels(e.target.value);
        civil.style.display = 'block';
        civil.style.animation = 'fadeIn 0.3s ease';
        updateChildrenCountVisibility();
        updateSpouseNameVisibility();
        validateField('gender');
    });
});

document.querySelectorAll('input[name="marital_status"]').forEach(radio => {
    radio.addEventListener('change', () => {
        updateChildrenCountVisibility();
        updateSpouseNameVisibility();
        validateField('maritalStatus');
    });
});

// Reset button
form.addEventListener('reset', () => {
    setTimeout(() => {
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('error', 'valid');
        });
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        document.getElementById('civil').style.display = 'none';
        document.getElementById('childrenCountGroup').style.display = 'none';
        document.getElementById('spouseNameGroup').style.display = 'none';
    }, 10);
});

// ==========================================
// Form Submission
// ==========================================

form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validate
    if (!validateForm()) {
        // Scroll to first error
        const firstError = document.querySelector('.form-group.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Collect form data
    const formData = {
        district: document.getElementById('district').value.trim(),
        school_year: document.getElementById('schoolYear').value.trim(),
        school_name: document.getElementById('schoolName').value.trim(),
        years_worked: parseInt(document.getElementById('yearsWorked').value, 10),
        first_name: document.getElementById('firstName').value.trim(),
        family_name: document.getElementById('familyName').value.trim(),
        maiden_name: document.getElementById('maidenName').value.trim(),
        birth_place: document.getElementById('birthPlace').value.trim(),
        residence: document.getElementById('residence').value.trim(),
        marital_status: document.querySelector('input[name="marital_status"]:checked')?.value || '',
        children_count: document.getElementById('childrenCountGroup')?.style.display !== 'none'
            ? parseInt(document.getElementById('childrenCount')?.value || '', 10) || null
            : null,
        spouse_name: document.getElementById('spouseNameGroup')?.style.display !== 'none'
            ? (document.getElementById('spouseName')?.value.trim() || '')
            : '',
        birth_date: document.getElementById('birthDate').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        school_entry_date: document.getElementById('firstAppointmentDate').value,
        diploma: document.getElementById('diploma').value.trim(),
        tech_institute_grad_year: document.getElementById('techInstituteGradYear').value || null,
        university_grad_year: document.getElementById('universityGradYear').value || null,
        first_appointment_date: document.getElementById('firstAppointmentDate').value,
        job_rank: document.getElementById('job_rank').value.trim(),
        status: document.getElementById('status').value.trim(),
        last_inspection_date: document.getElementById('lastInspectionDate').value || null,
        last_inspection_score: document.getElementById('lastInspectionScore').value !== '' ? parseInt(document.getElementById('lastInspectionScore').value, 10) : null,
        echelon: document.getElementById('echelon').value.trim() || null,
        grade: document.getElementById('grade').value.trim() || null,
        execution_date: document.getElementById('executionDate').value || null,
        latest_inspection_date: document.getElementById('latestInspectionDate').value || null,
        latest_inspection_score: document.getElementById('latestInspectionScore').value !== '' ? parseInt(document.getElementById('latestInspectionScore').value, 10) : null,
        previous_year_class: document.getElementById('previousYearClass').value || null,
        current_year_class: document.getElementById('currentYearClass').value,
        student_count: document.getElementById('studentCount').value !== '' ? parseInt(document.getElementById('studentCount').value, 10) : null,
        haraka: document.querySelector('input[name="haraka"]:checked')?.value || ''
    };

    console.log('[FormSubmit] Données envoyées au serveur :', JSON.stringify(formData, null, 2));

    // Show loading state
    setLoadingState(true);

    try {
        console.log('[FormSubmit] Envoi de la requête POST vers', CONFIG.API_URL);
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('[FormSubmit] Réponse HTTP reçue — statut :', response.status, response.statusText);

        const result = await response.json().catch(() => null);
        console.log('[FormSubmit] Réponse JSON du serveur :', result);

        if (!response.ok) {
            // Afficher le message métier renvoyé par le serveur (ex. email en double)
            const msg = result?.message || CONFIG.MESSAGES.serverError;
            console.warn('[FormSubmit] Erreur serveur :', response.status, msg);
            showError(msg);
            return;
        }

        if (result.success) {
            console.log('[FormSubmit] Enregistrement réussi. Réponse :', result.message);
            if (response.status === 201) {
                // Nouveau record : masquer le formulaire et afficher le message de succès
                showSuccess();
            } else {
                // Mise à jour : afficher une notification brève sans masquer le formulaire
                showUpdateSuccess();
            }
        } else {
            console.error('[FormSubmit] Échec signalé par le serveur :', result.message);
            showError(result.message || CONFIG.MESSAGES.serverError);
        }
    } catch (error) {
        console.error('[FormSubmit] Erreur réseau ou exception :', error);
        showError(CONFIG.MESSAGES.networkError);
    } finally {
        setLoadingState(false);
    }
});

// ==========================================
// UI Helpers
// ==========================================

function setLoadingState(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.querySelector('.btn-text').style.display = isLoading ? 'none' : 'inline';
    submitBtn.querySelector('.btn-loader').style.display = isLoading ? 'flex' : 'none';
}

function showSuccess() {
    form.style.display = 'none';
    document.querySelector('.form-header').style.display = 'none';
    successMessage.style.display = 'block';
}

function showUpdateSuccess() {
    const notification = document.createElement('div');
    notification.className = 'notification update-notification';
    notification.innerHTML = `
        <span>✓ تم تحديث المعلومات بنجاح</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:1.2rem;cursor:pointer;padding:0 8px;">&times;</button>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #27ae60;
        color: white;
        padding: 14px 24px;
        border-radius: 8px;
        font-family: var(--font-family);
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

function showError(message) {
    // Create a temporary error notification
    const notification = document.createElement('div');
    notification.className = 'notification error-notification';
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;font-size:1.2rem;cursor:pointer;padding:0 8px;">&times;</button>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #c0392b;
        color: white;
        padding: 14px 24px;
        border-radius: 8px;
        font-family: var(--font-family);
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 1000;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ==========================================
// PDF Generation — Custom Document Template
// ==========================================

/**
 * Collect all current form values into a plain object.
 */
function collectFormData() {
    const get = id => document.getElementById(id)?.value.trim() ?? '';
    const radio = name => document.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
    const visible = id => document.getElementById(id)?.style.display !== 'none';

    // Timetable rows
    const ttDays = ['sun', 'mon', 'tue', 'wed', 'thu'];
    const ttDayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const timetable = ttDays.map((d, i) => ({
        day: ttDayNames[i],
        slots: [1, 2, 3, 4, 5, 6, 7].map(n => document.querySelector(`input[name="tt_${d}_${n}"]`)?.value.trim() || ''),
    }));

    return {
        district             : get('district'),
        schoolYear           : get('schoolYear'),
        schoolName           : get('schoolName'),
        yearsWorked          : get('yearsWorked'),
        firstName            : get('firstName'),
        familyName           : get('familyName'),
        maidenName           : get('maidenName'),
        birthDate            : get('birthDate'),
        birthPlace           : get('birthPlace'),
        residence            : get('residence'),
        gender               : radio('gender'),
        maritalStatus        : radio('marital_status'),
        childrenCount        : visible('childrenCountGroup') ? get('childrenCount') : '',
        spouseName           : visible('spouseNameGroup')    ? get('spouseName')    : '',
        phone                : get('phone'),
        email                : get('email'),
        address              : get('address'),
        schoolEntryDate      : get('schoolEntryDate'),
        diploma              : get('diploma'),
        techInstituteGradYear: get('techInstituteGradYear'),
        universityGradYear   : get('universityGradYear'),
        firstAppointmentDate : get('firstAppointmentDate'),
        job_rank             : get('job_rank'),
        status               : get('status'),
        lastInspectionDate   : get('lastInspectionDate'),
        lastInspectionScore  : get('lastInspectionScore'),
        echelon              : get('echelon'),
        grade                : get('grade'),
        executionDate        : get('executionDate'),
        latestInspectionDate : get('latestInspectionDate'),
        latestInspectionScore: get('latestInspectionScore'),
        previousYearClass    : get('previousYearClass'),
        currentYearClass     : get('currentYearClass'),
        studentCount         : get('studentCount'),
        haraka               : radio('haraka'),
        timetable,
    };
}

/**
 * Format an ISO date string (YYYY-MM-DD) to Arabic-style DD/MM/YYYY.
 */
function formatDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

/**
 * Build and return the off-screen PDF template element.
 * Layout mirrors the form exactly: same field order, same side-by-side groupings.
 */
function buildPDFTemplate(data) {
    const fullName = [data.familyName, data.firstName, data.maidenName ? `(${data.maidenName})` : ''].filter(Boolean).join(' ');

    // ── helpers ──────────────────────────────────────────────────
    // Section header spanning all 6 columns
    const sec = title => `
        <tr>
            <td colspan="6" style="
                padding:6px 12px;
                background:#1a3a5c;
                color:#fff;
                font-weight:700;
                font-size:11.5px;
                border-right:4px solid #c8a45a;
            ">${title}</td>
        </tr>`;

    // Single full-width row
    const full = (label, value) => `
        <tr>
            <td class="lbl" colspan="2">${label}</td>
            <td class="val" colspan="4">${value || '—'}</td>
        </tr>`;

    // Two side-by-side fields (2 label+value pairs)
    const dual = (l1, v1, l2, v2) => `
        <tr>
            <td class="lbl">${l1}</td>
            <td class="val" colspan="2">${v1 || '—'}</td>
            <td class="lbl">${l2}</td>
            <td class="val" colspan="2">${v2 || '—'}</td>
        </tr>`;

    // Three side-by-side fields
    const tri = (l1, v1, l2, v2, l3, v3) => `
        <tr>
            <td class="lbl">${l1}</td>
            <td class="val">${v1 || '—'}</td>
            <td class="lbl">${l2}</td>
            <td class="val">${v2 || '—'}</td>
            <td class="lbl">${l3}</td>
            <td class="val">${v3 || '—'}</td>
        </tr>`;

    // Timetable rows
    const ttRows = (data.timetable || []).map(r => `
        <tr>
            <td class="tt-day">${r.day}</td>
            ${r.slots.slice(0, 4).map(s => `<td class="tt-slot">${s}</td>`).join('')}
            <td class="tt-break"></td>
            ${r.slots.slice(4).map(s => `<td class="tt-slot">${s}</td>`).join('')}
        </tr>`).join('');

    const html = `
        <div id="pdfTemplate" style="
            width: 794px;
            min-height: 1123px;
            background: #ffffff;
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            direction: rtl;
            padding: 40px 50px 80px;
            box-sizing: border-box;
            position: relative;
            color: #1a2e44;
        ">
            <!-- Outer border -->
            <div style="position:absolute;inset:16px;border:2px solid #1a3a5c;pointer-events:none;border-radius:4px;"></div>
            <div style="position:absolute;inset:20px;border:1px solid #c8a45a;pointer-events:none;border-radius:2px;"></div>

            <!-- ===== Header ===== -->
            <div style="text-align:center; margin-bottom:20px;">
                <p style="font-size:13px;font-weight:700;color:#1a3a5c;margin:0 0 2px;">الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <p style="font-size:12px;color:#555;margin:0 0 2px;">وزارة التربية الوطنية</p>
                <p style="font-size:12px;font-weight:600;color:#1a3a5c;margin:0 0 2px;">مديرية التربية لولاية بسكرة</p>
                <p style="font-size:11px;color:#555;margin:0;">مفتشية التعليم الابتدائي</p>
                <div style="display:flex;align-items:center;gap:8px;margin:12px auto;width:70%;">
                    <div style="flex:1;height:1px;background:#c8a45a;"></div>
                    <div style="width:6px;height:6px;background:#c8a45a;transform:rotate(45deg);flex-shrink:0;"></div>
                    <div style="flex:1;height:1px;background:#c8a45a;"></div>
                </div>
                <h1 style="font-size:16px;font-weight:700;color:#1a3a5c;margin:0 0 6px;">البطاقة الشخصية لأستاذ اللغة العربية</h1>
                <p style="font-size:11px;color:#777;margin:0;">يرجى ملء جميع الحقول المطلوبة بدقة</p>
            </div>

            <!-- ===== Full name banner ===== -->
            <div style="background:linear-gradient(135deg,#1a3a5c,#2c5282);color:#fff;text-align:center;padding:10px 20px;border-radius:4px;margin-bottom:18px;font-size:15px;font-weight:700;">
                ${fullName}
            </div>

            <style>
                .pdf-tbl { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:14px; }
                .lbl { padding:6px 10px; background:#eef1f6; color:#1a3a5c; font-weight:700; border:1px solid #c8d0db; white-space:nowrap; width:14%; }
                .val { padding:6px 12px; color:#1a2e44; border:1px solid #c8d0db; word-break:break-word; }
                .tt-tbl { width:100%; border-collapse:collapse; font-size:10.5px; }
                .tt-hdr { background:#1a3a5c; color:#fff; padding:5px 4px; text-align:center; border:1px solid #2c5282; font-weight:600; font-size:10px; }
                .tt-period { background:#2c5282; color:#fff; padding:4px; text-align:center; border:1px solid #2c5282; font-size:10px; }
                .tt-day { background:#eef1f6; color:#1a3a5c; font-weight:700; padding:5px 8px; border:1px solid #c8d0db; text-align:center; white-space:nowrap; }
                .tt-slot { padding:5px 4px; border:1px solid #c8d0db; text-align:center; min-width:56px; }
                .tt-break { background:#f7f9fc; border:1px solid #c8d0db; width:36px; }
            </style>

            <!-- ===== Main data table ===== -->
            <table class="pdf-tbl">

                ${sec('المعلومات المدرسية')}
                ${dual('المقاطعة المدرسية', data.district, 'العام الدراسي', data.schoolYear)}
                ${dual('اسم المدرسة', data.schoolName, 'عدد سنوات العمل فيها', data.yearsWorked)}

                ${sec('المعلومات الشخصية')}
                ${full('مكان الإقامة', data.residence)}
                ${full('الجنس', data.gender)}
                ${tri('الاسم الشخصي', data.firstName, 'الاسم العائلي', data.familyName, 'اللقب الأصلي للمتزوجة', data.maidenName)}
                ${dual('تاريخ الميلاد', formatDate(data.birthDate), 'مكان الميلاد', data.birthPlace)}
                ${data.maritalStatus ? full('الحالة المدنية', data.maritalStatus) : ''}
                ${data.childrenCount !== '' ? full('عدد الأطفال', data.childrenCount) : ''}
                ${data.spouseName ? full('إسم و لقب الزوج', data.spouseName) : ''}

                ${sec('معلومات الاتصال')}
                ${full('رقم الهاتف', data.phone)}
                ${full('البريد الإلكتروني', data.email)}
                ${dual('سنة التخرج من المعهد التكنولوجي', data.techInstituteGradYear, 'سنة التخرج من الجامعة', data.universityGradYear)}
                ${full('العنوان', data.address)}

                ${sec('المسار المهني')}
                ${full('الشهادة / الدبلوم المحصل عليه', data.diploma)}
                ${data.schoolEntryDate ? full('تاريخ الدخول المدرسي الأولي', formatDate(data.schoolEntryDate)) : ''}
                ${full('تاريخ أول تعيين بالتعليم', formatDate(data.firstAppointmentDate))}
                ${dual('الرتبة', data.job_rank, 'الصفة', data.status)}
                ${tri('السلم', data.echelon, 'الدرجة', data.grade, 'تاريخ التنفيذ', formatDate(data.executionDate))}
                ${dual('تاريخ آخر تفتيش', formatDate(data.latestInspectionDate), 'علامته', data.latestInspectionScore)}
                ${dual('تاريخ التفتيش ما قبل الأخير', formatDate(data.lastInspectionDate), 'علامته', data.lastInspectionScore)}

                ${sec('معلومات القسم')}
                ${dual('القسم المُسند العام الماضي', data.previousYearClass, 'القسم المُسند هذا العام', data.currentYearClass)}
                ${dual('عدد التلاميذ', data.studentCount, 'معني بالحركة', data.haraka)}

            </table>

            <!-- ===== Timetable ===== -->
            <div style="margin-bottom:14px;">
                <div style="background:#1a3a5c;color:#fff;padding:6px 12px;font-weight:700;font-size:11.5px;border-right:4px solid #c8a45a;">
                    التوزيع الأسبوعي
                    <span style="font-size:10px;font-weight:400;color:#c8a45a;margin-right:12px;">الفترة الصباحية: 4 حصص &nbsp;|&nbsp; الفترة المسائية: 3 حصص</span>
                </div>
                <table class="tt-tbl">
                    <thead>
                        <tr>
                            <th class="tt-hdr" rowspan="2" style="width:60px;">الأيام</th>
                            <th class="tt-period" colspan="4">الفترة الصباحية</th>
                            <th class="tt-hdr" rowspan="2" style="width:36px;">استراحة</th>
                            <th class="tt-period" colspan="3">الفترة المسائية</th>
                        </tr>
                        <tr>
                            <th class="tt-hdr">1</th>
                            <th class="tt-hdr">2</th>
                            <th class="tt-hdr">3</th>
                            <th class="tt-hdr">4</th>
                            <th class="tt-hdr">5</th>
                            <th class="tt-hdr">6</th>
                            <th class="tt-hdr">7</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ttRows}
                    </tbody>
                </table>
            </div>

            <!-- ===== Signature area ===== -->
            <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:20px;padding-top:14px;border-top:1px solid #dde3ed;font-size:11px;color:#666;">
                <div style="text-align:center;min-width:160px;">
                    <p style="margin:0 0 32px;">المفتش</p>
                    <div style="border-top:1px solid #aaa;width:120px;margin:0 auto;"></div>
                    <p style="margin:4px 0 0;font-size:10px;color:#999;">التوقيع والختم</p>
                </div>
                <div style="text-align:center;font-size:10px;color:#aaa;">
                    <p style="margin:0;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-DZ')}</p>
                </div>
                <div style="text-align:center;min-width:160px;">
                    <p style="margin:0 0 32px;">الأستاذ / الأستاذة</p>
                    <div style="border-top:1px solid #aaa;width:120px;margin:0 auto;"></div>
                    <p style="margin:4px 0 0;font-size:10px;color:#999;">التوقيع</p>
                </div>
            </div>

            <!-- Footer strip -->
            <div style="position:absolute;bottom:28px;left:28px;right:28px;text-align:center;font-size:9px;color:#bbb;border-top:1px solid #eee;padding-top:6px;">
                سماح علمي — جميع الحقوق محفوظة — 2026
            </div>
        </div>`;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:fixed; top:-9999px; left:-9999px; z-index:-1;';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
    return wrapper;
}

async function generatePDF() {
    const pdfBtn = document.getElementById('pdfBtn');
    const pdfText = pdfBtn.querySelector('.btn-pdf-text');
    const pdfLoader = pdfBtn.querySelector('.btn-pdf-loader');

    pdfBtn.disabled = true;
    pdfText.style.display = 'none';
    pdfLoader.style.display = 'flex';

    let wrapper = null;
    try {
        const { jsPDF } = window.jspdf;
        const data = collectFormData();
        wrapper = buildPDFTemplate(data);
        const templateEl = wrapper.querySelector('#pdfTemplate');

        const canvas = await html2canvas(templateEl, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: templateEl.scrollWidth,
            height: templateEl.scrollHeight,
        });

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const usableW = pageW - margin * 2;
        const imgH = (canvas.height * usableW) / canvas.width;

        let remaining = imgH;
        let srcY = 0;

        while (remaining > 0) {
            const sliceH = Math.min(remaining, pageH - margin * 2);
            const srcH = (sliceH / imgH) * canvas.height;

            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = srcH;
            sliceCanvas.getContext('2d').drawImage(
                canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH
            );

            if (srcY > 0) pdf.addPage();
            pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, margin, usableW, sliceH);

            srcY += srcH;
            remaining -= sliceH;
        }

        const namePart = [data.familyName, data.firstName].filter(Boolean).join('_');
        pdf.save(`البطاقة_الشخصية${namePart ? '_' + namePart : ''}.pdf`);
    } catch (err) {
        console.error('PDF generation error:', err);
        showError('حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.');
    } finally {
        if (wrapper) wrapper.remove();
        pdfBtn.disabled = false;
        pdfText.style.display = 'flex';
        pdfLoader.style.display = 'none';
    }
}

// Le pré-remplissage du formulaire est géré par auth.js (_prefillFormFromDB)
// qui est appelé après vérification de la session dans checkAuth().

/**
 * Reset form to initial state (called from success screen)
 */
function resetForm() {
    form.reset();
    form.style.display = 'block';
    document.querySelector('.form-header').style.display = 'block';
    successMessage.style.display = 'none';
    document.getElementById('civil').style.display = 'none';
    document.getElementById('childrenCountGroup').style.display = 'none';
    document.getElementById('spouseNameGroup').style.display = 'none';

    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error', 'valid');
    });
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
}
