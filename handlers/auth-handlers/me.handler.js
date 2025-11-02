import User from '../../models/user.model.js';
import { NotFoundException } from '../../utils/exceptions.utils.js';

export async function meHandler(request, reply) {
	const { userId } = request.user;

	const user = await User.findById(userId);
	if (!user) {
		throw new NotFoundException('User not found');
	}

	return reply.success({ user: user.toObject() });
}
