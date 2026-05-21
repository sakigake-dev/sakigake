import { ApplicationError } from "./ApplicationError";

export class ProjectNotFoundError extends ApplicationError {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`);
    this.name = "ProjectNotFoundError";
  }
}
