// Public repositories of the club's GitHub org, cached for an hour (unauthenticated API: 60 req/h).
const axios = require('axios');

const ORG = process.env.GITHUB_ORG || 'GDGOCBIT';
const TTL = 60 * 60 * 1000;
let cache = { at: 0, data: [] };

const prettify = (name) => name.replace(/[-_]+/g, ' ').replace(/\bGdg\b/gi, 'GDG').replace(/\bBit\b/g, 'BIT');

exports.getOrgProjects = async () => {
    if (Date.now() - cache.at < TTL) return cache.data;
    try {
        const { data } = await axios.get(`https://api.github.com/orgs/${ORG}/repos?per_page=100&sort=pushed`, {
            timeout: 10000,
            headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'gdg-bit-website' },
        });
        cache = {
            at: Date.now(),
            data: data
                .filter((r) => !r.fork && !r.archived && !r.private)
                .map((r) => ({
                    _id: `gh-${r.id}`,
                    source: 'github',
                    title: prettify(r.name),
                    description: r.description || '',
                    tags: [r.language, ...(r.topics || [])].filter(Boolean).slice(0, 4),
                    repoLink: r.html_url,
                    demoLink: r.homepage || '',
                    stars: r.stargazers_count,
                })),
        };
    } catch (e) {
        console.log(`[github] sync failed: ${e.message}`);
        cache.at = Date.now() - TTL + 5 * 60 * 1000; // retry in 5 minutes
    }
    return cache.data;
};
