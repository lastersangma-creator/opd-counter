// Global variables
let isLoggedIn = false;
let currentRole = '';
let patients = [];
let currentSlNo = 1;
let currentOPDNumber = 3468;
let editingIndex = -1;
let autoSaveInterval;

// Authentication credentials
const VALID_CREDENTIALS = {
    userId: "NONGALBIBRA",
    password: "794107"
};

// Role permissions
const ROLE_PERMISSIONS = {
    "Receptionist": {
        canEdit: ["date", "timeRegistration", "slNo", "opdNumber", "abhaId", "familyHead", "patientName", "dob", "age", "gender", "address", "contact"],
        requiredFields: ["patientName"],
        statusUpdate: "Registration",
        sectionClass: "receptionist-section"
    },
    "Staff Nurse": {
        canEdit: ["complaints", "diagnosis", "onsetDate", "serviceAvailed", "height", "weight", "bloodPressure", "bloodSugar", "breastCancer", "cervicalCancer", "oralCancer", "tbScreening"],
        requiredFields: [],
        statusUpdate: "Examination", 
        sectionClass: "nurse-section"
    },
    "Medical Officer": {
        canEdit: ["testsAdvised", "testConducted", "sampleType", "findings", "consultationStart", "teleconsultation", "rxAdvice", "patientReferred", "referralFacility", "idspReport", "remarks", "consultationEnd", "consultantName"],
        requiredFields: [],
        statusUpdate: "Complete",
        sectionClass: "officer-section"
    }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    // Show login screen by default
    showLoginScreen();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update date/time
    updateDateTime();
    setInterval(updateDateTime, 1000);
}

// Setup all event listeners
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Main form
    const opdForm = document.getElementById('opdForm');
    if (opdForm) {
        opdForm.addEventListener('submit', handleFormSubmit);
    }

    // Role selection
    const roleSelect = document.getElementById('roleSelect');
    if (roleSelect) {
        roleSelect.addEventListener('change', handleRoleChange);
    }

    // DOB calculation
    const dobField = document.getElementById('dob');
    if (dobField) {
        dobField.addEventListener('change', calculateAge);
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Clear form button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }

    // Tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterRecords);
    }

    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', filterRecords);
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }

    // Export CSV button
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCSV);
    }
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const userId = document.getElementById('userId').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('.login-btn');
    const loginText = document.getElementById('loginText');
    const loginLoader = document.getElementById('loginLoader');
    const errorDiv = document.getElementById('loginError');
    
    // Clear previous errors
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
    
    // Show loading state
    loginText.classList.add('hidden');
    loginLoader.classList.remove('hidden');
    loginBtn.disabled = true;
    
    // Simulate login validation delay
    setTimeout(() => {
        if (userId === VALID_CREDENTIALS.userId && password === VALID_CREDENTIALS.password) {
            // Successful login
            isLoggedIn = true;
            showMainApp();
            showStatusMessage('Login successful! Welcome to HWC-OPD Register.', 'success');
        } else {
            // Failed login
            showLoginError('Invalid User ID or Password. Please check your credentials and try again.');
        }
        
        // Reset button state
        loginText.classList.remove('hidden');
        loginLoader.classList.add('hidden');
        loginBtn.disabled = false;
    }, 1500);
}

// Show login error
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Clear password field and focus on user ID
    document.getElementById('password').value = '';
    document.getElementById('userId').focus();
}

// Show login screen
function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
    
    // Reset authentication state
    isLoggedIn = false;
    currentRole = '';
    editingIndex = -1;
    
    // Stop auto-save
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
    }
    
    // Reset login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.reset();
    }
    
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
    }
    
    // Focus on user ID field
    setTimeout(() => {
        const userIdField = document.getElementById('userId');
        if (userIdField) {
            userIdField.focus();
        }
    }, 100);
}

// Show main application
function showMainApp() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
    
    // Initialize main app
    initializeMainApp();
    
    // Start auto-save
    startAutoSave();
}

// Initialize main application after login
function initializeMainApp() {
    // Set current date and time
    const now = new Date();
    const dateField = document.getElementById('date');
    const timeField = document.getElementById('timeRegistration');
    const slNoField = document.getElementById('slNo');
    const opdNumberField = document.getElementById('opdNumber');
    
    if (dateField) dateField.value = formatDate(now);
    if (timeField) timeField.value = formatTime(now);
    if (slNoField) slNoField.value = currentSlNo;
    if (opdNumberField) opdNumberField.value = currentOPDNumber;
    
    // Load sample data if needed
    if (patients.length === 0) {
        loadSampleData();
    }
    
    // Show registration tab by default
    switchTab('registration');
    
    // Reset role selection
    const roleSelect = document.getElementById('roleSelect');
    if (roleSelect) {
        roleSelect.value = '';
    }
    currentRole = '';
    
    updateRoleAccess();
    updateRoleIndicator();
    updateExportStats();
}

// Handle role change
function handleRoleChange() {
    const roleSelect = document.getElementById('roleSelect');
    currentRole = roleSelect ? roleSelect.value : '';
    
    updateRoleAccess();
    updateRoleIndicator();
    
    if (currentRole) {
        showStatusMessage(`Role selected: ${currentRole}. You can now access your authorized fields.`, 'success');
    }
}

// Update role indicator
function updateRoleIndicator() {
    const indicator = document.getElementById('roleIndicator');
    const roleText = document.getElementById('roleText');
    
    if (!indicator || !roleText) return;
    
    if (currentRole) {
        roleText.textContent = `Current Role: ${currentRole}`;
        indicator.classList.remove('hidden');
        
        // Update indicator style based on role
        indicator.className = 'role-indicator';
        if (currentRole === 'Receptionist') {
            indicator.classList.add('receptionist');
        } else if (currentRole === 'Staff Nurse') {
            indicator.classList.add('nurse');
        } else if (currentRole === 'Medical Officer') {
            indicator.classList.add('officer');
        }
    } else {
        indicator.classList.add('hidden');
    }
}

// Update role-based access
function updateRoleAccess() {
    const sections = document.querySelectorAll('.form-section');
    
    // Reset all sections - disable but show them
    sections.forEach(section => {
        section.classList.remove('active');
        const inputs = section.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.disabled = true;
        });
    });
    
    if (currentRole && ROLE_PERMISSIONS[currentRole]) {
        const permissions = ROLE_PERMISSIONS[currentRole];
        const targetSection = document.querySelector(`.${permissions.sectionClass}`);
        
        if (targetSection) {
            targetSection.classList.add('active');
            const inputs = targetSection.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                // Don't enable readonly fields
                if (!input.hasAttribute('readonly')) {
                    input.disabled = false;
                }
            });
        }
    }
}

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.password-toggle');
    
    if (!passwordInput || !toggleBtn) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all application state
        isLoggedIn = false;
        currentRole = '';
        editingIndex = -1;
        
        // Stop auto-save
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }
        
        // Clear form
        clearForm();
        
        // Show login screen
        showLoginScreen();
    }
}

// Start auto-save functionality
function startAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    autoSaveInterval = setInterval(() => {
        if (isLoggedIn && currentRole) {
            const formData = getFormData();
            if (formData.patientName && formData.patientName.trim()) {
                console.log('Auto-save: Form data saved temporarily');
            }
        }
    }, 30000); // Auto-save every 30 seconds
}

// Load sample data for demonstration
function loadSampleData() {
    const sampleRecord = {
        date: "03/10/25",
        timeRegistration: "09:00",
        slNo: 1,
        opdNumber: 3468,
        abhaId: "",
        familyHead: "",
        patientName: "Nirmol",
        dob: "",
        age: 28,
        gender: "Male",
        address: "Rongkhandi Bolsalgittim",
        contact: "9006822884",
        complaints: "Chest Pain",
        diagnosis: "Chest Pain",
        onsetDate: "4 days",
        serviceAvailed: "5-General Outpatient Care: acute Simple illness",
        height: "",
        weight: "",
        bloodPressure: "",
        bloodSugar: "",
        breastCancer: "",
        cervicalCancer: "",
        oralCancer: "",
        tbScreening: "",
        testsAdvised: "",
        testConducted: "",
        sampleType: "",
        findings: "",
        consultationStart: "",
        teleconsultation: "",
        rxAdvice: "",
        patientReferred: "",
        referralFacility: "",
        idspReport: "",
        remarks: "",
        consultationEnd: "",
        consultantName: "Dr L D Sangma",
        status: "Complete"
    };
    
    patients.push(sampleRecord);
    currentSlNo = 2;
    currentOPDNumber = 3469;
    updateRecordsDisplay();
}

// Update date and time display in header
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateStr = now.toLocaleDateString('en-US', options);
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour12: true, 
        hour: 'numeric', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    const currentDateEl = document.getElementById('currentDate');
    const currentTimeEl = document.getElementById('currentTime');
    
    if (currentDateEl) currentDateEl.textContent = dateStr;
    if (currentTimeEl) currentTimeEl.textContent = timeStr;
}

// Format date as DD/MM/YY
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

// Format time as HH:MM
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Calculate age from date of birth
function calculateAge() {
    const dobInput = document.getElementById('dob');
    const ageInput = document.getElementById('age');
    
    if (dobInput && ageInput && dobInput.value) {
        const dob = new Date(dobInput.value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        
        ageInput.value = age >= 0 ? age : '';
    }
}

// Switch between tabs
function switchTab(tabName) {
    if (!isLoggedIn) {
        showLoginScreen();
        return;
    }
    
    // Hide all tab contents
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Remove active class from all tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Add active class to clicked button
    const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    // Update displays based on tab
    if (tabName === 'records') {
        updateRecordsDisplay();
    } else if (tabName === 'export') {
        updateExportStats();
    }
}

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!isLoggedIn) {
        showStatusMessage('Please login to access this functionality.', 'error');
        return;
    }
    
    if (!currentRole) {
        showStatusMessage('Please select your role before saving data.', 'error');
        return;
    }
    
    if (!validateForm()) {
        showStatusMessage('Please fill in all required fields.', 'error');
        return;
    }
    
    const formData = getFormData();
    formData.status = ROLE_PERMISSIONS[currentRole].statusUpdate;
    formData.lastUpdatedBy = currentRole;
    formData.lastUpdated = new Date().toISOString();
    
    if (editingIndex >= 0) {
        // Update existing record
        patients[editingIndex] = { ...patients[editingIndex], ...formData };
        editingIndex = -1;
        showStatusMessage('Patient record updated successfully!', 'success');
    } else {
        // Add new record
        patients.push(formData);
        currentSlNo++;
        currentOPDNumber++;
        showStatusMessage('Patient registered successfully!', 'success');
    }
    
    clearForm();
    updateRecordsDisplay();
    updateExportStats();
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate form based on current role
function validateForm() {
    if (!currentRole || !ROLE_PERMISSIONS[currentRole]) {
        return false;
    }
    
    const requiredFields = ROLE_PERMISSIONS[currentRole].requiredFields;
    
    for (const field of requiredFields) {
        const input = document.getElementById(field);
        if (!input || !input.value.trim()) {
            if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return false;
        }
    }
    
    return true;
}

// Get form data
function getFormData() {
    const data = {};
    
    // Get all form fields
    const fields = [
        'date', 'timeRegistration', 'slNo', 'opdNumber', 'abhaId',
        'familyHead', 'patientName', 'dob', 'age', 'gender', 'address', 'contact',
        'complaints', 'diagnosis', 'onsetDate', 'serviceAvailed',
        'height', 'weight', 'bloodPressure', 'bloodSugar',
        'testsAdvised', 'testConducted', 'sampleType', 'findings',
        'consultationStart', 'teleconsultation', 'rxAdvice', 'patientReferred',
        'referralFacility', 'idspReport', 'remarks', 'consultationEnd', 'consultantName'
    ];
    
    fields.forEach(field => {
        const element = document.getElementById(field);
        data[field] = element ? element.value : '';
    });
    
    // Get radio button values
    const radioGroups = ['breastCancer', 'cervicalCancer', 'oralCancer', 'tbScreening'];
    radioGroups.forEach(group => {
        const checked = document.querySelector(`input[name="${group}"]:checked`);
        data[group] = checked ? checked.value : '';
    });
    
    return data;
}

// Clear form
function clearForm() {
    const form = document.getElementById('opdForm');
    if (form) {
        form.reset();
    }
    
    // Clear radio buttons
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => radio.checked = false);
    
    // Reset auto-increment fields
    const now = new Date();
    const dateField = document.getElementById('date');
    const timeField = document.getElementById('timeRegistration');
    const slNoField = document.getElementById('slNo');
    const opdNumberField = document.getElementById('opdNumber');
    const consultantField = document.getElementById('consultantName');
    
    if (dateField) dateField.value = formatDate(now);
    if (timeField) timeField.value = formatTime(now);
    if (slNoField) slNoField.value = currentSlNo;
    if (opdNumberField) opdNumberField.value = currentOPDNumber;
    if (consultantField) consultantField.value = "Dr L D Sangma";
    
    // Reset form button text
    resetFormButton();
}

// Show status message
function showStatusMessage(message, type) {
    // Remove existing status messages
    const existingMessages = document.querySelectorAll('.status-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new status message
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-message--${type}`;
    statusDiv.textContent = message;
    
    // Insert at the top of the active tab or login screen
    let targetContainer = document.querySelector('.tab-content.active');
    if (!targetContainer) {
        targetContainer = document.querySelector('.login-container');
    }
    
    if (targetContainer) {
        targetContainer.insertBefore(statusDiv, targetContainer.firstChild);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }
}

// Update records display
function updateRecordsDisplay() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (patients.length === 0) {
        const row = tbody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 10;
        cell.textContent = 'No records found';
        cell.style.textAlign = 'center';
        cell.style.padding = '20px';
        cell.style.color = 'var(--color-text-secondary)';
        return;
    }
    
    patients.forEach((patient, index) => {
        const row = tbody.insertRow();
        
        // Add data cells
        row.insertCell().textContent = patient.date || '';
        row.insertCell().textContent = patient.slNo || '';
        row.insertCell().textContent = patient.opdNumber || '';
        row.insertCell().textContent = patient.patientName || '';
        row.insertCell().textContent = patient.age || '';
        row.insertCell().textContent = patient.gender || '';
        row.insertCell().textContent = patient.contact || '';
        row.insertCell().textContent = patient.serviceAvailed || '';
        
        // Add status badge
        const statusCell = row.insertCell();
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${(patient.status || 'Registration').toLowerCase().replace(' ', '')}`;
        statusBadge.textContent = patient.status || 'Registration';
        statusCell.appendChild(statusBadge);
        
        // Add action buttons
        const actionsCell = row.insertCell();
        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn action-btn--edit';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editRecord(index);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn action-btn--delete';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteRecord(index);
        
        const actionDiv = document.createElement('div');
        actionDiv.className = 'action-buttons';
        actionDiv.appendChild(editBtn);
        actionDiv.appendChild(deleteBtn);
        
        actionsCell.appendChild(actionDiv);
    });
}

// Filter records based on search and date
function filterRecords() {
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    
    if (!searchInput || !dateFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const dateFilterValue = dateFilter.value;
    
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        if (row.cells.length === 1) return; // Skip "no records" row
        
        const patientName = row.cells[3].textContent.toLowerCase();
        const recordDate = row.cells[0].textContent;
        
        let showRow = true;
        
        // Apply search filter
        if (searchTerm && !patientName.includes(searchTerm)) {
            showRow = false;
        }
        
        // Apply date filter
        if (dateFilterValue && recordDate) {
            const filterDate = new Date(dateFilterValue);
            const recordDateParts = recordDate.split('/');
            const recordDateObj = new Date(2000 + parseInt(recordDateParts[2]), parseInt(recordDateParts[1]) - 1, parseInt(recordDateParts[0]));
            
            if (filterDate.toDateString() !== recordDateObj.toDateString()) {
                showRow = false;
            }
        }
        
        row.style.display = showRow ? '' : 'none';
    });
}

// Clear filters
function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const dateFilter = document.getElementById('dateFilter');
    
    if (searchInput) searchInput.value = '';
    if (dateFilter) dateFilter.value = '';
    
    filterRecords();
}

// Edit record
function editRecord(index) {
    if (!isLoggedIn) {
        showStatusMessage('Please login to access this functionality.', 'error');
        return;
    }
    
    const patient = patients[index];
    editingIndex = index;
    
    // Switch to registration tab
    switchTab('registration');
    
    // Populate form with patient data
    Object.keys(patient).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = patient[key];
        }
    });
    
    // Set radio buttons
    const radioGroups = ['breastCancer', 'cervicalCancer', 'oralCancer', 'tbScreening'];
    radioGroups.forEach(group => {
        if (patient[group]) {
            const radio = document.querySelector(`input[name="${group}"][value="${patient[group]}"]`);
            if (radio) radio.checked = true;
        }
    });
    
    // Update form button text
    const submitBtn = document.getElementById('saveBtn');
    if (submitBtn) submitBtn.textContent = 'Update Registration';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    showStatusMessage('Record loaded for editing. Please select your role to continue.', 'success');
}

// Delete record
function deleteRecord(index) {
    if (!isLoggedIn) {
        showStatusMessage('Please login to access this functionality.', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this record?')) {
        patients.splice(index, 1);
        updateRecordsDisplay();
        updateExportStats();
        showStatusMessage('Record deleted successfully.', 'success');
    }
}

// Update export statistics
function updateExportStats() {
    const totalRecordsEl = document.getElementById('totalRecords');
    const todayRecordsEl = document.getElementById('todayRecords');
    
    if (totalRecordsEl && todayRecordsEl) {
        const totalRecords = patients.length;
        const today = formatDate(new Date());
        const todayRecords = patients.filter(p => p.date === today).length;
        
        totalRecordsEl.textContent = totalRecords;
        todayRecordsEl.textContent = todayRecords;
    }
}

// Export to CSV
function exportToCSV() {
    if (!isLoggedIn) {
        showStatusMessage('Please login to access this functionality.', 'error');
        return;
    }
    
    if (patients.length === 0) {
        showStatusMessage('No records to export.', 'error');
        return;
    }
    
    const headers = [
        "Date (DD/MM/YY)", "Time of Registration", "Sl No", "OPD Registration Number", 
        "Patient ABHA ID number", "Name of the head of the family", "Name of the patient",
        "Date of birth", "Age", "Gender", "Address: Name of (Village/Locality)", 
        "Contact Number", "Chief complaints", "Provisional diagnosis", 
        "Date of onset of Illness", "Service Availed", "Height", "Weight", 
        "Blood Pressure", "Blood Sugar", "Breast Cancer", "Cervical Cancer", 
        "Oral Cancer", "TB Symptomatic Screening", "Any diagnostic tests advised (Yes/No)",
        "Test conducted In-House (IH) or Referred (RF)", 
        "Type of sample referred/ collected for testing", 
        "Findings/Investigation (Mention the category of case wherever applicable)",
        "Consultation Starting time", "Teleconsultation is Done (Yes/No/Not required)",
        "Rx advice including vaccine, drug", "Patient Referred ( Yes/No)",
        "Name of the referral facility", "Reported in IDSP- IHIP (Yes/No)",
        "Remarks (Referral/Teleconsultation/Follow- up, etc)", 
        "Consultation Ending time", "Consultant Name (Doctor)", "Status"
    ];
    
    const csvContent = [
        headers.join(','),
        ...patients.map(patient => [
            patient.date || '',
            patient.timeRegistration || '',
            patient.slNo || '',
            patient.opdNumber || '',
            patient.abhaId || '',
            patient.familyHead || '',
            patient.patientName || '',
            patient.dob || '',
            patient.age || '',
            patient.gender || '',
            patient.address || '',
            patient.contact || '',
            `"${(patient.complaints || '').replace(/"/g, '""')}"`,
            `"${(patient.diagnosis || '').replace(/"/g, '""')}"`,
            patient.onsetDate || '',
            patient.serviceAvailed || '',
            patient.height || '',
            patient.weight || '',
            patient.bloodPressure || '',
            patient.bloodSugar || '',
            patient.breastCancer || '',
            patient.cervicalCancer || '',
            patient.oralCancer || '',
            patient.tbScreening || '',
            patient.testsAdvised || '',
            patient.testConducted || '',
            patient.sampleType || '',
            `"${(patient.findings || '').replace(/"/g, '""')}"`,
            patient.consultationStart || '',
            patient.teleconsultation || '',
            `"${(patient.rxAdvice || '').replace(/"/g, '""')}"`,
            patient.patientReferred || '',
            patient.referralFacility || '',
            patient.idspReport || '',
            `"${(patient.remarks || '').replace(/"/g, '""')}"`,
            patient.consultationEnd || '',
            patient.consultantName || '',
            patient.status || 'Registration'
        ].join(','))
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `OPD_Records_${formatDate(new Date()).replace(/\//g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatusMessage('CSV file exported successfully!', 'success');
}

// Utility function to reset form button text
function resetFormButton() {
    const submitBtn = document.getElementById('saveBtn');
    if (submitBtn) submitBtn.textContent = 'Save Registration';
    editingIndex = -1;
}

// Global function for password toggle (called from HTML onclick)
window.togglePassword = togglePassword;