namespace ProjectLoopbreaker.Web.API.DTOs
{
    public class CreateMediaItemDto
    {
        public string Title { get; set; }
        public string MediaType { get; set; }
        public string? Link { get; set; }
        public string? Notes { get; set; }
        public bool Consumed { get; set; }
        public string? Rating { get; set; }
        public string? RelatedNotes { get; set; }
        public string? Thumbnail { get; set; }
        public string? Description { get; set; }
    }
}
