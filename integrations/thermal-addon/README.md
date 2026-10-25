# Standalone thermal provider example

Original adapter: Parham (Leon) Faraji · leon-executes. Adapter code: MIT. Model weights retain upstream terms.

Requires Node 24, sharp 0.34.5 and onnxruntime-node 1.30.0. Run npm install here. No weights are downloaded. Supply models/hituav-thermal-detector.onnx and models/hituav-thermal-detector.json. Metadata includes sha256 of the ONNX and names mapping: 0 Person, 1 Car, 2 Bicycle, 3 OtherVehicle, 4 DontCare. Input: float32 images [1,3,640,640]. Output: output0 [1,9,N], YOLOv8 centre/size boxes. Other ONNX models are not interchangeable.

Copy service.example.json to service.json. Generate a token with node -p "require('crypto').randomBytes(32).toString('hex')" and replace the example. Run node server.mjs. Enter the same URL and token in Bird Eye → Models → External object evidence.

Tested weights: https://huggingface.co/KissTheHabit/yolov8n-hituav-thermal-finetune at revision a521855673acbd56aff6eebb628e47353a208a7f, identified as AGPL-3.0. Public example contains no weights or Ultralytics. The existing ONNX export is supplied in the personal package. See docs/EXTERNAL_DETECTOR.md for hashes and provenance. This adapter is not a licence exemption.

Threshold 0.35, class-aware NMS IoU 0.45, 640-square letterbox, maximum 100 outputs. Preprocessing and decoding match the previously evaluated export. Scores are not calibrated probabilities. Aerial thermal only. The service is independently launched and accepts authenticated loopback traffic only. The personal launcher stops only its own service process.
