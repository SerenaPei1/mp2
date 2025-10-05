import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import tmdbApi from '../services/tmdbApi';
import { Movie, Genre } from '../types/tmdb';

const GalleryView: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [moviesResponse, genresResponse] = await Promise.all([
        tmdbApi.getPopularMovies(1),
        tmdbApi.getGenres()
      ]);
      
      setMovies(moviesResponse.results);
      setGenres(genresResponse.genres);
    } catch (err) {
      setError('Failed to fetch data. Please try again later.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenreToggle = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const handleYearChange = (year: string) => {
    setYearFilter(year);
  };

  const filteredMovies = useMemo(() => {
    return movies.filter(movie => {
      // Filter by genres
      if (selectedGenres.length > 0) {
        const hasSelectedGenre = movie.genre_ids.some(id => selectedGenres.includes(id));
        if (!hasSelectedGenre) return false;
      }

      // Filter by year
      if (yearFilter) {
        const movieYear = movie.release_date.split('-')[0];
        if (movieYear !== yearFilter) return false;
      }

      return true;
    });
  }, [movies, selectedGenres, yearFilter]);

  // Get unique years from movies
  const availableYears = useMemo(() => {
    const years = movies
      .map(movie => movie.release_date.split('-')[0])
      .filter(year => year && year !== '')
      .sort((a, b) => b.localeCompare(a)); // Sort descending
    
    return Array.from(new Set(years));
  }, [movies]);

  if (loading) {
    return <div className="loading">Loading gallery...</div>;
  }

  return (
    <div>
      <h1>Movie Gallery</h1>
      
      {error && <div className="error">{error}</div>}

      <div className="filters-section">
        <div className="form-group">
          <label className="form-label">Filter by Genres</label>
          <div className="genre-filters">
            {genres.map(genre => (
              <label key={genre.id} className="genre-filter">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(genre.id)}
                  onChange={() => handleGenreToggle(genre.id)}
                />
                <span>{genre.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="year-filter" className="form-label">Filter by Year</label>
          <select
            id="year-filter"
            className="form-select"
            value={yearFilter}
            onChange={(e) => handleYearChange(e.target.value)}
          >
            <option value="">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="filters-info">
          <p>
            Showing {filteredMovies.length} movies
            {selectedGenres.length > 0 && ` (${selectedGenres.length} genre filter${selectedGenres.length > 1 ? 's' : ''} applied)`}
            {yearFilter && ` (Year: ${yearFilter})`}
          </p>
          {(selectedGenres.length > 0 || yearFilter) && (
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setSelectedGenres([]);
                setYearFilter('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-4">
        {filteredMovies.map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}`}
            state={{ list: filteredMovies }}
            className="gallery-card"
          >
            <img
              src={tmdbApi.getImageUrl(movie.poster_path, 'w342')}
              alt={movie.title}
              className="gallery-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `${process.env.PUBLIC_URL}/placeholder-movie.png`;
              }}
            />
            <div className="gallery-overlay">
              <h3 className="gallery-title">{movie.title}</h3>
              <div className="gallery-meta">
                <span>⭐ {movie.vote_average.toFixed(1)}</span>
                <span>📅 {movie.release_date.split('-')[0]}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredMovies.length === 0 && !loading && (
        <div className="loading">
          <p>No movies found matching your filter criteria.</p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setSelectedGenres([]);
              setYearFilter('');
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default GalleryView;

