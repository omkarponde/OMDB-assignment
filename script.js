const itemsPerPage = 10;
let currentPage = 1;
const movieListElement = document.getElementById('movieList');
// Load ratings from localStorage on page load
const comments = getCommentsForMovie();
const ratings = getRatingsFromLocalStorage();

// Function to fetch movies from OMDB API
async function fetchMovies(searchQuery) {
    const server_url = SERVER_URL; // Using the API key from env.js
    const url = `${server_url}&s=${searchQuery}&type=movie&page=${currentPage}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

// Function to display movies on the page
function displayMovies(movies) {
    const movieListElement = document.getElementById('movieList');
    movieListElement.innerHTML = '';

    movies.Search.forEach((movie) => {
        const movieCard = createMovieCard(movie);
        movieCard.addEventListener('click', () =>{
          showMovieDetails(movieCard, movie.imdbID);
          movieCard.classList.toggle('selected');
        });
        // Append the movie details below the clicked movie
        movieListElement.appendChild(movieCard);
    });
}

function createMovieCard(movie) {
  const movieCard = document.createElement("li");
  movieCard.classList.add("movie-card");
  movieCard.id = "movie-card"

  const movieImage = document.createElement("img");
  movieImage.src = movie.Poster === "N/A" ? "no-poster.jpg" : movie.Poster;
  movieCard.appendChild(movieImage);

  const movieTitle = document.createElement("h2");
  movieTitle.classList.add("movie-title");
  movieTitle.textContent = movie.Title;
  movieCard.appendChild(movieTitle);

  const movieYear = document.createElement("p");
  movieYear.classList.add("movie-year");
  movieYear.textContent = movie.Year;
  movieCard.appendChild(movieYear);

  return movieCard;
}


// Function to handle the search event
function searchMovies(page) {
    const searchInput = document.getElementById('searchInput');
    const searchQuery = searchInput.value.trim();
    // if (searchInput.value.trim() === '') {
    //   alert('Please enter a movie title.');
    //   return;
    // }

    currentSearch = searchInput;
    currentPage = page || 1;
    console.log(currentPage)
    fetchMovies(searchQuery)
        .then((data) => {
            if (data.Response === 'True') {
                displayMovies(data);
                totalPages = Math.ceil(data.totalResults / 10);
                console.log(currentPage)
                updatePaginationButtons();
                updatePageNumbers(data.totalResults);
                displayPagination(data.totalResults);
            } else {
              document.getElementById('movieList').innerHTML = '<p>No results found.</p>';
            }
        })
        .catch((error) => {
            console.error('Error fetching movies:', error);
        });
}

// Function to update page numbers
function updatePageNumbers(totalResults) {
  const pageNumbersSpan = document.getElementById('pageNumbers');
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  pageNumbersSpan.innerHTML = `Page ${currentPage} of ${totalPages}`;
}


function updatePaginationButtons() {
  console.log(currentPage)
  document.getElementById('prevButton').disabled = currentPage <= 1;
  document.getElementById('nextButton').disabled = currentPage >= totalPages;
  console.log(currentPage, totalPages, document.getElementById('nextButton').disabled)
}

document.getElementById('prevButton').addEventListener('click', () => {
  if (currentPage > 1) {
    searchMovies(currentPage - 1);
  }
});

document.getElementById('nextButton').addEventListener('click', () => {
  console.log(currentPage, totalPages)
  if (currentPage < totalPages) {
    searchMovies(currentPage + 1);
  }
});

// Calculate and display pagination buttons and page numbers
function displayPagination(totalResults) {
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(totalResults / itemsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const pageLink = document.createElement('button');
    pageLink.textContent = i;
    pageLink.addEventListener('click', () => {
      currentPage = i;
      searchMovies(currentPage);
    });
    paginationContainer.appendChild(pageLink);
  }
}

// Search button event listener
document.getElementById('searchButton').addEventListener('click', () => {
  searchMovies();
});


// Event listener for Enter key in search input
document.getElementById('searchInput').addEventListener('keydown', (event) => {
  searchMovies();
  // If you wan to search only after enter is pressed
  // if (event.key === 'Enter') {
  //     const searchTerm = document.getElementById('searchInput').value;
  //     if (searchTerm.trim() !== '') {
  //       searchMovies();
  //     }
  // }
});

// Display movie details
async function showMovieDetails(movieCard, movieId) {
    const url = `${SERVER_URL}&i=${movieId}`;
    const response = await fetch(url);
    const movie = await response.json();

    const detailsHTML = `
      <h2>${movie.Title}</h2>
      <p>Year: ${movie.Year}</p>
      <p>Plot: ${movie.Plot}</p>
      <p>Genre: ${movie.Genre}</p>
      <p>Director: ${movie.Director}</p>
      <p>Actors: ${movie.Actors}</p>
      <p>IMDb Rating: ${movie.imdbRating}</p>
    `;

  
    
  // Create a div element for the movie details
  const movieListElement = document.getElementById('movieList');
  const movieDetailsDiv = document.createElement('div');
    movieDetailsDiv.classList.add('movie-details');
    movieDetailsDiv.innerHTML = detailsHTML;
    movieDetailsDiv.dataset.currentMovieId = movieId; // Store the current movie ID in the div's dataset

    // Remove any existing movie details before adding the new one
    const existingDetails = document.querySelector('.movie-details');
    if (existingDetails) {
      existingDetails.remove();
    }

    const movieRatingInput = addRatingInput(ratings[movieId]);
    movieDetailsDiv.appendChild(movieRatingInput);

    const commentsContainer = addCommentContainer(movieId);
    movieDetailsDiv.appendChild(commentsContainer);

    // Get the stored rating for the movie and update the UI
    const movieRating = ratings[movieId] || 0;
    updateMovieRatingUI(movieRating);

    // Event listener for movie rating selection using event delegation
    movieDetailsDiv.addEventListener('click', event => {
      if (event.target.classList.contains('rating-stars')) {
        const movieId = movieDetailsDiv.dataset.currentMovieId;
        const rating = parseInt(event.target.dataset.rating);
        ratings[movieId] = rating;
        saveRatingsToLocalStorage(ratings);
        updateMovieRatingUI(rating);
      }
    });

    // Event listener for movie comment addition
    commentsContainer.addEventListener('click', () => {
      const movieId = movieDetailsDiv.dataset.currentMovieId;
      const movieCard = document.getElementById('movie-card');
      const commentInput = document.getElementById('commentInput');
      const comment = commentInput.value.trim();
      
      if (comment) {
        const comments = getCommentsForMovie(movieId);
        comments.push(comment);
        saveCommentsForMovie(movieId, comments);
        show_comments(movieId)
      }
    });
    movieListElement.insertBefore(movieDetailsDiv, movieCard.nextSibling);
    
}

function updateMovieRatingUI(rating) {
  console.log("updateMovieRatingUI")
  console.log(rating)
    const stars = document.querySelectorAll('.rating-stars');
    stars.forEach(star => {
      const ratingValue = parseInt(star.dataset.rating);
      if (ratingValue <= rating) {
        console.log('filled')
        star.textContent = '\u2605'; // Filled star
      } else {
        star.textContent = '\u2606'; // Empty star
        console.log('empty')
      }
    });
}

// Function to dynamically add the movieRatingInput to the movie details section
function addRatingInput(rating) {
  console.log("addRatingInput")
  console.log(rating)
    const movieRatingContainer = document.createElement('div');
    const movieRatingTitle = document.createElement('p');
    movieRatingTitle.innerHTML = "Rating: "
    movieRatingContainer.appendChild(movieRatingTitle);
    movieRatingContainer.classList.add('rating-container');
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.classList.add('rating-stars');
      star.dataset.rating = i;
      // star.textContent = stars[i];
      if (i <= rating) {
        console.log('filled')
        star.textContent = '\u2605'; // Filled star
      } else {
        star.textContent = '\u2606'; // Empty star
        console.log('empty')
      }
      movieRatingContainer.appendChild(star);
    }
    return movieRatingContainer
}

function show_comments(movieId) {
  // Show comments for the movie
  const commentsContainer = document.getElementById('commentsContainer');
  commentsContainer.innerHTML = '';
  const commentsContainerTitle = document.createElement('p');
  commentsContainerTitle.innerHTML = "Comments: ";
  commentsContainer.appendChild(commentsContainerTitle);
  const comments = getCommentsForMovie(movieId);
  if (comments.length > 0) {
    const commentsList = document.createElement('ul');
    comments.forEach(comment => {
      const commentItem = document.createElement('li');
      commentItem.textContent = comment;
      commentsList.appendChild(commentItem);
    });
    commentsContainer.appendChild(commentsList);
  } else {
    const noCommentsElement = document.createElement('p');
    noCommentsElement.textContent = 'No comments yet.';
    commentsContainer.appendChild(noCommentsElement);
    
  }
  const commentInput = document.createElement('textarea');
  commentInput.id = 'commentInput';
  commentInput.rows = 4;
  commentInput.cols = 50;
  const addCommentBtn = document.createElement('button');
  addCommentBtn.textContent = 'Add Comment';
  addCommentBtn.id = 'addCommentBtn';
  commentsContainer.appendChild(commentInput);
  commentsContainer.appendChild(addCommentBtn);
}    
// Function to dynamically add the comment container to the movie details section
function addCommentContainer(movieId) {
    const commentsContainer = document.createElement('div');
    commentsContainer.id = 'commentsContainer';
    const commentsContainerTitle = document.createElement('p');
    commentsContainerTitle.innerHTML = "Comments: ";
    commentsContainer.appendChild(commentsContainerTitle);
    const comments = getCommentsForMovie(movieId);
    if (comments.length > 0) {
      const commentsList = document.createElement('ul');
      comments.forEach(comment => {
        const commentItem = document.createElement('li');
        commentItem.textContent = comment;
        commentsList.appendChild(commentItem);
      });
      commentsContainer.appendChild(commentsList);
    } else {
      const noCommentsElement = document.createElement('p');
      noCommentsElement.textContent = 'No comments yet.';
      commentsContainer.appendChild(noCommentsElement);
    }
    const commentInput = document.createElement('textarea');
    commentInput.id = 'commentInput';
    commentInput.rows = 4;
    commentInput.cols = 50;
    const addCommentBtn = document.createElement('button');
    addCommentBtn.textContent = 'Add Comment';
    addCommentBtn.id = 'addCommentBtn';
    commentsContainer.appendChild(commentInput);
    commentsContainer.appendChild(addCommentBtn);
    return commentsContainer
}

// ############# SAVE ratings and comments

// Function to get or initialize ratings from localStorage
function getRatingsFromLocalStorage() {
  const ratingsString = localStorage.getItem('movieRatings');
  return ratingsString ? JSON.parse(ratingsString) : {};
}

// Function to save ratings to localStorage
function saveRatingsToLocalStorage(ratings) {
  const ratingsString = JSON.stringify(ratings);
  localStorage.setItem('movieRatings', ratingsString);
}

// Function to get comments for a movie from local storage
function getCommentsForMovie(movieId) {
  const commentsString = localStorage.getItem('movieComments');
  if (commentsString) {
    const comments = JSON.parse(commentsString);
    return comments[movieId] || [];
  }
  return [];
}

// Function to save comments for a movie to local storage
function saveCommentsForMovie(movieId, movie_comments) {
  const commentsString = localStorage.getItem('movieComments');
  const comments = JSON.parse(commentsString) || {};
  comments[movieId] = movie_comments
  localStorage.setItem('movieComments',  JSON.stringify(comments));
}

