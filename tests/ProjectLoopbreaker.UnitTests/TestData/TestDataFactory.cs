using AutoFixture;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.UnitTests.TestData
{
    public static class TestDataFactory
    {
        private static readonly Fixture _fixture = new();

        static TestDataFactory()
        {
            _fixture.Customize<BaseMediaItem>(c => c
                .Without(x => x.Id)
                .Without(x => x.Topics)
                .Without(x => x.Genres)
                .Without(x => x.Mixlists)
                .Do(x => x.Id = Guid.NewGuid()));

            _fixture.Customize<Book>(c => c
                .Without(x => x.Id)
                .Without(x => x.Topics)
                .Without(x => x.Genres)
                .Without(x => x.Mixlists)
                .Do(x => x.Id = Guid.NewGuid()));

            _fixture.Customize<Podcast>(c => c
                .Without(x => x.Id)
                .Without(x => x.Topics)
                .Without(x => x.Genres)
                .Without(x => x.Mixlists)
                .Without(x => x.ParentPodcast)
                .Without(x => x.Episodes)
                .Do(x => x.Id = Guid.NewGuid()));

            _fixture.Customize<Mixlist>(c => c
                .Without(x => x.Id)
                .Without(x => x.MediaItems)
                .Do(x => x.Id = Guid.NewGuid()));

            _fixture.Customize<Topic>(c => c
                .Without(x => x.Id)
                .Without(x => x.MediaItems)
                .Do(x => x.Id = Guid.NewGuid()));

            _fixture.Customize<Genre>(c => c
                .Without(x => x.Id)
                .Without(x => x.MediaItems)
                .Do(x => x.Id = Guid.NewGuid()));
        }

        public static Book CreateBook(string? title = null, string? author = null)
        {
            var book = _fixture.Create<Book>();
            if (title != null) book.Title = title;
            if (author != null) book.Author = author;
            return book;
        }

        public static Podcast CreatePodcastSeries(string? title = null, string? publisher = null)
        {
            var podcast = _fixture.Create<Podcast>();
            podcast.PodcastType = PodcastType.Series;
            if (title != null) podcast.Title = title;
            if (publisher != null) podcast.Publisher = publisher;
            return podcast;
        }

        public static Podcast CreatePodcastEpisode(string? title = null, Guid? parentId = null)
        {
            var podcast = _fixture.Create<Podcast>();
            podcast.PodcastType = PodcastType.Episode;
            if (title != null) podcast.Title = title;
            if (parentId.HasValue) podcast.ParentPodcastId = parentId.Value;
            return podcast;
        }

        public static Mixlist CreateMixlist(string? name = null)
        {
            var mixlist = _fixture.Create<Mixlist>();
            if (name != null) mixlist.Name = name;
            return mixlist;
        }

        public static Topic CreateTopic(string? name = null)
        {
            var topic = _fixture.Create<Topic>();
            if (name != null) topic.Name = name;
            return topic;
        }

        public static Genre CreateGenre(string? name = null)
        {
            var genre = _fixture.Create<Genre>();
            if (name != null) genre.Name = name;
            return genre;
        }

        public static CreateBookDto CreateBookDto(string? title = null, string? author = null)
        {
            var dto = _fixture.Create<CreateBookDto>();
            if (title != null) dto.Title = title;
            if (author != null) dto.Author = author;
            return dto;
        }

        public static CreatePodcastDto CreatePodcastDto(string? title = null, PodcastType? type = null)
        {
            var dto = _fixture.Create<CreatePodcastDto>();
            if (title != null) dto.Title = title;
            if (type.HasValue) dto.PodcastType = type.Value;
            return dto;
        }

        public static CreateMixlistDto CreateMixlistDto(string? name = null)
        {
            var dto = _fixture.Create<CreateMixlistDto>();
            if (name != null) dto.Name = name;
            return dto;
        }

        public static CreateTopicDto CreateTopicDto(string? name = null)
        {
            var dto = _fixture.Create<CreateTopicDto>();
            if (name != null) dto.Name = name;
            return dto;
        }

        public static CreateGenreDto CreateGenreDto(string? name = null)
        {
            var dto = _fixture.Create<CreateGenreDto>();
            if (name != null) dto.Name = name;
            return dto;
        }

        public static List<Book> CreateBooks(int count)
        {
            return _fixture.CreateMany<Book>(count).ToList();
        }

        public static List<Podcast> CreatePodcastSeries(int count)
        {
            return _fixture.CreateMany<Podcast>(count)
                .Select(p => { p.PodcastType = PodcastType.Series; return p; })
                .ToList();
        }

        public static List<Mixlist> CreateMixlists(int count)
        {
            return _fixture.CreateMany<Mixlist>(count).ToList();
        }
    }
}
