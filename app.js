// Your API keys
const newsApiKey = 'fba255075b0a4a478400909aa15b3af3'; // NewsAPI key
const footballDataApiKey = 'a406bb7d504646ae9741d15e086ba397'; // Football-Data.org key

let currentPage = 1;
const initialPageSize = 16; // Number of articles to fetch on the first load
const subsequentPageSize = 12; // Number of articles to fetch on subsequent loads

// Function to fetch football news from NewsAPI
async function fetchFootballNews(page = 1) {
    const pageSize = page === 1 ? initialPageSize : subsequentPageSize;
    try {
        const response = await fetch(`https://newsapi.org/v2/everything?q=football OR "football transfer" NOT "American football" NOT "NFL" NOT "college football" NOT "Taylor Swift" NOT "accident" NOT "sued"&language=en&pageSize=${pageSize}&page=${page}&apiKey=${newsApiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('API Response:', data); // Debugging: Check the API response
        displayNews(data.articles, page);
    } catch (error) {
        console.error('Error fetching football news:', error);
    }
}

// Function to display news with images from NewsAPI
function displayNews(articles, page) {
    const newsContainer = document.getElementById('news-container');
    if (page === 1) {
        newsContainer.innerHTML = ''; // Clear the container for the first page
    }

    const unwantedKeywords = ["American football", "NFL", "college football", "Taylor Swift", "accident", "sued"];

    articles.forEach((article, index) => {
        // Filter out articles containing unwanted keywords
        const containsUnwantedKeyword = unwantedKeywords.some(keyword => 
            (article.title && article.title.includes(keyword)) || 
            (article.description && article.description.includes(keyword))
        );
        if (containsUnwantedKeyword) {
            return; // Skip this article
        }

        // Create news item container
        const newsItem = document.createElement('div');
        newsItem.classList.add(index === 0 && page === 1 ? 'main-news' : 'news-item');

        // Create image element, fallback to default if no image is provided
        const image = document.createElement('img');
        image.src = article.urlToImage || 'default_image.jpg';
        newsItem.appendChild(image);

        // Create title element
        const title = document.createElement('h3');
        title.textContent = article.title;
        newsItem.appendChild(title);

        // Append news item to container
        newsContainer.appendChild(newsItem);
    });

    // Show the "Show More" button if there are more articles to load
    if (articles.length === pageSize) {
        document.getElementById('show-more-btn').style.display = 'block';
    } else {
        document.getElementById('show-more-btn').style.display = 'none';
    }
}

// Function to fetch team standings from Football-Data.org
async function fetchTeamStandings(teamId) {
    try {
        const response = await fetch(`https://api.football-data.org/v2/teams/${teamId}/matches?status=FINISHED`, {
            headers: { 'X-Auth-Token': footballDataApiKey }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Team Standings:', data); // Debugging: Check the API response
        displayStandings(data);
    } catch (error) {
        console.error('Error fetching team standings:', error);
    }
}

// Function to display team standings
function displayStandings(data) {
    const standingsContainer = document.getElementById('selected-team');
    standingsContainer.innerHTML = ''; // Clear the container

    // Display standings data
    data.matches.forEach(match => {
        const matchItem = document.createElement('div');
        matchItem.classList.add('match-item');
        matchItem.innerHTML = `
            <p>${match.competition.name}</p>
            <p>${match.homeTeam.name} vs ${match.awayTeam.name}</p>
            <p>${match.score.fullTime.homeTeam} - ${match.score.fullTime.awayTeam}</p>
        `;
        standingsContainer.appendChild(matchItem);
    });
}

// Function to toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

// Function to show popup
function showPopup(content) {
    const popup = document.querySelector('.popup');
    popup.innerHTML = content;
    popup.style.display = 'block';
}

// Function to hide popup
function hidePopup() {
    const popup = document.querySelector('.popup');
    popup.style.display = 'none';
}

// Fetch and display football news on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchFootballNews();

    // Fetch the selected team from localStorage and display it
    const selectedTeamId = localStorage.getItem('selectedTeamId');
    const selectedTeamName = localStorage.getItem('selectedTeamName');
    if (selectedTeamId) {
        document.getElementById('selected-team').innerText = selectedTeamName;
        fetchTeamStandings(selectedTeamId);
    } else {
        document.getElementById('selected-team').innerText = 'No team selected';
    }

    // Event listener for "Show More" button
    document.getElementById('show-more-btn').addEventListener('click', () => {
        currentPage++;
        fetchFootballNews(currentPage);
    });

    // Event listener for dark mode toggle
    document.getElementById('dark-mode-toggle').addEventListener('click', toggleDarkMode);

    // Event listener for popup close
    document.querySelector('.popup').addEventListener('click', hidePopup);
});

document.getElementById('save-team-btn').addEventListener('click', () => {
    const teamSelect = document.getElementById('team-select');
    const selectedTeamId = teamSelect.value;
    const selectedTeamName = teamSelect.options[teamSelect.selectedIndex].text;
    localStorage.setItem('selectedTeamId', selectedTeamId);
    localStorage.setItem('selectedTeamName', selectedTeamName);
    alert('Team saved!');
});