export const Collaborative = {
  share: (doc: string) => `CRDT share ${doc} via WebRTC`,
  join: (room: string) => `Join collaborative room ${room}`,
};
