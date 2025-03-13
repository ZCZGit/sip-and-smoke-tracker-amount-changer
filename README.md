# Sip & Smoke Amount Changer Card

A custom Home Assistant Lovelace card for dynamically interacting with **[sip-and-smoke-tracker](https://github.com/ZCZGit/sip-and-smoke-tracker)** devices. This card lets you select a device, view its current consumable amount, update the amount, and provides visual feedback upon successful updates. It dynamically adapts to filter devices by their consumable type, ensuring only relevant devices are displayed.

This card can now be nested in the **[sip-and-smoke-tracker-card](https://github.com/ZCZGit/sip-and-smoke-tracker-card)** or added as a standalone card. If nested, this card will function slightly differently due to the fact that the parent card will refresh when it receives an update from this card on a consumable update. If the card is nested, the submission flash or the updated amount may not appear depending on how quick the page is to refresh. The card will default back to "Select Device" on submission and refresh.

## Features
- Dynamically filters devices based on a specified consumable type (e.g., whisky, cigar).
- Displays the current amount and allows for updating the amount.
- Hides elements like the "Submit" button until a device is selected.
- Provides visual feedback (button flash) upon successful submissions.
- Refreshes the current amount automatically after updates.

## Installation

### Step 1: Add the Custom Card
1. Place the **`sip-and-smoke-amount-changer.js`** file to your `www` folder within Home Assistant.
2. Add the card to your Lovelace resources. Navigate to **Configuration** > **Dashboards** > **Resources**, and add the file with the following URL:

`/local/sip-and-smoke-card.js`

Ensure the resource type is set to **JavaScript Module**.

### Step 2: Configure the Card in Lovelace
Add the custom card to your Lovelace dashboard via YAML.

## Configuration Options

The card supports the following configuration options:

| Option             | Type   | Required | Description                                                                   |
|--------------------|--------|----------|-------------------------------------------------------------------------------|
| `type`             | string | Required | Must be set to `custom:sip-and-smoke-amount-changer`.                         |
| `title`            | string | Optional | The title displayed at the top of the card.                                   |
| `consumable_type`  | string | Optional | Filters devices by their consumable type, e.g., whisky, cigar. If omitted, all devices are shown. |

## Example YAML Configuration

### Example 1: Track Whiskys
```yaml
type: custom:sip-and-smoke-amount-changer
title: Whisky Tracker
consumable_type: whisky
```

### Example 2: Track Cigars
```yaml
type: custom:sip-and-smoke-amount-changer
title: Cigar Tracker
consumable_type: cigar
```

### Example 3: Show All Devices
```yaml
type: custom:sip-and-smoke-amount-changer
title: All Devices
```
## Usage

1. **Select a device** from the dropdown list. Only devices matching the configured `consumable_type` are displayed.
2. **View the "Current Amount"** for the selected device.
3. **Enter a new amount** in the "New Amount" input field.
4. **Click "Submit"** to update the device's consumable amount:
   - The button will flash green upon successful submission.
   - The "Current Amount" will refresh to show the updated value.

