# L99 User Manual

Welcome to the L99 Ophthalmic Diagnostic System. This guide is designed for clinicians, field workers, and administrators operating the app in both connected hospitals and offline, rural environments.

## 1. Initial Setup & Access
L99 is deployed as a Progressive Web App (PWA). You do not need an app store to install it.
1. Open the deployment URL on your mobile or tablet browser (Chrome/Safari).
2. You will be prompted with **"Add to Home Screen"**. Accept this to install the app natively on your device.
3. Once installed, it will function like a standard app and cache the necessary 30MB ONNX engine required for offline usage.

## 2. Authentication
Upon opening the app, you must select your Operator ID.
* Use ID `001` with Password `admin` to log in as the default Senior Screener.
* (Administrators: Additional operator IDs can be modified in `constants.js` or shifted to the Supabase auth layer).

## 3. Registering a Patient
Before running a scan, you must tie it to a patient record.
1. Navigate to the **Patients** tab via the sidebar.
2. Click the `+ Register Patient` button.
3. Fill in the required fields (Name, Phone, Age, Gender) and crucially, their **Assigned Doctor**.
4. Patient demographics are securely synchronized with the Supabase database.

## 4. Taking a Diagnostic Scan
1. Navigate to the **Scan** tab.
2. Search for a registered patient via their phone number or name.
3. Select either **"Open Camera"** or **"Upload Image"**.
   - Ensure the retinal image is cleanly focused. The system evaluates sharpness and luminance automatically.
4. Set the **Priority** level (e.g., Routine, Urgent, Emergency, or leave on Auto).
5. Click **Analyze Image**.
   - **Cloud Mode (Online)**: You will see a Floating Cloud animation. The EfficientNet-B4 system will process the image via the HuggingFace FastAPI, generating a Grad-CAM Heatmap and calculating statistical Uncertainty via MC Dropout passes.
   - **Engine Mode (Offline)**: You will see a Spinning DNA animation. The system will rely purely on your device's RAM and the pre-cached `.wasm` ONNX engine, running the MobileNetV3 model with zero latency.

## 5. Reviewing the Results
Once the AI finishes computing, you will be taken to the **Results** dashboard.
* You will see the **Severity Grade (0-4)**.
* You will see the **Triage Recommendation** (e.g., "See specialist within 2 weeks").
* If online, a **Grad-CAM Activation Map** will highlight the bleeding or exudates that the model detected.

## 6. Generating the PDF Medical Report
From either the Results page or the History page:
1. Click **Export PDF Report**.
2. The system dynamically renders a two-page document. Page 1 contains patient forensics, the original image, and the AI Heatmap side-by-side. Page 2 contains exhaustive telemetry (EXIF focal length, CLAHE quality limits).
3. Click **Share to WhatsApp** to immediately send the generated PDF directly to the Assigned Doctor.

## 7. Working Offline (No Internet)
If your medical camp loses internet access, keep scanning!
1. Check the Dashboard; the top-right indicator should read **Offline Engine [Active]**.
2. All scans taken will be automatically tagged with `is_offline: true`.
3. They will be saved to your browser's IndexedDB queue.
4. When you return to a zone with internet access, navigate to **Settings** and click **Sync X Offline Scans**. Your local records will safely merge into the cloud architecture.
