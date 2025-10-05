import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import tmdbApi from '../services/tmdbApi';
import { MovieDetails, Movie } from '../types/tmdb';

type ListState = { list?: Movie[] } | null;

const DetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovieDetails = useCallback(async (movieId: number) => {
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
  }, []);

  const fetchAllMovies = useCallback(async () => {
    try {
      const response = await tmdbApi.getPopularMovies(1);
      setAllMovies(response.results);
    } catch (err) {
      console.error('Error fetching movies for navigation:', err);
    }
  }, []);

  useEffect(() => {
    if (!id) return;

    fetchMovieDetails(parseInt(id, 10));

    const priorList = (location.state as ListState)?.list;
    if (priorList?.length) {
      setAllMovies(priorList);
    } else {
      // Only fetch if we don't have any movies yet
      fetchAllMovies();
    }
  }, [id, location.state, fetchMovieDetails, fetchAllMovies]);

  // Scroll to top when movie changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [id]);

  const getCurrentIndex = (): number => {
    if (!movie || allMovies.length === 0) return -1;
    return allMovies.findIndex(m => m.id === movie.id);
  };

  const goToPrevious = () => {
    if (!movie || allMovies.length === 0) return;
    const currentIndex = getCurrentIndex();
    const prevIndex = currentIndex <= 0 ? allMovies.length - 1 : currentIndex - 1; // 首尾相接
    const previousMovie = allMovies[prevIndex];
    navigate(`/movie/${previousMovie.id}`, { state: { list: allMovies } });
  };

  const goToNext = () => {
    if (!movie || allMovies.length === 0) return;
    const currentIndex = getCurrentIndex();
    const nextIndex = currentIndex < 0 || currentIndex >= allMovies.length - 1 ? 0 : currentIndex + 1; // 首尾相接
    const nextMovie = allMovies[nextIndex];
    navigate(`/movie/${nextMovie.id}`, { state: { list: allMovies } });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRuntime = (minutes?: number): string => {
    if (typeof minutes === 'number' && minutes > 0) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
    return '—';
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
            alt={`${movie.title} poster`}
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
              <strong>Release Date:</strong>{' '}
              {movie.release_date ? new Date(movie.release_date).toLocaleDateString() : '—'}
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

          {movie.production_companies?.length > 0 && (
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

          {movie.spoken_languages?.length > 0 && (
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
          aria-label="Go to previous movie"
        >
          ← Previous Movie
        </button>
        
        <span className="navigation-info">
          {allMovies.length > 0 && currentIndex >= 0
            ? `Movie ${currentIndex + 1} of ${allMovies.length}`
            : '—'}
        </span>
        
        <button
          className="btn btn-primary"
          onClick={goToNext}
          aria-label="Go to next movie"
        >
          Next Movie →
        </button>
      </div>
    </div>
  );
};

export default DetailView;

