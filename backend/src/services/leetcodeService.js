const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

// In-memory cache for question metadata (difficulty, tags)
const questionCache = new Map();

/**
 * Clean and extract a LeetCode username from a URL or raw string
 * Examples supported:
 * - https://leetcode.com/u/neal_wu/
 * - https://leetcode.com/neal_wu/
 * - leetcode.com/u/neal_wu
 * - @neal_wu
 * - neal_wu
 */
function extractUsername(input) {
  if (!input || typeof input !== 'string') return '';
  let cleaned = input.trim();
  
  // Match LeetCode URL patterns
  const urlMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?leetcode\.(?:com|cn)\/(?:u\/)?([a-zA-Z0-9_\-]+)\/?/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  
  // Clean off leading @ or slashes
  return cleaned.replace(/^[@/]+/, '').replace(/\/+$/, '');
}

/**
 * Generic GraphQL requester to LeetCode with standard headers
 */
async function queryLeetCodeGraphQL(query, variables = {}) {
  const response = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'referer': 'https://leetcode.com',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept': '*/*'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`LeetCode API returned HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.errors && result.errors.length > 0) {
    const errorMsg = result.errors.map(e => e.message).join(', ');
    throw new Error(`LeetCode GraphQL error: ${errorMsg}`);
  }

  return result.data;
}

/**
 * Fetch user profile information, avatar, ranking, and solved breakdown
 */
async function getUserProfile(rawInput) {
  const username = extractUsername(rawInput);
  if (!username) {
    throw new Error('Please provide a valid LeetCode username or profile URL.');
  }

  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        githubUrl
        profile {
          realName
          userAvatar
          ranking
          reputation
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      recentAcSubmissionList(username: $username, limit: 10) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;

  const data = await queryLeetCodeGraphQL(query, { username });

  if (!data || !data.matchedUser) {
    throw new Error(`LeetCode user "${username}" was not found or has a private profile.`);
  }

  const matched = data.matchedUser;
  const statsList = matched.submitStatsGlobal?.acSubmissionNum || [];

  const getStat = (diff) => {
    const item = statsList.find(s => s.difficulty.toLowerCase() === diff.toLowerCase());
    return item ? item.count : 0;
  };

  const totalSolved = getStat('All');
  const easySolved = getStat('Easy');
  const mediumSolved = getStat('Medium');
  const hardSolved = getStat('Hard');

  const recentSubmissions = (data.recentAcSubmissionList || []).map(sub => ({
    id: sub.id,
    title: sub.title,
    titleSlug: sub.titleSlug,
    timestamp: parseInt(sub.timestamp, 10),
    problemUrl: `https://leetcode.com/problems/${sub.titleSlug}/`
  }));

  return {
    username: matched.username,
    realName: matched.profile?.realName || matched.username,
    avatar: matched.profile?.userAvatar || 'https://assets.leetcode.com/users/default_avatar.jpg',
    ranking: matched.profile?.ranking || null,
    stats: {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved
    },
    recentSubmissions,
    lastCheckedAt: Date.now()
  };
}

/**
 * Fetch question difficulty & topic tags by title slug (with in-memory cache)
 */
async function getQuestionDetails(titleSlug) {
  if (!titleSlug) return { difficulty: 'Unknown', tags: [] };
  
  if (questionCache.has(titleSlug)) {
    return questionCache.get(titleSlug);
  }

  const query = `
    query questionDetails($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        difficulty
        topicTags {
          name
        }
      }
    }
  `;

  try {
    const data = await queryLeetCodeGraphQL(query, { titleSlug });
    const question = data?.question;
    const details = {
      difficulty: question?.difficulty || 'Unknown',
      tags: (question?.topicTags || []).map(t => t.name)
    };
    
    // Cache for 24 hours
    questionCache.set(titleSlug, details);
    return details;
  } catch (err) {
    console.warn(`Could not fetch details for question ${titleSlug}:`, err.message);
    return { difficulty: 'Unknown', tags: [] };
  }
}

/**
 * Enrich submissions with difficulty & tags
 */
async function enrichSubmissions(submissions) {
  if (!Array.isArray(submissions)) return [];
  
  const enriched = await Promise.all(
    submissions.map(async (sub) => {
      const details = await getQuestionDetails(sub.titleSlug);
      return {
        ...sub,
        difficulty: details.difficulty,
        tags: details.tags
      };
    })
  );

  return enriched;
}

/**
 * Compare recent submissions with previous known state to find new solves
 */
function findNewSubmissions(latestSubmissions, knownSubmissionIds = new Set(), lastKnownTimestamp = 0) {
  const newItems = [];
  
  for (const sub of latestSubmissions) {
    const isIdNew = !knownSubmissionIds.has(String(sub.id));
    const isTimeNew = lastKnownTimestamp ? sub.timestamp > lastKnownTimestamp : false;
    
    if (isIdNew || isTimeNew) {
      newItems.push(sub);
    }
  }

  // Sort chronologically ascending (oldest of the new to latest)
  newItems.sort((a, b) => a.timestamp - b.timestamp);
  return newItems;
}

module.exports = {
  extractUsername,
  getUserProfile,
  getQuestionDetails,
  enrichSubmissions,
  findNewSubmissions
};
