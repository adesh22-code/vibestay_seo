/* ==================================================
   DARJEELING HOMESTAY DIRECTORY
   SCRIPT.JS - PHASE 2 SMART JSON CACHE
================================================== */

/*const SHEET_URL = "https://script.google.com/macros/s/AKfycbwDr5oX8tcgMuXPbUZphku7qNEMfm_KcIpiwwFQdR_UQ7P0DzW4x2lFs9S4H4TnHvN7/exec";
*/
const SHEET_URL="data.json";
const CACHE_KEY = "homestay_cache_v2";
const CACHE_TIME = "homestay_cache_time";
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

let homestays = [];
let filteredHomestays = [];
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

/* ==================================================
   DOM ELEMENTS
================================================== */

const container = document.getElementById("homestayContainer");
const searchInput = document.getElementById("searchInput");
const locationFilter = document.getElementById("locationFilter");
const priceSlider = document.getElementById("priceSlider");
const priceValue = document.getElementById("priceValue");
const sortSelect = document.getElementById("sortSelect");
const resultCount = document.getElementById("resultCount");
const loading = document.getElementById("loading");
const noResult = document.getElementById("noResult");

/* ==================================================
   INITIALIZE
================================================== */

document.addEventListener("DOMContentLoaded", () => {
    initFastLoad();
    setupEventListeners();
});

/* ==================================================
   EVENT LISTENERS
================================================== */

function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener("input", applyFilters);
    }

    if (locationFilter) {
        locationFilter.addEventListener("change", applyFilters);
    }

    if (priceSlider) {
        priceSlider.addEventListener("input", handlePriceSlider);
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", applyFilters);
    }
}

/* ==================================================
   FAST INITIALIZATION & SMART CACHING
================================================== */

async function initFastLoad() {
    let hasCachedData = false;

    /* ==============================================
       1. TRY LOCAL CACHE FIRST
    ============================================== */
    try {
        const cache = localStorage.getItem(CACHE_KEY);

        if (cache) {
            const parsed = JSON.parse(cache);

            if (Array.isArray(parsed) && parsed.length > 0) {
                homestays = parsed;
                filteredHomestays = [...homestays];

                populateLocations();
                applyFilters();
                hideLoading();

                hasCachedData = true;
            }
        }
    } catch (error) {
        console.warn("Invalid local cache. Clearing it.");
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME);
    }

    /* ==============================================
       2. SHOW LOADER ONLY IF NO CACHE
    ============================================== */
    if (!hasCachedData) {
        showLoading();
    }

    /* ==============================================
       3. CHECK CACHE AGE
    ============================================== */
    const cacheTime = Number(localStorage.getItem(CACHE_TIME) || 0);
    const isExpired = !cacheTime || (Date.now() - cacheTime > CACHE_DURATION);

    /* ==============================================
       4. FETCH FRESH DATA
    ============================================== */
    if (!hasCachedData || isExpired) {
        /*
           Important:
           If cached data already exists, we DO NOT wait for Apps Script.
           The website continues displaying cached data while fresh data loads
           in the background.
        */
        fetchFreshData(!hasCachedData);
    }
}

/* ==================================================
   FETCH FRESH JSON DATA
================================================== */

async function fetchFreshData(showErrorUI = false) {
    try {
        const response = await fetch(SHEET_URL, {
            method: "GET",
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const freshData = await response.json();

        if (!Array.isArray(freshData)) {
            throw new Error("Invalid API format");
        }

        /* ==========================================
           SAVE FRESH DATA
        ========================================== */
        homestays = freshData;

        localStorage.setItem(CACHE_KEY, JSON.stringify(homestays));
        localStorage.setItem(CACHE_TIME, Date.now().toString());

        /* ==========================================
           UPDATE WEBSITE
        ========================================== */
        filteredHomestays = [...homestays];

        populateLocations();
        applyFilters();

        console.log(`Fresh JSON data loaded: ${homestays.length} listings`);

    } catch (error) {
        console.error("Fetch error:", error);

        /*
           If cached data is already visible,
           DO NOT remove it if the refresh fails.
        */
        if (showErrorUI && container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="alert alert-danger">
                        Unable to load homestay data. Please refresh.
                    </div>
                </div>
            `;
        }
    } finally {
        hideLoading();
    }
}

/* ==================================================
   MANUAL DATA REFRESH
================================================== */

async function refreshHomestayData() {
    showLoading();

    /*
       Remove ONLY website data cache.
       Wishlist remains untouched.
    */
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME);

    await fetchFreshData(true);
    hideLoading();
}

/*
   Make function available globally.
   You can call refreshHomestayData(); from browser console or an admin button later.
*/
window.refreshHomestayData = refreshHomestayData;

/* ==================================================
   FILTERING & SORTING
================================================== */

function populateLocations() {
    if (!locationFilter) return;

    const locations = [
        ...new Set(
            homestays
                .map(h => (h.location || "").trim())
                .filter(Boolean)
        )
    ].sort();

    let options = '<option value="">All Locations</option>';

    locations.forEach(location => {
        options += `<option value="${location}">${location}</option>`;
    });

    locationFilter.innerHTML = options;
}

/* ==================================================
   PRICE SLIDER
================================================== */

function handlePriceSlider() {
    if (priceValue && priceSlider) {
        priceValue.textContent = `₹${priceSlider.value}`;
    }

    applyFilters();
}

/* ==================================================
   APPLY FILTERS
================================================== */

function applyFilters() {
    const search = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const selectedLoc = locationFilter
        ? locationFilter.value.toLowerCase()
        : "";

    const maxPrice = priceSlider
        ? Number(priceSlider.value)
        : Infinity;

    filteredHomestays = homestays.filter(home => {
        const nameMatch = (home.name || "").toLowerCase().includes(search);
        const locMatch = (home.location || "").toLowerCase().includes(search);
        const descMatch = (home.description || "").toLowerCase().includes(search);

        const matchesSearch = !search || nameMatch || locMatch || descMatch;

        const homeLocation = (home.location || "").toLowerCase().trim();
        const matchesLocation = !selectedLoc || homeLocation === selectedLoc;

        const price = parseInt(home.price) || 0;
        const matchesPrice = price <= maxPrice;

        return matchesSearch && matchesLocation && matchesPrice;
    });

    sortHomestays();
    renderHomestays();
}

/* ==================================================
   SORT
================================================== */

function sortHomestays() {
    if (!sortSelect) return;

    const sortValue = sortSelect.value;

    if (sortValue === "priceLow") {
        filteredHomestays.sort(
            (a, b) => (parseInt(a.price) || 0) - (parseInt(b.price) || 0)
        );
    } else if (sortValue === "priceHigh") {
        filteredHomestays.sort(
            (a, b) => (parseInt(b.price) || 0) - (parseInt(a.price) || 0)
        );
    } else if (sortValue === "nameAZ") {
        filteredHomestays.sort(
            (a, b) => (a.name || "").localeCompare(b.name || "")
        );
    } else if (sortValue === "nameZA") {
        filteredHomestays.sort(
            (a, b) => (b.name || "").localeCompare(a.name || "")
        );
    }
}

/* ==================================================
   RENDER HOMESTAYS
================================================== */

function renderHomestays() {
    if (!container) return;

    if (resultCount) {
        resultCount.textContent = filteredHomestays.length;
    }

    if (filteredHomestays.length === 0) {
        container.innerHTML = "";

        if (noResult) {
            noResult.classList.remove("d-none");
        }

        return;
    }

    if (noResult) {
        noResult.classList.add("d-none");
    }

    /*
       Build complete HTML first.
       Then perform ONE DOM update.
    */
    let cardsHtml = "";

    filteredHomestays.forEach(home => {
        const image = home.image && home.image.trim() !== ""
            ? home.image.split("|")[0].trim()
            : "https://placehold.co/800x500?text=No+Image";

        const price = parseInt(home.price) || 0;
        const liked = wishlist.includes(String(home.id));

        const amenities = (home.amenities || "")
            .split(",")
            .slice(0, 4)
            .map(item => `<span class="amenity">${item.trim()}</span>`)
            .join("");

        cardsHtml += `
            <div class="col-xl-4 col-lg-4 col-md-6 mb-4">
                <div class="homestay-card fade-up">
                    <div class="card-image position-relative">
                        <img
                            src="${image}"
                            loading="lazy"
                            alt="${home.name || "Homestay"}"
                            onerror="this.src='https://placehold.co/800x500?text=No+Image'"
                        >
                        <button
                            class="wishlist btn btn-light rounded-circle position-absolute top-0 end-0 m-2"
                            onclick="toggleWishlist('${home.id}')"
                        >
                            ${liked ? "❤️" : "🤍"}
                        </button>
                        <div class="price-badge">
                            ₹${price}
                        </div>
                    </div>
                    <div class="card-body">
                        <h4 class="card-title">
                            ${home.name || ""}
                        </h4>
                        <div class="location-badge mb-3">
                            <i class="fa-solid fa-location-dot"></i>
                            ${home.location || ""}
                        </div>
                        <p class="card-text">
                            ${(home.description || "").substring(0, 110)}...
                        </p>
                        <div class="amenity-list">
                            ${amenities}
                        </div>
                        <div class="d-grid mt-4">
                            <a
                                href="${getDetailsPage(home)}"
                                class="btn btn-view"
                            >
                                View Details
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = cardsHtml;
}

/* ==================================================
   DETAILS PAGE LINK
================================================== */

function slugifyName(value) {
    return String(value || "homestay")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "homestay";
}

function getDetailsPage(home) {
    const id = String(home.id || "");
    return id === "0" ? "try.html" : `homestay/${id}-${slugifyName(home.name)}.html`;
}

/* ==================================================
   LOADING
================================================== */

function showLoading() {
    if (loading) {
        loading.style.display = "block";
    }
}

function hideLoading() {
    if (loading) {
        loading.style.display = "none";
    }
}

/* ==================================================
   WISHLIST
================================================== */

function toggleWishlist(id) {
    id = String(id);
    const index = wishlist.indexOf(id);

    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(id);
    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    renderHomestays();
}

/* ==================================================
   OPTIONAL HARD REFRESH SHORTCUT
================================================== */

/*
   Ctrl + Shift + R
   will force the website to fetch the latest Website Sheet data.
*/
document.addEventListener("keydown", function (event) {
    if (
        event.ctrlKey &&
        event.shiftKey &&
        event.key.toLowerCase() === "r"
    ) {
        event.preventDefault();
        refreshHomestayData();
    }
});

/* ==================================================
   CONSOLE MESSAGE
================================================== */

console.log("Darjeeling Homestay Directory - Phase 2 Smart JSON Cache loaded.");
