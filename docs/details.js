/* ===========================================================
   DARJEELING HOMESTAY DIRECTORY
   DETAILS.JS - JSON API VERSION
=========================================================== */

/* ===========================================================
   JSON API
=========================================================== */

/*const DATA_URL = "https://script.google.com/macros/s/AKfycbwDr5oX8tcgMuXPbUZphku7qNEMfm_KcIpiwwFQdR_UQ7P0DzW4x2lFs9S4H4TnHvN7/exec";
*/
const DATA_URL="data.json";
/* ===========================================================
   GLOBAL VARIABLES
=========================================================== */

let homestay = null;
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
const queryId = new URLSearchParams(window.location.search).get("id");
const id = queryId || (window.HOMESTAY_DATA && window.HOMESTAY_DATA.id);

/* ===========================================================
   START
=========================================================== */

document.addEventListener("DOMContentLoaded", loadHomestay);

/* ===========================================================
   LOAD HOMESTAY FROM JSON API
=========================================================== */

async function loadHomestay() {
    try {
        console.log("Loading homestay ID:", id);

        if (!id) {
            showNotFound();
            return;
        }

       /* let homes = null;
        const cache = localStorage.getItem("homestay_cache");
        const cacheTime = localStorage.getItem("homestay_cache_time");
        const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

         ⚡ INSTANT LOAD: Check if cache exists and is fresh 
        if (cache && cacheTime && (Date.now() - Number(cacheTime) < CACHE_DURATION)) {
            try {
                homes = JSON.parse(cache);
            } catch (e) {
                localStorage.removeItem("homestay_cache");
            }
        }*/

       // Cache config - use same key in both files
const CACHE_KEY = "homestay_cache_v2"; 
const CACHE_TIME_KEY = "homestay_cache_time";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Generated SEO pages embed their exact homestay record in the HTML.
// This keeps the page immediately usable and avoids a JSON lookup.
if (window.HOMESTAY_DATA) {
    homestay = window.HOMESTAY_DATA;
    displayHomestay();
    return;
}

let homes = null;

/* ⚡ INSTANT LOAD: Check if cache exists and is fresh */
const cachedData = localStorage.getItem(CACHE_KEY);
const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

if (cachedData && cachedTime && (Date.now() - Number(cachedTime) < CACHE_DURATION)) {
    try {
        homes = JSON.parse(cachedData);
        console.log("Loaded homes from cache");
    } catch (e) {
        console.error("Cache parse error", e);
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
    }
}

        /* 🐢 FALLBACK: Only fetch from Apps Script if cache is missing */
        if (!homes) {
            console.log("No cache found. Fetching from Apps Script...");
            const response = await fetch(DATA_URL);

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            homes = await response.json();

            if (!Array.isArray(homes)) {
                throw new Error("JSON API did not return an array");
            }

            // Save to localStorage for instant loads on subsequent clicks
            localStorage.setItem(CACHE_KEY, JSON.stringify(homes));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }

        /* Find requested homestay */
        homestay = homes.find(
            home => String(home.id).trim() === String(id).trim()
        );

        if (!homestay) {
            showNotFound();
            return;
        }

        displayHomestay();

    } catch (error) {
        console.error("Error loading homestay:", error);
        showError("Unable to load homestay details. Please refresh the page.");
    }
}
        


/* ===========================================================
   NOT FOUND
=========================================================== */

function showNotFound() {
    document.body.innerHTML = `
        <div class="container py-5 text-center">
            <div class="alert alert-warning shadow-sm rounded-4 p-5">
                <i class="fa-solid fa-triangle-exclamation fs-1 text-warning mb-3"></i>
                <h3 class="fw-bold">Homestay Not Found</h3>
                <p class="text-muted">
                    The requested property could not be located.
                </p>
                <a href="index.html" class="btn btn-success mt-2">
                    Return to Directory
                </a>
            </div>
        </div>
    `;
}

/* ===========================================================
   ERROR
=========================================================== */

function showError(message) {
    const loader = document.getElementById("loading");

    if (loader) {
        loader.innerHTML = `
            <div class="alert alert-danger">
                ${message}
            </div>
        `;
    }
}

/* ===========================================================
   DISPLAY HOMESTAY
=========================================================== */

function displayHomestay() {
    /* ==========================================
       Page title
    ========================================== */
    document.title = `${homestay.name || "Details"} | Darjeeling Homestay`;

    /* ==========================================
       Hero Image
    ========================================== */
    const heroImage = document.getElementById("heroImage");
    if (heroImage) {
        heroImage.src = homestay.image || "https://placehold.co/1200x700?text=No+Image+Available";
    }

    /* ==========================================
       Hero Name
    ========================================== */
    const homeName = document.getElementById("homeName");
    if (homeName) {
        homeName.textContent = homestay.name || "Unnamed Homestay";
    }

    /* ==========================================
       Hero Location
    ========================================== */
    const homeLocation = document.getElementById("homeLocation");
    if (homeLocation) {
        homeLocation.innerHTML = `
            <i class="fa-solid fa-location-dot text-danger me-1"></i>
            ${homestay.location || "Location Not Specified"}
        `;
    }

    /* ==========================================
       Details Name
    ========================================== */
    const detailName = document.getElementById("detailName");
    if (detailName) {
        detailName.textContent = homestay.name || "";
    }

    /* ==========================================
       Details Location
    ========================================== */
    const detailLocation = document.getElementById("detailLocation");
    if (detailLocation) {
        detailLocation.innerHTML = `
            <i class="fa-solid fa-location-dot text-muted me-1"></i>
            ${homestay.location || ""}
        `;
    }

    /* ==========================================
       Price
    ========================================== */
    const formattedPrice = homestay.price ? `₹ ${homestay.price}` : "Price on Request";

    const detailPrice = document.getElementById("detailPrice");
    if (detailPrice) {
        detailPrice.textContent = formattedPrice;
    }

    /* ==========================================
       Mobile Price
    ========================================== */
    const mobilePrice = document.getElementById("mobilePrice");
    if (mobilePrice) {
        mobilePrice.textContent = formattedPrice;
    }

    /* ==========================================
       Description
    ========================================== */
    const description = document.getElementById("detailDescription");
    if (description) {
        description.textContent = homestay.description || "No description provided for this homestay.";
    }

    /* ==========================================
       Scenery
    ========================================== */
    const scenery = document.getElementById("detailScenery");
    if (scenery) {
        scenery.textContent = homestay.scenery || "No specific scenic views detailed for this location.";
    }

    /* ==========================================
       Remaining sections
    ========================================== */
    renderAmenities();
    setupButtons();
    createGallery();
    updateWishlistButton();
    setupEnquiryForm();

    console.log("Homestay details rendered successfully.");
}

/* ===========================================================
   AMENITIES
=========================================================== */

function renderAmenities() {
    const container = document.getElementById("detailAmenities");

    if (!container) return;

    container.innerHTML = "";

    if (!homestay.amenities) {
        container.innerHTML = `
            <span class="text-muted small">
                No amenities listed for this stay.
            </span>
        `;
        return;
    }

    homestay.amenities.split(",").forEach(item => {
        if (item.trim()) {
            container.innerHTML += `
                <span class="amenity-chip">
                    <i class="fa-solid fa-circle-check text-success"></i>
                    ${item.trim()}
                </span>
            `;
        }
    });
}

/* ===========================================================
   BUTTONS
=========================================================== */

function setupButtons() {
    /* ==========================================
       CALL
    ========================================== */
    const handleCall = () => {
        if (homestay && homestay.phone) {
            window.location.href = `tel:${homestay.phone}`;
        } else {
            showToast("Phone number not provided.");
        }
    };

    const callBtn = document.getElementById("callBtn");
    if (callBtn) {
        callBtn.onclick = handleCall;
    }

    const mobileCallBtn = document.getElementById("mobileCallBtn");
    if (mobileCallBtn) {
        mobileCallBtn.onclick = handleCall;
    }

    /* ==========================================
       WHATSAPP
    ========================================== */
    const whatsappBtn = document.getElementById("whatsappBtn");
    if (whatsappBtn) {
        whatsappBtn.onclick = () => {
            if (homestay && homestay.whatsapp) {
                const cleanNumber = homestay.whatsapp.replace(/[^0-9]/g, "");
                window.open(`https://wa.me/${cleanNumber}`, "_blank");
            } else {
                showToast("WhatsApp contact not available.");
            }
        };
    }

    /* ==========================================
       GOOGLE MAP
    ========================================== */
    const mapBtn = document.getElementById("mapBtn");
    if (mapBtn) {
        mapBtn.onclick = () => {
            if (homestay && homestay.googleMap) {
                window.open(homestay.googleMap, "_blank");
            } else {
                showToast("Map direction link not available.");
            }
        };
    }

    /* ==========================================
       WEBSITE
    ========================================== */
    const websiteBtn = document.getElementById("websiteBtn");
    if (websiteBtn) {
        const website = (homestay.website || "").trim();

        if (website && website !== "#") {
            websiteBtn.onclick = () => {
                window.open(website, "_blank");
            };
        } else {
            websiteBtn.style.display = "none";
        }
    }

    /* ==========================================
       SHARE
    ========================================== */
    const handleShare = async (e) => {
        if (e) {
            e.preventDefault();
        }

        const shareData = {
            title: homestay.name || document.title,
          //  text: `🏡 Check out ${homestay.name || "this homestay"} in ${homestay.location || ""}!`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log("Share cancelled.", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast("Link copied to clipboard!");
            } catch (err) {
                prompt("Copy this link to share:", window.location.href);
            }
        }
    };

    document.querySelectorAll("#shareBtn, .share-btn").forEach(btn => {
        btn.onclick = handleShare;
    });

    /* ==========================================
       SOCIAL MEDIA
    ========================================== */
    const socialLinks = [
        { id: "facebookBtn", url: homestay.facebook },
        { id: "instagramBtn", url: homestay.instagram },
        { id: "youtubeBtn", url: homestay.youtube }
    ];

    let hasSocials = false;

    socialLinks.forEach(item => {
        const btn = document.getElementById(item.id);
        if (!btn) return;

        const url = (item.url || "").trim();

        if (url && url !== "#" && url.toLowerCase() !== "n/a") {
            btn.href = url;
            btn.target = "_blank";
            btn.rel = "noopener noreferrer";
            btn.style.display = "inline-flex";
            hasSocials = true;
        } else {
            btn.style.display = "none";
        }
    });

    if (!hasSocials) {
        const socialCard = document.getElementById("socialCard");
        if (socialCard) {
            socialCard.style.display = "none";
        }
    }
}

/* ===========================================================
   ENQUIRY FORM
=========================================================== */

function setupEnquiryForm() {
    const enquiryForm = document.getElementById("enquiryForm");
    if (!enquiryForm) return;

    enquiryForm.onsubmit = function (e) {
        e.preventDefault();

        let ownerPhone = homestay && homestay.phone
            ? homestay.phone.replace(/[^0-9+]/g, "")
            : "";

        if (!ownerPhone) {
            showToast("Owner phone number is not available.");
            return;
        }

        const name = document.getElementById("enquiryName").value;
        const phone = document.getElementById("enquiryPhone").value;
        const checkIn = document.getElementById("enquiryCheckIn").value;
        const checkOut = document.getElementById("enquiryCheckOut").value;
        const homestayName = homestay ? homestay.name : "Homestay";

        const message =
            `Hello! Enquiry for ${homestayName}:\n` +
            `Name: ${name}\n` +
            `Phone: ${phone}\n` +
            `Check-in: ${checkIn}\n` +
            `Check-out: ${checkOut}`;

        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

        const separator = isIOS ? "&" : "?";
        const smsUrl = `sms:${ownerPhone}${separator}body=${encodeURIComponent(message)}`;

        const link = document.createElement("a");
        link.href = smsUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}

/* ===========================================================
   GALLERY
=========================================================== */

function createGallery() {
    const gallery = document.getElementById("galleryContainer");
    if (!gallery) return;

    gallery.innerHTML = "";

    let images = [];

    if (homestay.gallery) {
        images = homestay.gallery
            .split("|")
            .map(img => img.trim())
            .filter(img => img !== "");
    }

    if (images.length === 0) {
        gallery.innerHTML = `
            <div class="col-12 text-center text-muted py-3">
                <i class="fa-regular fa-image fs-3 mb-2 d-block"></i>
                <p class="mb-0">
                    No extra gallery photos available.
                </p>
            </div>
        `;
        return;
    }

    images.forEach(img => {
        gallery.innerHTML += `
            <div class="col-6 col-md-4">
                <div class="gallery-item shadow-sm" onclick="openImage('${img}')">
                    <img
                        src="${img}"
                        class="gallery-image"
                        alt="Homestay Photo"
                        loading="lazy"
                    >
                </div>
            </div>
        `;
    });
}

/* ===========================================================
   OPEN IMAGE
=========================================================== */

function openImage(src) {
    const modalImg = document.getElementById("previewImage");
    const modalElement = document.getElementById("imageModal");

    if (modalImg && modalElement) {
        modalImg.src = src;
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

/* ===========================================================
   WISHLIST
=========================================================== */

function updateWishlistButton() {
    const btn = document.getElementById("wishlistBtn");
    const mobileBtn = document.getElementById("mobileWishlistBtn");

    if (!homestay) return;

    const liked = wishlist.includes(String(homestay.id));

    if (btn) {
        btn.innerHTML = liked ? "❤️ Wishlisted" : "🤍 Add Wishlist";
        btn.className = liked ? "btn btn-danger" : "btn btn-outline-danger";
        btn.onclick = toggleWishlist;
    }

    if (mobileBtn) {
        mobileBtn.innerHTML = liked ? "❤️" : "🤍";
        mobileBtn.onclick = toggleWishlist;
    }
}

/* ===========================================================
   TOGGLE WISHLIST
=========================================================== */

function toggleWishlist() {
    const homestayId = String(homestay.id);
    const index = wishlist.indexOf(homestayId);

    if (index > -1) {
        wishlist.splice(index, 1);
        showToast("Removed from Wishlist");
    } else {
        wishlist.push(homestayId);
        showToast("Added to Wishlist!");
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    updateWishlistButton();
}

/* ===========================================================
   TOAST
=========================================================== */

function showToast(msg) {
    const toastEl = document.getElementById("toastMessage");
    const toastText = document.getElementById("toastText");

    if (toastEl && toastText) {
        toastText.textContent = msg;

        const toast = new bootstrap.Toast(toastEl, {
            delay: 2500
        });

        toast.show();
    }
}

/* ===========================================================
   DEBUG
=========================================================== */

console.log("Details JS loaded - JSON API version");
console.log("Requested ID:", id);
