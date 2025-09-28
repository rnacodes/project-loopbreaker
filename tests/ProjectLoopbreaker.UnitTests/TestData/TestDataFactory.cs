using AutoFixture;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.TMDB;

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

        // TMDB Test Data Factory Methods
        public static TmdbMovieDto CreateTmdbMovieDto(int id = 27205, string title = "Inception")
        {
            return new TmdbMovieDto
            {
                Id = id,
                Title = title,
                Overview = "A skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life.",
                PosterPath = "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
                BackdropPath = "/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
                ReleaseDate = "2010-07-16",
                VoteAverage = 8.4,
                Popularity = 85.123,
                OriginalLanguage = "en",
                OriginalTitle = title,
                GenreIds = new[] { 28, 878, 53 },
                Runtime = 148,
                Tagline = "Your mind is the scene of the crime.",
                Homepage = "https://www.warnerbros.com/movies/inception",
                ImdbId = "tt1375666",
                ProductionCompanies = new[]
                {
                    new TmdbProductionCompanyDto { Id = 923, Name = "Legendary Entertainment", LogoPath = "/8M99Dkt23MjQMTTWukq4m5XsEuo.png" }
                },
                ProductionCountries = new[]
                {
                    new TmdbProductionCountryDto { Iso31661 = "US", Name = "United States of America" }
                },
                SpokenLanguages = new[]
                {
                    new TmdbSpokenLanguageDto { EnglishName = "English", Iso6391 = "en", Name = "English" }
                }
            };
        }

        public static TmdbTvShowDto CreateTmdbTvShowDto(int id = 1399, string name = "Game of Thrones")
        {
            return new TmdbTvShowDto
            {
                Id = id,
                Name = name,
                Overview = "Seven noble families fight for control of the mythical land of Westeros.",
                PosterPath = "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
                BackdropPath = "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
                FirstAirDate = "2011-04-17",
                LastAirDate = "2019-05-19",
                VoteAverage = 8.4,
                Popularity = 369.594,
                OriginalLanguage = "en",
                OriginalName = name,
                GenreIds = new[] { 18, 10759, 10765 },
                NumberOfSeasons = 8,
                NumberOfEpisodes = 73,
                Homepage = "http://www.hbo.com/game-of-thrones",
                OriginCountry = new[] { "US" },
                Tagline = "Winter Is Coming",
                Networks = new[]
                {
                    new TmdbNetworkDto { Id = 49, Name = "HBO", LogoPath = "/tuomPhY2UuLiCOFvxycrJYSHZL.png", OriginCountry = "US" }
                },
                ProductionCompanies = new[]
                {
                    new TmdbProductionCompanyDto { Id = 76043, Name = "Revolution Sun Studios", LogoPath = null }
                },
                ProductionCountries = new[]
                {
                    new TmdbProductionCountryDto { Iso31661 = "US", Name = "United States of America" }
                },
                SpokenLanguages = new[]
                {
                    new TmdbSpokenLanguageDto { EnglishName = "English", Iso6391 = "en", Name = "English" }
                }
            };
        }

        public static TmdbMovieSearchResultDto CreateTmdbMovieSearchResultDto(params TmdbMovieDto[] movies)
        {
            return new TmdbMovieSearchResultDto
            {
                Page = 1,
                Results = movies,
                TotalPages = 1,
                TotalResults = movies.Length
            };
        }

        public static TmdbTvSearchResultDto CreateTmdbTvSearchResultDto(params TmdbTvShowDto[] tvShows)
        {
            return new TmdbTvSearchResultDto
            {
                Page = 1,
                Results = tvShows,
                TotalPages = 1,
                TotalResults = tvShows.Length
            };
        }

        public static Movie CreateMovie(string? title = null, int? releaseYear = null, string? tmdbId = null)
        {
            var movie = _fixture.Create<Movie>();
            if (title != null) movie.Title = title;
            if (releaseYear.HasValue) movie.ReleaseYear = releaseYear.Value;
            if (tmdbId != null) movie.TmdbId = tmdbId;
            return movie;
        }

        public static TvShow CreateTvShow(string? title = null, int? firstAirYear = null, string? tmdbId = null)
        {
            var tvShow = _fixture.Create<TvShow>();
            if (title != null) tvShow.Title = title;
            if (firstAirYear.HasValue) tvShow.FirstAirYear = firstAirYear.Value;
            if (tmdbId != null) tvShow.TmdbId = tmdbId;
            return tvShow;
        }

        public static CreateMovieDto CreateMovieDto(string? title = null, int? releaseYear = null)
        {
            var dto = _fixture.Create<CreateMovieDto>();
            dto.MediaType = MediaType.Movie;
            if (title != null) dto.Title = title;
            if (releaseYear.HasValue) dto.ReleaseYear = releaseYear.Value;
            return dto;
        }

        public static CreateTvShowDto CreateTvShowDto(string? title = null, int? firstAirYear = null)
        {
            var dto = _fixture.Create<CreateTvShowDto>();
            dto.MediaType = MediaType.TVShow;
            if (title != null) dto.Title = title;
            if (firstAirYear.HasValue) dto.FirstAirYear = firstAirYear.Value;
            return dto;
        }
    }
}
