# AWS Academy Tracker Notes

Use this file as project guidance for future changes.

## Excel Export Rules

- The export should visually match the in-app Excel matrix as closely as possible.
- Use Excel-friendly inline styles in the generated HTML export. Mac Excel may ignore CSS classes, so important colors, widths, and text formats should be inline.
- Keep `Student`, `Email`, and `Approval` as fixed leading columns.
- When criteria headers use multiple rows, `Student`, `Email`, and `Approval` should preserve the matching `rowspan`.
- Sort exported students by Required labs percent from high to low. Use completed required count as the tie-breaker, then student name.
- Avoid Excel date auto-conversion in score values. Export `Value` cells as the achieved score only, for example `13`, `12`, or `0`, not `13/13` or `13 / 13`.
- Remove numeric platform IDs from lab/test titles everywhere they are displayed or exported. For example, remove `(1937909)`.

## Export Colors

- Required guided labs use green tones.
- Extra/challenge labs use yellow tones.
- Tests use blue tones.
- The color should fill the whole column group, including blank cells, not only headers or scored cells.
- Pending cells should use light red:
  - Required guided labs are pending when score is `<= 75%`.
  - Challenge/extra labs are pending when score is `<= 60%`.
  - Tests do not use the pending threshold.

## Export Header Layout

- Split criterion headers into separate rows:
  - First row: module plus criterion type, for example `M05 - Guided lab:`.
  - Second row: lab title only.
  - Third row: metric labels.
- For guided labs, separate `M05 - Guided lab:` from the lab title.
- For challenge labs, separate `M07 - Challenge lab:` from the lab title.
- Omit `(Cafe)` from challenge lab export prefixes. Use `Challenge lab:`, not `Challenge (Cafe) lab:`.
- Normal labs and challenges keep two columns: `Percent` and `Value`.
- Tests use only one column: `Percent`.

## In-App Display Rules

- The in-app Excel view and detail view should not show numeric platform IDs in lab/test titles.
- Keep the same grouping semantics as the export:
  - Required
  - Extra
  - Tests
- Keep the app focused on the usable tracker view rather than a marketing-style landing page.
