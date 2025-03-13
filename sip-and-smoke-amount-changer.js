class SipAndSmokeAmountChanger extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.devices = [];
        this._config = null;
        this._hass = null;
        this.selectedDeviceImagePath = "";
        this.collapsed = true; // Start collapsed
        this.currentAmount = ""; // Track current amount for the selected device
    }

    async fetchDevices() {
        const sanitizeDeviceName = (name) =>
            name.toLowerCase().replace(/[\W_]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
        try {
            // Fetch all devices from Home Assistant
            const devices = await this._hass.connection.sendMessagePromise({
                type: "config/device_registry/list",
            });

            // Step 1: Retrieve the consumableType from the card's configuration
            const targetConsumableType = this._config?.consumable_type?.toLowerCase(); // e.g., "whisky", "cigar"

            // Step 2: Filter devices belonging specifically to "Sip and Smoke Tracker"
            const sipAndSmokeDevices = devices.filter((device) =>
                (device.manufacturer === "Sip and Smoke Tracker" ||
                    device.config_entries.some((entry) => entry === "sip_and_smoke_tracker")) &&
                (!targetConsumableType || device.model.toLowerCase() === targetConsumableType)
            );

            // Step 3: Map the filtered devices into a usable format
            this.devices = sipAndSmokeDevices.map((device) => {
                const sanitizedName = sanitizeDeviceName(device.name);
                return {
                    name: device.name,
                    entityId: `sensor.${sanitizedName}_amount`,
                };
            });

            // Step 4: Update the dropdown options dynamically
            this.updateDeviceDropdown();
        } catch (error) {
            console.error("Error fetching devices:", error);
        }
    }


    async fetchDeviceImagePath(entityId) {
        try {
            const state = this._hass.states[entityId.replace("_amount", "_image_path")];
            return state ? state.state : "";
        } catch (error) {
            console.error("Error fetching image path for device:", error);
            return "";
        }
    }

    async fetchCurrentAmount(entityId) {
        try {
            const state = this._hass.states[entityId];
            return state ? state.state : "Unknown"; // Return current amount or "Unknown" if unavailable
        } catch (error) {
            console.error("Error fetching current amount for device:", error);
            return "Unknown";
        }
    }

    updateDeviceDropdown() {
        const dropdown = this.shadowRoot.querySelector("#device-dropdown");
        if (dropdown) {
            dropdown.innerHTML = `<option value="" disabled selected>Select a device...</option>` +
                this.devices
                    .map((device) => `<option value="${device.entityId}">${device.name}</option>`)
                    .join("");
        }
    }

    async handleDeviceSelection(event) {
        const selectedEntityId = event.target.value;

        if (selectedEntityId) {
            // Fetch the current amount
            this.currentAmount = await this.fetchCurrentAmount(selectedEntityId);
            const currentAmountBox = this.shadowRoot.querySelector("#current-amount-box");

            if (currentAmountBox) {
                // Set the current amount value dynamically
                currentAmountBox.innerText = this.currentAmount;
                currentAmountBox.style.display = "block"; // Ensure box is visible
                console.log("Current Amount updated to:", this.currentAmount); // Debugging log
            } else {
                console.error("Current Amount Box not found in DOM");
            }

            // Fetch and display the device image
            this.selectedDeviceImagePath = await this.fetchDeviceImagePath(selectedEntityId);
            const imageContainer = this.shadowRoot.querySelector("#image-container");
            if (this.selectedDeviceImagePath && imageContainer) {
                imageContainer.style.display = "block"; // Show image container
                const imageElement = imageContainer.querySelector("#device-image");
                imageElement.src = this.selectedDeviceImagePath;
                console.log("Device image updated to:", this.selectedDeviceImagePath); // Debugging log
            }
        } else {
            // Hide the image container if no device is selected
            const imageContainer = this.shadowRoot.querySelector("#image-container");
            if (imageContainer) {
                imageContainer.style.display = "none";
                console.log("Image container hidden as no device is selected");
            }
        }

        // Show the "New Amount" input row dynamically
        const amountRow = this.shadowRoot.querySelector("#amount-row");
        if (amountRow) {
            amountRow.style.display = "flex";
            console.log("New Amount input row is now visible"); // Debugging log
        }

        // Show the "Current Amount" row dynamically
        const currentAmountRow = this.shadowRoot.querySelector("#current-amount-row");
        if (currentAmountRow) {
            currentAmountRow.style.display = "flex";
            console.log("Current Amount row is now visible"); // Debugging log
        }

        // Show the Submit button
        const submitButton = this.shadowRoot.querySelector("#submit-button");
        if (submitButton) {
            submitButton.style.display = "block";
            console.log("Submit button is now visible");
        }
    }

    set hass(hass) {
        if (!this.shadowRoot.querySelector(".card")) {
            this.render();
        }
        this._hass = hass;
        if (!this.devices.length) {
            this.fetchDevices();
        }
    }

    render() {
        const card = document.createElement("ha-card");
        card.className = "card";
        card.style.padding = "16px";
        card.style.fontFamily = "Roboto, sans-serif"; // Ensure consistent font
        card.style.backgroundColor = "var(--card-background-color)"
        card.style.borderRadius = "8px";
        card.style.marginBottom = "10px";

        // Add CSS styles
        const style = document.createElement("style");
        style.textContent = `
            .success-flash {
                background-color: green !important;
                color: white !important;
                transition: background-color 0.5s ease;
            }
        `;
        this.shadowRoot.appendChild(style);

        // Title Section
        const titleContainer = document.createElement("div");
        titleContainer.className = "title-container";
        titleContainer.style.textAlign = "center";
        titleContainer.style.fontWeight = "bold";
        titleContainer.style.fontSize = "1.2em";
        titleContainer.style.marginBottom = "16px";
        titleContainer.innerText = this._config?.title || "Amount Changer";

        // Main Content Section
        const mainContainer = document.createElement("div");
        mainContainer.className = "main-container";
        mainContainer.style.display = "flex";
        mainContainer.style.flexDirection = "row";
        mainContainer.style.alignItems = "flex-start";

        // Image Section
        const imageContainer = document.createElement("div");
        imageContainer.id = "image-container";
        imageContainer.style.display = "none"; // Hidden by default
        imageContainer.style.marginRight = "16px";

        const deviceImage = document.createElement("img");
        deviceImage.id = "device-image";
        deviceImage.style.width = "80px";
        deviceImage.style.height = "80px";
        deviceImage.style.borderRadius = "50%";
        deviceImage.style.objectFit = "cover";
        imageContainer.appendChild(deviceImage);

        // Right Content Section
        const contentContainer = document.createElement("div");
        contentContainer.className = "content-container";
        contentContainer.style.flex = "1";
        contentContainer.style.display = "flex";
        contentContainer.style.flexDirection = "column";

        // Dropdown Row
        const dropdownRow = document.createElement("div");
        dropdownRow.className = "row";
        dropdownRow.style.display = "flex";
        dropdownRow.style.marginBottom = "10px";

        const dropdownLabel = document.createElement("label");
        dropdownLabel.setAttribute("for", "device-dropdown");
        dropdownLabel.innerText = "Device:";
        dropdownLabel.style.marginRight = "10px";
        dropdownLabel.style.fontWeight = "bold";

        const dropdown = document.createElement("select");
        dropdown.id = "device-dropdown";
        dropdown.style.fontFamily = "Roboto, sans-serif"; // Consistent font
        dropdown.innerHTML = `<option value="" disabled selected>Select a device...</option>`;
        dropdown.addEventListener("change", (event) => this.handleDeviceSelection(event));
        dropdown.style.width = "100%"; // Full width of the card
        dropdown.style.borderRadius = "8px"; // Rounded corners

        dropdownRow.appendChild(dropdownLabel);
        dropdownRow.appendChild(dropdown);

        // Current Amount Box
        const currentAmountRow = document.createElement("div");
        currentAmountRow.className = "row";
        currentAmountRow.id = "current-amount-row";
        currentAmountRow.style.marginBottom = "10px"; // Consistent padding below this row
        currentAmountRow.style.display = "none";
        currentAmountRow.style.alignItems = "center";

        const currentAmountLabel = document.createElement("label");
        currentAmountLabel.innerText = "Current Amount:";
        currentAmountLabel.style.marginRight = "10px";
        currentAmountLabel.style.fontWeight = "bold";

        const currentAmountBox = document.createElement("div");
        currentAmountBox.id = "current-amount-box";
        currentAmountBox.style.fontFamily = "Roboto, sans-serif"; // Consistent font
        currentAmountBox.style.fontWeight = "bold";
        currentAmountBox.style.display = "none"; // Hidden until a device is selected

        currentAmountRow.appendChild(currentAmountLabel);
        currentAmountRow.appendChild(currentAmountBox);

        // Amount Row (renamed to New Amount)
        const amountRow = document.createElement("div");
        amountRow.id = "amount-row";
        amountRow.style.display = "none";
        amountRow.style.marginBottom = "10px"; // Consistent padding
        amountRow.style.alignItems = "center";

        const amountLabel = document.createElement("label");
        amountLabel.innerText = "New Amount:";
        amountLabel.style.marginRight = "10px";
        amountLabel.style.fontWeight = "bold";

        const amountInput = document.createElement("input");
        amountInput.type = "number";
        amountInput.id = "amount-input";
        amountInput.style.fontFamily = "Roboto, sans-serif"; // Consistent font
        amountInput.style.width = "100%"; // Full width of the card
        amountInput.style.borderRadius = "8px"; // Rounded corners

        amountRow.appendChild(amountLabel);
        amountRow.appendChild(amountInput);

        // Submit Button
        const submitButton = document.createElement("button");
        submitButton.innerText = "Submit";
        submitButton.style.marginTop = "10px"; // Padding before submit button
        submitButton.style.fontFamily = "Roboto, sans-serif"; // Consistent font
        submitButton.style.display = "none"; // Hide button by default
        submitButton.id = "submit-button";
        submitButton.style.fontWeight = "bold";
        submitButton.addEventListener("click", () => this._handleSubmit());
        submitButton.style.width = "100%"; // Full width of the card
        submitButton.style.borderRadius = "8px"; // Rounded corners


        // Append Elements to Main Content
        contentContainer.appendChild(dropdownRow);
        contentContainer.appendChild(currentAmountRow); // Add Current Amount Box
        contentContainer.appendChild(amountRow);
        contentContainer.appendChild(submitButton);

        // Assemble Main Layout
        mainContainer.appendChild(imageContainer);
        mainContainer.appendChild(contentContainer);

        // Assemble Card
        card.appendChild(titleContainer);
        card.appendChild(mainContainer);

        this.shadowRoot.appendChild(card); // Append the card to the shadow DOM
    }

    _handleSubmit() {
        const dropdown = this.shadowRoot.querySelector("#device-dropdown");
        const amountInput = this.shadowRoot.querySelector("#amount-input");
        const submitButton = this.shadowRoot.querySelector("#submit-button");

        // Get the selected device and amount input values
        const selectedDevice = dropdown.value;
        const amount = parseInt(amountInput.value, 10);

        // Validate the input values
        if (!selectedDevice || isNaN(amount) || amount < 0) {
            console.error("Invalid input or no device selected!");
            return;
        }

        // Fire the Home Assistant event to update the selected device's amount
        this._hass.callApi("POST", "events/sip_and_smoke_tracker.update", {
            entity_id: selectedDevice,
            value: amount,
        })
        .then(async () => {
            console.log("Event fired successfully: ", { entity_id: selectedDevice, value: amount });

            // Flash the Submit button green
            submitButton.classList.add("success-flash");
            setTimeout(() => {
                submitButton.classList.remove("success-flash");
            }, 1000); // Remove the class after 1 second

            // Refresh the Current Amount
            this.currentAmount = await this.fetchCurrentAmount(selectedDevice);
            const currentAmountBox = this.shadowRoot.querySelector("#current-amount-box");
            if (currentAmountBox) {
                currentAmountBox.innerText = this.currentAmount;
                console.log("Current Amount refreshed to:", this.currentAmount); // Debugging log
            }

            // Fire the Home Assistant service to refresh the entity state
            this._hass.callService("homeassistant", "update_entity", {
                entity_id: selectedDevice,
            });

            // Dispatch the custom event for the parent card
            this.dispatchEvent(new CustomEvent("amount-updated", {
                detail: { entity_id: selectedDevice, value: amount },
                bubbles: true,
                composed: true
            }));
        })
        .catch((error) => {
            console.error("Error firing the event: ", error);
        });
    }


    setConfig(config) {
        if (!config) {
            throw new Error("Invalid configuration");
        }
        this._config = config;
    }

    getCardSize() {
        return 1;
    }
}

customElements.define("sip-and-smoke-amount-changer", SipAndSmokeAmountChanger);

