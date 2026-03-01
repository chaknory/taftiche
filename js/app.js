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
        schoolName: 'يرجى إدخال اسم المدرسة (5 أحرف على الأقل)',
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
        rank: 'يرجى إدخال الرتبة (2 أحرف على الأقل)',
        status: 'يرجى إدخال الصفة (2 أحرف على الأقل)',
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
        return value.trim().length >= 5;
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
        if (civil.style.display === 'none') return true; // masqué = pas encore requis
        return document.querySelector('input[name="marital_status"]:checked') !== null;
    },

    spouseName(value) {
        const group = document.getElementById('spouseNameGroup');
        if (group.style.display === 'none') return true; // optionnel si masqué
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

    rank(value) {
         return true; // champ optionnel
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
        rank: { element: 'rank', errorId: 'rankError' },
        status: { element: 'status', errorId: 'statusError' },
        lastInspectionDate: { element: 'lastInspectionDate', errorId: 'lastInspectionDateError' },
        lastInspectionScore: { element: 'lastInspectionScore', errorId: 'lastInspectionScoreError' },
        echelon: { element: 'echelon', errorId: 'echelonError' },
        grade: { element: 'grade', errorId: 'gradeError' },
        executionDate: { element: 'executionDate', errorId: 'executionDateError' },
        latestInspectionDate: { element: 'latestInspectionDate', errorId: 'latestInspectionDateError' },
        latestInspectionScore: { element: 'latestInspectionScore', errorId: 'latestInspectionScoreError' },
        previousYearClass: { element: 'previousYearClass', errorId: 'previousYearClassError' },
        currentYearClass: { element: 'currentYearClass', errorId: 'currentYearClassError' }
    };

    const config = fieldMap[fieldName];
    if (!config) return true;

    const input = config.element ? document.getElementById(config.element) : null;
    const errorEl = document.getElementById(config.errorId);
    const value = input ? input.value : '';
    const isValid = validators[fieldName](value);

    // Update UI
    const formGroup = (input || errorEl).closest('.form-group');
    
    if (isValid) {
        formGroup.classList.remove('error');
        formGroup.classList.add('valid');
        errorEl.textContent = '';
    } else {
        formGroup.classList.remove('valid');
        formGroup.classList.add('error');
        errorEl.textContent = CONFIG.MESSAGES[fieldName];
    }

    return isValid;
}

/**
 * Validate entire form
 */
function validateForm() {
    const fields = ['district', 'schoolYear', 'schoolName', 'yearsWorked', 'firstName', 'familyName', 'maidenName', 'birthDate', 'birthPlace', 'residence', 'gender', 'maritalStatus', 'childrenCount', 'spouseName', 'phone', 'email', 'address', 'schoolEntryDate', 'diploma', 'firstAppointmentDate', 'rank', 'status', 'techInstituteGradYear', 'universityGradYear', 'lastInspectionDate', 'lastInspectionScore', 'echelon', 'grade', 'executionDate', 'latestInspectionDate', 'latestInspectionScore', 'previousYearClass', 'currentYearClass'];
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

// Text inputs — rank, status, echelon, grade + lastInspectionScore
['rank', 'status', 'echelon', 'grade', 'lastInspectionScore', 'latestInspectionScore'].forEach(fieldId => {
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
        children_count: document.getElementById('childrenCountGroup').style.display !== 'none'
            ? parseInt(document.getElementById('childrenCount').value, 10)
            : null,
        spouse_name: document.getElementById('spouseNameGroup').style.display !== 'none'
            ? document.getElementById('spouseName').value.trim()
            : '',
        birth_date: document.getElementById('birthDate').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        address: document.getElementById('address').value.trim(),
        school_entry_date: document.getElementById('schoolEntryDate').value,
        diploma: document.getElementById('diploma').value.trim(),
        tech_institute_grad_year: document.getElementById('techInstituteGradYear').value || null,
        university_grad_year: document.getElementById('universityGradYear').value || null,
        first_appointment_date: document.getElementById('firstAppointmentDate').value,
        rank: document.getElementById('rank').value.trim(),
        status: document.getElementById('status').value.trim(),
        last_inspection_date: document.getElementById('lastInspectionDate').value || null,
        last_inspection_score: document.getElementById('lastInspectionScore').value !== '' ? parseInt(document.getElementById('lastInspectionScore').value, 10) : null,
        echelon: document.getElementById('echelon').value.trim() || null,
        grade: document.getElementById('grade').value.trim() || null,
        execution_date: document.getElementById('executionDate').value || null,
        latest_inspection_date: document.getElementById('latestInspectionDate').value || null,
        latest_inspection_score: document.getElementById('latestInspectionScore').value !== '' ? parseInt(document.getElementById('latestInspectionScore').value, 10) : null,
        previous_year_class: document.getElementById('previousYearClass').value || null,
        current_year_class: document.getElementById('currentYearClass').value
    };

    // Show loading state
    setLoadingState(true);

    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            showSuccess();
        } else {
            showError(result.message || CONFIG.MESSAGES.serverError);
        }
    } catch (error) {
        console.error('Submission error:', error);
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

    return {
        district        : get('district'),
        schoolYear      : get('schoolYear'),
        schoolName      : get('schoolName'),
        yearsWorked     : get('yearsWorked'),
        firstName       : get('firstName'),
        familyName      : get('familyName'),
        maidenName      : get('maidenName'),
        birthDate       : get('birthDate'),
        birthPlace      : get('birthPlace'),
        residence       : get('residence'),
        gender          : radio('gender'),
        maritalStatus   : radio('marital_status'),
        childrenCount   : visible('childrenCountGroup') ? get('childrenCount') : '—',
        spouseName      : visible('spouseNameGroup')    ? get('spouseName')    : '',
        phone           : get('phone'),
        email           : get('email'),
        address         : get('address'),
        schoolEntryDate         : get('schoolEntryDate'),
        diploma                  : get('diploma'),
        techInstituteGradYear    : get('techInstituteGradYear'),
        universityGradYear       : get('universityGradYear'),
        firstAppointmentDate     : get('firstAppointmentDate'),
        rank                     : get('rank'),
        status                   : get('status'),
        lastInspectionDate       : get('lastInspectionDate'),
        lastInspectionScore      : get('lastInspectionScore'),
        echelon                  : get('echelon'),
        grade                    : get('grade'),
        executionDate            : get('executionDate'),
        latestInspectionDate     : get('latestInspectionDate'),
        latestInspectionScore    : get('latestInspectionScore'),
        previousYearClass        : get('previousYearClass'),
        currentYearClass         : get('currentYearClass'),
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
 */
function buildPDFTemplate(data) {
    const fullName = [data.familyName, data.firstName, data.maidenName ? `(${data.maidenName})` : ''].filter(Boolean).join(' ');

    const row = (label, value) => `
        <tr>
            <td class="cell-label">${label}</td>
            <td class="cell-value">${value || '—'}</td>
        </tr>`;

    const section = (title, rows) => `
        <div class="pdf-section">
            <div class="section-title">${title}</div>
            <table class="info-table">${rows}</table>
        </div>`;

    const html = `
        <div id="pdfTemplate" style="
            width: 794px;
            min-height: 1123px;
            background: #ffffff;
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            direction: rtl;
            padding: 40px 50px 50px;
            box-sizing: border-box;
            position: relative;
            color: #1a2e44;
        ">
            <!-- Outer border -->
            <div style="
                position: absolute; inset: 16px;
                border: 2px solid #1a3a5c;
                pointer-events: none;
                border-radius: 4px;
            "></div>

            <!-- Inner border -->
            <div style="
                position: absolute; inset: 20px;
                border: 1px solid #c8a45a;
                pointer-events: none;
                border-radius: 2px;
            "></div>

            <!-- ===== Header ===== -->
            <div style="text-align:center; margin-bottom: 28px;">
                <p style="font-size:13px; font-weight:700; color:#1a3a5c; margin:0 0 2px;">
                    الجمهورية الجزائرية الديمقراطية الشعبية
                </p>
                <p style="font-size:12px; color:#555; margin:0 0 2px;">
                    وزارة التربية الوطنية
                </p>
                <p style="font-size:12px; font-weight:600; color:#1a3a5c; margin:0 0 2px;">
                    مديرية التربية لولاية بسكرة
                </p>
                <p style="font-size:11px; color:#555; margin:0;">
                    مفتشية التعليم الابتدائي — المقاطعة ${data.district}
                </p>

                <!-- Decorative divider -->
                <div style="display:flex; align-items:center; gap:8px; margin:14px auto; width:70%;">
                    <div style="flex:1; height:1px; background:#c8a45a;"></div>
                    <div style="width:6px; height:6px; background:#c8a45a; transform:rotate(45deg); flex-shrink:0;"></div>
                    <div style="flex:1; height:1px; background:#c8a45a;"></div>
                </div>

                <h1 style="font-size:17px; font-weight:700; color:#1a3a5c; margin:0 0 4px;">
                    البطاقة الشخصية لأستاذ اللغة العربية
                </h1>
                <p style="font-size:11px; color:#777; margin:0;">
                    السنة الدراسية: <strong>${data.schoolYear}</strong>
                </p>
            </div>

            <!-- ===== Full name banner ===== -->
            <div style="
                background: linear-gradient(135deg, #1a3a5c, #2c5282);
                color: #fff;
                text-align: center;
                padding: 10px 20px;
                border-radius: 4px;
                margin-bottom: 24px;
                font-size: 15px;
                font-weight: 700;
            ">
                ${fullName}
            </div>

            <style>
                .pdf-section { margin-bottom: 20px; }
                .section-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #fff;
                    background: #1a3a5c;
                    padding: 5px 12px;
                    border-radius: 3px 3px 0 0;
                    border-right: 4px solid #c8a45a;
                }
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11.5px;
                }
                .info-table tr:nth-child(even) { background: #f7f9fc; }
                .cell-label {
                    width: 36%;
                    padding: 7px 12px;
                    color: #555;
                    font-weight: 600;
                    border: 1px solid #dde3ed;
                    border-right: 3px solid #c8a45a;
                    white-space: nowrap;
                }
                .cell-value {
                    padding: 7px 14px;
                    color: #1a2e44;
                    font-weight: 500;
                    border: 1px solid #dde3ed;
                    word-break: break-word;
                }
            </style>

            ${section('المعلومات المدرسية', `
                ${row('اسم المدرسة', data.schoolName)}
                ${row('عدد سنوات العمل', data.yearsWorked)}
                ${row('الشهادة / الدبلوم المحصل عليه', data.diploma)}
                ${row('تاريخ الدخول المدرسي الأولي', formatDate(data.schoolEntryDate))}
                ${row('تاريخ أول تعيين بالتعليم', formatDate(data.firstAppointmentDate))}
                ${row('الرتبة', data.rank)}
                ${row('الصفة', data.status)}
                ${data.lastInspectionDate ? row('تاريخ التفتيش ما قبل الأخير', formatDate(data.lastInspectionDate)) : ''}
                ${data.lastInspectionScore !== '' && data.lastInspectionScore !== undefined ? row('علامة التفتيش ما قبل الأخير', data.lastInspectionScore) : ''}
                ${data.latestInspectionDate ? row('تاريخ آخر تفتيش', formatDate(data.latestInspectionDate)) : ''}
                ${data.latestInspectionScore !== '' && data.latestInspectionScore !== undefined ? row('علامة آخر تفتيش', data.latestInspectionScore) : ''}
                ${data.echelon ? row('السلم', data.echelon) : ''}
                ${data.grade ? row('الدرجة', data.grade) : ''}
                ${data.executionDate ? row('تاريخ التنفيذ', formatDate(data.executionDate)) : ''}
                ${data.techInstituteGradYear ? row('سنة التخرج من المعهد التكنولوجي', data.techInstituteGradYear) : ''}
                ${data.universityGradYear ? row('سنة التخرج من الجامعة', data.universityGradYear) : ''}
                ${data.previousYearClass ? row('القسم المُسند العام الماضي', data.previousYearClass) : ''}
                ${row('القسم المُسند هذا العام', data.currentYearClass)}
            `)}

            ${section('المعلومات الشخصية', `
                ${row('الجنس', data.gender)}
                ${row('تاريخ الميلاد', formatDate(data.birthDate))}
                ${row('مكان الميلاد', data.birthPlace)}
                ${row('مكان الإقامة', data.residence)}
                ${row('الحالة المدنية', data.maritalStatus)}
                ${data.spouseName ? row('اسم ولقب الزوج', data.spouseName) : ''}
                ${row('عدد الأطفال', data.childrenCount)}
            `)}

            ${section('معلومات الاتصال', `
                ${row('رقم الهاتف', data.phone)}
                ${row('البريد الإلكتروني', data.email)}
                ${row('العنوان', data.address)}
            `)}

            <!-- ===== Signature area ===== -->
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: 32px;
                padding-top: 16px;
                border-top: 1px solid #dde3ed;
                font-size: 11px;
                color: #666;
            ">
                <div style="text-align:center; min-width:160px;">
                    <p style="margin:0 0 32px;">المفتش</p>
                    <div style="border-top:1px solid #aaa; width:120px; margin:0 auto;"></div>
                    <p style="margin:4px 0 0; font-size:10px; color:#999;">التوقيع والختم</p>
                </div>
                <div style="text-align:center; font-size:10px; color:#aaa;">
                    <p style="margin:0;">تاريخ الإصدار: ${new Date().toLocaleDateString('ar-DZ')}</p>
                </div>
                <div style="text-align:center; min-width:160px;">
                    <p style="margin:0 0 32px;">الأستاذ / الأستاذة</p>
                    <div style="border-top:1px solid #aaa; width:120px; margin:0 auto;"></div>
                    <p style="margin:4px 0 0; font-size:10px; color:#999;">التوقيع</p>
                </div>
            </div>

            <!-- Footer strip -->
            <div style="
                position: absolute;
                bottom: 28px; left: 28px; right: 28px;
                text-align: center;
                font-size: 9px;
                color: #bbb;
                border-top: 1px solid #eee;
                padding-top: 6px;
            ">
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
