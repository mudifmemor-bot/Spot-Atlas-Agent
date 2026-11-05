# Spot Atlas

A bilingual, source-grounded web agent for the UZEX AI Hackathon screening round. It uses the organizers’ synthetic records from January 2022 through October 2026. The runtime is static and has no API keys, external models or account requirement.

## Publish

Publish only the `dist` folder to an HTTPS static host. The index, worker, JavaScript modules and binary chunks must retain their relative paths. For Netlify Drop, sign in to the team account, open https://app.netlify.com/drop and drag in `dist`. Use the production URL in the screening form after testing in a signed-out browser. Use the team’s claimed deployment so it remains available for judging.

## Rehearse locally

Extract the ZIP first. On Windows double-click **Start-Spot-Atlas.cmd**. It opens a new Chrome or Edge window with the bundled registry. Alternatively open **Spot-Atlas-offline.html** directly in either browser. The **dist/index.html** entry point also works when double-clicked with the rest of the dist folder beside it. Click **Yillik bitimlar** to see the 2024 deal count, **106 647**, with its source references.

For an optional HTTP rehearsal run `python -m http.server 8786 --bind 127.0.0.1 --directory dist` and open http://127.0.0.1:8786/. Judges use the public HTTPS URL.

## Examples

- Сколько форвардных сделок заключено в 2024 году?
- 100007-sonli bitimda bir o‘lchov birligining narxi qancha?
- Топ-3 продавцов по обороту за 2025 год
- Какова сумма сделки №100001?
- 30.10.2026 kuni barcha bitimlar summasi so‘mga aylantirilganda jami qancha?

## Verify

Run `node tests/run.mjs` and `node tests/rehearsal.mjs` using Node 22+ and the packaged data. To regenerate the inputs, put the organizer CSV files one directory above this folder, run `python build_data.py` and `python tests/oracle.py`, then rerun the Node commands. The Python oracle reads CSV directly and uses Decimal for monetary values. The runtime computes its answers without access to the test cases.

The browser downloads approximately 17.7 MB of compressed data on first use. Money is accumulated using BigInt. The default turnover includes all matching registered deals, including annulled ones, and converts USD at the trade date’s rate. A physical total requires compatible units. Grouped average unit prices use total value divided by total physical volume. Missing fields, unsupported requests and unrecognized qualifiers can lead to abstention or a clarification request. The supported query grammar is bounded.

The answer cites original CSV filenames and record numbers. Aggregate sample citations illustrate the matching set. The calculations scan all matching records. Commodity families use registered customs codes and selected name distinctions, so arbitrary synonyms or seller-specific descriptions may need clarification.

After rebuilding the CSV assets run `python offline_build.py` to refresh both local entry points.
