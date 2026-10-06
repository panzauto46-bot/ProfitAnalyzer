# Product Requirements Document (PRD): E-Commerce Profit Analyzer App

## 1. Product Overview

**Product Name:** E-Commerce Profit Analyzer (Temporary Name)
**Platform:** Native Android (Kotlin)
**Product Description:** A lightweight, fully offline Android application designed to help e-commerce sellers (specifically from TikTok Shop and Tokopedia) calculate their true net profit. The app parses exported local marketplace data (CSV/Excel), incorporates custom seller variables, and automates the calculation of ad spends, admin fees, and cost of goods sold (COGS).

## 2. Target Audience

* E-commerce sellers utilizing Tokopedia and TikTok Shop.

* Merchants running GMV Max or similar ad campaigns who need clarity on their actual ROI.

* Sellers who prefer analyzing their financial data privately and offline on their mobile devices.

## 3. Problem Statement

Sellers currently download raw performance reports containing gross revenue and ad spend, but these reports do not reflect the actual net profit. Sellers must manually calculate the deductions for platform administrative fees and their own COGS to understand if a campaign is truly profitable. Doing this manually on a mobile device is tedious and prone to errors.

## 4. Key Objectives

* **Automation:** Eliminate manual spreadsheet calculations on mobile devices.

* **Accuracy:** Provide an exact net profit figure by combining exported data with user-defined variables.

* **Privacy/Security:** Ensure all data processing happens locally on the device (100% offline) without uploading financial data to any external server.

## 5. Scope & Features (MVP)

* **File Upload & Parsing:** Ability to browse the Android local storage to select and parse exported report files (.csv or .xlsx).

* **Variable Input Fields:** Dedicated input fields for users to define their base metrics.

* **Calculation Engine:** An offline algorithm to extract relevant columns and compute the final net profit.

* **Summary Dashboard:** A single-screen UI to display the calculated financial breakdown clearly.

## 6. Functional Requirements

### 6.1. User Interface (UI)

* **Screen Layout:** Single-page application approach.

* **Components:**

  * "Import Data" button utilizing Android's Storage Access Framework (`ActivityResultContracts.GetContent`).

  * Numeric text fields for **Platform Admin Fee (%)**.

  * Numeric text fields for **COGS per Item (IDR)**.

  * A primary "Calculate Profit" action button.

  * A Results Card displaying the final breakdown.

### 6.2. Data Processing Logic

* The app must locate and extract specific column headers from the imported file:

  * `Biaya` (Ad Spend)

  * `Pesanan` (Total Orders)

  * `Pendapatan kotor` (Gross Revenue)

* **Error Handling:** If the required columns are missing, the app must display an error toast/snackbar: "Invalid file format. Required columns not found."

### 6.3. Calculation Formula

The app will execute the following mathematical logic once the user taps "Calculate":

1. **Total Ad Spend** = Sum of `Biaya`

2. **Total Gross Revenue** = Sum of `Pendapatan kotor`

3. **Total Orders** = Sum of `Pesanan`

4. **Total Admin Fee Deduction** = Total Gross Revenue \* (Admin Fee Input / 100)

5. **Total COGS Deduction** = Total Orders \* COGS Input

6. **NET PROFIT** = Total Gross Revenue - Total Ad Spend - Total Admin Fee Deduction - Total COGS Deduction

## 7. Non-Functional Requirements

* **Offline Capability:** The app must not request `android.permission.INTERNET`. All parsing (via standard Kotlin CSV parsers or Apache POI for Excel) must run locally.

* **Performance:** File parsing and calculation for files up to 10,000 rows must complete within 3 seconds on average Android devices.

* **Compatibility:** Minimum API Level 24 (Android 7.0) to ensure broad device coverage.

* **Usability:** Number formatting must localize to the Indonesian standard (e.g., Rp 1.000.000) for easy readability.

## 8. User Flow

1. User launches the application.

2. User taps "Import Data" and selects the exported Tokopedia/TikTok report from their "Downloads" folder.

3. The app confirms the file is successfully loaded.

4. User types the current Admin Fee (e.g., "6.5") into the percentage field.

5. User types their modal per item (e.g., "50000") into the COGS field.

6. User taps "Calculate Profit".

7. The Results Card populates with the step-by-step deductions and highlights the final Net Profit in green (if positive) or red (if negative).

## 9. Out of Scope for MVP (Future Enhancements)

* Multi-file consolidation (merging multiple reports).

* Multi-product COGS variation (currently assumes an average COGS across all orders).

* Graphical charts (pie charts, line graphs).

* Exporting the finalized calculation back to a new PDF or Excel file.