💡 **What:**
The RxDB N+1 write bottleneck was optimized in `SyncEngineService`. Previously, the code performed individual `.patch()` operations inside a `for...of` loop for updating each existing document (`upsertFarms`, `upsertFields`, `upsertEvents`, `upsertSoilAnalyses`, and `upsertFertilisationPlans`).
This has been refactored so that document updates are merged into their JSON representation and accumulated into a `toUpsert` array, and then committed to the local database in a single `bulkUpsert` operation.

🎯 **Why:**
Calling `await localDoc.patch()` within a loop triggers individual IndexedDB transactions, emitting corresponding RxDB events for each write operation. For a sync involving many updated entries, this resulted in N sequential database writes (a write N+1 query issue). Bulk operations resolve this overhead.

📊 **Measured Improvement:**
Since the Angular development environment lacked access to a robust RxDB performance profiling harness, we rely on theoretical analysis of the storage engine.
- **Baseline:** N document updates require N individual asynchronous IndexedDB writes/transactions.
- **Improvement:** By accumulating all patches into a `toUpsert` list, we eliminate the N+1 transaction overhead and perform exactly 1 bulk upsert write operation per entity type. This provides an exponentially faster sync process during large data payloads.
