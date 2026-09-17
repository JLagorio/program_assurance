import { homedir } from "node:os";
import { join } from "node:path";

/** Fixed local engine: the project VM on macOS and the runner's Docker engine on Linux. */
export function localDockerEnv() {
  const env = {
    ...process.env,
    DOCKER_HOST:
      process.platform === "darwin"
        ? `unix://${join(homedir(), ".colima", "program-assurance", "docker.sock")}`
        : "unix:///var/run/docker.sock",
  };
  for (const key of ["DOCKER_CONTEXT", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH"]) delete env[key];
  return env;
}
