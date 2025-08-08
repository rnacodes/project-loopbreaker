Of course. Integrating a dedicated search engine like TypeSense is an excellent step for creating a powerful and fast search experience for both media metadata and full-text document content.

Here is the updated, comprehensive development plan that now includes the setup, deployment, and integration of TypeSense.

***

### Phase 1: Core Functionality and Schema Updates

This phase focuses on critical backend changes and implementing full CRUD (Create, Read, Update, Delete) operations for media items.

#### **Step 1: Update `MediaItem` Status and Finalize Naming**
* **Backend Tasks**:
    1.  In `BaseMediaItem.cs`, change the existing consumption property to **`Status`**. Define it as an enum with four options: `Consumed`, `InProgress`, `NotConsumed`, and `DidNotFinish`.
    2.  [cite_start]In your solution, perform a global find-and-replace to change "Playlist" to **"Mixlist"** in all backend files for consistency[cite: 51, 52].
    3.  [cite_start]Create and apply a new database migration for the `Status` change[cite: 338, 340].

* **Frontend Tasks**:
    1.  Perform a global find-and-replace in your frontend codebase to change "Playlist" to "Mixlist".
    2.  In the `AddMediaForm` and any other relevant forms, update the consumption status field to a dropdown or set of radio buttons that reflect the new `Status` enum.

---

#### **Step 2: Implement "Edit" and "Delete" Media**
* **Backend Tasks**:
    1.  Implement `UpdateAsync` and `DeleteAsync` methods in your `IMediaRepository` and `MediaRepository`.
    2.  [cite_start]Create `UpdateMediaItemAsync` and `DeleteMediaItemAsync` methods in your `MediaAppService`[cite: 187].
    3.  [cite_start]Add **`PUT /api/media/{id}`** and **`DELETE /api/media/{id}`** endpoints to your `MediaController`[cite: 203].

* **Frontend Tasks**:
    1.  Create an **"Edit" button** on each item in the `ViewAllMedia` page and on the individual media profile page.
    2.  Create **`EditMediaForm.jsx`**, pre-filled with the item's data.
    3.  Add `updateMediaItem` and `deleteMediaItem` functions to your `mediaService.js`.
    4.  Implement a **"Delete" button** with a confirmation dialog.

***

### Phase 2: UI/UX Enhancements and Mixlist Polish

This phase is about refining the user experience, implementing your UI improvement ideas, and making the Mixlist functionality real.

#### **Step 3: Refine Media Display and Forms**
* **Backend Tasks**:
    1.  In your `MediaController`, ensure that when you return media data, the `Status` and `MediaType` enums are being sent as **strings** (e.g., "Consumed") rather than their integer index values.

* **Frontend Tasks**:
    1.  **Media Profile Page & Search Results**:
        * **Display Thumbnails**: Ensure the thumbnail image is rendered as a picture (`<img>` tag), not a URL string.
        * **Adjust Text**: Increase text size for better readability and adjust colors for contrast.
        * **Verify Properties**: Double-check that all displayed properties correctly map to the data coming from the API.
        * **Update Labels**: Change the "View Source" button text to "Visit Link".
    2.  **Form Styling**:
        * [cite_start]Apply consistent styling from `AddMediaForm.jsx` to all other forms[cite: 269].
        * Make all form selection "chips" and the "Create Mixlist" button larger.
    3.  **Date Picker**: Update the date picker component to allow for selecting a full date.

---

#### **Step 4: Implement Core Mixlist Functionality**
* **Backend Tasks**:
    1.  **Enhance `Mixlist` Entity**: In `Mixlist.cs`, add a property to store the count of media items it contains.
    2.  **Seed Database**: Create a migration or a seed data script to add your placeholder Mixlists to the database.
    3.  **Troubleshoot Display Logic**: Investigate and fix the repository query that fetches a Mixlist and its associated `MediaItems`.

* **Frontend Tasks**:
    1.  **Replace Placeholders**: Update the front page to fetch and display the actual Mixlists from your database.
    2.  **Mixlist View Page**:
        * Implement a **carousel** at the top to preview the media items.
        * Add an option for the user to view the Mixlist's contents as a simple **list** in addition to the carousel.

***

### Phase 3: Integrating the TypeSense Search Engine

This new phase is dedicated to implementing a powerful, fast, and dedicated search engine for all your content.

#### **Step 5: Deploy and Configure TypeSense**
* **Backend/DevOps Task**:
    1.  **Deploy TypeSense on DigitalOcean**: Follow the official TypeSense documentation to deploy a TypeSense instance on a DigitalOcean Droplet.
    2.  **Secure the Instance**: Configure the firewall and set up the TypeSense API key.
    3.  **Add Credentials to Render**: Securely add your TypeSense Host, Port, and API Key as environment variables in your Render backend service.

---

#### **Step 6: Integrate TypeSense into the Backend**
* **Backend Tasks**:
    1.  **Add TypeSense Client**: Install the official `typesense-dotnet` NuGet package in your `ProjectLoopbreaker.Infrastructure` project.
    2.  **Create `ITypeSenseService`**: In the Domain layer, define an interface for your search service with methods like `IndexMediaItemAsync(MediaItem item)` and `SearchAsync(string query)`.
    3.  **Implement `TypeSenseService`**: In the Infrastructure layer, create the concrete implementation. It will initialize the TypeSense client with the credentials from your environment variables.
    4.  **Modify `MediaAppService`**:
        * Inject your new `ITypeSenseService`.
        * In `AddMediaItemAsync`, after successfully saving to the database, call `_typeSenseService.IndexMediaItemAsync(newItem)`.
        * Do the same for `UpdateMediaItemAsync` and add a `DeleteItemFromIndexAsync` call in `DeleteMediaItemAsync`. This keeps your search index perfectly in sync with your database.
    5.  **Create New Search Endpoint**: Create a new controller endpoint, **`GET /api/search`**, that takes a query string. This endpoint will call the `_typeSenseService.SearchAsync(query)` method and return the results directly from TypeSense.

* **Frontend Tasks**:
    1.  **Update `mediaService.js`**: Create a new `searchMedia(query)` function that calls your new `/api/search` backend endpoint.
    2.  **Update `ViewAllMedia.jsx`**: Modify the search bar's logic to call this new `searchMedia` function instead of the old database-driven one. You should notice an immediate improvement in speed and relevance.

***

### Phase 4: Advanced Features and External Integrations

This final phase tackles complex functionality, building upon your now-solid foundation.

#### **Step 7: Connect to DigitalOcean Object Storage**
* **Backend Tasks**:
    1.  **Configure Storage Client**: Your `S3CompatibleStorageClient` can be configured to work with DigitalOcean Spaces. In your Render environment variables, add the required credentials.
    2.  **Finalize Upload Logic**: Ensure the `AddMediaItemAsync` and `UpdateMediaItemAsync` services correctly use this client.

* **Frontend Tasks**:
    * No major changes are needed here if the forms are already set up to send file data.

---

#### **Step 8: Integrate AI for Content Enrichment**
* **Backend Tasks**:
    1.  [cite_start]**Update `MediaItem` Entity**: Add nullable string properties for AI suggestions: `AiSuggestedCategoriesJson` and `AiSummary`[cite: 126, 127]. Apply the migration.
    2.  **Implement `IAISuggestionService`**: Create a service that calls an external LLM.
    3.  **Web Scraper Integration**: Implement a simple web scraper client to fetch text content from URLs.
    4.  **Orchestrate in `MediaAppService`**: Use the scraper and AI service to populate the new fields when a media item is added.

* **Frontend Tasks**:
    1.  **Display AI Content**: On the media profile page, display the AI-generated summary and categories.
    2.  **Use AI for Mixlists**: Create a UI element to populate template Mixlists with relevant media items from your database using AI.

---

#### **Step 9: Enhance Podcast Functionality**
* **Backend Tasks**:
    1.  **Define Relationships**: Establish a clear relationship between a `PodcastSeries` entity and a `PodcastEpisode` entity.
    2.  **Inherit Thumbnail**: When adding a podcast episode, automatically assign the thumbnail from its parent `PodcastSeries` if one isn't provided.
    3.  **Import Logic**: Refine the external API import logic to handle series and their episodes correctly.

* **Frontend Tasks**:
    1.  **Create Linking UI**: Build a page or a modal where users can manage podcast series and the episodes within them.