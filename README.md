# Madina Honda Centre - 3-in-1 POS, Workshop Lift ERP & Connected Analytics

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B%20%7C%20v22%2B%20%7C%20v24%2B-green.svg)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-SQLite%20(WAL%20Mode)-blue.svg)](https://sqlite.org/)
[![UI Style](https://img.shields.io/badge/UI%20Design-Aronium%20Lite%20Dark-orange.svg)](https://www.aronium.com/)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Custom-crimson.svg)]()

> **Custom-built, offline-first Point of Sale (POS), Workshop Bay Management, and Business Intelligence System designed specifically for Madina Honda Centre (Motorcycle Showroom, Authorized 3S Dealership, Genuine Spare Parts Retailer & Repair Workshop).**

---

## 📌 Table of Contents
1. [Business Background & Core Vision](#-business-background--core-vision)
2. [Key Features & What We Built](#-key-features--what-we-built)
3. [Aronium-Style POS Interface](#-aronium-style-pos-interface)
4. [System Architecture & Technology Stack](#-system-architecture--technology-stack)
5. [Quick Start & Setup on Any PC](#-quick-start--setup-on-any-pc)
6. [Accessing from Mobile / Tablet over Shop Wi-Fi](#-accessing-from-mobile--tablet-over-shop-wi-fi)
7. [Default User Accounts & Permissions (RBAC)](#-default-user-accounts--permissions-rbac)
8. [Hardware & Peripheral Setup](#-hardware--peripheral-setup)
9. [Keyboard Shortcuts Reference](#-keyboard-shortcuts-reference)
10. [Database Schema & Automatic Seeding](#-database-schema--automatic-seeding)
11. [Project Directory Layout](#-project-directory-layout)

---

## 🏢 Business Background & Core Vision

Running a motorcycle showroom, repair workshop, and spare parts store manually creates major business bottlenecks:
* Spare parts taken from shelves during bike repairs are often forgotten and unbilled.
* Complex mechanic splits (50% labor share, cash advances, savings kept with the shop) are difficult to calculate daily.
* Repeat repair disputes happen when customers return with recurring issues, and no one knows who worked on the bike.
* Disagreements over fuel levels, scratches, or replaced parts ("kabaad") cause customer friction.
* Working capital gets tied up in dead stock while fast-moving oils and cables run out.

### The Solution:
A **3-in-1 Hybrid POS & Workshop ERP** with the familiar, clean aesthetic of **Aronium Lite POS** that runs **100% offline** on the main shop computer, while allowing the owner to monitor live sales and profits from their smartphone over the local Wi-Fi.

---

## 🚀 Key Features & What We Built

### 1. 3-in-1 Point of Sale (POS) Billing Engine
* **Stream 1: Counter Retail Parts**: Fast barcode scanning and keyboard lookup for walk-in retail sales of genuine Honda oils, plugs, and parts.
* **Stream 2: In-House Workshop Delivery**: Pulls up active repair jobs by Registration No, Chassis No, or Lift #. Combines all parts fitted during repair + dynamic labor charge, collects payment, and prints an official **Barcoded Gate Pass**.
* **Stream 3: Local Shop Wholesale (B2B)**: Dedicated trade catalog for nearby freelance mechanics and repair workshops with wholesale discount pricing, credit limits (*Khata*), and balance tracking.
* **Stream 4: After-Sales Service**: Periodic maintenance packages (1st Free Service, Oil & Tuning packages).

### 2. Physical Workshop Lift Bays & Bike Intake
* **Visual Lift Grid**: Real-time status board of physical workshop bays (`Lift 1 - Quick Service`, `Lift 2 - Main Repair`, `Lift 3 - Engine Overhaul`, `Bay 5 - Washing & Detailing`) with color states:
  - 🟢 **Available / Idle**
  - 🟡 **In-Service** (Assigned mechanic, bike model, reg #, start timer)
  - 🔵 **Ready for Delivery**
* **30-Second Dispute-Prevention Intake Inspection**:
  - Fuel Gauge Level on intake: `Reserve` / `Half` / `Full`.
  - Scratches, body dents, and helmet/toolkit presence checklist.
  - **Old Replaced Parts Policy**: Checkbox for *"Old Replaced Parts (Kabaad) to be Handed Over to Customer [Yes / No]"*.
* **Live Parts Consumption**: Mechanics request parts from the store; parts are attached to the Job Card and instantly deducted from inventory.

### 3. Re-Work & Customer Complaint Management
* **Instant History Trace**: If a customer brings a motorcycle back with an unresolved problem, typing the **Registration Number** or **Chassis / Frame Number** reveals:
  - Exact date of previous service.
  - What spare parts were replaced.
  - **The exact mechanic who performed the job**.
* **Same-Mechanic Reassignment**: Reassigns the bike back to the same mechanic with 1 click.
* **Warranty / Free Re-Work Flag**: Prevents customer double-billing while tracking technician rework rates.

### 4. Mechanic Commission & Peshgi Ledger
* **Dynamic Labor Pricing**: Service labor can be adjusted on the fly depending on job difficulty.
* **Configurable Percentage Split**: Automatically calculates the agreed split (e.g., 50% Mechanic / 50% Showroom).
* **Cash Advances (*Peshgi*)**: Tracks cash borrowed against future earnings with date and reason.
* **Retained Savings**: If a mechanic leaves their daily earnings with the showroom for safekeeping, it accumulates in their savings balance.
* **Personal Parts Account**: Parts taken by mechanics for personal projects are charged at trade rates.
* **End-of-Day Settlement Calculation**:
  $$\text{Net Payout} = \text{Earned Commission} + \text{Prior Savings} - \text{Cash Advances} - \text{Personal Parts}$$
  One-click payout settlement with printable payment voucher.

### 5. Spare Parts Inventory & Bulk Spreadsheet Import
* **Dual Catalog**: Clear distinction between **Genuine Atlas Honda** (OEM part numbers e.g. `15412-MGS-D21`) and **Cost-Effective Aftermarket Parts** (Crown, ISH, local market).
* **Bulk Import (Excel / CSV)**: Drag-and-drop supplier price lists with automatic column mapping, live preview, duplicate detection, and a downloadable sample template.
* **Thermal Barcode Label Generator**: Built-in barcode sticker creator (50×25mm / 40×30mm rolls) with store branding (`MADINA HONDA CENTRE`), part name, model, barcode, and retail price.
* **Engine Oil Auto-Matching**: Recommends exact capacity per model (0.7L for CD70, 0.8L for Pridor, 1.0L for CG125/CB150F).
* **ABC Stock Analysis**: Classifies inventory into A (Fast-moving), B (Medium), and C (Slow/Dead stock warnings).

### 6. Khata Credit Management & WhatsApp Alerts
* **Customer & Wholesale Shop Ledgers**: Credit limits, outstanding balances, payment recovery logging, and statements.
* **1-Click WhatsApp Alerts (Zero SMS Cost)**:
  - Intake notification with Job Card # and Gate Pass code.
  - "Ready for Pickup" notification with total bill breakdown.
  - 30-Day periodic oil change & maintenance reminder.
  - Friendly Khata balance payment reminder.

### 7. Cashier "Blind" Shift Closing & Security
* At shift close, the cashier enters the physical cash counted in their drawer **without seeing system expected cash**.
* The system calculates the variance automatically and flags any **Surplus or Shortage** directly to the Admin.
* Petty cash expense logger for morning tea, generator fuel, or workshop tools.

### 8. Owner's Connected Analytics & Intelligence (Admin Only)
* Accessible securely on the owner's smartphone, tablet, or PC:
  - **Today's True Net Profit**: $(\text{Parts Margin} + \text{Shop's Share of Labor}) - \text{Shop Expenses}$.
  - **Today's Cash vs. Credit**: Cash in drawer vs. unpaid credit (*Udhaar*) extended today.
  - **4-Stream Revenue Breakdown**: Workshop vs. Counter Retail vs. Local Shop Wholesale vs. After-Sales.
  - **Technician Efficiency Matrix**: Jobs completed, revenue generated, and unpaid commission balances.
  - **1-Click Local & USB Flash Drive Database Backup**.

---

## 🎨 Aronium-Style POS Interface

The POS terminal is modeled directly after **Aronium Lite POS** for maximum cashier speed:

```
+---------------------------------------------------------------------------------------------------+
| [☰] [||||||] [#] [🏷️]  Search products by name, code or barcode...    [🟢 Shift Open] [Admin] [- □ ✕] |
+-----------------------------------------------------------------+---------------------------------+
| Product name                       Quantity     Price    Amount | [  ✕ Delete ] [  🔍 F3 Search ] |
|-----------------------------------------------------------------| [  🧺 F4 Qty ] [  ➕ F8 New   ] |
| Honda 4T 20W-50 Oil (0.7L)                1    850.00    850.00 |---------------------------------|
| Spark Plug C7HSA (Genuine)                2    340.00    680.00 | [F12 Cash] [JAZZCASH] [EASYPAISA|
| Clutch Cable CD70 (Genuine)               1    290.00    290.00 | [BANK TR]  [ Card   ] [ Khata  ]|
|                                                                 |---------------------------------|
|                                                                 |            A R O N I U M        |
|                                                                 |---------------------------------|
|                                                                 | [? Service] [% Disc] [Price] [👤]
|                                                                 | [💵 Drawer] [💾 Save] [↩️ Ref] [⇄]
|                                                                 | [ 🔒 Lock ] [   F10 Payment  ]  |
|                                                                 |             [ (Big Green Btn)]  |
| Subtotal                                                1820.00 |             [  🗑️ Void Order ] |
| Total                                               PKR 1820.00 |---------------------------------+
+-----------------------------------------------------------------+
```

### Slide-out Sidebar for All Additional Options:
Clicking the top-left menu icon (`☰`) opens the sleek sidebar drawer:
* 🛒 POS Cash Register
* 🔧 Workshop Lift Bays & Bike Intake
* 📦 Spare Parts Inventory & Bulk Import
* 👥 Mechanic Commission & Peshgi Ledger
* ⚠️ Re-work & Customer Complaints
* 💳 Khata Credit Management
* 📈 Owner Analytics (Admin Only)
* 🔒 End of Shift / Blind Closing
* 💰 Record Daily Petty Expense
* 👤 User Role Switcher
* 🌓 Dark / Daylight Theme Toggle

---

## 🛠️ System Architecture & Technology Stack

| Component | Technology | Why It Was Chosen |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + Vite** | Blazing-fast development, sub-second Hot Module Replacement, zero bundle bloat. |
| **Styling & Design** | **Custom Vanilla CSS Tokens** | Authentic Aronium Lite pixel-perfect dark theme + High-contrast Daylight POS theme. No bulky CSS frameworks. |
| **Icons & Barcodes** | **Lucide-React + JsBarcode** | Automotive-grade icons and client-side Code128 thermal barcode rendering. |
| **Backend Server** | **Node.js + Express** | Lightweight, high throughput, binds to `0.0.0.0` for local network access. |
| **Database Engine** | **SQLite (`node:sqlite`)** | **Built directly into modern Node.js**. Zero external server setup, zero node-gyp C++ compiler hassle on Windows. High-speed WAL mode with crash resistance. |
| **File Processing** | **Multer + SheetJS (XLSX)** | Fast Excel (.xlsx) and CSV spreadsheet parsing for bulk price list imports. |
| **Printing** | **CSS `@media print` + HTML5** | Silent, pixel-accurate 80mm/58mm thermal receipt printing and A4/A5 Job Cards. |

---

## 💻 Quick Start & Setup on Any PC

Follow these steps to run the application on any new computer (Windows, Mac, or Linux):

### 1. Prerequisites
* **Node.js**: Version **20+, 22+, or 24+** installed. (Recommended: Node.js 22 LTS or 24 from [nodejs.org](https://nodejs.org/)).
* **Git**: Installed (from [git-scm.com](https://git-scm.com/)).

Check your installation:
```bash
node -v
npm -v
```

### 2. Clone the Repository
```bash
git clone https://github.com/<YOUR_USERNAME>/MADINA-HONDA-CENTRE-POS.git
cd MADINA-HONDA-CENTRE-POS
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
Run both the Express backend server and the Vite React frontend with a single command:
```bash
npm run dev
```

You will see:
```text
[SERVER] ======================================================
[SERVER]   MADINA HONDA CENTRE POS & WORKSHOP ERP SERVER
[SERVER]   Local Address:   http://localhost:5000
[SERVER]   Network Address: http://0.0.0.0:5000
[SERVER]   Database Engine: SQLite (WAL Mode active)
[SERVER] ======================================================

[CLIENT]   VITE ready in 500 ms
[CLIENT]   ➜  Local:   http://localhost:5173/
[CLIENT]   ➜  Network: http://192.168.x.x:5173/
```

Open your browser to:
👉 **`http://localhost:5173`**

*(Note: The database file `server/data/madina_pos.db` will be created and seeded automatically with Honda parts, lifts, mechanics, and accounts on the very first run!)*

---

## 📱 Accessing from Mobile / Tablet over Shop Wi-Fi

You don't need internet or cloud hosting to access the POS or Owner Analytics on another device in the shop:

1. Connect your smartphone, tablet, or laptop to the **same Wi-Fi network** as the main shop computer.
2. Note the **Network IP address** shown in your terminal when you run `npm run dev` (e.g., `http://192.168.0.105:5173/`).
3. Open Chrome or Safari on your phone and type that address:
   ```text
   http://192.168.0.105:5173
   ```
4. **Result**: You can view the live Owner Analytics, manage workshop jobs, or bill counter customers right from your phone or tablet on the shop floor!

---

## 👥 Default User Accounts & Permissions (RBAC)

The system includes pre-seeded user accounts for testing:

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Showroom Owner (Admin)** | `admin` | `admin123` | **Full Access**: Live gross profit, cost prices, Owner Analytics, mechanic payout approvals, wholesale credit limits, 1-click backups. |
| **Counter Cashier** | `cashier` | `cashier123` | **POS & Cash**: 3-in-1 billing, receiving payments, shift blind closing, customer lookup. *(Cost prices and owner profit margins are hidden)*. |
| **Workshop Supervisor** | `supervisor` | `supervisor123` | **Workshop Operations**: Bike intake, assigning lifts & mechanics, adding parts consumed, complaints & re-work tickets. |

*You can switch roles instantly using the role dropdown in the sidebar.*

---

## 🖨️ Hardware & Peripheral Setup

### 1. Thermal Receipt Printer (80mm or 58mm)
* Connect your thermal printer via USB or local network.
* In Windows Printer Properties, set the default paper size to **80mm × 297mm** (or 58mm Roll).
* When clicking **Print Receipt** (`F10`), the browser print dialog will automatically format the slip with store header, itemized parts, labor charges, and the **official Barcoded Gate Pass**.

### 2. Barcode Scanner (USB / Wireless)
* Compatible with any standard 1D / 2D barcode scanner (e.g., Honeywell, Zebra, Netum, Datalogic).
* Scanners operate in "Keyboard Wedge" mode: when you scan a part's barcode, it types the code into the search bar and presses `Enter`, adding the item to the receipt instantly.

### 3. Electronic Cash Drawer
* Connect the cash drawer's RJ11/RJ12 cable directly to the back of your thermal receipt printer.
* Configure printer properties: *"Open Cash Drawer Before/After Printing"*.

### 4. Barcode Sticker Roll Printer
* For unbarcoded parts, open **Spare Parts Inventory** -> click the **Tag (`🏷️`)** icon on any part.
* Select sticker size (**50×25mm** or **40×30mm**), enter the quantity of copies, and click **Print**.

---

## ⌨️ Keyboard Shortcuts Reference

Designed for high-speed cashier operation without touching the mouse:

| Shortcut | Action | Description |
| :---: | :--- | :--- |
| **`F3`** | **Search Catalog** | Opens product search modal to find parts by name or model. |
| **`F4`** | **Change Quantity** | Opens keypad to change quantity of the currently selected row. |
| **`F2`** | **Discount** | Enter rupee or percentage discount for the bill. |
| **`F8`** | **New Sale** | Clears the active cart and starts a fresh transaction. |
| **`F9`** | **Save / Park Sale** | Puts current bill on temporary hold. |
| **`F10`** | **Payment & Print** | Opens payment dialog (cash received, change due, and print bill). |
| **`F12`** | **Cash Mode** | Selects Cash payment method. |
| **`Delete`** | **Remove Item** | Removes the highlighted item from the receipt. |
| **`Enter`** | **Quick Add** | Adds the first matched search/scanned item directly to the receipt. |

---

## 🗄️ Database Schema & Automatic Seeding

The application stores all data locally in an SQLite database file at:
```text
server/data/madina_pos.db
```

### Relational Tables:
1. `users`: Role-based user accounts (`admin`, `cashier`, `supervisor`).
2. `lifts`: Physical workshop bays (`Lift 1`, `Lift 2`, `Lift 3`, `Washing Bay`).
3. `mechanics`: Mechanics, commission split rates, retained savings, total advances (*peshgi*), personal parts balances.
4. `mechanic_ledger`: Audit log of labor shares, cash advances, savings deposits/withdrawals, and payouts.
5. `products`: Spare parts inventory, Honda OEM part numbers, ABC classification (`A`, `B`, `C`), shelf locations, barcodes.
6. `customers`: Customer accounts and credit balances.
7. `vehicles`: Motorcycle records linked to customers (Registration #, Chassis/Frame #, Engine #, Model).
8. `job_cards`: Workshop intake, fuel level, scratch inspection, old parts return policy, dynamic labor, gate passes.
9. `job_card_parts`: Parts fitted to motorcycles during repair (auto-deducted from store stock).
10. `b2b_shops`: Local motorcycle workshops trade catalog and credit limits.
11. `sales`: 4-stream transactions (`counter_retail`, `inhouse`, `b2b_wholesale`, `after_sale`).
12. `sale_items`: Itemized line products per sale.
13. `khata_ledger`: Customer & B2B shop credit statements.
14. `complaints`: Customer re-work tickets with same-mechanic accountability.
15. `cashier_shifts`: Shift records with blind drawer count and variance calculation.
16. `shop_expenses`: Daily petty cash expenses (tea, utility, maintenance).
17. `backup_logs`: Database backup history.

---

## 📁 Project Directory Layout

```text
MADINA-HONDA-CENTRE POS/
├── package.json               # Full-stack dependencies & concurrent scripts
├── vite.config.js             # Vite configuration with proxy to port 5000 & network host
├── index.html                 # HTML shell
├── .gitignore                 # Excludes node_modules, temp uploads, and database files
├── server/
│   ├── server.js              # Express REST API (POS, Workshop, Inventory, Khata, Analytics)
│   ├── db.js                  # SQLite database engine, WAL mode, schema & auto-seed
│   └── data/                  # Auto-generated SQLite database (madina_pos.db)
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Master Aronium shell, top header & view controller
│   ├── index.css              # Aronium Lite authentic dark theme & Daylight POS styling
│   ├── components/
│   │   ├── AroniumSidebar.jsx     # Slide-out drawer for all additional options
│   │   ├── BarcodeCanvas.jsx      # JsBarcode Code128 renderer
│   │   ├── ThermalReceipt.jsx     # 80mm/58mm printable receipt & Gate Pass slip
│   │   ├── BarcodeStickerModal.jsx# Thermal barcode sticker roll generator
│   │   ├── BlindCloseModal.jsx    # Cashier blind shift closing with surplus/shortage audit
│   │   └── ExpenseModal.jsx       # Daily petty cash logger (tea, utilities)
│   └── views/
│       ├── PosTerminal.jsx        # Aronium-style 3-in-1 POS Cash Register
│       ├── WorkshopLifts.jsx      # Visual lift bays, 30-sec intake & dynamic labor
│       ├── InventoryManager.jsx   # Catalog, bulk Excel/CSV import & ABC analysis
│       ├── MechanicLedger.jsx     # 50/50 splits, peshgi advances & daily cashouts
│       ├── ComplaintsManager.jsx  # Re-work trace by reg/chassis & same-mechanic reassignment
│       ├── KhataManager.jsx       # Customer & B2B shop credit with WhatsApp reminders
│       └── AdminAnalytics.jsx     # Owner live gross profit, 4 streams & 1-click backup
└── public/
    └── aronium_preview.png    # Live preview screenshot of the Aronium layout
```

---

## 💾 Backups & Data Protection

* **1-Click Local Backup**: Go to **Owner Analytics** (or Sidebar) and click **"1-Click Backup"**. It creates a timestamped copy in `server/backups/`.
* **USB Flash Drive Backup**: Click **"Save to USB Flash Drive"** to download a complete `.db` snapshot directly to a plugged USB flash drive.
* **Restoring**: To restore data on any new computer, simply replace `server/data/madina_pos.db` with your backup file and restart the server!

---

## 📜 License
Custom developed exclusively for **Madina Honda Centre**. All rights reserved.
