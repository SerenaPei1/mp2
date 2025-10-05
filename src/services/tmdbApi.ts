import axios from 'axios';
import { Movie, MovieDetails, TMDBResponse, TMDBConfig, Genre } from '../types/tmdb';

const API_KEY = '6df07c50dd45b3afcc455ae5d3dad64c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

class TMDBApi {
  private api = axios.create({
    baseURL: BASE_URL,
    params: {
      api_key: API_KEY,
    },
  });

  // Get popular movies
  async getPopularMovies(page: number = 1): Promise<TMDBResponse<Movie>> {
    try {
      const response = await this.api.get<TMDBResponse<Movie>>('/movie/popular', {
        params: { page },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw error;
    }
  }

  // Search movies
  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<Movie>> {
    try {
      const response = await this.api.get<TMDBResponse<Movie>>('/search/movie', {
        params: { 
          query,
          page,
          include_adult: false,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }

  // Get movie details
  async getMovieDetails(id: number): Promise<MovieDetails> {
    try {
      const response = await this.api.get<MovieDetails>(`/movie/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  }

  // Get genres
  async getGenres(): Promise<{ genres: Genre[] }> {
    try {
      const response = await this.api.get<{ genres: Genre[] }>('/genre/movie/list');
      return response.data;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  }

  // Get TMDB configuration
  async getConfiguration(): Promise<TMDBConfig> {
    try {
      const response = await this.api.get<TMDBConfig>('/configuration');
      return response.data;
    } catch (error) {
      console.error('Error fetching configuration:', error);
      throw error;
    }
  }

  // Helper method to get full image URL
  getImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) {
      return `${process.env.PUBLIC_URL}/placeholder-movie.png`;
    }
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }

  // Helper method to get backdrop URL
  getBackdropUrl(path: string | null, size: string = 'w1280'): string {
    if (!path) {
      return `${process.env.PUBLIC_URL}/placeholder-backdrop.png`;
    }
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }
}

export const tmdbApi = new TMDBApi();
export default tmdbApi;

