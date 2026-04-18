# 🚧 Technical Hurdles & Engineering Post-Mortem

Building a clinical-grade medical PWA that operates in zero-connectivity environments presents a unique set of challenges. This document serves as a guide for developers to understand the pitfalls we encountered and how they were resolved.

---

## 1. The "WASM Wall": ONNX Runtime Web
**The Problem**: Our primary diagnostic engine relies on ONNX (MobileNetV3). We faced significant issues with the **WebAssembly (WASM)** backend failing to initialize on older mobile browsers and "out-of-memory" crashes when handling high-res retinal scans.
**The Solution**:
- **Operator Support**: We had to custom-optimize the model to use only Opset 13+ compatible operators that ONNX Runtime Web supports natively.
- **Backend Fallback**: We implemented a priority logic: `WebGPU` -> `WebGL` -> `WASM`.
- **Memory Management**: Images are now downsampled to the model's expected input (224x224) *before* hitting the inference engine to prevent browser-kill signals.

## 2. Camera API Fragmentation
**The Problem**: The `getUserMedia` API behaves drastically different across iOS Safari and Android Chrome. Specific challenges included:
- **Aspect Ratio Distortion**: Images appeared stretched on certain aspect ratios.
- **Focus Issues**: Macro photography (necessary for eyes) often failed on auto-focus constraints.
**The Solution**:
- We implemented a **Constraint Validator** that probes for `ideal` resolution settings and falls back to standard definitions if the device rejects the request.
- Added a client-side **Crop & Center** heuristic to ensure the retina is always in the focal dead-zone.

## 3. Hugging Face & Gradio "Dependency Hell"
**The Problem**: Setting up the serverless backend on Hugging Face Spaces was an exercise in frustration. 
- **requirements.txt conflict**: Version mismatches between `tensorflow`, `fastapi`, and the underlying Debian environment in HF Spaces.
- **Gradio Latency**: The default Gradio UI added unnecessary overhead for pure API inference.
**The Solution**:
- **FastAPI Migration**: We stripped Gradio entirely and moved to a pure FastAPI implementation to reduce container startup time by **40%**.
- **Containerization**: Use of pinned versions in `requirements.txt` to ensure reproducible builds across different Space instances.

## 4. Training & Model Conversion
**The Problem**: Training the **EfficientNet-B4** model provided high accuracy but resulted in a `.h5` file too large for edge deployment. 
- **Loss of Fidelity**: Initial quantization (converting to INT8) reduced diagnostic accuracy from 94% to 78%.
**The Solution**:
- **Hybrid Quantization**: We utilized FP16 (Float16) quantization, which halved the file size without significant loss in clinical sensitivity.
- **Transfer Learning**: We froze the initial 150 layers of the pre-trained model to focus weight adjustments specifically on vascular lesion identification.

## 5. Service Worker Persistence
**The Problem**: `vite-plugin-pwa` occasionally failed to cache the 30MB `.onnx` model files, causing the app to crash when the user went offline unexpectedly.
**The Solution**:
- **Manual Pre-Caching**: We expanded the `workbox` configuration to explicitly include the `models/` directory in the precache manifest.
- **Sync Logic**: Implemented a "Sync Indicator" that ensures the user stays online until the local model store is 100% verified.

## 6. Modernizing the Inference Pipeline (New Wave)
**The Problem**: Our initial implementation used a mismatched tensor format (NHWC) and lacked standard normalization, resulting in erratic results. Additionally, ONNX WASM binaries were failing to load due to missing glue code (`.mjs`) in the production bundle.
**The Solution**:
- **NCHW Transition**: We refactored the inference engine to use **Channel-First (NCHW)** tensors and **ImageNet Normalization**. This aligned the browser inference 100% with the Kaggle training logic.
- **WASM Synchronization**: Created an automated `wasm-sync.ps1` script to ensure all specialized `.mjs` and `.wasm` files are correctly bundled in the `public/` directory for zero-error initialization on Vercel.
- **Dynamic Capture Logic**: Implemented a "Best of 2" capture heuristic and adjustable Iris Circle guides to minimize movement artifacts during image acquisition.

---

> [!TIP]
> **Key Takeaway**: When building for the edge, assume the hardware is weak and the network is non-existent. Over-allocate resources for local image processing rather than relying on server-side cleanup.

## 7. Vercel Deployment Without GitHub Integration

**The Problem**: The standard Vercel workflow assumes a GitHub-connected repository for automatic CI/CD deployments. In our case, the repository is managed independently on GitHub and the Vercel project is **not linked** to GitHub. This breaks the typical `git push → auto-deploy` pipeline.

**The Consequences**:
- Every production deployment requires a manual `vercel --prod` CLI invocation from the local machine.
- There is no automatic preview URL for pull requests.
- Environment variables must be managed directly in the Vercel dashboard — they are not loaded from `.env` automatically on the server side.
- The `VITE_HF_SPACES_URL` and `VITE_SUPABASE_*` variables must be manually set in **Vercel Dashboard → Project → Settings → Environment Variables**.

**The Solution**:
- **Build locally first**: Always run `npm run build` and verify the `dist/` folder before deploying.
- **Deploy with CLI**: Use `npx vercel --prod` from the project root. Vercel will use the `vercel.json` config to determine build settings.
- **Manual env sync**: After any `.env` change, update the corresponding variables in the Vercel dashboard manually.
- **GitHub remains the source of truth**: All code changes are pushed to GitHub separately using standard `git push` commands. The two systems (GitHub and Vercel) operate independently.

**Workaround Script** (run in project root):
\`\`\`powershell
npm run build
npx vercel --prod
\`\`\`
