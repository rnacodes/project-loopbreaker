Current Admin Page Layout
  Page: BackgroundJobsPage
  Current Functions: Book enrichment only (with "More Jobs Coming Soon"       
    placeholder)
  ────────────────────────────────────────
  Page: TypesenseAdminPage
  Current Functions: Health check, Reindex, Reset, Deduplication, Notes Sync, 
    Search Testing
  Recommendations

  1. Expand BackgroundJobsPage (Consolidate Enrichment)

  The BackgroundJobsPage already has Book Enrichment and a "More Jobs Coming Soon" placeholder. Add the other enrichment services here:

  Add to BackgroundJobsPage:
  - Movie/TV Enrichment (similar UI to Book Enrichment)
  - Podcast Enrichment (similar UI to Book Enrichment)
  - AI Description Generation (Notes)
  - Embedding Generation

  This creates a single "Enrichment Hub" for all data enrichment operations.  

  2. Keep TypesenseAdminPage As-Is

  The Typesense page is focused on search infrastructure:
  - Reindexing (syncing DB → Typesense)
  - Resetting collections
  - Search testing

  The Notes Sync section fits here because it's about importing into the system, not enrichment.

  3. Division of Responsibility
  ┌──────────────────────────────┬─────────────┬─────┐
  │             Task             │ Admin Pages │ N8N │
  ├──────────────────────────────┼─────────────┼─────┤
  │ Check status/counts          │ Yes         │ No  │
  ├──────────────────────────────┼─────────────┼─────┤
  │ Single-item operations       │ Yes         │ No  │
  ├──────────────────────────────┼─────────────┼─────┤
  │ Run single batch (ad-hoc)    │ Yes         │ No  │
  ├──────────────────────────────┼─────────────┼─────┤
  │ Scheduled batch runs         │ No          │ Yes │
  ├──────────────────────────────┼─────────────┼─────┤
  │ Chained workflows            │ No          │ Yes │
  ├──────────────────────────────┼─────────────┼─────┤
  │ Execution history/monitoring │ No          │ Yes │
  ├──────────────────────────────┼─────────────┼─────┤
  │ Failure notifications        │ No          │ Yes │
  └──────────────────────────────┴─────────────┴─────┘
  4. Remove Redundant Config UI

  The BackgroundJobsPage has sliders for batch size, delay, etc. These are useful for manual runs, but don't duplicate scheduling config. Let N8N handle when jobs run; admin pages handle how they run when triggered manually.

  ---
  Summary: Expand BackgroundJobsPage to be the "Enrichment Control Panel" with all 5 enrichment services. Keep TypesenseAdminPage for search infrastructure. Use N8N for scheduling and monitoring.

  Would you like me to implement the expanded BackgroundJobsPage with the additional enrichment services?