import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import tmdbApi from '../services/tmdbApi';
import { MovieDetails, Movie } from '../types/tmdb';

const DetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetchMovieDetails(parseInt(id, 10));

    const priorList = (location.state as any)?.list as Movie[] | undefined;
    if (priorList && Array.isArray(priorList) && priorList.length > 0) {
      setAllMovies(priorList);
    } else if (allMovies.length === 0) {
      fetchAllMovies();
    }
  }, [id, location.state, allMovies.length]);

  const fetchMovieDetails = async (movieId: number) => {
    try {
      setLoading(true);
      setError(null);
      const movieDetails = await tmdbApi.getMovieDetails(movieId);
      setMovie(movieDetails);
    } catch (err) {
      setError('Failed to fetch movie details. Please try again later.');
      console.error('Error fetching movie details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMovies = async () => {
    try {
      const response = await tmdbApi.getPopularMovies(1);
      setAllMovies(response.results);
    } catch (err) {
      console.error('Error fetching movies for navigation:', err);
    }
  };

  const getCurrentIndex = (): number => {
    if (!movie || allMovies.length === 0) return -1;
    return allMovies.findIndex(m => m.id === movie.id);
  };

  const goToPrevious = () => {
    const currentIndex = getCurrentIndex();
    if (currentIndex > 0) {
      const previousMovie = allMovies[currentIndex - 1];
      navigate(`/movie/${previousMovie.id}`, { state: { list: allMovies } });
    }
  };

  const goToNext = () => {
    const currentIndex = getCurrentIndex();
    if (currentIndex < allMovies.length - 1 && currentIndex >= 0) {
      const nextMovie = allMovies[currentIndex + 1];
      navigate(`/movie/${nextMovie.id}`, { state: { list: allMovies } });
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return <div className="loading">Loading movie details...</div>;
  }

  if (error || !movie) {
    return (
      <div>
        {error && <div className="error">{error}</div>}
        <Link to="/" className="btn btn-primary">Back to Movies</Link>
      </div>
    );
  }

  const currentIndex = getCurrentIndex();
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < allMovies.length - 1 && currentIndex >= 0;

  return (
    <div className="detail-view">
      <div className="detail-navigation">
        <Link to="/" className="btn btn-secondary">← Back to List</Link>
        <Link to="/gallery" className="btn btn-secondary">← Back to Gallery</Link>
      </div>

      <div className="detail-content">
      <div className="detail-poster">
          <img
            src={tmdbApi.getImageUrl(movie.poster_path, 'w500')}
            alt={movie.title}
            className="movie-poster"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `${process.env.PUBLIC_URL}/placeholder-movie.png`;
            }}
          />
        </div>

        <div className="detail-info">
          <h1 className="movie-title">{movie.title}</h1>
          
          {movie.tagline && (
            <p className="movie-tagline">"{movie.tagline}"</p>
          )}

          <div className="movie-meta">
            <div className="meta-item">
              <strong>Release Date:</strong> {new Date(movie.release_date).toLocaleDateString()}
            </div>
            <div className="meta-item">
              <strong>Rating:</strong> ⭐ {movie.vote_average.toFixed(1)}/10 ({movie.vote_count} votes)
            </div>
            <div className="meta-item">
              <strong>Runtime:</strong> {formatRuntime(movie.runtime)}
            </div>
            <div className="meta-item">
              <strong>Status:</strong> {movie.status}
            </div>
            {movie.budget > 0 && (
              <div className="meta-item">
                <strong>Budget:</strong> {formatCurrency(movie.budget)}
              </div>
            )}
            {movie.revenue > 0 && (
              <div className="meta-item">
                <strong>Revenue:</strong> {formatCurrency(movie.revenue)}
              </div>
            )}
          </div>

          <div className="genres">
            <strong>Genres:</strong>
            <div className="genre-tags">
              {movie.genres.map(genre => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>
          </div>

          <div className="overview">
            <h3>Overview</h3>
            <p>{movie.overview}</p>
          </div>

          {movie.production_companies.length > 0 && (
            <div className="production-companies">
              <h3>Production Companies</h3>
              <div className="company-list">
                {movie.production_companies.map(company => (
                  <span key={company.id} className="company-tag">
                    {company.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {movie.spoken_languages.length > 0 && (
            <div className="languages">
              <h3>Languages</h3>
              <div className="language-list">
                {movie.spoken_languages.map((language, index) => (
                  <span key={index} className="language-tag">
                    {language.english_name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="detail-navigation-buttons">
        <button
          className="btn btn-primary"
          onClick={goToPrevious}
          disabled={!canGoPrevious}
        >
          ← Previous Movie
        </button>
        
        <span className="navigation-info">
          Movie {currentIndex + 1} of {allMovies.length}
        </span>
        
        <button
          className="btn btn-primary"
          onClick={goToNext}
          disabled={!canGoNext}
        >
          Next Movie →
        </button>
      </div>
    </div>
  );
};

export default DetailView;

