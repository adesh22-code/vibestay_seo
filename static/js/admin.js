let homestays = [];

async function deleteHomestay(id) {
    const confirmed = confirm(
        "🛑 WARNING: PERMANENT DELETION\n\n" +
        "This will completely remove the homestay and permanently delete its main image and all gallery images from ImageKit.\n\n" +
        "Are you absolutely sure you want to proceed?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/homestays/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to delete homestay");
        }

        alert("Homestay and all associated images were successfully deleted.");
        
        // Refresh the table to show the updated list
        await loadHomestays();

    } catch (error) {
        console.error(error);
        alert("Error deleting homestay: " + error.message);
    }
}

function showAddForm() {
    // Clear the hidden ID so the system knows it's new
    document.getElementById("editId").value = "";
    
    // Clear all text fields
    const fields = [
        "name", "location", "price", "scenery", "amenities", "description", 
        "phone", "whatsapp", "facebook", "website", "youtube", "instagram", 
        "googleMap", "gallery", "image"
    ];
    fields.forEach(field => document.getElementById(field).value = "");

    // Clear image previews
    showGalleryPreview([]);
    showMainImagePreview("");

    // Switch views
    document.getElementById("listSection").style.display = "none";
    document.getElementById("editSection").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
}


function showGalleryPreview(urls) {

    const preview = document.getElementById("galleryPreview");
    preview.innerHTML = "";

    urls.forEach((url, index) => {
        if (!url) {
            return;
        }

        const item = document.createElement("div");
        item.className = "gallery-item";
        item.innerHTML = `
            <img src="${url}" alt="Gallery image ${index + 1}">
            <button type="button" class="delete-gallery-image" data-url="${encodeURIComponent(url)}">
                Delete
            </button>
        `;
        preview.appendChild(item);
    });

    document.querySelectorAll(".delete-gallery-image").forEach(button => {
        button.addEventListener("click", function () {
            const url = decodeURIComponent(this.dataset.url);
            deleteGalleryImage(url);
        });
    });
}

async function deleteGalleryImage(url) {
    const confirmed = confirm(
        "⚠️ PERMANENT IMAGE DELETION\n\n" +
        "This image will be permanently deleted from ImageKit " +
        "and removed from the homestay data.\n\n" +
        "Image:\n" +
        url +
        "\n\n" +
        "Are you sure you want to continue?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch("/api/images/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: url })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Image deletion failed");
        }

        const galleryInput = document.getElementById("gallery");
        const urls = galleryInput.value
            .split("|")
            .map(item => item.trim())
            .filter(item => item && item !== url);

        galleryInput.value = urls.join("|");
        showGalleryPreview(urls);

        alert("Image permanently deleted from ImageKit and removed from GitHub data.");

    } catch (error) {
        console.error(error);
        alert("Unable to delete image:\n\n" + error.message);
    }
}

document.getElementById("uploadGallery").addEventListener("click", async function () {
    const input = document.getElementById("galleryFiles");
    const files = Array.from(input.files);

    if (files.length === 0) {
        alert("Please select one or more images.");
        return;
    }

    const button = document.getElementById("uploadGallery");
    button.disabled = true;
    button.textContent = "Uploading...";

    try {
        const uploadedUrls = [];

        for (const file of files) {
            const result = await uploadImageToImageKit(file, "/vibestay");
            uploadedUrls.push(result.url);
        }

        const existing = document.getElementById("gallery").value
            .split("|")
            .map(url => url.trim())
            .filter(url => url);

        const allUrls = [...existing, ...uploadedUrls];
        document.getElementById("gallery").value = allUrls.join("|");
        showGalleryPreview(allUrls);
        input.value = "";

        alert(`${uploadedUrls.length} gallery image(s) uploaded.`);
        
        await saveHomestay();

    } catch (error) {
        console.error(error);
        alert("Gallery upload failed: " + error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Upload Gallery Images";
    }
});

function showMainImagePreview(url) {
    const preview = document.getElementById("mainImagePreview");

    if (!url) {
        preview.innerHTML = "No image";
        return;
    }

    // Wrap the image and add a delete button
    preview.innerHTML = `
        <div class="gallery-item" style="position: relative; display: inline-block;">
            <img src="${url}" alt="Main image preview" style="max-width: 200px; display: block;">
            <button type="button" class="delete-main-image" data-url="${encodeURIComponent(url)}" style="position: absolute; top: 5px; right: 5px; background: red; color: white; border: none; padding: 5px; cursor: pointer;">
                Delete
            </button>
        </div>
    `;

    // Attach click listener to the new delete button
    document.querySelector(".delete-main-image").addEventListener("click", function () {
        const decodedUrl = decodeURIComponent(this.dataset.url);
        deleteMainImage(decodedUrl);
    });
}

async function deleteMainImage(url) {
    const confirmed = confirm(
        "⚠️ PERMANENT IMAGE DELETION\n\n" +
        "This main image will be permanently deleted from ImageKit " +
        "and removed from the homestay data.\n\n" +
        "Image:\n" + url + "\n\n" +
        "Are you sure you want to continue?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch("/api/images/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: url })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Image deletion failed");
        }

        // Clear the main image input field
        document.getElementById("image").value = "";
        
        // Update the preview to show "No image"
        showMainImagePreview("");

        alert("Main image permanently deleted from ImageKit and removed from GitHub data.");

    } catch (error) {
        console.error(error);
        alert("Unable to delete image:\n\n" + error.message);
    }
}

document.getElementById("uploadMainImage").addEventListener("click", async function () {
    const input = document.getElementById("mainImageFile");
    const file = input.files[0];

    if (!file) {
        alert("Please select an image first.");
        return;
    }

    const button = document.getElementById("uploadMainImage");
    button.disabled = true;
    button.textContent = "Uploading...";

    try {
        const result = await uploadImageToImageKit(file, "/vibestay");
        document.getElementById("image").value = result.url;
        showMainImagePreview(result.url);

        alert("Main image uploaded successfully.");
        
        await saveHomestay();

    } catch (error) {
        console.error(error);
        alert("Image upload failed: " + error.message);
    } finally {
        button.disabled = false;
        button.textContent = "Upload Main Image";
    }
});

async function uploadImageToImageKit(file, folder) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Image upload failed");
    }

    return result;
}

async function loadHomestays() {
    const table = document.getElementById("homestayTable");
    const total = document.getElementById("totalHomestays");
    const message = document.getElementById("message");

    try {
        const response = await fetch("/api/homestays");

        if (!response.ok) {
            throw new Error("Failed to load homestays");
        }

        homestays = await response.json();
        total.textContent = `${homestays.length} homestays`;
        table.innerHTML = "";

        homestays.forEach((homestay, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${homestay.id ?? ""}</td>
                <td>
                    ${homestay.image ? `<img src="${homestay.image}" alt="">` : "No image"}
                </td>
                <td>${homestay.name ?? ""}</td>
                <td>${homestay.location ?? ""}</td>
                <td>₹${homestay.price ?? ""}</td>
                <td>
                    <button type="button" class="edit-button" onclick="editHomestay(${index})">
                        Edit
                    </button>
                    <button type="button" class="delete-button" onclick="deleteHomestay('${homestay.id}')" style="background-color: #dc3545; color: white; margin-left: 8px; border: none; padding: 5px 10px; cursor: pointer; border-radius: 4px;">
                        Delete
                    </button>
                </td>
            `;
            table.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        total.textContent = "";
        message.textContent = "Unable to load homestays.";
        table.innerHTML = `
            <tr>
                <td colspan="6">Error loading data.</td>
            </tr>
        `;
    }
}

function editHomestay(index) {
    const homestay = homestays[index];

    if (!homestay) {
        return;
    }

    document.getElementById("editId").value = homestay.id ?? "";
    document.getElementById("name").value = homestay.name ?? "";
    document.getElementById("location").value = homestay.location ?? "";
    document.getElementById("price").value = homestay.price ?? "";
    document.getElementById("scenery").value = homestay.scenery ?? "";
    document.getElementById("amenities").value = homestay.amenities ?? "";
    document.getElementById("description").value = homestay.description ?? "";
    document.getElementById("phone").value = homestay.phone ?? "";
    document.getElementById("whatsapp").value = homestay.whatsapp ?? "";
    document.getElementById("facebook").value = homestay.facebook ?? "";
    document.getElementById("website").value = homestay.website ?? "";
    document.getElementById("youtube").value = homestay.youtube ?? "";
    document.getElementById("instagram").value = homestay.instagram ?? "";
    document.getElementById("googleMap").value = homestay.googleMap ?? "";
    document.getElementById("gallery").value = homestay.gallery ?? "";

    showGalleryPreview(
        (homestay.gallery ?? "")
            .split("|")
            .map(url => url.trim())
            .filter(url => url)
    );

    document.getElementById("image").value = homestay.image ?? "";
    showMainImagePreview(homestay.image ?? "");

    document.getElementById("listSection").style.display = "none";
    document.getElementById("editSection").style.display = "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function cancelEdit() {
    document.getElementById("editSection").style.display = "none";
    document.getElementById("listSection").style.display = "block";
}

document.getElementById("cancelEdit").addEventListener("click", cancelEdit);
document.getElementById("cancelEdit2").addEventListener("click", cancelEdit);
document.getElementById("saveButton").addEventListener("click", saveHomestay);

async function saveHomestay() {
    const id = document.getElementById("editId").value;
    const isNew = !id; // True if adding new, False if editing

    const updatedHomestay = {
        name: document.getElementById("name").value,
        location: document.getElementById("location").value,
        price: document.getElementById("price").value,
        scenery: document.getElementById("scenery").value,
        amenities: document.getElementById("amenities").value,
        description: document.getElementById("description").value,
        phone: document.getElementById("phone").value,
        whatsapp: document.getElementById("whatsapp").value,
        facebook: document.getElementById("facebook").value,
        website: document.getElementById("website").value,
        youtube: document.getElementById("youtube").value,
        instagram: document.getElementById("instagram").value,
        googleMap: document.getElementById("googleMap").value,
        gallery: document.getElementById("gallery").value,
        image: document.getElementById("image").value
    };

    if (!isNew) {
        updatedHomestay.id = id;
    }

    const saveButton = document.getElementById("saveButton");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    // Dynamically set endpoint and method
    const url = isNew ? "/api/homestays" : `/api/homestays/${encodeURIComponent(id)}`;
    const method = isNew ? "POST" : "PUT";

    try {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedHomestay)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to save homestay");
        }

        alert(isNew ? "New homestay added successfully!" : "Homestay updated successfully.");

        document.getElementById("editSection").style.display = "none";
        document.getElementById("listSection").style.display = "block";
        await loadHomestays();

    } catch (error) {
        console.error(error);
        alert("Error saving homestay: " + error.message);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }
}

loadHomestays();
