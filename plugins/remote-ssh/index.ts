export const RemoteSSHProvider = {
  connect: (host: string) => `ssh ${host}`,
  openFolder: (host: string, path: string) => `ssh ${host} "ls ${path}"`,
};
