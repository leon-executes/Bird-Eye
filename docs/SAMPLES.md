# Sample pack

63 scenes, 77 display panels. Use the in-app library filters and Sources page.
The public pack deliberately excludes personal uploads, RSICD/NWPU images with unresolved release rights,
and IR-TD research-only data. Earlier evaluation counts may refer to the larger local research corpus.

| Collection | Selection | Transformations | Reference type |
|---|---|---|---|
| EuroSAT | First three per class encountered in first 400 test rows of pinned mirror | RGB decoded to PNG | Land-cover class |
| HIT-UAV | One per selected day/night, altitude and angle group, capped at 18 test images | Decoded to PNG | Object boxes and acquisition metadata |
| Landsat C2 | Six selected environmental contexts, 2024 acquisitions | Common-grid crop; RGB stretch; QA-masked ST product and rendered thermal display | Deterministic temperature sidecar, no human caption truth |
| Sentinel-2 | Four geographic contexts, June 2024 | Same-acquisition RGB and NIR crops, display normalization | Acquisition/product metadata |
| Sentinel-1 RTC | Four geographic contexts, June 2024 | VV/VH radar crops, display normalization, backscatter sidecars | Product measurements, no semantic caption truth |

NOTICE contains full attribution and license links. data/manifest.json records each selected source row or
product, dimensions, acquisition details where known, asset digests and transformations.
Sidecars retain scale/offset/QA rules and measurement units. In-app source links open in the system browser.

These examples exercise modality routing and presentation. They do not establish independent performance.
Dataset class labels, boxes and location names are held out of inference prompts. A human should judge
whether the caption identifies real scene content and respects the image's spatial resolution.

The included saved Phoenix assessment is tagged example_record and displayed as a recorded example.
It is preserved verbatim from a real engine run. Running the sample again creates a new report.

