/**
 * Multiplayer Race Routes
 * Handles creating, joining, and managing multiplayer typing races
 * Note: Real-time gameplay should use WebSocket, these are REST endpoints for game state
 */
export default async function raceRoutes(fastify, _options) {
	// Create a new multiplayer race
	fastify.post('/create', async (request, reply) => {
		// TODO: Implement create race
		// - Generate unique race ID
		// - Set race configuration
		// - Create waiting room
		// - Host becomes race admin
		const { mode = 'public', maxPlayers = 5, difficulty = 'medium', duration = 60 } = request.body;

		return reply.success(
			{
				race: {
					id: `race_${Date.now()}`,
					mode,
					status: 'waiting',
					maxPlayers,
					currentPlayers: 1,
					difficulty,
					duration,
					hostId: 'user_123',
					createdAt: new Date().toISOString(),
				},
			},
			201,
		);
	});

	// Join an existing race
	fastify.post('/:raceId/join', async (request, reply) => {
		// TODO: Implement join race
		// - Validate race exists and is joinable
		// - Check if race is full
		// - Add player to race
		// - Notify other players via WebSocket
		const { raceId } = request.params;

		return reply.success({
			race: {
				id: raceId,
				status: 'waiting',
				players: [
					{ id: 'user_123', username: 'speedtyper', ready: true },
					{ id: 'user_456', username: 'fastfingers', ready: false },
				],
				currentPlayers: 2,
				maxPlayers: 5,
			},
		});
	});

	// Leave a race
	fastify.post('/:raceId/leave', async (_request, reply) => {
		// TODO: Implement leave race
		// - Remove player from race
		// - If host leaves, transfer host or cancel race
		// - Notify other players

		return reply.success({
			message: 'Left race successfully',
		});
	});

	// Mark player as ready
	fastify.post('/:raceId/ready', async (_request, reply) => {
		// TODO: Implement ready status
		// - Mark player as ready
		// - If all players ready, start countdown
		// - Notify other players
		const { ready = true } = request.body;

		return reply.success({
			message: 'Ready status updated',
			ready,
			allReady: false,
		});
	});

	// Start the race (host only)
	fastify.post('/:raceId/start', async (request, reply) => {
		// TODO: Implement start race
		// - Verify host permission
		// - Check all players ready (or allow force start)
		// - Generate race text
		// - Set status to 'active'
		// - Start countdown via WebSocket
		const { raceId } = request.params;

		return reply.success({
			race: {
				id: raceId,
				status: 'countdown',
				text: 'The quick brown fox jumps over the lazy dog...',
				startsAt: new Date(Date.now() + 3000).toISOString(),
			},
		});
	});

	// Submit race result
	fastify.post('/:raceId/finish', async (_request, reply) => {
		// TODO: Implement finish race
		// - Validate race is active
		// - Calculate final WPM and accuracy
		// - Determine placement
		// - Update player statistics
		// - Award XP and achievements

		return reply.success({
			result: {
				placement: 2,
				wpm: 92,
				accuracy: 97.3,
				xpEarned: 150,
				newAchievements: [],
			},
		});
	});

	// Get race details
	fastify.get('/:raceId', async (request, reply) => {
		// TODO: Implement get race details
		// - Fetch race state
		// - Include player list and their progress
		const { raceId } = request.params;

		return reply.success({
			race: {
				id: raceId,
				status: 'active',
				text: 'The quick brown fox jumps over the lazy dog...',
				players: [
					{
						id: 'user_123',
						username: 'speedtyper',
						progress: 85,
						wpm: 94,
						position: 1,
					},
					{
						id: 'user_456',
						username: 'fastfingers',
						progress: 72,
						wpm: 89,
						position: 2,
					},
				],
				startedAt: new Date(Date.now() - 30000).toISOString(),
			},
		});
	});

	// Get active races (lobby)
	fastify.get('/lobby', async (_request, reply) => {
		// TODO: Implement get active races
		// - Return list of joinable races
		// - Filter by mode, difficulty
		// - Exclude full races

		return reply.success({
			races: [
				{
					id: 'race_1',
					mode: 'public',
					difficulty: 'medium',
					currentPlayers: 3,
					maxPlayers: 5,
					status: 'waiting',
					host: { username: 'speedtyper' },
					createdAt: new Date().toISOString(),
				},
				{
					id: 'race_2',
					mode: 'public',
					difficulty: 'hard',
					currentPlayers: 2,
					maxPlayers: 4,
					status: 'waiting',
					host: { username: 'typingpro' },
					createdAt: new Date().toISOString(),
				},
			],
		});
	});

	// Quick match (auto-join)
	fastify.post('/quick-match', async (request, reply) => {
		// TODO: Implement quick match
		// - Find or create suitable race
		// - Match by skill level (optional)
		// - Auto-join player
		const { difficulty = 'medium' } = request.body;

		return reply.success({
			race: {
				id: `race_quickmatch_${Date.now()}`,
				status: 'waiting',
				difficulty,
				currentPlayers: 3,
				maxPlayers: 5,
			},
		});
	});

	// Get race history for user
	fastify.get('/history', async (request, reply) => {
		// TODO: Implement get race history
		// - Requires authentication
		// - Paginated results
		// - Include placement and stats
		const { page = 1, limit = 20 } = request.query;

		return reply.success({
			races: [
				{
					id: 'race_123',
					placement: 1,
					totalPlayers: 4,
					wpm: 98,
					accuracy: 96.8,
					xpEarned: 200,
					completedAt: new Date().toISOString(),
				},
			],
			pagination: {
				page: Number.parseInt(page, 10),
				limit: Number.parseInt(limit, 10),
				total: 89,
				pages: 5,
			},
		});
	});

	// Cancel race (host only)
	fastify.delete('/:raceId', async (_request, reply) => {
		// TODO: Implement cancel race
		// - Verify host permission
		// - Only allow if race hasn't started
		// - Notify all players

		return reply.success({
			message: 'Race cancelled successfully',
		});
	});
}
