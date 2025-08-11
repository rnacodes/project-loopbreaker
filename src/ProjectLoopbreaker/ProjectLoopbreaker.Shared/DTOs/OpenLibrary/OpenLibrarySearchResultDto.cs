using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.OpenLibrary
{
    public class OpenLibrarySearchResultDto
    {
        [JsonPropertyName("numFound")]
        public int NumFound { get; set; }

        [JsonPropertyName("start")]
        public int Start { get; set; }

        [JsonPropertyName("numFoundExact")]
        public bool NumFoundExact { get; set; }

        [JsonPropertyName("docs")]
        public OpenLibraryBookDto[] Docs { get; set; } = Array.Empty<OpenLibraryBookDto>();
    }

    public class OpenLibraryBookDto
    {
        [JsonPropertyName("key")]
        public string? Key { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("author_name")]
        public string[]? AuthorName { get; set; }

        [JsonPropertyName("author_key")]
        public string[]? AuthorKey { get; set; }

        [JsonPropertyName("first_publish_year")]
        public int? FirstPublishYear { get; set; }

        [JsonPropertyName("isbn")]
        public string[]? Isbn { get; set; }

        [JsonPropertyName("subject")]
        public string[]? Subject { get; set; }

        [JsonPropertyName("cover_i")]
        public int? CoverId { get; set; }

        [JsonPropertyName("publisher")]
        public string[]? Publisher { get; set; }

        [JsonPropertyName("language")]
        public string[]? Language { get; set; }

        [JsonPropertyName("publish_date")]
        public string[]? PublishDate { get; set; }

        [JsonPropertyName("publish_year")]
        public int[]? PublishYear { get; set; }

        [JsonPropertyName("number_of_pages_median")]
        public int? NumberOfPagesMedian { get; set; }

        [JsonPropertyName("rating_average")]
        public double? RatingAverage { get; set; }

        [JsonPropertyName("rating_count")]
        public int? RatingCount { get; set; }

        [JsonPropertyName("has_fulltext")]
        public bool? HasFulltext { get; set; }

        [JsonPropertyName("public_scan_b")]
        public bool? PublicScan { get; set; }

        [JsonPropertyName("lending_edition_s")]
        public string? LendingEdition { get; set; }

        [JsonPropertyName("lending_identifier_s")]
        public string? LendingIdentifier { get; set; }

        [JsonPropertyName("printdisabled_s")]
        public string? PrintDisabled { get; set; }

        [JsonPropertyName("seed")]
        public string[]? Seed { get; set; }

        [JsonPropertyName("edition_count")]
        public int? EditionCount { get; set; }

        [JsonPropertyName("edition_key")]
        public string[]? EditionKey { get; set; }

        [JsonPropertyName("format")]
        public string[]? Format { get; set; }

        [JsonPropertyName("ebook_count_i")]
        public int? EbookCount { get; set; }
    }

    public class OpenLibraryWorkDto
    {
        [JsonPropertyName("key")]
        public string? Key { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("authors")]
        public OpenLibraryAuthorReference[]? Authors { get; set; }

        [JsonPropertyName("description")]
        public object? Description { get; set; } // Can be string or object with "value" property

        [JsonPropertyName("subjects")]
        public string[]? Subjects { get; set; }

        [JsonPropertyName("subject_places")]
        public string[]? SubjectPlaces { get; set; }

        [JsonPropertyName("subject_times")]
        public string[]? SubjectTimes { get; set; }

        [JsonPropertyName("subject_people")]
        public string[]? SubjectPeople { get; set; }

        [JsonPropertyName("covers")]
        public int[]? Covers { get; set; }

        [JsonPropertyName("created")]
        public OpenLibraryTimestamp? Created { get; set; }

        [JsonPropertyName("last_modified")]
        public OpenLibraryTimestamp? LastModified { get; set; }

        [JsonPropertyName("latest_revision")]
        public int? LatestRevision { get; set; }

        [JsonPropertyName("revision")]
        public int? Revision { get; set; }

        [JsonPropertyName("type")]
        public OpenLibraryTypeReference? Type { get; set; }
    }

    public class OpenLibraryAuthorReference
    {
        [JsonPropertyName("author")]
        public OpenLibraryTypeReference? Author { get; set; }

        [JsonPropertyName("type")]
        public OpenLibraryTypeReference? Type { get; set; }
    }

    public class OpenLibraryTypeReference
    {
        [JsonPropertyName("key")]
        public string? Key { get; set; }
    }

    public class OpenLibraryTimestamp
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("value")]
        public DateTime? Value { get; set; }
    }

    public class OpenLibraryAuthorDto
    {
        [JsonPropertyName("key")]
        public string? Key { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("personal_name")]
        public string? PersonalName { get; set; }

        [JsonPropertyName("birth_date")]
        public string? BirthDate { get; set; }

        [JsonPropertyName("death_date")]
        public string? DeathDate { get; set; }

        [JsonPropertyName("bio")]
        public object? Bio { get; set; } // Can be string or object with "value" property

        [JsonPropertyName("wikipedia")]
        public string? Wikipedia { get; set; }

        [JsonPropertyName("photos")]
        public int[]? Photos { get; set; }

        [JsonPropertyName("alternate_names")]
        public string[]? AlternateNames { get; set; }

        [JsonPropertyName("created")]
        public OpenLibraryTimestamp? Created { get; set; }

        [JsonPropertyName("last_modified")]
        public OpenLibraryTimestamp? LastModified { get; set; }

        [JsonPropertyName("latest_revision")]
        public int? LatestRevision { get; set; }

        [JsonPropertyName("revision")]
        public int? Revision { get; set; }

        [JsonPropertyName("type")]
        public OpenLibraryTypeReference? Type { get; set; }
    }
}
