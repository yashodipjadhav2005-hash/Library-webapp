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
    btnBook.addEventListener("click", function () {
        this.innerText = "Loading...";
    });

    btnBook.onclick = () => {
        window.location.href = "seat.html";
    };
}

// OPEN and CLOSE Status
function updateStatus() {
    const statusEl = document.getElementById("statusText");
    if (!statusEl) {
        return;
    }

    const now = new Date();
    const hours = now.getHours();
    const day = now.getDay();

    let open = false;

    if (day === 0) {
        open = hours >= 8 && hours < 20;
    } else {
        open = hours >= 6 && hours < 23;
    }

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

async function saveSeatAdmission(payload) {

    const firebaseConfig = window.__FIREBASE_CONFIG__;
    if (!firebaseConfig) {
        throw new Error("Firebase is not configured.");
    }

    const [{ initializeApp, getApps, getApp }, { getFirestore, collection, addDoc, serverTimestamp }] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js")
    ]);

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const docRef = await addDoc(
        collection(db, "admins", "pC1A2vbd09dDA2zMGzumTVEMT8P2", "NewRegistrations"),
        {
            ...payload,
            createdAt: serverTimestamp()
        }
    );

    return docRef.id;
}

// const totalSeats = 15;
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
            if (!value) {
                return "Student full name is required.";
            }

            if (!/^[A-Za-z][A-Za-z\s.'-]{2,79}$/.test(value)) {
                return "Enter a valid full name with at least 3 letters.";
            }

            return "";
        }
    },
    address: {
        validate: (value) => {
            if (!value) {
                return "Address is required.";
            }

            if (value.length < 10) {
                return "Address must be at least 10 characters long.";
            }

            return "";
        }
    },
    dob: {
        validate: (value) => {
            if (!value) {
                return "Date of birth is required.";
            }

            const selectedDate = new Date(`${value}T00:00:00`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (Number.isNaN(selectedDate.getTime())) {
                return "Enter a valid date of birth.";
            }

            if (selectedDate > today) {
                return "Date of birth cannot be in the future.";
            }

            return "";
        }
    },
    email: {
        validate: (value) => {
            if (!value) {
                return "Email ID is required.";
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return "Enter a valid email address.";
            }

            return "";
        }
    },
    aadhar: {
        sanitize: (value) => value.replace(/\D/g, "").slice(0, 12),
        validate: (value) => {
            if (!value) {
                return "Aadhar number is required.";
            }

            if (!/^\d{12}$/.test(value)) {
                return "Aadhar number must be exactly 12 digits.";
            }

            return "";
        }
    },
    mobile: {
        sanitize: (value) => value.replace(/\D/g, "").slice(0, 10),
        validate: (value) => {
            if (!value) {
                return "Mobile number is required.";
            }

            if (!/^[6-9]\d{9}$/.test(value)) {
                return "Enter a valid 10-digit mobile number.";
            }

            return "";
        }
    },
    education: {
        validate: (value) => {
            if (!value) {
                return "Education field is required.";
            }

            if (value.length < 2) {
                return "Education must be at least 2 characters.";
            }

            return "";
        }
    },
    preparingFor: {
        validate: (value) => {
            if (!value) {
                return "Preparing for field is required.";
            }

            if (value.length < 2) {
                return "Preparing for must be at least 2 characters.";
            }

            return "";
        }
    }
};
let activeSeatButton = null;
let selectedSeatType = "";

async function loadSeatsFromFirebase() {

    const firebaseConfig = window.__FIREBASE_CONFIG__;

    const [
        { initializeApp, getApps, getApp },
        {
            getFirestore,
            collection,
            onSnapshot
        }
    ] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js")
    ]);

    const app = getApps().length
        ? getApp()
        : initializeApp(firebaseConfig);

    const db = getFirestore(app);

    // YOUR FIRESTORE PATH
    const seatsRef = collection(
        db,
        "admins",
        "pC1A2vbd09dDA2zMGzumTVEMT8P2",
        "seat"
    );

    onSnapshot(seatsRef, (snapshot) => {

        const sectionMap = {};

        snapshot.forEach((doc) => {

            console.log(doc.id, doc.data());

            const seat = doc.data();

            // Group seats by section
            if (!sectionMap[seat.section]) {
                sectionMap[seat.section] = [];
            }

            sectionMap[seat.section].push(seat);
        });

        renderSections(sectionMap);
    });
}
function renderSections(sectionMap) {

    sectionsGrid.innerHTML = "";

    let totalLibraryAvailableSeats = 0;

    Object.keys(sectionMap)

        // ✅ Sort sections in ascending order
        .sort((a, b) => {

            const sectionA = parseInt(
                a.replace(/\D/g, "")
            );

            const sectionB = parseInt(
                b.replace(/\D/g, "")
            );

            return sectionA - sectionB;
        })

        .forEach((sectionName) => {

            // ✅ Sort seats in ascending order
            const seats = sectionMap[sectionName].sort((a, b) => {

                const seatA = parseInt(
                    String(a.seatNumber)
                        .replace("S", "")
                );

                const seatB = parseInt(
                    String(b.seatNumber)
                        .replace("S", "")
                );

                return seatA - seatB;
            });

            const firstSeat = seats[0];

            const bookedCount = seats.filter(
                seat => seat.status === "Booked"
            ).length;

            const reservedCount = seats.filter(
                seat => seat.status === "Reserved"
            ).length;

            const availableCount =
                seats.length - bookedCount - reservedCount;

            // ✅ Total available seats in library
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

                    <span class="section-type">
                        ${section.type}
                    </span>
                </div>

                <div class="seat-counts">

                    <span class="count-chip">
                        Total: ${seats.length}
                    </span>

                    <span class="count-chip">
                        Available: ${availableCount}
                    </span>

                    <span class="count-chip">
                        Reserved: ${reservedCount}
                    </span>

                    <span class="count-chip">
                        Booked: ${bookedCount}
                    </span>

                </div>

                <div class="seat-pricing">

                    <span class="price-chip">
                        Seat Fee: ₹${section.seatFees}
                    </span>

                    <span class="price-chip">
                        Registration Fee: ₹100
                    </span>

                </div>

                <div class="seats-grid"></div>
            `;

            const seatGrid =
                card.querySelector(".seats-grid");

            seats.forEach((seatData) => {

                seatGrid.appendChild(
                    createDynamicSeat(section, seatData)
                );

            });

            sectionsGrid.appendChild(card);

        });

    // ✅ Update total library available seats
    if (libraryAvailableSeats) {

        libraryAvailableSeats.textContent =
            totalLibraryAvailableSeats;

    }
}

function createDynamicSeat(section, seatData) {

    const seat = document.createElement("button");

    const isBooked =
        seatData.status === "Booked";

    const isReserved =
        seatData.status === "Reserved";

    seat.className = `seat ${isBooked
        ? "booked"
        : isReserved
            ? "reserved"
            : "available"
        }`;

    seat.type = "button";

    seat.innerHTML = `
        <span class="seat-number">
            ${seatData.seatNumber}
        </span>
    `;

    seat.disabled = isBooked || isReserved;

    if (!isBooked && !isReserved) {

        seat.addEventListener("click", () => {

            if (activeSeatButton) {
                activeSeatButton.classList.remove("selected");
            }

            activeSeatButton = seat;

            seat.classList.add("selected");

            selectedSectionInput.value =
                section.name;

            selectedSeatInput.value =
                seatData.seatNumber;

            selectedSeatType = section.type;

            selectedSeatLabel.textContent =
                `Selected: ${section.name}
                - Seat ${seatData.seatNumber}`;

            selectedPricingLabel.textContent =
                `Seat Fee: ₹${section.seatFees}
                + Registration Fee: ₹100
                = Total: ₹${section.seatFees + 100}`;

            successMessage.hidden = true;

            // ✅ Auto scroll to form
            studentForm.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    }

    return seat;
}

function getFieldValue(field) {
    return field.value;
}

function getErrorElement(field) {
    const fieldWrapper = field.closest(".field");
    return fieldWrapper ? fieldWrapper.querySelector(".field-error") : null;
}

function ensureErrorElement(field) {
    const fieldWrapper = field.closest(".field");

    if (!fieldWrapper) {
        return null;
    }

    let errorElement = fieldWrapper.querySelector(".field-error");

    if (!errorElement) {
        errorElement = document.createElement("p");
        errorElement.className = "field-error";
        errorElement.hidden = true;
        fieldWrapper.appendChild(errorElement);
    }

    return errorElement;
}

function showFieldError(field, message) {
    const errorElement = ensureErrorElement(field);

    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.hidden = false;
    }
}

function clearFieldError(field) {
    const errorElement = getErrorElement(field);

    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");

    if (errorElement) {
        errorElement.hidden = true;
        errorElement.textContent = "";
    }
}

function validateField(field) {
    const config = validatorConfigs[field.name];

    if (!config) {
        return true;
    }

    const value = getFieldValue(field).trim();
    const message = config.validate(value);
    field.setCustomValidity(message);

    if (message) {
        showFieldError(field, message);
        return false;
    }

    clearFieldError(field);
    return true;
}

function setupFieldValidation(form) {
    const validatableFields = form.querySelectorAll("input[name], textarea[name]");

    validatableFields.forEach((field) => {
        const config = validatorConfigs[field.name];

        if (!config) {
            return;
        }

        ensureErrorElement(field);

        field.addEventListener("input", () => {
            if (typeof config.sanitize === "function") {
                field.value = config.sanitize(field.value);
            }

            validateField(field);
        });

        field.addEventListener("blur", () => {
            validateField(field);
        });
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
    const validatableFields = form.querySelectorAll("input[name], textarea[name]");

    validatableFields.forEach((field) => {
        field.setCustomValidity("");
        clearFieldError(field);
    });
}

// Popup Elements
const successPopup =
    document.getElementById("successPopup");

const closePopup =
    document.getElementById("closePopup");

// Open Popup
function openPopup() {

    successPopup.hidden = false;

    requestAnimationFrame(() => {
        successPopup.classList.add("show");
    });

    document.body.style.overflow = "hidden";
}

// Close Popup
function closePopupBox() {

    successPopup.classList.remove("show");

    document.body.style.overflow = "auto";

    setTimeout(() => {
        successPopup.hidden = true;
    }, 300);
}

// Close Button
if (closePopup) {

    closePopup.addEventListener("click", () => {
        closePopupBox();
    });

}

// Close when clicking outside
if (successPopup) {

    successPopup.addEventListener("click", (e) => {

        if (e.target === successPopup) {
            closePopupBox();
        }

    });

}

if (
    sectionsGrid &&
    studentForm &&
    selectedSeatLabel &&
    selectedPricingLabel &&
    selectedSectionInput &&
    selectedSeatInput &&
    successMessage
) {
    loadSeatsFromFirebase();

    const dobInput = studentForm.querySelector("#dob");
    if (dobInput) {
        dobInput.max = new Date().toISOString().split("T")[0];
    }

    setupFieldValidation(studentForm);

    studentForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!validateSeatSelection()) {
            return;
        }

        const validatableFields = studentForm.querySelectorAll("input[name], textarea[name]");
        const allFieldsValid = [...validatableFields]
            .filter((field) => validatorConfigs[field.name])
            .every((field) => validateField(field));

        if (!allFieldsValid || !studentForm.checkValidity()) {
            return;
        }

        const formData = new FormData(studentForm);
        const submitButton = studentForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton ? submitButton.textContent : "";

        const payload = {
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
            preparingFor: formData.get("preparingFor")?.toString().trim() || ""
        };

        successMessage.hidden = true;

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
        }

        saveSeatAdmission(payload)
            .then(async (reservationId) => {
                await reserveSeat(
                    payload.section,
                    Number(payload.seatNumber),
                    reservationId
                );

                // Show popup
                openPopup();
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

            })
            .catch((error) => {
                console.error("Firebase Error:", error);   // 👈 see details in console
                successMessage.hidden = false;
                successMessage.textContent = error.message; // 👈 show exact reason
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            });
    });

    async function reserveSeat(sectionName, seatNumber, reservationId) {

        const firebaseConfig = window.__FIREBASE_CONFIG__;

        const [
            { initializeApp, getApps, getApp },
            {
                getFirestore,
                collection,
                query,
                where,
                getDocs,
                updateDoc
            }
        ] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js")
        ]);

        const app = getApps().length
            ? getApp()
            : initializeApp(firebaseConfig);

        const db = getFirestore(app);

        const seatsRef = collection(
            db,
            "admins",
            "pC1A2vbd09dDA2zMGzumTVEMT8P2",
            "seat"
        );

        const q = query(
            seatsRef,
            where("section", "==", sectionName),
            where("seatNumber", "==", Number(seatNumber))
        );

        const snapshot = await getDocs(q);

        console.log("Found Seats:", snapshot.size);

        snapshot.forEach(async (docItem) => {

            console.log("Updating:", docItem.id);

            await updateDoc(docItem.ref, {
                status: "Reserved",
                reservationId: reservationId
            });

        });
    }

}

