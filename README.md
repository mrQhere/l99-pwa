# L99: Open Source Ophthalmic Diagnostic System 👁️

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

**L99** is a dual-architecture, zero-infrastructure edge Progressive Web App (PWA) designed to democratize high-grade medical diagnostics. 

## 🌍 The Mission
I built L99 with a singular goal in mind: **to bring immediate, clinical-grade medical treatment to marginalized and deeply impoverished populations where hospitals do not exist.** 

In rural and underserved regions, the lack of immediate access to an ophthalmologist can mean the difference between sight and permanent blindness. L99 places a powerful diagnostic engine directly into the pockets of field workers, running entirely on consumer-grade mobile devices. It works entirely offline when internet connectivity is completely unavailable, ensuring that poor communities get immediate triage and intervention without relying on expensive, centralized medical infrastructure.

## 🧠 System Architecture

L99 utilizes a deeply optimized split-architecture system that fluidly transitions between edge-compute and cloud-compute based on network availability.

### 1. The Offline Edge Engine (Browser-Native)
When operating in remote areas with zero connectivity, L99 falls back to a locally cached **MobileNetV3** neural network.
* **ONNX Runtime Web**: Executed completely locally using WebAssembly (`.wasm`) and WebGL APIs to process images natively within the device's CPU/GPU.
* **IndexedDB Offline Queue**: Scans taken offline are securely queued in the browser's IndexedDB. When connectivity is restored, the `is_offline: true` flagged records sync back to the master database.

### 2. The Cloud Ensemble (FastAPI + HuggingFace)
When internet is restored, the PWA seamlessly transitions to a robust, serverless backend hosted on Hugging Face Spaces.
* **Pure FastAPI Inference**: Stripped of UI bloat, the cloud runs a heavy-duty **EfficientNet-B4** model.
* **Grad-CAM Heuristics**: Generates granular heatmaps using Gradient-weighted Class Activation Mapping to pinpoint the exact vascular lesions and exudates.
* **Monte Carlo Dropout (MC Dropout)**: Runs 10 concurrent passes to generate statistical uncertainty metrics, warning clinicians of low-confidence predictions.

### 3. Image Preprocessing Pipeline
* **CLAHE**: Contrast Limited Adaptive Histogram Equalization is applied client-side to strip lighting abnormalities and clarify retinal vessels.
* **EXIF Parser**: Automatically reads focal length, ISO, and device manufacturer metrics to normalize inference weights.

### 4. Zero-Data-Leak Federated Learning 
The architecture includes rudimentary hooks for Federated Learning. Rather than uploading heavy, privacy-violating patient images to centralized servers, L99 captures encrypted weight deltas which are aggregated periodically, meaning the model gets smarter globally while patient data never leaves the device locally.

## 🛠️ Tech Stack
* **Frontend**: React.js, Vite, Vanilla CSS
* **Backend Inference**: Python, FastAPI, TensorFlow/Keras
* **Database**: Supabase (PostgreSQL + RLS)
* **Edge Inference**: ONNX WebAssembly

## 🚀 Quick Start Guide

### Prerequisites
1. Node.js (v18+)
2. Supabase Account
3. Hugging Face Account

### Installation
1. Clone the repository:
```bash
git clone https://github.com/mrQhere/l99-pwa.git
cd l99-pwa
```
2. Install dependencies:
```bash
npm install
```
3. Set up your environment variables (see `.env.example`):
```bash
cp .env.example .env
# Edit .env with your specific API keys
```
4. Run locally:
```bash
npm run dev
```

## ⚖️ License & Usage

This software is released under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** license.

The mission of L99 is strictly humanitarian. You are free to fork this project, deploy it, and use it in your local communities. However, **you are strictly prohibited from using any part of this software, its models, or its architectures for commercial profit or monetization.**

---
*Developed by mrQhere. For a world where healthcare has no borders.*
