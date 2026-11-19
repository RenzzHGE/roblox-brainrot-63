-- v1.5 shared type definitions (hangout + karaoke systems).
-- Original code for BRAINROT MEGA UNIVERSE v1.5.

export type QueueSong = {
	userId: number,
	userName: string,
	songTitle: string,
	queuedAt: number,
}

export type KaraokeState = {
	current: QueueSong?,
	queue: { QueueSong },
}

export type SeatData = {
	seat: Seat,
	occupied: boolean,
	occupant: Player?,
}

export type InteractionTarget = {
	part: BasePart,
	actionText: string,
	holdDuration: number,
}

export type WorldZone = {
	name: string,
	position: Vector3,
	radius: number,
}

return {}
