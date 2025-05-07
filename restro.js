document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').min = today;
    
    // Sample tables data
    const tables = [
        { id: 1, capacity: 2, name: "N2" },
        { id: 2, capacity: 2, name: "N2" },
        { id: 3, capacity: 4, name: "N4" },
        { id: 4, capacity: 4, name: "N4" },
        { id: 5, capacity: 6, name: "N6" },
        { id: 6, capacity: 8, name: "N8" }
    ];
    
    // Initialize users and reservations from localStorage
    let users = JSON.parse(localStorage.getItem('lakeside_users')) || [];
    let reservations = JSON.parse(localStorage.getItem('lakeside_reservations')) || [];
    let currentUser = null;
    
    // DOM elements
    const aboutBtn = document.getElementById('aboutBtn');
    const reserveBtn = document.getElementById('reserveBtn');
    const aboutSection = document.getElementById('aboutSection');
    const loginSection = document.getElementById('loginSection');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const reservationForm = document.getElementById('reservationForm');
    const guestFields = document.getElementById('guestFields');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const reservationTitle = document.getElementById('reservationTitle');
    const backBtn = document.querySelector('.back-btn');
    
    // Event listeners
    aboutBtn.addEventListener('click', showAboutSection);
    reserveBtn.addEventListener('click', showReserveSection);
    backBtn.addEventListener('click', showReserveSection);
    document.getElementById('showRegister').addEventListener('click', showRegister);
    document.getElementById('showLogin').addEventListener('click', showLogin);
    document.getElementById('continueAsGuest').addEventListener('click', continueAsGuest);
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('registerBtn').addEventListener('click', register);
    document.getElementById('bookBtn').addEventListener('click', makeReservation);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('newReservationBtn').addEventListener('click', newReservation);
    
    // Functions
    function showAboutSection(e) {
        e.preventDefault();
        aboutSection.classList.remove('hidden');
        loginSection.classList.add('hidden');
        reservationForm.classList.add('hidden');
        document.getElementById('confirmation').classList.add('hidden');
        
        // Update nav active state
        aboutBtn.classList.add('active');
        reserveBtn.classList.remove('active');
    }
    
    function showReserveSection(e) {
        if(e) e.preventDefault();
        aboutSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        
        // Update nav active state
        reserveBtn.classList.add('active');
        aboutBtn.classList.remove('active');
    }
    
    function showRegister(e) {
        e.preventDefault();
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
    
    function showLogin(e) {
        e.preventDefault();
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    }
    
    function continueAsGuest(e) {
        e.preventDefault();
        currentUser = null;
        showReservationForm();
    }
    
    function login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            currentUser = user;
            showReservationForm();
        } else {
            alert('Invalid email or password. Please try again.');
        }
    }
    
    function register() {
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        
        if (!name || !email || !phone || !password) {
            alert('Please fill all fields');
            return;
        }
        
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        if (phone.length < 10) {
            alert('Please enter a valid phone number');
            return;
        }
        
        if (users.some(u => u.email === email)) {
            alert('This email is already registered. Please login instead.');
            return;
        }
        
        const user = { 
            name, 
            email, 
            phone, 
            password,
            joinDate: new Date().toISOString(),
            loyaltyPoints: 0
        };
        
        users.push(user);
        localStorage.setItem('lakeside_users', JSON.stringify(users));
        
        currentUser = user;
        showReservationForm();
    }
    
    function showReservationForm() {
        loginSection.classList.add('hidden');
        reservationForm.classList.remove('hidden');
        
        if (currentUser) {
            // Registered user
            guestFields.classList.add('hidden');
            userInfo.classList.remove('hidden');
            userInfo.innerHTML = `
                <p><strong>Member:</strong> ${currentUser.name}</p>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Phone:</strong> ${currentUser.phone}</p>
            `;
            logoutBtn.classList.remove('hidden');
            reservationTitle.textContent = `Welcome, ${currentUser.name.split(' ')[0]}`;
        } else {
            // Guest user
            guestFields.classList.remove('hidden');
            userInfo.classList.add('hidden');
            logoutBtn.classList.add('hidden');
            reservationTitle.textContent = 'Guest Reservation';
        }
    }
    
    function makeReservation() {
        const name = currentUser ? currentUser.name : document.getElementById('name').value.trim();
        const email = currentUser ? currentUser.email : document.getElementById('email').value.trim();
        const phone = currentUser ? currentUser.phone : document.getElementById('phone').value.trim();
        const guests = parseInt(document.getElementById('guests').value);
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        
        if (!name || !email || !phone || isNaN(guests) || !date || !time) {
            alert('Please fill all required fields');
            return;
        }
        
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            alert('Please enter a valid email address');
            return;
        }
        
        if (phone.length < 10) {
            alert('Please enter a valid phone number');
            return;
        }
        
        // Find suitable table
        let table = tables.find(t => t.capacity >= guests);
        if (!table) {
            // If no single table, find combination
            const combination = findTableCombination(guests);
            if (combination) {
                table = { 
                    id: combination.map(t => t.id).join('+'), 
                    name: combination.map(t => t.name).join(' + '),
                    capacity: combination.reduce((sum, t) => sum + t.capacity, 0) 
                };
            } else {
                alert('We cannot accommodate a party of this size at the selected time. Please try a smaller group or different time.');
                return;
            }
        }
        
        // Create reservation
        const reservation = {
            id: Date.now(),
            userId: currentUser ? currentUser.email : null,
            name,
            email,
            phone,
            guests,
            date,
            time,
            table: table.id,
            tableName: table.name,
            capacity: table.capacity,
            timestamp: new Date().toISOString(),
            status: 'confirmed'
        };
        
        reservations.push(reservation);
        localStorage.setItem('lakeside_reservations', JSON.stringify(reservations));
        
        // Update loyalty points for registered users
        if (currentUser) {
            currentUser.loyaltyPoints += guests * 10; // 10 points per guest
            localStorage.setItem('lakeside_users', JSON.stringify(users));
        }
        
        showConfirmation(reservation);
    }
    
    function findTableCombination(guests) {
        const available = [...tables].sort((a, b) => b.capacity - a.capacity);
        let result = [];
        let remaining = guests;
        
        for (const table of available) {
            if (table.capacity <= remaining) {
                result.push(table);
                remaining -= table.capacity;
                if (remaining <= 0) break;
            }
        }
        
        return remaining <= 0 ? result : null;
    }
    
    function showConfirmation(reservation) {
        reservationForm.classList.add('hidden');
        
        const dateObj = new Date(reservation.date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options);
        
        document.getElementById('reservationDetails').innerHTML = `
            <p><strong>Name:</strong> ${reservation.name}</p>
            <p><strong>When:</strong> ${formattedDate} at ${reservation.time}</p>
            <p><strong>Party Size:</strong> ${reservation.guests} guest${reservation.guests > 1 ? 's' : ''}</p>
            <p><strong>Table:</strong> ${reservation.tableName}</p>
            ${currentUser ? `<p><strong>Loyalty Points Earned:</strong> ${reservation.guests * 10}</p>` : ''}
        `;
        
        document.getElementById('confirmation').classList.remove('hidden');
    }
    
    function logout() {
        currentUser = null;
        document.getElementById('reservationForm').reset();
        loginSection.classList.remove('hidden');
        reservationForm.classList.add('hidden');
        document.getElementById('confirmation').classList.add('hidden');
        document.getElementById('loginForm').reset();
    }
    
    function newReservation() {
        document.getElementById('confirmation').classList.add('hidden');
        document.getElementById('reservationForm').reset();
        if (currentUser) {
            showReservationForm();
        } else {
            loginSection.classList.remove('hidden');
            reservationForm.classList.add('hidden');
        }
    }
});