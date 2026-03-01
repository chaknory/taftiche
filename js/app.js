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
        schoolEntryDate: { element: 'schoolEntryDate', errorId: 'schoolEntryDateError' }
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
    const fields = ['district', 'schoolYear', 'schoolName', 'yearsWorked', 'firstName', 'familyName', 'maidenName', 'birthDate', 'birthPlace', 'residence', 'gender', 'maritalStatus', 'childrenCount', 'spouseName', 'phone', 'email', 'address', 'schoolEntryDate'];
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

// Text inputs
['district', 'schoolYear', 'schoolName', 'yearsWorked', 'firstName', 'familyName', 'maidenName', 'birthPlace', 'residence', 'childrenCount', 'spouseName', 'phone', 'email', 'address'].forEach(fieldId => {
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
['birthDate', 'schoolEntryDate'].forEach(fieldId => {
    document.getElementById(fieldId).addEventListener('change', () => validateField(fieldId));
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
        school_entry_date: document.getElementById('schoolEntryDate').value
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
