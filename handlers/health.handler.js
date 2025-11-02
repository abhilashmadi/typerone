import { envConfig } from '../configs/env.config.js';

export default function healthHandler(_, reply) {
	return reply.success({
		status: 'ok',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: envConfig.MODE,
	});
}
