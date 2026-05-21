// Loader
window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    if (loader) {
        setTimeout(() => loader.classList.add("hide"), 500);
    }
});

// Navigation mobile menu
const toggle = document.getElementById("menuToggle");
const nav = document.getElementById("navLinks");

if (toggle && nav) {
    toggle.addEventListener("click", () => {
        nav.classList.toggle("active");
    });
}

// Home page actions
const btnSeats = document.getElementById("btnSeats");
if (btnSeats) {
    btnSeats.onclick = () => {
        window.location.href = "seat.html";
    };
}

const btnTour = document.getElementById("btnTour");
if (btnTour) {
    btnTour.onclick = () => {
        alert("Virtual tour coming soon");
    };
}

const btnBook = document.getElementById("btnBook");
if (btnBook) {
    // ✅ FIXED: single click handler, no onclick conflict
    btnBook.addEventListener("click", function () {
        this.innerText = "Loading...";
        window.location.href = "seat.html";
    });
}

// OPEN and CLOSED Status
function updateStatus() {
    const statusEl = document.getElementById("statusText");
    if (!statusEl) return;

    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();

    let open = day === 0
        ? hours >= 8 && hours < 20
        : hours >= 6 && hours < 23;

    if (open) {
        statusEl.textContent = "Open Now";
        statusEl.classList.add("open");
        statusEl.classList.remove("closed");
    } else {
        statusEl.textContent = "Closed Now";
        statusEl.classList.add("closed");
        statusEl.classList.remove("open");
    }
}
updateStatus();

// ─── Firebase helpers ────────────────────────────────────────────────────────

async function getFirebaseInstances() {
    const firebaseConfig = window.__FIREBASE_CONFIG__;
    if (!firebaseConfig) throw new Error("Firebase is not configured.");

    const [
        { initializeApp, getApps, getApp },
        { getFirestore, collection, addDoc, updateDoc, serverTimestamp, query, where, getDocs }
    ] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js")
    ]);

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    return { db, collection, addDoc, updateDoc, serverTimestamp, query, where, getDocs };
}

const ADMIN_ID = "pC1A2vbd09dDA2zMGzumTVEMT8P2";

async function reserveSeat(sectionName, seatNumber, reservationId) {
    const { db, collection, query, where, getDocs, updateDoc } = await getFirebaseInstances();

    const seatsRef = collection(db, "admins", ADMIN_ID, "seat");

    const q = query(
        seatsRef,
        where("section", "==", sectionName),
        where("seatNumber", "==", Number(seatNumber))
    );

    const snapshot = await getDocs(q);

    // ✅ FIXED: use for...of instead of forEach to properly await async updates
    for (const docItem of snapshot.docs) {
        await updateDoc(docItem.ref, {
            status: "Reserved",
            reservationId: reservationId
        });
    }
}

// ─── Seat / Form elements ─────────────────────────────────────────────────────

const sectionsGrid = document.getElementById("sectionsGrid");
const studentForm = document.getElementById("studentForm");
const selectedSeatLabel = document.getElementById("selectedSeatLabel");
const selectedPricingLabel = document.getElementById("selectedPricingLabel");
const selectedSectionInput = document.getElementById("selectedSection");
const selectedSeatInput = document.getElementById("selectedSeat");
const successMessage = document.getElementById("successMessage");

const validatorConfigs = {
    fullName: {
        validate: (value) => {
            if (!value) return "Student full name is required.";
            if (!/^[A-Za-z][A-Za-z\s.'-]{2,79}$/.test(value))
                return "Enter a valid full name with at least 3 letters.";
            return "";
        }
    },
    address: {
        validate: (value) => {
            if (!value) return "Address is required.";
            if (value.length < 10) return "Address must be at least 10 characters long.";
            return "";
        }
    },
    dob: {
        validate: (value) => {
            if (!value) return "Date of birth is required.";
            const selectedDate = new Date(`${value}T00:00:00`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (Number.isNaN(selectedDate.getTime())) return "Enter a valid date of birth.";
            if (selectedDate > today) return "Date of birth cannot be in the future.";
            return "";
        }
    },
    email: {
        validate: (value) => {
            if (!value) return "Email ID is required.";
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
            return "";
        }
    },
    aadhar: {
        sanitize: (value) => value.replace(/\D/g, "").slice(0, 12),
        validate: (value) => {
            if (!value) return "Aadhar number is required.";
            if (!/^\d{12}$/.test(value)) return "Aadhar number must be exactly 12 digits.";
            return "";
        }
    },
    mobile: {
        sanitize: (value) => value.replace(/\D/g, "").slice(0, 10),
        validate: (value) => {
            if (!value) return "Mobile number is required.";
            if (!/^[6-9]\d{9}$/.test(value)) return "Enter a valid 10-digit mobile number.";
            return "";
        }
    },
    education: {
        validate: (value) => {
            if (!value) return "Education field is required.";
            if (value.length < 2) return "Education must be at least 2 characters.";
            return "";
        }
    },
    preparingFor: {
        validate: (value) => {
            if (!value) return "Preparing for field is required.";
            if (value.length < 2) return "Preparing for must be at least 2 characters.";
            return "";
        }
    }
};

let activeSeatButton = null;
let selectedSeatType = "";

// ─── UTR Popup ────────────────────────────────────────────────────────────────

const utrPopup = document.getElementById("utrPopup");       // new popup wrapper
const utrInput = document.getElementById("utrInput");        // UTR text input
const utrError = document.getElementById("utrError");        // error message el
const utrConfirmBtn = document.getElementById("utrConfirmBtn");   // confirm button
const utrCancelBtn = document.getElementById("utrCancelBtn");    // cancel button
const utrAmountLabel = document.getElementById("utrAmountLabel");  // shows total amount

let pendingReservationId = null;   // holds reservationId while awaiting UTR
let pendingPayload = null;   // holds form payload while awaiting UTR

function openUTRPopup(reservationId, payload, totalAmount) {
    pendingReservationId = null;   // ✅ always null at open — assigned after Firebase save
    pendingPayload = payload;

    if (utrAmountLabel) {
        utrAmountLabel.textContent = totalAmount ? `₹${totalAmount}` : "";
    }

    if (utrInput) utrInput.value = "";
    if (utrError) { utrError.textContent = ""; utrError.hidden = true; }

    utrPopup.hidden = false;
    requestAnimationFrame(() => utrPopup.classList.add("show"));
    document.body.style.overflow = "hidden";
    if (utrInput) utrInput.focus();
}

function closeUTRPopup() {
    utrPopup.classList.remove("show");
    document.body.style.overflow = "auto";
    setTimeout(() => { utrPopup.hidden = true; }, 300);
    pendingReservationId = null;
    pendingPayload = null;
}

// Cancel button
if (utrCancelBtn) {
    utrCancelBtn.addEventListener("click", closeUTRPopup);
}

// Confirm button — validate UTR then save to Firebase
if (utrConfirmBtn) {
    utrConfirmBtn.addEventListener("click", async () => {
        const utr = utrInput ? utrInput.value.trim() : "";

        // Validate: empty check
        if (!utr) {
            if (utrError) {
                utrError.textContent = "Please enter your UTR number to confirm payment.";
                utrError.hidden = false;
            }
            if (utrInput) utrInput.focus();
            return;
        }

        // Validate: 12-digit check
        if (!/^\d{12}$/.test(utr)) {
            if (utrError) {
                utrError.textContent = "UTR number must be exactly 12 digits.";
                utrError.hidden = false;
            }
            if (utrInput) utrInput.focus();
            return;
        }

        if (utrError) { utrError.textContent = ""; utrError.hidden = true; }

        utrConfirmBtn.disabled = true;
        utrConfirmBtn.textContent = "Saving...";

        try {
            // ✅ STEP 1: Save registration with UTR and paymentStatus: Paid in one shot
            const { db, collection, addDoc, updateDoc, serverTimestamp } =
                await getFirebaseInstances();

            const docRef = await addDoc(
                collection(db, "admins", ADMIN_ID, "NewRegistrations"),
                {
                    ...pendingPayload,
                    utrNumber: utr,
                    paymentStatus: "Paid",
                    paidAt: new Date().toISOString(),
                    createdAt: serverTimestamp()
                }
            );

            const reservationId = docRef.id;

            // ✅ STEP 2: Mark seat as Reserved in Firestore
            await reserveSeat(
                pendingPayload.section,
                Number(pendingPayload.seatNumber),
                reservationId
            );

            // ✅ STEP 3: All saved — now close popup and reset UI
            closeUTRPopup();

            studentForm.reset();
            resetFormValidation(studentForm);
            selectedSectionInput.value = "";
            selectedSeatInput.value = "";
            selectedSeatLabel.textContent = "No seat selected yet";
            selectedSeatLabel.classList.remove("selection-error");
            selectedPricingLabel.textContent = "Pricing will appear after seat selection.";

            if (activeSeatButton) {
                activeSeatButton.classList.remove("selected");
                activeSeatButton = null;
            }

            if (successMessage) {
                successMessage.hidden = false;
                successMessage.innerHTML = `
                <div class="success-card">
                    <div class="success-icon">✓</div>
                    <h3>Registration Successful!</h3>
                     <p>Payment recorded successfully.</p>
                        <p class="seat-info">📍 You can sit at your selected seat</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error("Save error:", error);
            if (utrError) {
                utrError.textContent = "Failed to save. Please try again.";
                utrError.hidden = false;
            }
        } finally {
            utrConfirmBtn.disabled = false;
            utrConfirmBtn.textContent = "Confirm payment";
        }
    });
}

// ✅ Clear error as user types
if (utrInput) {
    utrInput.addEventListener("input", () => {
        const val = utrInput.value.replace(/\D/g, "").slice(0, 12);
        utrInput.value = val; // auto sanitize: digits only
        if (utrError) { utrError.textContent = ""; utrError.hidden = true; }
    });
}

// ─── Firebase seat loading ────────────────────────────────────────────────────

async function loadSeatsFromFirebase() {
    const firebaseConfig = window.__FIREBASE_CONFIG__;

    const [
        { initializeApp, getApps, getApp },
        { getFirestore, collection, onSnapshot }
    ] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js")
    ]);

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const seatsRef = collection(db, "admins", ADMIN_ID, "seat");

    onSnapshot(seatsRef, (snapshot) => {
        const sectionMap = {};
        snapshot.forEach((doc) => {
            const seat = doc.data();
            if (!sectionMap[seat.section]) sectionMap[seat.section] = [];
            sectionMap[seat.section].push(seat);
        });
        renderSections(sectionMap);
    });
}

function renderSections(sectionMap) {
    sectionsGrid.innerHTML = "";
    let totalLibraryAvailableSeats = 0;

    Object.keys(sectionMap)
        .sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")))
        .forEach((sectionName) => {

            const seats = sectionMap[sectionName].sort((a, b) =>
                parseInt(String(a.seatNumber).replace("S", "")) -
                parseInt(String(b.seatNumber).replace("S", ""))
            );

            const firstSeat = seats[0];
            const bookedCount = seats.filter(s => s.status === "Booked").length;
            const reservedCount = seats.filter(s => s.status === "Reserved").length;
            const availableCount = seats.length - bookedCount - reservedCount;

            totalLibraryAvailableSeats += availableCount;

            const section = {
                name: sectionName,
                type: firstSeat.seatType,
                seatFees: firstSeat.seatFees,
                registrationFee: 100,
                seats: seats
            };

            const card = document.createElement("article");
            card.className = "library-section-card";
            card.innerHTML = `
                <div class="section-top">
                    <h2>${section.name}</h2>
                    <span class="section-type">${section.type}</span>
                </div>
                <div class="seat-counts">
                    <span class="count-chip">Total: ${seats.length}</span>
                    <span class="count-chip">Available: ${availableCount}</span>
                    <span class="count-chip">Reserved: ${reservedCount}</span>
                    <span class="count-chip">Booked: ${bookedCount}</span>
                </div>
                <div class="seat-pricing">
                    <span class="price-chip">Seat Fee: ₹${section.seatFees}</span>
                    <span class="price-chip">Registration Fee: ₹100</span>
                </div>
                <div class="seats-grid"></div>
            `;

            const seatGrid = card.querySelector(".seats-grid");
            seats.forEach((seatData) => seatGrid.appendChild(createDynamicSeat(section, seatData)));
            sectionsGrid.appendChild(card);
        });

    const libraryAvailableSeats = document.getElementById("libraryAvailableSeats");
    if (libraryAvailableSeats) {
        libraryAvailableSeats.textContent = totalLibraryAvailableSeats;
    }
}

function createDynamicSeat(section, seatData) {
    const seat = document.createElement("button");
    const isBooked = seatData.status === "Booked";
    const isReserved = seatData.status === "Reserved";

    seat.className = `seat ${isBooked ? "booked" : isReserved ? "reserved" : "available"}`;
    seat.type = "button";
    seat.innerHTML = `<span class="seat-number">${seatData.seatNumber}</span>`;
    seat.disabled = isBooked || isReserved;

    if (!isBooked && !isReserved) {
        seat.addEventListener("click", () => {
            if (activeSeatButton) activeSeatButton.classList.remove("selected");

            activeSeatButton = seat;
            seat.classList.add("selected");

            selectedSectionInput.value = section.name;
            selectedSeatInput.value = seatData.seatNumber;
            selectedSeatType = section.type;

            selectedSeatLabel.textContent =
                `Selected: ${section.name} - Seat ${seatData.seatNumber}`;

            selectedPricingLabel.textContent =
                `Seat Fee: ₹${section.seatFees} + Registration Fee: ₹100 = Total: ₹${section.seatFees + 100}`;

            if (successMessage) successMessage.hidden = true;

            studentForm.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    return seat;
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

function getFieldValue(field) { return field.value; }
function getErrorElement(field) {
    const w = field.closest(".field");
    return w ? w.querySelector(".field-error") : null;
}
function ensureErrorElement(field) {
    const w = field.closest(".field");
    if (!w) return null;
    let el = w.querySelector(".field-error");
    if (!el) {
        el = document.createElement("p");
        el.className = "field-error";
        el.hidden = true;
        w.appendChild(el);
    }
    return el;
}
function showFieldError(field, message) {
    const el = ensureErrorElement(field);
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
    if (el) { el.textContent = message; el.hidden = false; }
}
function clearFieldError(field) {
    const el = getErrorElement(field);
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    if (el) { el.hidden = true; el.textContent = ""; }
}
function validateField(field) {
    const config = validatorConfigs[field.name];
    if (!config) return true;
    const message = config.validate(getFieldValue(field).trim());
    field.setCustomValidity(message);
    if (message) { showFieldError(field, message); return false; }
    clearFieldError(field);
    return true;
}
function setupFieldValidation(form) {
    form.querySelectorAll("input[name], textarea[name]").forEach((field) => {
        const config = validatorConfigs[field.name];
        if (!config) return;
        ensureErrorElement(field);
        field.addEventListener("input", () => {
            if (typeof config.sanitize === "function") field.value = config.sanitize(field.value);
            validateField(field);
        });
        field.addEventListener("blur", () => validateField(field));
    });
}
function validateSeatSelection() {
    if (selectedSectionInput.value && selectedSeatInput.value) {
        selectedSeatLabel.classList.remove("selection-error");
        return true;
    }
    selectedSeatLabel.textContent = "Please select an available green seat first.";
    selectedSeatLabel.classList.add("selection-error");
    return false;
}
function resetFormValidation(form) {
    form.querySelectorAll("input[name], textarea[name]").forEach((field) => {
        field.setCustomValidity("");
        clearFieldError(field);
    });
}

// ─── Main form submit ─────────────────────────────────────────────────────────

if (
    sectionsGrid && studentForm && selectedSeatLabel &&
    selectedPricingLabel && selectedSectionInput &&
    selectedSeatInput && successMessage
) {
    loadSeatsFromFirebase();

    const dobInput = studentForm.querySelector("#dob");
    if (dobInput) dobInput.max = new Date().toISOString().split("T")[0];

    setupFieldValidation(studentForm);

    studentForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!validateSeatSelection()) return;

        const validatableFields = studentForm.querySelectorAll("input[name], textarea[name]");
        const allFieldsValid = [...validatableFields]
            .filter((f) => validatorConfigs[f.name])
            .every((f) => validateField(f));

        if (!allFieldsValid || !studentForm.checkValidity()) return;

        const formData = new FormData(studentForm);

        // ✅ Just collect payload and open UTR popup — NO Firebase calls here
        pendingPayload = {
            section: selectedSectionInput.value,
            seatNumber: selectedSeatInput.value,
            seatType: selectedSeatType,
            fullName: formData.get("fullName")?.toString().trim() || "",
            address: formData.get("address")?.toString().trim() || "",
            dob: formData.get("dob")?.toString() || "",
            email: formData.get("email")?.toString().trim() || "",
            aadhar: formData.get("aadhar")?.toString().trim() || "",
            mobile: formData.get("mobile")?.toString().trim() || "",
            education: formData.get("education")?.toString().trim() || "",
            preparingFor: formData.get("preparingFor")?.toString().trim() || "",
            paymentStatus: "Pending"
        };

        // Extract total amount from the pricing label to show in popup
        const seatFees = Number(
            selectedPricingLabel.textContent.match(/₹(\d+)\s*\+/)?.[1] || 0
        );
        const totalAmount = seatFees + 100;

        if (successMessage) successMessage.hidden = true;

        openUTRPopup(null, pendingPayload, totalAmount);
    });
}