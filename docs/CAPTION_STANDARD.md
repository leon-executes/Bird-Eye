# Caption standard: identify the scene

A useful caption identifies what the place or object is, its components, and their spatial relationships. Color and texture supply evidence; they do not replace identification.

Use this order:

1. Most specific supported scene/object identity: river delta, vegetated island, dune field, harbor, residential blocks, road junction, mountain ridge, vehicle, person, etc.
2. Distinctive arrangement and context: channels dividing wetlands; docks extending into a harbor; streets meeting between building blocks; ridges and valleys; cultivation around a settlement.
3. A qualified finer interpretation when justified. Attach uncertainty to that interpretation, rather than reducing the whole caption to patches and colors.

Example for the supplied coastal/wetland sample: **A branching river delta spreads through densely vegetated wetlands and islands, with sediment plumes around its channels and river mouths.** This is a visually reviewed example, not an assertion that the bundled model reliably produces it.

Unknown sensor metadata does not prevent ordinary object or landform recognition. It does prevent attributing temperatures or a sensor type from grayscale alone. A thermal bright spot becomes a candidate hut, vehicle or person only when morphology, spatial scale, context and any registered companion imagery support that identity. A geographic analogy must not become an invented location. Blur alone does not demonstrate motion.

## Pipeline correction

The prior UNKNOWN-modality instruction explicitly restricted output to shapes and contrast. This was removed. Satellite first opinions now use available RGB overviews to establish scene identity. Reviewers and the master still inspect the selected companions. Each image has its own immediately preceding asset label. If several inputs have no declared RGB anchor, council mode first obtains separate image opinions so that a recognisable image is not drowned out by unrelated or less interpretable panels. Independent passes do not read earlier opinions.

## Quality gate

Assess factual scene identification, component identity, spatial relationships, useful specificity and warranted uncertainty. A grammatical caption, valid JSON, longer wording or the presence of a noun does not demonstrate correctness. Do not count confident misidentification as an improvement over vagueness.

Prompt revision: 2026-10-24.6-semantic-scene. Six supplied scenes were exercised through the revised council; a separate three-image experiment increased the visual-token minimum from 256 to 1024. The larger image-token budget did not resolve the 4B model's confusion over the dune field or the striped/clouded scene. The default token minimum remains 256. These remain known recognition failures; the change is not a validated expert-quality solution. The larger 8B model remains incomplete and untested.

Routing, evidence isolation, image binding and other source regression tests pass (16 tests). The earlier 96-scene operational test belongs to the previous prompt revision and is not a semantic accuracy result for this revision.

An additional input-order test moved the color delta image to the fourth position and marked all four modalities UNKNOWN. Separate image opinions plus synthesis identified a coastal wetland/river delta with branching channels. Intermediate grayscale interpretations still included unsupported motion/smoke suggestions, so the success of this final caption does not validate every intermediate opinion. The test result is saved privately in work/unknown-order-validation.json.
