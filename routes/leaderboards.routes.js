/**
 * Leaderboard Routes
 * Handles global and filtered leaderboards for typing performance
 */
export default async function leaderboardRoutes(fastify, _options) {
	// Get global leaderboard
	fastify.get('/global', async (request, reply) => {
		// TODO: Implement global leaderboard
		// - Rank by highest WPM or average WPM
		// - Filter by time period (all-time, month, week, day)
		// - Paginated results
		const { period = 'all', metric = 'highest_wpm', page = 1, limit = 50 } = request.query;

		return reply.success({
			leaderboard: [
				{
					rank: 1,
					userId: 'user_123',
					username: 'speedking',
					avatar: 'https://example.com/avatar1.jpg',
					wpm: 158,
					accuracy: 99.2,
					totalRaces: 1247,
				},
				{
					rank: 2,
					userId: 'user_456',
					username: 'typingmaster',
					avatar: 'https://example.com/avatar2.jpg',
					wpm: 156,
					accuracy: 98.8,
					totalRaces: 892,
				},
				{
					rank: 3,
					userId: 'user_789',
					username: 'fastfingers',
					avatar: 'https://example.com/avatar3.jpg',
					wpm: 154,
					accuracy: 99.0,
					totalRaces: 654,
				},
			],
			currentUser: {
				rank: 142,
				wpm: 89,
			},
			pagination: {
				page: Number.parseInt(page, 10),
				limit: Number.parseInt(limit, 10),
				total: 10247,
				pages: 205,
			},
			period,
			metric,
		});
	});

	// Get daily leaderboard
	fastify.get('/daily', async (request, reply) => {
		// TODO: Implement daily leaderboard
		// - Show top performers for today
		// - Include daily challenge rankings
		const { date } = request.query;

		return reply.success({
			leaderboard: [
				{
					rank: 1,
					username: 'dailychamp',
					wpm: 145,
					accuracy: 98.5,
					racesCompleted: 15,
				},
			],
			date: date || new Date().toISOString().split('T')[0],
			totalParticipants: 3421,
		});
	});

	// Get weekly leaderboard
	fastify.get('/weekly', async (_request, reply) => {
		// TODO: Implement weekly leaderboard
		// - Show top performers for this week
		// - Reset every Monday

		return reply.success({
			leaderboard: [
				{
					rank: 1,
					username: 'weeklypro',
					avgWpm: 132,
					totalRaces: 87,
					totalXp: 12450,
				},
			],
			weekStart: new Date().toISOString(),
			weekEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		});
	});

	// Get friends leaderboard
	fastify.get('/friends', async (_request, reply) => {
		// TODO: Implement friends leaderboard
		// - Requires authentication
		// - Show rankings among user's friends
		// - Compare stats

		return reply.success({
			leaderboard: [
				{
					rank: 1,
					userId: 'friend_1',
					username: 'mybestfriend',
					wpm: 95,
					accuracy: 97.2,
					isFriend: true,
				},
				{
					rank: 2,
					userId: 'current_user',
					username: 'me',
					wpm: 89,
					accuracy: 96.5,
					isCurrentUser: true,
				},
			],
		});
	});

	// Get leaderboard by difficulty
	fastify.get('/difficulty/:difficulty', async (request, reply) => {
		// TODO: Implement difficulty-specific leaderboard
		// - Separate rankings for easy, medium, hard
		const { difficulty } = request.params;
		const { period = 'all' } = request.query;

		return reply.success({
			leaderboard: [
				{
					rank: 1,
					username: 'hardcoretyper',
					wpm: 142,
					accuracy: 98.9,
					difficulty,
				},
			],
			difficulty,
			period,
		});
	});

	// Get leaderboard by language
	fastify.get('/language/:language', async (request, reply) => {
		// TODO: Implement language-specific leaderboard
		// - Separate rankings for different languages
		const { language } = request.params;

		return reply.success({
			leaderboard: [
				{
					rank: 1,
					username: 'polyglottyper',
					wpm: 128,
					accuracy: 99.1,
					language,
				},
			],
			language,
		});
	});

	// Get nearby ranks (players around current user)
	fastify.get('/nearby', async (_request, reply) => {
		// TODO: Implement nearby ranks
		// - Requires authentication
		// - Show players ranked just above and below user
		// - Motivate competitive improvement

		return reply.success({
			leaderboard: [
				{ rank: 138, username: 'player1', wpm: 91 },
				{ rank: 139, username: 'player2', wpm: 90 },
				{ rank: 140, username: 'you', wpm: 89, isCurrentUser: true },
				{ rank: 141, username: 'player3', wpm: 89 },
				{ rank: 142, username: 'player4', wpm: 88 },
			],
			currentUser: {
				rank: 140,
				wpm: 89,
			},
		});
	});

	// Get hall of fame
	fastify.get('/hall-of-fame', async (_request, reply) => {
		// TODO: Implement hall of fame
		// - All-time records and achievements
		// - Historic milestones

		return reply.success({
			records: [
				{
					category: 'highest_wpm',
					holder: 'legendtyper',
					value: 212,
					achievedAt: new Date('2024-08-15').toISOString(),
				},
				{
					category: 'most_races',
					holder: 'marathonman',
					value: 50247,
					achievedAt: new Date().toISOString(),
				},
				{
					category: 'longest_streak',
					holder: 'consistentpro',
					value: 365,
					achievedAt: new Date('2024-12-31').toISOString(),
				},
			],
		});
	});

	// Get race-specific leaderboard
	fastify.get('/race/:raceId', async (request, reply) => {
		// TODO: Implement race-specific leaderboard
		// - Final standings for a completed race
		const { raceId } = request.params;

		return reply.success({
			race: {
				id: raceId,
				completedAt: new Date().toISOString(),
			},
			standings: [
				{
					placement: 1,
					username: 'winner',
					wpm: 124,
					accuracy: 98.7,
					timeCompleted: 45.2,
				},
				{
					placement: 2,
					username: 'runnerup',
					wpm: 118,
					accuracy: 97.9,
					timeCompleted: 48.7,
				},
			],
		});
	});
}
