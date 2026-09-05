export const DockerRunner = {
  build: (image: string) => `docker build -t ${image} .`,
  run: (image: string) => `docker run --rm -it ${image}`,
};
