// Your API keys
const newsApiKey = 'fba255075b0a4a478400909aa15b3af3'; // NewsAPI key
const footballDataApiKey = 'a406bb7d504646ae9741d15e086ba397'; // Football-Data.org key

// Function to fetch football news from NewsAPI
async function fetchFootballNews() {
    try {
        const response = await fetch(`https://newsapi.org/v2/everything?q=football&apiKey=${newsApiKey}`);
        const data = await response.json();
        displayNews(data.articles);
    } catch (error) {
        console.error('Error fetching football news:', error);
    }
}

// Function to display news with images from NewsAPI
function displayNews(articles) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = ''; // Clear the container

    articles.forEach((article, index) => {
        // Create news item container
        const newsItem = document.createElement('div');
        newsItem.classList.add('news-item');
        
        // Bigger style for the first article (main-news)
        if (index === 0) {
            newsItem.classList.add('main-news');
        }

        // Create image element, fallback to default if no image is provided
        const image = document.createElement('img');
        image.src = article.urlToImage || 'default_image.jpg';
        image.alt = article.title; // Set alt attribute for accessibility
        image.classList.add('news-image');

        // Create title element
        const title = document.createElement('div');
        title.classList.add('news-title');
        title.textContent = article.title;

        // Create description element
        const description = document.createElement('p');
        description.classList.add('news-description');
        description.textContent = article.description;

        // Create a link to the full article
        const newsLink = document.createElement('a');
        newsLink.href = article.url;
        newsLink.textContent = 'Read more';
        newsLink.classList.add('news-link');

        // Append image, title, description, and link to the news item
        newsItem.appendChild(image);
        newsItem.appendChild(title);
        newsItem.appendChild(description);
        newsItem.appendChild(newsLink);

        // Add the news item to the container
        newsContainer.appendChild(newsItem);
    });
}

// Fetch football news on page load
fetchFootballNews();

// Fetch team-specific data (leagues and standings) using Football-Data API
async function fetchTeamData() {
    const teamSelect = document.getElementById('team-select');
    const selectedTeam = teamSelect.value;

    const teamLeagues = document.getElementById('team-leagues');
    teamLeagues.innerHTML = ''; // Clear previous data

    try {
        // Fetch the team's competitions (leagues they are in)
        const response = await fetch(`https://api.football-data.org/v2/teams/${selectedTeam}/competitions`, {
            headers: { 'X-Auth-Token': footballDataApiKey }
        });
        const data = await response.json();
        displayTeamLeagues(data.competitions);
    } catch (error) {
        console.error('Error fetching team data:', error);
    }
}

// Function to display the team's standings in different leagues
function displayTeamLeagues(competitions) {
    const teamLeagues = document.getElementById('team-leagues');

    competitions.forEach(competition => {
        // Create a container for each league/competition
        const leagueTable = document.createElement('div');
        leagueTable.classList.add('league-table');

        // Create league title
        const leagueTitle = document.createElement('h3');
        leagueTitle.textContent = competition.name;

        // Placeholder for standings (modify based on actual API response)
        const standings = document.createElement('p');
        standings.textContent = `Current Position: TBD`; // Replace TBD with actual position if available

        // Append the league title and standings to the league table
        leagueTable.appendChild(leagueTitle);
        leagueTable.appendChild(standings);

        // Add the league table to the leagues container
        teamLeagues.appendChild(leagueTable);
    });
}

// Call fetchTeamData when a team is selected
document.getElementById('team-select').addEventListener('change', fetchTeamData);
