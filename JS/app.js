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

    await addDoc(collection(db, "seatAdmissions"), {
        ...payload,
        createdAt: serverTimestamp()
    });
}

// Seat page
// const sectionConfigs = [
//     { name: "Section 1", type: "AC", seatFee: 1000, registrationFee: 100, booked: [2, 5, 8, 11] },
//     { name: "Section 2", type: "AC", seatFee: 1000, registrationFee: 100, booked: [1, 4, 6, 10, 14] },
//     { name: "Section 3", type: "Semi-AC", seatFee: 1000, registrationFee: 100, booked: [3, 7, 9] },
//     { name: "Section 4", type: "Non-AC", seatFee: 800, registrationFee: 100, booked: [2, 5, 6, 12, 15] },
//     { name: "Section 5", type: "Non-AC", seatFee: 700, registrationFee: 100, booked: [1, 8, 11, 13] },
//     { name: "Section 6", type: "AC", seatFee: 700, registrationFee: 100, booked: [4, 7, 10, 12] },
//     { name: "Section 7", type: "Non-AC", seatFee: 850, registrationFee: 100, booked: [3, 5, 9, 14] },
//     { name: "Section 8", type: "Non-AC", seatFee: 700, registrationFee: 100, booked: [2, 6, 8, 15] }
// ];

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
        "vez5ClBMuNPiNWkAJnA5b1hJqCD3",
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

    Object.keys(sectionMap).forEach((sectionName) => {

        const seats = sectionMap[sectionName];

        const firstSeat = seats[0];

        const bookedCount = seats.filter(
            seat => seat.status === "Booked"
        ).length;

        const reservedCount = seats.filter(
            seat => seat.status === "Reserved"
        ).length;

        const availableCount =
            seats.length - bookedCount - reservedCount;

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

// function createSeat(section, seatNumber) {
//     const seat = document.createElement("button");
//     const isBooked = section.booked.includes(seatNumber);

//     seat.className = `seat ${isBooked ? "booked" : "available"}`;
//     seat.type = "button";
//     seat.innerHTML = `
//         <span class="seat-icon" aria-hidden="true">
//             <svg viewBox="0 0 24 24" focusable="false">
//                 <path d="M7 12V9.5A2.5 2.5 0 0 1 9.5 7h5A2.5 2.5 0 0 1 17 9.5V12h1a2 2 0 0 1 2 2v3h-2v-2H6v2H4v-3a2 2 0 0 1 2-2h1Zm2-3a.5.5 0 0 0-.5.5V12h7V9.5a.5.5 0 0 0-.5-.5h-5ZM7 16h10v1.5a1.5 1.5 0 0 1-3 0V17h-4v.5a1.5 1.5 0 0 1-3 0V16Z"></path>
//             </svg>
//         </span>
//         <span class="seat-number">${seatNumber}</span>
//     `;
//     seat.setAttribute("aria-label", `${section.name} seat ${seatNumber} ${isBooked ? "booked" : "available"}`);
//     seat.disabled = isBooked;

//     if (!isBooked) {
//         seat.addEventListener("click", () => {
//             if (activeSeatButton) {
//                 activeSeatButton.classList.remove("selected");
//             }

//             activeSeatButton = seat;
//             seat.classList.add("selected");
//             selectedSectionInput.value = section.name;
//             selectedSeatInput.value = seatNumber;
//             selectedSeatLabel.textContent = `Selected: ${section.name} - Seat ${seatNumber}`;
//             selectedSeatLabel.classList.remove("selection-error");
//             selectedPricingLabel.textContent = `Seat Fee: ${section.seatFee} + Registration Fee: ${section.registrationFee} = Total: ${section.seatFee + section.registrationFee}`;
//             successMessage.hidden = true;
//             studentForm.scrollIntoView({ behavior: "smooth", block: "start" });
//         });
//     }
//     return seat;
// }

// function createSectionCard(section) {
//     const bookedCount = section.booked.length;
//     const availableCount = totalSeats - bookedCount;

//     const card = document.createElement("article");
//     card.className = "library-section-card";

//     const top = document.createElement("div");
//     top.className = "section-top";
//     top.innerHTML = `<h2>${section.name}</h2><span class="section-type">${section.type}</span>`;

//     const counts = document.createElement("div");
//     counts.className = "seat-counts";
//     counts.innerHTML = `
//         <span class="count-chip">Total: ${totalSeats}</span>
//         <span class="count-chip">Available: ${availableCount}</span>
//         <span class="count-chip">Booked: ${bookedCount}</span>
//     `;

//     const pricing = document.createElement("div");
//     pricing.className = "seat-pricing";
//     pricing.innerHTML = `
//         <span class="price-chip">Seat Fee: ${section.seatFee}</span>
//         <span class="price-chip">Registration Fee: ${section.registrationFee}</span>
//         <span class="price-chip">Total: ${section.seatFee + section.registrationFee}</span>
//     `;

//     const seatGrid = document.createElement("div");
//     seatGrid.className = "seats-grid";

//     for (let i = 1; i <= totalSeats; i += 1) {
//         seatGrid.appendChild(createSeat(section, i));
//     }

//     card.append(top, counts, pricing, seatGrid);
//     return card;
// }
// Popup Elements

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
            .then(async () => {
                await reserveSeat(
                    payload.section,
                    Number(payload.seatNumber)
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

    async function reserveSeat(sectionName, seatNumber) {

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
            "vez5ClBMuNPiNWkAJnA5b1hJqCD3",
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
                status: "Reserved"
            });

        });
    }

}

