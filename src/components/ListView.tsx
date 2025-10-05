import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import tmdbApi from '../services/tmdbApi';
import { Movie, SortOption } from '../types/tmdb';

const ListView: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>({
    property: 'title',
    direction: 'asc',
    label: 'Title (A-Z)'
  });

  const sortOptions: SortOption[] = [
    { property: 'title', direction: 'asc', label: 'Title (A-Z)' },
    { property: 'title', direction: 'desc', label: 'Title (Z-A)' },
    { property: 'release_date', direction: 'desc', label: 'Release Date (Newest)' },
    { property: 'release_date', direction: 'asc', label: 'Release Date (Oldest)' },
    { property: 'vote_average', direction: 'desc', label: 'Rating (Highest)' },
    { property: 'vote_average', direction: 'asc', label: 'Rating (Lowest)' },
    { property: 'popularity', direction: 'desc', label: 'Popularity (Highest)' },
    { property: 'popularity', direction: 'asc', label: 'Popularity (Lowest)' },
  ];

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tmdbApi.getPopularMovies();
      setMovies(response.results);
    } catch (err) {
      setError('Failed to fetch movies. Please try again later.');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Debounced API search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        const performSearch = async () => {
          try {
            setLoading(true);
            const response = await tmdbApi.searchMovies(searchQuery);
            setMovies(response.results);
          } catch (err) {
            setError('Failed to search movies. Please try again later.');
            console.error('Error searching movies:', err);
          } finally {
            setLoading(false);
          }
        };
        performSearch();
      } else {
        fetchMovies();
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredAndSortedMovies = useMemo(() => {
    // When searchQuery is active, movies already contain API-filtered results.
    // Avoid redundant client-side filtering for a small perf win.
    const filtered = movies;

    // Sort movies
    return [...filtered].sort((a, b) => {
      if (sortOption.property === 'release_date') {
        const toTime = (d?: string) => (d ? Date.parse(d) : 0);
        const aTime = toTime(a.release_date);
        const bTime = toTime(b.release_date);
        return sortOption.direction === 'asc' ? aTime - bTime : bTime - aTime;
      }

      const aValue = a[sortOption.property];
      const bValue = b[sortOption.property];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOption.direction === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOption.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [movies, sortOption]);

  if (loading) {
    return <div className="loading">Loading movies...</div>;
  }

  return (
    <div>
      <h1>Movie List</h1>
      
      {error && <div className="error">{error}</div>}

      <div className="form-group">
        <label htmlFor="search" className="form-label">Search Movies</label>
        <input
          id="search"
          type="text"
          className="form-input"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="sort" className="form-label">Sort By</label>
        <select
          id="sort"
          className="form-select"
          value={`${sortOption.property}-${sortOption.direction}`}
          onChange={(e) => {
            const [property, direction] = e.target.value.split('-');
            const option = sortOptions.find(opt => 
              opt.property === property && opt.direction === direction
            );
            if (option) setSortOption(option);
          }}
        >
          {sortOptions.map((option, index) => (
            <option key={index} value={`${option.property}-${option.direction}`}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="results-info">
        <p>Showing {filteredAndSortedMovies.length} movies</p>
      </div>

      <div className="grid grid-2">
        {filteredAndSortedMovies.map((movie) => (
          <Link
            key={movie.id}
            to={`/movie/${movie.id}`}
            state={{ list: filteredAndSortedMovies }}
            className="card"
          >
            <img
              src={tmdbApi.getImageUrl(movie.poster_path)}
              alt={movie.title}
              className="card-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `${process.env.PUBLIC_URL}/placeholder-movie.png`;
              }}
            />
            <div className="card-content">
              <h3 className="card-title">{movie.title}</h3>
              <p className="card-text">
                {movie.overview.length > 150 
                  ? `${movie.overview.substring(0, 150)}...` 
                  : movie.overview
                }
              </p>
              <div className="movie-meta">
                <span>⭐ {movie.vote_average.toFixed(1)}</span>
                <span>📅 {movie.release_date}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredAndSortedMovies.length === 0 && !loading && (
        <div className="loading">
          <p>No movies found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ListView;

