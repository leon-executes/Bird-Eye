# External detector gateway: local check

Two previously used HIT-UAV development frames; not an independent accuracy benchmark. Same detector ONNX, same 0.35 score threshold and 0.45 NMS IoU; no training. All reports include model receipts, image hashes and decision trace.

- Six-person frame: six proposals transmitted. Initial gateway run rejected them generically. After adding individual crops and a focused review, the morphology reviewer identified human-like silhouettes; the master retained person proposals as qualified/tentative findings. It still did not identify people in the main caption and still proposed an unverified reservoir/excavation. This remains a semantic failure. The visible object-evidence section prevents the useful proposals from disappearing.
- Fourteen-car frame: fourteen proposals transmitted. Final caption includes approximately 14 parked vehicles; the count is qualified in the decision trace. Without the detector, the earlier caption identified parked vehicles but supplied no count.
- Both final runs completed structured adjudication and cited the external claim in final findings. The connection and contribution trace work; correct final identification is not guaranteed.

Raw final reports: [external-gateway.json](evaluation-1.0.2/external-gateway.json). The public app does not include this provider or its weights. The personal edition lets you reproduce the comparison with the separate service.
