# Generate GitHub Stats GIFs

This project generates GIFs for each of the GitHub stats cards.

# Examples

![Readme](./out/readme.gif)
![Main Stats](./out/main-stats.gif)
![Languages](./out/languages.gif)
![Top Languages](./out/top-languages.gif)
![Issue Tracking](./out/issue-tracking.gif)
![Code Metrics](./out/code-metrics.gif)
![Activity Overview](./out/activity-overview.gif)
![Commit Streak](./out/commit-streak.gif)

## AI-Powered Insights

This project now features AI-generated summaries of your GitHub statistics, providing a narrative overview of your activity and achievements.

This functionality is powered by [OpenRouter](https://openrouter.ai/). To enable this feature, you will need to provide your own OpenRouter API key.

### Setup Instructions:

1.  If you don't already have one, create a file named `.env` in the root directory of this project.
2.  Open the `.env` file and add the following line, replacing `your_actual_api_key` with your personal OpenRouter API key:
    ```
    OPENROUTER_API_KEY=your_actual_api_key
    ```
3.  You can refer to the `.env.example` file for the correct format.
4.  Ensure that your `.env` file is listed in your `.gitignore` file to prevent your API key from being committed to a repository.

---

### Reddit Statistics

This project can also fetch and display statistics for Reddit users in a dedicated Remotion composition.

**How to Enable:**

To display Reddit statistics, add a `redditUsernames` array to your `input.json` file. This array should contain the Reddit usernames for which you want to fetch statistics.

Example `input.json`:
```json
{
  "usernames": ["your_github_username"],
  "redditUsernames": ["your_reddit_username", "another_reddit_user", "FAIL_USER", "INVALID_DATA_USER"]
}
```
Adding "FAIL_USER" or "INVALID_DATA_USER" will help test the error handling features.

**API Credentials for Live Data:**

To fetch live data from the Reddit API, you must provide API credentials as **environment variables**. The application is configured to read these variables to make live API calls.

The required environment variables are:
*   `REDDIT_USER_AGENT`: A descriptive user agent string for your script (e.g., `MyRedditStatsBot/1.0 by /u/YourRedditUsername`).
*   `REDDIT_CLIENT_ID`: The client ID obtained from your Reddit app settings.
*   `REDDIT_CLIENT_SECRET`: The client secret obtained from your Reddit app settings.
*   `REDDIT_REFRESH_TOKEN`: A refresh token for OAuth access.

**Local Development:**
For local development, create a file named `.env` in the project root directory. Add your credentials to this file in the following format:
```
REDDIT_USER_AGENT="MyRedditStatsBot/1.0 by /u/MyUsername"
REDDIT_CLIENT_ID="your_client_id"
REDDIT_CLIENT_SECRET="your_client_secret"
REDDIT_REFRESH_TOKEN="your_refresh_token"
```
**Important:**
*   Ensure that the `.env` file is listed in your `.gitignore` file to prevent committing your secrets. If `.gitignore` doesn't exist or list `.env`, add `.env` to it.
*   This project does not bundle a library like `dotenv` by default. You will need to ensure these variables are loaded into your shell environment before running the application. You can do this by:
    *   Manually sourcing them (e.g., `export $(grep -v '^#' .env | xargs)` in your terminal before running `yarn start` or `yarn render`).
    *   Using a tool like `direnv` that automatically loads `.env` files when you `cd` into the directory.
    *   Alternatively, you can install `dotenv` (`yarn add dotenv`) and modify `src/Root.tsx` to load it at the beginning of the `RedditStatsComposition` component if you prefer.

**GitHub Actions:**
For automated workflows running on GitHub Actions, these credentials must be configured as GitHub Secrets in your repository:
1.  Go to your repository on GitHub.
2.  Navigate to `Settings` > `Secrets and variables` > `Actions`.
3.  Click `New repository secret` for each of the four variables listed above, using the environment variable names (e.g., `REDDIT_USER_AGENT`) as the secret names.
The provided GitHub Actions workflow (`.github/workflows/render-video.yml`) is already configured to pass these secrets as environment variables to the rendering process.

**Important Security Note:**
*   **Never commit your API credentials or your `.env` file (if it contains real secrets) directly to your repository.**
*   Always use environment variables or secrets management tools as described above.

*Note on Data Fetching:*
*   If the required environment variables are set, the application will attempt to fetch **live data** from the Reddit API.
*   If any credentials are missing, an error message will be displayed in the `RedditStats` composition.
*   The `fetchRedditStats` function in `src/functions/redditApi.ts` is still configured to return specific **mock data or simulated errors** for the test usernames "FAIL_USER" (simulates a user not found error) and "INVALID_DATA_USER" (simulates a data validation error). This allows for testing the error handling features even without live credentials. For all other usernames, it will attempt a live fetch if credentials are provided.

**New Remotion Composition:**

The Reddit statistics are displayed in a new, separate Remotion composition with the ID:
*   `RedditStats`

You can render this composition specifically using the Remotion CLI.

**Displayed Statistics:**

The Reddit user card currently displays the following information:
*   User's Avatar (icon image)
*   Username
*   Total Karma
*   Post Karma
*   Comment Karma
*   Cake Day (account creation date)
Error states are also displayed per user if data fetching fails or if credentials are missing.
